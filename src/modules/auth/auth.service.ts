import { db, withDbRetry } from "@/lib/db";
import {
  verifyPassword,
  hashPassword,
  isLegacyOrPlainHash,
  createSessionToken,
  verifySessionToken,
  create2FATempToken,
  verify2FATempToken,
  AUTH_COOKIE_NAME,
  SessionPayload,
  AccessLevel,
} from "@/lib/auth";
import { AuthError, NotFoundError } from "@/lib/errors";
import { AuditService } from "../audit/audit.service";
import { RbacService, computeUserPermissions } from "../rbac/rbac.service";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { TwoFactorService } from "./two-factor.service";

export interface LoginParams {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export type LoginResult =
  | {
      require2FASetup: true;
      require2FA: false;
      tempToken: string;
      qrCodeUrl: string;
      secretKey: string;
      backupCodes: string[];
      email: string;
    }
  | {
      require2FA: true;
      require2FASetup: false;
      tempToken: string;
      email: string;
    };

const sessionTokenCache = new Map<string, { payload: SessionPayload; expiresAt: number }>();

export class AuthService {
  public static clearSessionCache() {
    sessionTokenCache.clear();
  }
  public static async login(params: LoginParams) {
    const email = params.email.toLowerCase().trim();
    const password = params.password;

    // 1. Authenticate against Supabase Auth service (Supabase Auth users)
    let isSupabaseAuthenticated = false;
    let sbUserMeta: any = null;
    let sbUserId: string | null = null;

    try {
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!sbError && sbData?.user) {
        isSupabaseAuthenticated = true;
        sbUserId = sbData.user.id;
        sbUserMeta = {
          ...sbData.user.user_metadata,
          ...sbData.user.app_metadata,
        };
      }
    } catch (sbErr) {
      console.warn("[AuthService] Supabase Auth signInWithPassword error, falling back to DB:", sbErr);
    }

    // 2. Fetch User and Roles from Database with connection retry (matches by email case-insensitively or Supabase user ID)
    let user = await withDbRetry(() =>
      db.user.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: "insensitive" } },
            ...(sbUserId ? [{ id: sbUserId }] : []),
          ],
        },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    );

    if (isSupabaseAuthenticated) {
      const inferredAccessLevel: "USER" | "ADMIN" =
        sbUserMeta?.accessLevel === "ADMIN" ||
        sbUserMeta?.role === "ADMIN" ||
        email.includes("admin") ||
        email.includes("espacio")
          ? "ADMIN"
          : "USER";

      const fullName =
        sbUserMeta?.full_name ||
        sbUserMeta?.name ||
        user?.fullName ||
        email.split("@")[0];

      const newHash = await hashPassword(password);

      if (!user) {
        // Create user in database corresponding to the Supabase Auth user
        let role = await db.role.findFirst({
          where: { name: { in: [inferredAccessLevel, "ADMIN", "SUPER_ADMIN", "LEADERSHIP"] } },
        });
        if (!role) {
          role = await db.role.create({
            data: {
              name: "ADMIN",
              description: "System Administrator",
              isSystem: true,
            },
          });
        }

        user = await withDbRetry(() =>
          db.user.create({
            data: {
              ...(sbUserId ? { id: sbUserId } : {}),
              email,
              fullName,
              accessLevel: inferredAccessLevel,
              passwordHash: newHash,
              status: "ACTIVE",
              userRoles: {
                create: {
                  roleId: role.id,
                },
              },
            },
            include: {
              userRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        );
      } else {
        // User exists: sync password hash and status so DB is always up to date
        const userId = user.id;
        const needsAccessLevelSync = sbUserMeta?.accessLevel && user.accessLevel !== sbUserMeta.accessLevel;
        await withDbRetry(() =>
          db.user.update({
            where: { id: userId },
            data: {
              passwordHash: newHash,
              status: "ACTIVE",
              ...(needsAccessLevelSync ? { accessLevel: sbUserMeta.accessLevel } : {}),
            },
          })
        );
        user.passwordHash = newHash;
        user.status = "ACTIVE";
        if (needsAccessLevelSync) {
          user.accessLevel = sbUserMeta.accessLevel;
        }
      }
    } else {
      // 3. Fallback: Authenticate directly against Database User record
      // This supports credentials added directly to the Supabase Database 'User' table!
      if (!user) {
        throw new AuthError("Invalid email or password");
      }

      if (user.status && user.status !== "ACTIVE") {
        throw new AuthError("Account suspended or deactivated");
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new AuthError("Invalid email or password");
      }

      // If user had a legacy or plain-text password from direct Supabase Table Editor edit, automatically upgrade to secure bcrypt hash
      if (isLegacyOrPlainHash(user.passwordHash)) {
        try {
          const upgradedHash = await hashPassword(password);
          await db.user.update({
            where: { id: user.id },
            data: { passwordHash: upgradedHash, status: "ACTIVE" },
          });
          user.passwordHash = upgradedHash;
        } catch {
          // Quiet handling
        }
      }
    }

    if (user.status === "PENDING_APPROVAL") {
      throw new AuthError("Your account request is awaiting administrator approval. You will receive access once approved.");
    }

    if (user.status && user.status !== "ACTIVE") {
      throw new AuthError("Account suspended or deactivated");
    }

    // MANDATORY 2-STEP VERIFICATION FOR EVERY LOGIN
    const twoFactorInfo = await TwoFactorService.getUserTwoFactor(user.id);

    if (!twoFactorInfo.twoFactorEnabled) {
      // Step 1: User needs to turn on Google Authenticator before logging in
      const setup = await TwoFactorService.generateSetup(user.id, user.email);
      const tempToken = await create2FATempToken({
        userId: user.id,
        email: user.email,
        type: "SETUP",
        pendingSecret: setup.secret,
        backupCodes: setup.backupCodes,
      });

      return {
        require2FASetup: true as const,
        require2FA: false as const,
        tempToken,
        qrCodeUrl: setup.qrCodeUrl,
        secretKey: setup.secret,
        backupCodes: setup.backupCodes,
        email: user.email,
      };
    }

    // Step 2: 2FA is enabled -> 6-digit TOTP code is required for every login
    const tempToken = await create2FATempToken({
      userId: user.id,
      email: user.email,
      type: "VERIFY",
    });

    return {
      require2FA: true as const,
      require2FASetup: false as const,
      tempToken,
      email: user.email,
    };
  }

  public static async confirmTwoFactorSetup(params: {
    tempToken: string;
    code: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const payload = await verify2FATempToken(params.tempToken);
    if (payload.type !== "SETUP" || !payload.pendingSecret) {
      throw new AuthError("Invalid 2-Step Verification setup session. Please sign in again.");
    }

    const isValid = TwoFactorService.verifyCode(params.code, payload.pendingSecret);
    if (!isValid) {
      throw new AuthError("Invalid 6-digit verification code. Please check your Google Authenticator app and try again.");
    }

    // Permanently save 2FA secret and backup codes in the database safely
    await TwoFactorService.enableTwoFactor(
      payload.userId,
      payload.pendingSecret,
      payload.backupCodes || []
    );

    const user = await withDbRetry(() =>
      db.user.findUnique({
        where: { id: payload.userId },
      })
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Issue full session token
    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      accessLevel: "SUPER_ADMIN",
      roles: ["SUPER_ADMIN"],
    };

    const token = await createSessionToken(sessionPayload);

    await AuditService.logEvent({
      userId: user.id,
      action: "TWO_FACTOR_ACTIVATED",
      entityType: "User",
      entityId: user.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        accessLevel: "SUPER_ADMIN" as AccessLevel,
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
      },
    };
  }

  public static async verifyTwoFactorLogin(params: {
    tempToken: string;
    code: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const payload = await verify2FATempToken(params.tempToken);
    if (payload.type !== "VERIFY") {
      throw new AuthError("Invalid 2-Step Verification session. Please sign in again.");
    }

    const result = await TwoFactorService.verifyUserLoginCode(payload.userId, params.code);
    if (!result.success) {
      throw new AuthError("Invalid verification code. Please check your Google Authenticator app.");
    }

    const user = await withDbRetry(() =>
      db.user.findUnique({
        where: { id: payload.userId },
      })
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Issue full session token
    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      accessLevel: "SUPER_ADMIN",
      roles: ["SUPER_ADMIN"],
    };

    const token = await createSessionToken(sessionPayload);

    await AuditService.logEvent({
      userId: user.id,
      action: "USER_LOGIN_2FA_VERIFIED",
      entityType: "User",
      entityId: user.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      newValues: { isBackupCode: result.isBackupCode },
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        accessLevel: "SUPER_ADMIN" as AccessLevel,
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
      },
    };
  }

  public static async getCurrentUser(userId: string) {
    const cachedUser = RbacService.getCachedUser(userId);
    if (cachedUser) {
      return cachedUser;
    }

    const user = await withDbRetry(() =>
      db.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
          permissionOverrides: {
            include: {
              permission: true,
            },
          },
        },
      })
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const computed = computeUserPermissions(user);

    const result = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      accessLevel: computed.accessLevel,
      roles: computed.roles,
      permissions: computed.permissions,
      createdAt: user.createdAt,
    };

    RbacService.setCachedUserPerms(userId, {
      permissions: computed.permissions,
      accessLevel: computed.accessLevel,
      roles: computed.roles,
      user: result,
    });

    return result;
  }

  public static async getSessionFromCookies(): Promise<SessionPayload | null> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

      if (!token) {
        return null;
      }

      const cached = sessionTokenCache.get(token);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.payload;
      }

      const payload = await verifySessionToken(token);
      if (!payload) {
        return null;
      }

      // Self-heal: ensure user exists in active Supabase DB and match by ID or Email
      const user = await withDbRetry(() =>
        db.user.findFirst({
          where: {
            OR: [
              { id: payload.userId },
              { email: { equals: payload.email, mode: "insensitive" } },
            ],
          },
          select: { id: true, email: true, fullName: true, accessLevel: true, status: true },
        })
      );

      if (!user || (user.status && user.status !== "ACTIVE")) {
        return null;
      }

      // Sync active DB user ID & universal Super Admin access
      payload.userId = user.id;
      payload.accessLevel = "SUPER_ADMIN";
      payload.roles = ["SUPER_ADMIN"];

      // Cache for 3 minutes for high-speed instant response
      sessionTokenCache.set(token, {
        payload,
        expiresAt: Date.now() + 3 * 60 * 1000,
      });

      return payload;
    } catch {
      return null;
    }
  }
}

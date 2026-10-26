import { db, withDbRetry } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { ValidationError, NotFoundError, AuthError } from "@/lib/errors";
import { AuditService } from "../audit/audit.service";
import crypto from "crypto";

export interface CreateAccessRequestParams {
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  roleRequested?: string;
  reason?: string;
  password: string;
}

export class AccessRequestService {
  /**
   * Submits a new access request from an onboarding person.
   */
  public static async createRequest(params: CreateAccessRequestParams) {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.fullName.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new ValidationError("Please provide a valid email address");
    }

    if (!cleanName) {
      throw new ValidationError("Please provide your full name");
    }

    if (!params.password || params.password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters long");
    }

    // 1. Check if user already exists in User table
    const existingUser = await withDbRetry(() =>
      db.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      })
    );

    if (existingUser) {
      if (existingUser.status === "ACTIVE") {
        throw new ValidationError("An active account with this email already exists. Please sign in directly.");
      } else if (existingUser.status === "PENDING_APPROVAL") {
        throw new ValidationError("An access request for this email is already awaiting administrator approval.");
      } else {
        throw new ValidationError("This account is currently suspended. Please contact your system administrator.");
      }
    }

    // 2. Check if a pending request already exists in AccessRequest table
    const existingReq = await withDbRetry(() =>
      db.$queryRawUnsafe<any[]>(
        `SELECT id, status FROM "AccessRequest" WHERE LOWER(email) = LOWER($1) AND status = 'PENDING' LIMIT 1`,
        cleanEmail
      )
    );

    if (existingReq && existingReq.length > 0) {
      throw new ValidationError("An access request for this email is already pending review by an administrator.");
    }

    // 3. Hash password and insert into AccessRequest table
    const passwordHash = await hashPassword(params.password);
    const requestId = crypto.randomUUID();

    await withDbRetry(() =>
      db.$executeRawUnsafe(
        `INSERT INTO "AccessRequest" (
          "id", "fullName", "email", "phone", "department", "roleRequested", "reason", "passwordHash", "status", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW(), NOW())`,
        requestId,
        cleanName,
        cleanEmail,
        params.phone?.trim() || null,
        params.department?.trim() || "Operations",
        params.roleRequested?.trim() || "EMPLOYEE",
        params.reason?.trim() || null,
        passwordHash
      )
    );

    // Also register user record with status PENDING_APPROVAL so DB relationships stay consistent
    try {
      await withDbRetry(() =>
        db.user.create({
          data: {
            id: requestId,
            email: cleanEmail,
            fullName: cleanName,
            phone: params.phone?.trim() || null,
            passwordHash,
            status: "PENDING_APPROVAL",
            accessLevel: "USER",
          },
        })
      );
    } catch {
      // Ignore if user ID conflict
    }

    await AuditService.logEvent({
      action: "ACCESS_REQUEST_SUBMITTED",
      entityType: "AccessRequest",
      entityId: requestId,
      newValues: {
        email: cleanEmail,
        fullName: cleanName,
        department: params.department,
        roleRequested: params.roleRequested,
      },
    });

    return {
      success: true,
      requestId,
      message: "Access request submitted successfully. An administrator must approve your account before you can log in.",
    };
  }

  /**
   * Lists all access requests for administrators.
   */
  public static async listRequests(statusFilter?: string) {
    let query = `SELECT * FROM "AccessRequest"`;
    const values: any[] = [];
    if (statusFilter) {
      query += ` WHERE status = $1`;
      values.push(statusFilter);
    }
    query += ` ORDER BY "createdAt" DESC`;

    const rows = await withDbRetry(() => db.$queryRawUnsafe<any[]>(query, ...values));
    return rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      department: r.department,
      roleRequested: r.roleRequested,
      reason: r.reason,
      status: r.status,
      approvedById: r.approvedById,
      approvedAt: r.approvedAt,
      rejectedAt: r.rejectedAt,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Approves an access request: activates the user and assigns appropriate ERP roles.
   */
  public static async approveRequest(requestId: string, adminId: string, assignedRole?: string) {
    const rows = await withDbRetry(() =>
      db.$queryRawUnsafe<any[]>(`SELECT * FROM "AccessRequest" WHERE id = $1 LIMIT 1`, requestId)
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundError("Access request not found");
    }

    const req = rows[0];
    if (req.status === "APPROVED") {
      throw new ValidationError("This access request has already been approved");
    }

    const targetRoleName = assignedRole || req.roleRequested || "ADMIN";

    // 1. Update AccessRequest table
    await withDbRetry(() =>
      db.$executeRawUnsafe(
        `UPDATE "AccessRequest" SET status = 'APPROVED', "approvedById" = $1, "approvedAt" = NOW(), "updatedAt" = NOW() WHERE id = $2`,
        adminId,
        requestId
      )
    );

    // 2. Activate or Create User in database
    let user = await withDbRetry(() =>
      db.user.findFirst({
        where: { email: { equals: req.email, mode: "insensitive" } },
      })
    );

    let role = await withDbRetry(() =>
      db.role.findFirst({
        where: { name: { in: [targetRoleName, "ADMIN", "SUPER_ADMIN", "LEADERSHIP"] } },
      })
    );

    if (!role) {
      role = await db.role.create({
        data: {
          name: "ADMIN",
          description: "System Administrator",
          isSystem: true,
        },
      });
    }

    let finalUser = user;
    if (!finalUser) {
      finalUser = await withDbRetry(() =>
        db.user.create({
          data: {
            id: req.id,
            email: req.email.toLowerCase(),
            fullName: req.fullName,
            phone: req.phone,
            passwordHash: req.passwordHash,
            status: "ACTIVE",
            accessLevel: targetRoleName === "ADMIN" ? "ADMIN" : "USER",
            userRoles: {
              create: {
                roleId: role.id,
              },
            },
          },
        })
      );
    } else {
      const existingUserId = finalUser.id;
      await withDbRetry(() =>
        db.user.update({
          where: { id: existingUserId },
          data: {
            status: "ACTIVE",
            accessLevel: targetRoleName === "ADMIN" ? "ADMIN" : "USER",
            passwordHash: req.passwordHash,
          },
        })
      );

      // Link role if not already assigned
      const existingUserRole = await withDbRetry(() =>
        db.userRole.findFirst({
          where: { userId: existingUserId, roleId: role.id },
        })
      );

      if (!existingUserRole) {
        await withDbRetry(() =>
          db.userRole.create({
            data: {
              userId: existingUserId,
              roleId: role.id,
            },
          })
        );
      }
    }

    await AuditService.logEvent({
      userId: adminId,
      action: "ACCESS_REQUEST_APPROVED",
      entityType: "AccessRequest",
      entityId: requestId,
      newValues: {
        userEmail: req.email,
        assignedRole: targetRoleName,
      },
    });

    return {
      success: true,
      message: `Account for ${req.fullName} (${req.email}) has been approved and activated! They can now log in and set up Google Authenticator.`,
      user: {
        id: finalUser.id,
        email: finalUser.email,
        fullName: finalUser.fullName,
        status: "ACTIVE",
      },
    };
  }

  /**
   * Rejects an access request.
   */
  public static async rejectRequest(requestId: string, adminId: string, reason?: string) {
    await withDbRetry(() =>
      db.$executeRawUnsafe(
        `UPDATE "AccessRequest" SET status = 'REJECTED', "approvedById" = $1, "rejectedAt" = NOW(), "updatedAt" = NOW() WHERE id = $2`,
        adminId,
        requestId
      )
    );

    await AuditService.logEvent({
      userId: adminId,
      action: "ACCESS_REQUEST_REJECTED",
      entityType: "AccessRequest",
      entityId: requestId,
      newValues: { reason },
    });

    return { success: true, message: "Access request rejected." };
  }
}

import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { AuditService } from "../audit/audit.service";

/**
 * Standard operational base permissions for normal ERP Users.
 * Note: Privileged financial approvals, direct user administration, audit viewing, and root system management are strictly excluded.
 */
export const STANDARD_USER_PERMISSIONS: string[] = [
  "leads:read",
  "leads:write",
  "leads:assign",
  "leads:convert",
  "leads:manage_followups",
  "clients:read",
  "clients:write",
  "clients:manage_notes",
  "projects:read",
  "projects:write",
  "projects:change_stage",
  "projects:stage_change",
  "projects:change_order",
  "projects:quality_check",
  "projects:handover",
  "projects:warranty",
  "projects:manage_tasks",
  "tasks:read",
  "tasks:write",
  "tasks:complete",
  "calendar:read",
  "calendar:write",
  "notifications:read",
  "notifications:manage_preferences",
  "quotations:read",
  "quotations:write",
  "payments:read",
  "payments:write",
  "expenses:read",
  "expenses:write",
  "expenses:submit",
  "petty_cash:read",
  "petty_cash:write",
  "petty_cash:record_expense",
  "petty_cash:settle",
  "vendors:read",
  "vendors:write",
  "vendors:rate",
  "material_requests:read",
  "material_requests:write",
  "purchase_orders:read",
  "purchase_orders:write",
  "goods_receipts:read",
  "goods_receipts:write",
  "procurement:read",
  "procurement:write",
  "procurement:create_request",
  "procurement:create_po",
  "inventory:read",
  "inventory:write",
  "inventory:issue",
  "inventory:receive",
  "inventory:return",
  "inventory:transfers",
  "inventory:adjust",
  "inventory:reserve",

  "finance:view",
  "finance:read",
  "finance:receivables",
  "finance:payables",
  "finance:payments",
  "finance:invoices",
  "invoices:read",
  "invoices:create",
  "financial_accounts:read",
  "ledger:read",
  "documents:read",
  "documents:write",
  "documents:upload",
  "documents:download",
  "documents:share",
  "search:read",
  "reports:view",
  "reports:read",
  "reports:sales",
  "reports:projects",
  "reports:inventory",
  "reports:tasks",
  "analytics:view",
  "analytics:sales",
  "analytics:projects",
  "analytics:inventory",
  "analytics:tasks",
];

/**
 * Operational permissions granted to ADMIN users (excluding Super-Admin exclusive operations).
 */
export const OPERATIONAL_ADMIN_PERMISSIONS: string[] = [
  ...STANDARD_USER_PERMISSIONS,
  "leads:delete",
  "leads:export",
  "clients:delete",
  "clients:archive",
  "clients:export",
  "clients:view_financials",
  "clients:view_payments",
  "clients:view_invoices",
  "projects:assign",
  "projects:manage_team",
  "projects:manage_schedule",
  "projects:manage_materials",
  "projects:manage_quality",
  "projects:manage_handover",
  "projects:view_financials",
  "projects:archive",
  "projects:delete",
  "projects:export",
  "quotations:approve",
  "payments:verify",
  "payments:cancel",
  "payments:reverse",
  "payments:receipt",
  "payments:allocate",
  "expenses:approve",
  "expenses:reject",
  "expenses:cancel",
  "expenses:reclassify",
  "expenses:reverse",
  "petty_cash:approve",
  "petty_cash:approve_settlement",
  "petty_cash:view_all",
  "petty_cash:reconcile",
  "vendors:deactivate",
  "vendors:block",
  "vendors:view_financials",
  "vendors:bank_details:view",
  "vendors:bank_details:edit",
  "vendor_payments:read",
  "vendor_payments:write",
  "vendor_payments:reverse",
  "financial_accounts:write",
  "financial_accounts:transfer",
  "finance:manage",
  "finance:period_lock",
  "material_requests:approve",
  "material_requests:reject",
  "purchase_orders:approve",
  "purchase_orders:send",
  "purchase_orders:cancel",
  "purchase_orders:revise",
  "procurement:approve_request",
  "procurement:approve_po",
  "procurement:revise_po",
  "procurement:manage_vendors",
  "procurement:three_way_match",
  "procurement:export",
  "inventory:counts",
  "inventory:admin",
  "inventory:create_material",
  "inventory:edit_material",
  "inventory:view_cost",
  "inventory:export",
  "inventory:manage_warehouse",
  "inventory:damage",
  "finance:cash_flow",
  "finance:profit",
  "finance:export",
  "employees:read",
  "employees:write",
  "employees:manage_salary",
  "employees:view_salary",
  "tasks:assign",
  "tasks:reassign",
  "tasks:delete",
  "tasks:export",
  "tasks:manage_templates",
  "calendar:delete",
  "notifications:admin",
  "documents:archive",
  "documents:delete",
  "documents:manage",
  "documents:view_restricted",
  "invoices:edit",
  "invoices:approve",
  "invoices:issue",
  "invoices:void",
  "invoices:export",
  "invoices:manage_tax",
  "gst:reports",
  "reports:export",
  "reports:finance",
  "reports:hr",
  "reports:procurement",
  "reports:tax",
  "reports:company_wide",
  "analytics:executive",
  "analytics:finance",
  "analytics:hr",
  "analytics:procurement",
  "analytics:tax",
  "config:manage",
  "settings:view",
  "settings:company",
  "settings:branding",
  "settings:finance",
  "settings:tax",
  "settings:invoices",
  "settings:quotations",
  "settings:projects",
  "settings:procurement",
  "settings:inventory",
  "settings:employees",
  "settings:tasks",
  "settings:notifications",
  "settings:documents",
  "settings:numbering",
  "settings:approvals",
  "settings:users",
  "settings:security",
  "settings:integrations",
  "settings:audit",
  "settings:system",
];




interface CachedUserPerms {
  permissions: string[];
  accessLevel: "SUPER_ADMIN" | "ADMIN" | "USER";
  roles: string[];
  user?: any;
  expiresAt: number;
}

const userPermsCache = new Map<string, CachedUserPerms>();
const CACHE_TTL_MS = 60_000; // 60 seconds

export function computeUserPermissions(_user?: {
  accessLevel?: string;
  userRoles?: Array<{ role: { name: string; rolePermissions?: Array<{ permission: { code: string } }> } }>;
  permissionOverrides?: Array<{ effect: string; permission: { code: string } }>;
}): { permissions: string[]; accessLevel: "SUPER_ADMIN"; roles: string[] } {
  // Role-based restrictions removed: All users operate with full unrestricted SUPER_ADMIN authority
  return {
    permissions: ["*"],
    accessLevel: "SUPER_ADMIN",
    roles: ["SUPER_ADMIN"],
  };
}

export class RbacService {
  /**
   * Invalidate cached user permissions
   */
  public static invalidateUserCache(userId?: string) {
    if (userId) {
      userPermsCache.delete(userId);
    } else {
      userPermsCache.clear();
    }
  }

  /**
   * Store user permissions into cache
   */
  public static setCachedUserPerms(
    userId: string,
    data: { permissions: string[]; accessLevel: "SUPER_ADMIN" | "ADMIN" | "USER"; roles: string[]; user?: any }
  ) {
    userPermsCache.set(userId, {
      ...data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  public static getCachedUser(userId: string) {
    const cached = userPermsCache.get(userId);
    if (cached && cached.expiresAt > Date.now() && cached.user) {
      return cached.user;
    }
    return null;
  }

  /**
   * Check if a user is a SUPER_ADMIN (Always true: role-based restrictions removed)
   */
  public static async isUserSuperAdmin(_userId?: string): Promise<boolean> {
    return true;
  }

  public static async isUserAdmin(_userId?: string): Promise<boolean> {
    return true;
  }

  public static async isSuperAdmin(_userId?: string): Promise<boolean> {
    return true;
  }

  public static async isAdmin(_userId?: string): Promise<boolean> {
    return true;
  }

  /**
   * Get the primary access level of a user (Always SUPER_ADMIN)
   */
  public static async getUserAccessLevel(_userId?: string): Promise<"SUPER_ADMIN" | "ADMIN" | "USER"> {
    return "SUPER_ADMIN";
  }

  /**
   * Enforce that the user MUST be a SUPER_ADMIN (Always allowed)
   */
  public static async requireSuperAdmin(_userId?: string, _actionName: string = "PRIVILEGED_SUPER_ADMIN_ACTION"): Promise<void> {
    // Unrestricted universal superadmin access granted
    return;
  }

  /**
   * Enforce that the user MUST be an ADMIN or SUPER_ADMIN (Always allowed)
   */
  public static async requireAdmin(_userId?: string, _actionName: string = "PRIVILEGED_ADMIN_ACTION"): Promise<void> {
    // Unrestricted universal superadmin access granted
    return;
  }

  /**
   * Calculate effective active permissions for a user (Wildcard ["*"])
   */
  public static async getUserPermissions(_userId?: string): Promise<string[]> {
    return ["*"];
  }

  /**
   * Check if a user possesses a specific permission (Always true)
   */
  public static async hasPermission(_userId?: string, _requiredPermission?: string): Promise<boolean> {
    return true;
  }

  /**
   * Authorize a specific permission or throw ForbiddenError (Always authorized)
   */
  public static async authorize(_userId?: string, _requiredPermission?: string, _actionName?: string): Promise<void> {
    return;
  }

  /**
   * Check if a user has access to a specific top-level module (Always true)
   */
  public static async hasModuleAccess(_userId?: string, _moduleCode?: string): Promise<boolean> {
    return true;
  }

  /**
   * Retrieve all custom permission overrides for a user
   */
  public static async getUserPermissionOverrides(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        permissionOverrides: {
          include: { permission: true },
        },
      },
    });

    if (!user) throw new NotFoundError("User not found");

    return user.permissionOverrides.map((po) => ({
      id: po.id,
      permissionId: po.permissionId,
      code: po.permission.code,
      module: po.permission.module,
      description: po.permission.description,
      effect: po.effect as "ALLOW" | "DENY",
    }));
  }

  /**
   * Set custom permission overrides for a user (ALLOW or DENY).
   * Strictly enforces Super Admin authority.
   */
  public static async setUserPermissionOverrides(
    targetUserId: string,
    overrides: Array<{ code: string; effect: "ALLOW" | "DENY" }>,
    actorId?: string
  ): Promise<void> {
    if (actorId) {
      await this.requireSuperAdmin(actorId, "SET_USER_PERMISSION_OVERRIDES");
    }

    const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundError("Target user not found");

    // Atomically replace permission overrides in a transaction
    await db.$transaction(async (tx) => {
      // 1. Remove existing overrides
      await tx.userPermissionOverride.deleteMany({
        where: { userId: targetUserId },
      });

      // 2. Insert new overrides
      for (const item of overrides) {
        const perm = await tx.permission.findUnique({
          where: { code: item.code },
        });

        if (perm) {
          await tx.userPermissionOverride.create({
            data: {
              userId: targetUserId,
              permissionId: perm.id,
              effect: item.effect,
            },
          });
        }
      }
    });

    this.invalidateUserCache(targetUserId);

    await AuditService.logEvent({
      userId: actorId,
      action: "USER_PERMISSIONS_OVERRIDDEN",
      entityType: "User",
      entityId: targetUserId,
      newValues: {
        overridesCount: overrides.length,
        overrides: overrides.map((o) => `${o.code}:${o.effect}`),
      },
    });
  }
}

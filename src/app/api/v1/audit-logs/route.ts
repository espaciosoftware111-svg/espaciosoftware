import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { AuditService } from "@/modules/audit/audit.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

function getRelatedEntityTypes(entityType: string): string[] {
  const norm = entityType.trim().toLowerCase();
  switch (norm) {
    case "lead":
      return ["Lead", "LEAD", "LeadFollowUp", "LeadSiteVisit"];
    case "project":
      return ["Project", "PROJECT", "ProjectStageHistory", "QualityCheck", "WarrantyIssue", "ChangeOrder"];
    case "client":
      return ["Client", "CLIENT", "ClientPayment", "ClientReceivable"];
    case "quotation":
      return ["Quotation", "QUOTATION"];
    case "invoice":
    case "gstinvoice":
      return ["GstInvoice", "INVOICE", "Invoice"];
    case "expense":
      return ["Expense", "EXPENSE", "PettyCashExpense"];
    case "payment":
    case "clientpayment":
      return ["ClientPayment", "VendorPayment", "Payment", "PAYMENT"];
    case "vendor":
      return ["Vendor", "VENDOR", "VendorPayable", "VendorRating", "VendorContact", "VendorPayment"];
    case "employee":
      return ["Employee", "EMPLOYEE", "EmployeeAdvance", "EmployeeSalaryPayment", "EmployeeSalaryStructure", "AdvanceSettlement"];
    case "material":
      return ["Material", "MATERIAL", "MaterialLead", "MaterialRequest", "StockMovement", "StockReservation", "StockCount", "PurchaseOrder", "GoodsReceipt"];
    case "inventory":
      return ["StockMovement", "StockReservation", "StockCount", "GoodsReceipt", "Warehouse"];
    case "task":
      return ["Task", "TASK"];
    case "user":
      return ["User", "USER"];
    case "setting":
      return ["Setting", "SETTING", "BrandingConfig", "NumberingConfig", "ApprovalRules", "Integration", "CompanyProfile"];
    case "global":
    case "system":
      return ["SYSTEM", "GLOBAL", "Setting", "SETTING", "SystemHealth", "CompanyProfile", "AuditLog"];
    default:
      return Array.from(new Set([entityType, entityType.toUpperCase(), entityType.toLowerCase()]));
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const action = searchParams.get("action") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (entityType && entityId) {
      const relatedTypes = getRelatedEntityTypes(entityType);
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            {
              entityType: { in: relatedTypes },
              entityId: entityId,
            },
            {
              entityType: { in: relatedTypes },
              newValues: { contains: entityId },
            },
            {
              entityType: { in: relatedTypes },
              oldValues: { contains: entityId },
            },
          ],
        },
      ];
    } else if (entityType) {
      const relatedTypes = getRelatedEntityTypes(entityType);
      where.entityType = { in: relatedTypes };
    } else if (entityId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { entityId: entityId },
            { newValues: { contains: entityId } },
            { oldValues: { contains: entityId } },
          ],
        },
      ];
    }

    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = end;
      }
    }

    if (category && category !== "ALL") {
      if (category === "SECURITY_AUTH") {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { action: { contains: "SKIP", mode: "insensitive" } },
              { action: { contains: "PASSWORD", mode: "insensitive" } },
              { action: { contains: "AUTH", mode: "insensitive" } },
              { action: { contains: "SECURITY", mode: "insensitive" } },
            ],
          },
        ];
      } else if (category === "STAGE_CHANGES") {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { action: { contains: "STAGE", mode: "insensitive" } },
              { action: { contains: "STATUS", mode: "insensitive" } },
              { action: { contains: "PROGRESSION", mode: "insensitive" } },
            ],
          },
        ];
      } else if (category === "VERIFICATIONS") {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { action: { contains: "AUDIT", mode: "insensitive" } },
              { action: { contains: "VERIF", mode: "insensitive" } },
              { action: { contains: "COMPLIANCE", mode: "insensitive" } },
            ],
          },
        ];
      } else if (category === "EXPENSES_FINANCE") {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { action: { contains: "EXPENSE", mode: "insensitive" } },
              { action: { contains: "PAYMENT", mode: "insensitive" } },
              { action: { contains: "INVOICE", mode: "insensitive" } },
              { action: { contains: "FINANCE", mode: "insensitive" } },
            ],
          },
        ];
      }
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { action: { contains: search, mode: "insensitive" } },
            { entityType: { contains: search, mode: "insensitive" } },
            { entityId: { contains: search, mode: "insensitive" } },
            { newValues: { contains: search, mode: "insensitive" } },
            { oldValues: { contains: search, mode: "insensitive" } },
            { user: { fullName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const [auditLogs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, email: true, accessLevel: true, avatarUrl: true } },
        },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    // Parse oldValues and newValues for client UI
    const parsedLogs = auditLogs.map((l) => {
      let parsedOld = null;
      let parsedNew = null;
      try {
        if (l.oldValues) parsedOld = JSON.parse(l.oldValues);
      } catch {
        parsedOld = l.oldValues;
      }
      try {
        if (l.newValues) parsedNew = JSON.parse(l.newValues);
      } catch {
        parsedNew = l.newValues;
      }
      return {
        ...l,
        parsedOldValues: parsedOld,
        parsedNewValues: parsedNew,
      };
    });

    return successResponse(parsedLogs, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + auditLogs.length < total,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const body = await req.json();
    const { action, entityType, entityId, notes, category, auditType, metadata } = body;

    if (!action) {
      throw new ValidationError("action is required");
    }

    const targetEntityType = (entityType && typeof entityType === "string" && entityType.trim())
      ? entityType.trim()
      : "GLOBAL";
    const targetEntityId = (entityId && typeof entityId === "string" && entityId.trim())
      ? entityId.trim()
      : "GLOBAL";

    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const ipAddress = rawIp.split(",")[0].trim();

    const log = await AuditService.logEvent({
      userId: session.userId,
      action: action.toUpperCase().replace(/\s+/g, "_"),
      entityType: targetEntityType,
      entityId: targetEntityId,
      newValues: {
        category: category || "AUDIT_VERIFICATION",
        auditType: auditType || "MANUAL_CHECK",
        notes: notes || "Audit verification confirmed by auditor.",
        metadata: metadata || null,
        loggedAt: new Date().toISOString(),
      },
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return successResponse(log);
  } catch (err) {
    return errorResponse(err);
  }
}
 

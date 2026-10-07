import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { AuditService } from "@/modules/audit/audit.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "100", 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }
    if (action) where.action = { contains: action };
    if (userId) where.userId = userId;
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { action: { contains: search } },
            { newValues: { contains: search } },
            { oldValues: { contains: search } },
            { user: { fullName: { contains: search } } },
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

    if (!action || !entityType || !entityId) {
      throw new ValidationError("action, entityType, and entityId are required");
    }

    const log = await AuditService.logEvent({
      userId: session.userId,
      action: action.toUpperCase().replace(/\s+/g, "_"),
      entityType,
      entityId,
      newValues: {
        category: category || "AUDIT_VERIFICATION",
        auditType: auditType || "MANUAL_CHECK",
        notes: notes || "Audit verification confirmed by auditor.",
        metadata: metadata || null,
        loggedAt: new Date().toISOString(),
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return successResponse(log);
  } catch (err) {
    return errorResponse(err);
  }
}

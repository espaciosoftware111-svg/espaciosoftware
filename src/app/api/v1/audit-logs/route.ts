import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.requireAdmin(session.userId, "VIEW_AUDIT_LOGS");

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const action = searchParams.get("action") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "100", 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [auditLogs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { fullName: true, email: true } },
        },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    return successResponse(auditLogs, {
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

import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { SettingsService } from "@/modules/settings/settings.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ForbiddenError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError("Unauthorized");

    const hasPermission = await RbacService.hasPermission(session.userId, "settings:finance");
    const isSuperAdmin = await RbacService.isUserSuperAdmin(session.userId);
    if (!hasPermission && !isSuperAdmin) {
      throw new ForbiddenError("Forbidden: Insufficient permissions to view payment settings");
    }

    const settings = await SettingsService.getPaymentSettings();
    return successResponse(settings);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError("Unauthorized");

    const hasPermission = await RbacService.hasPermission(session.userId, "settings:finance");
    const isSuperAdmin = await RbacService.isUserSuperAdmin(session.userId);
    if (!hasPermission && !isSuperAdmin) {
      throw new ForbiddenError("Forbidden: Insufficient permissions to update payment settings");
    }

    const body = await req.json();
    const updated = await SettingsService.updatePaymentSettings(body, session.userId);
    return successResponse(updated, { message: "Payment settings updated successfully" });
  } catch (err) {
    return errorResponse(err);
  }
}

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

    const hasPermission = await RbacService.hasPermission(session.userId, "settings:quotations");
    const isSuperAdmin = await RbacService.isUserSuperAdmin(session.userId);
    if (!hasPermission && !isSuperAdmin) {
      throw new ForbiddenError("Forbidden: Insufficient permissions to view quotation settings");
    }

    const settings = await SettingsService.getQuotationSettings();
    return successResponse(settings);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError("Unauthorized");

    const hasPermission = await RbacService.hasPermission(session.userId, "settings:quotations");
    const isSuperAdmin = await RbacService.isUserSuperAdmin(session.userId);
    if (!hasPermission && !isSuperAdmin) {
      throw new ForbiddenError("Forbidden: Insufficient permissions to update quotation settings");
    }

    const body = await req.json();
    const updated = await SettingsService.updateQuotationSettings(body, session.userId);
    return successResponse(updated, { message: "Quotation settings updated successfully" });
  } catch (err) {
    return errorResponse(err);
  }
}

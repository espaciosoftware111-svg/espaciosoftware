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

    const hasPermission = await RbacService.hasPermission(session.userId, "settings:view");
    const isSuperAdmin = await RbacService.isUserSuperAdmin(session.userId);
    if (!hasPermission && !isSuperAdmin) {
      throw new ForbiddenError("Forbidden: Insufficient permissions to view business configuration");
    }

    const [leadSettings, projectSettings, paymentSettings, expenseSettings, vendorSettings] = await Promise.all([
      SettingsService.getLeadSettings(),
      SettingsService.getProjectSettings(),
      SettingsService.getPaymentSettings(),
      SettingsService.getExpenseSettings(),
      SettingsService.getVendorSettings(),
    ]);

    return successResponse({
      leadSettings,
      projectSettings,
      paymentSettings,
      expenseSettings,
      vendorSettings,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

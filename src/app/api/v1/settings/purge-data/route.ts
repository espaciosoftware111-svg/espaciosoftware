import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { SettingsService } from "@/modules/settings/settings.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ForbiddenError, ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) {
      throw new AuthError("Authentication required to access system purge controls");
    }

    // Verify Super Admin authority
    const isSuperAdmin = await RbacService.isUserSuperAdmin(session.userId);
    if (!isSuperAdmin) {
      throw new ForbiddenError("Forbidden: Only Super Administrators can execute system-wide data purge");
    }

    const body = await req.json().catch(() => ({}));
    const { password, confirmationPhrase } = body;

    if (!password) {
      throw new ValidationError("Admin password is required to authorize complete system data wipe.");
    }

    if (confirmationPhrase !== "RESET ALL DATA" && confirmationPhrase !== "PURGE ALL DATA") {
      throw new ValidationError("Please type 'RESET ALL DATA' in the confirmation box to confirm this permanent action.");
    }

    const result = await SettingsService.purgeAllOperationalData(session.userId, password);

    return successResponse(result, {
      message: "All operational records, leads, projects, expenses, payments, orders, and inventory have been reset to 0.",
    });
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { SettingsService } from "@/modules/settings/settings.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError("Unauthorized");

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new ValidationError("Current password, new password, and confirmation are required");
    }

    if (newPassword !== confirmPassword) {
      throw new ValidationError("New password and confirmation password do not match");
    }

    if (newPassword.length < 6) {
      throw new ValidationError("New password must be at least 6 characters in length");
    }

    const result = await SettingsService.changeUserPassword(session.userId, currentPassword, newPassword);
    return successResponse(result, { message: "Password updated successfully" });
  } catch (err) {
    return errorResponse(err);
  }
}

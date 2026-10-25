import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { GoogleSheetsSyncService } from "@/modules/integrations/google-sheets.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError("Unauthorized");

    const config = await GoogleSheetsSyncService.getConfig();
    return successResponse(config);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError("Unauthorized");

    const result = await GoogleSheetsSyncService.syncNow(session.userId);
    return successResponse(result, { message: result.message });
  } catch (err) {
    return errorResponse(err);
  }
}

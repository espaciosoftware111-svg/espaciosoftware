import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { DynamicAlertService } from "@/modules/notifications/dynamic-alert.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const result = await DynamicAlertService.syncDynamicAlerts(session.userId);
    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

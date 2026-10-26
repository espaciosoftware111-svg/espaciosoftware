import { NextRequest } from "next/server";
import { AccessRequestService } from "@/modules/auth/access-request.service";
import { AuthService } from "@/modules/auth/auth.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) {
      throw new AuthError("Unauthorized. Please log in.");
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const requests = await AccessRequestService.listRequests(status);
    return successResponse(requests);
  } catch (err) {
    console.error("[ACCESS REQUESTS GET ERROR]:", err);
    return errorResponse(err);
  }
}

import { NextRequest } from "next/server";
import { AccessRequestService } from "@/modules/auth/access-request.service";
import { AuthService } from "@/modules/auth/auth.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) {
      throw new AuthError("Unauthorized. Please log in.");
    }

    const { id } = await context.params;
    let reason: string | undefined = undefined;

    try {
      const body = await req.json();
      if (body?.reason) reason = body.reason;
    } catch {
      // Empty body
    }

    const result = await AccessRequestService.rejectRequest(id, session.userId, reason);
    return successResponse(result, { message: "Access request rejected" });
  } catch (err) {
    console.error("[ACCESS REQUEST REJECT POST ERROR]:", err);
    return errorResponse(err);
  }
}

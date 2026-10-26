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
    let assignedRole: string | undefined = undefined;

    try {
      const body = await req.json();
      if (body?.role) assignedRole = body.role;
    } catch {
      // Empty body is acceptable
    }

    const result = await AccessRequestService.approveRequest(id, session.userId, assignedRole);
    return successResponse(result, { message: "Account approved successfully" });
  } catch (err) {
    console.error("[ACCESS REQUEST APPROVE POST ERROR]:", err);
    return errorResponse(err);
  }
}

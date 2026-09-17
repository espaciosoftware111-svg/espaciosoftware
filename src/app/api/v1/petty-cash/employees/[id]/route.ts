import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { PettyCashService } from "@/modules/petty-cash/petty-cash.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "finance:read", "GET_EMPLOYEE_PETTY_CASH_LEDGER");

    const resolvedParams = await params;
    const data = await PettyCashService.getEmployeePettyCashDetails(resolvedParams.id);
    return successResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
}

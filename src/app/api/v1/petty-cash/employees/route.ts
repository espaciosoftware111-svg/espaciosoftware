import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { PettyCashService } from "@/modules/petty-cash/petty-cash.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "finance:read", "GET_PETTY_CASH_EMPLOYEES");

    const employees = await PettyCashService.getEmployeesPettyCashSummary();
    return successResponse(employees);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "finance:write", "CREATE_PETTY_CASH_EMPLOYEE");

    const body = await req.json();
    if (!body.fullName || typeof body.fullName !== "string" || body.fullName.trim().length === 0) {
      throw new ValidationError("Employee full name is required");
    }

    const employee = await PettyCashService.createQuickEmployee(
      {
        fullName: body.fullName.trim(),
        phone: body.phone ? String(body.phone).trim() : undefined,
        email: body.email ? String(body.email).trim() : undefined,
        designation: body.designation ? String(body.designation).trim() : undefined,
        department: body.department ? String(body.department).trim() : undefined,
      },
      session.userId
    );

    return successResponse(employee, undefined, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

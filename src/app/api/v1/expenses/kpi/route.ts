import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { ExpenseService } from "@/modules/expenses/expense.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "expenses:read", "GET_EXPENSE_KPI");

    const kpi = await ExpenseService.getExpensesKpi();
    return successResponse(kpi);
  } catch (err) {
    return errorResponse(err);
  }
}

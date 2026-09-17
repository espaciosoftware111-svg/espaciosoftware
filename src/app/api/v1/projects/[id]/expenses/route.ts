import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { ExpenseService } from "@/modules/expenses/expense.service";
import { recordExpenseSchema } from "@/validators/expense.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "projects:read", "GET_PROJECT_EXPENSES");

    const { id } = await params;
    const summary = await ExpenseService.getProjectExpensesSummary(id);
    return successResponse(summary);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "expenses:write", "RECORD_PROJECT_EXPENSE");

    const { id } = await params;
    const body = await req.json();

    const payload = {
      ...body,
      expenseType: "PROJECT",
      projectId: id,
    };

    const parsed = recordExpenseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError("Invalid project expense payload", parsed.error.format());
    }

    const expense = await ExpenseService.recordExpense(parsed.data, session.userId);
    return successResponse(expense, undefined, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

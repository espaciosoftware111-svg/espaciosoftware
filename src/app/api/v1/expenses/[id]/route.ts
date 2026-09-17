import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { ExpenseService } from "@/modules/expenses/expense.service";
import { updateExpenseSchema } from "@/validators/expense.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "expenses:read", "GET_EXPENSE_DETAILS");

    const { id } = await params;
    const expense = await ExpenseService.getExpenseById(id);
    return successResponse(expense);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "expenses:write", "UPDATE_EXPENSE");

    const { id } = await params;
    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError("Invalid expense update payload", parsed.error.format());
    }

    const updated = await ExpenseService.updateExpense(id, parsed.data, session.userId);
    return successResponse(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "expenses:delete", "DELETE_EXPENSE");

    const { id } = await params;
    const result = await ExpenseService.deleteExpense(id, session.userId);
    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}


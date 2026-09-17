import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";
import { PettyCashCalculationService } from "@/modules/petty-cash/petty-cash-calculation.service";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "expenses:read", "GET_PETTY_CASH_KPI");

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    // 1. Total allocated (sum of all advance amounts)
    const advanceTotals = await db.employeeAdvance.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 2. Total spent = sum of all petty cash expense amounts
    const spentTotals = await db.pettyCashExpense.aggregate({
      where: { status: { not: "REJECTED" } },
      _sum: { amount: true },
    });

    // 3. Total returned = sum of cashReturned from settlements (only finalized ones)
    const settlementTotals = await db.advanceSettlement.aggregate({
      where: { status: { in: ["SETTLED", "DISCREPANCY"] } },
      _sum: { cashReturned: true },
    });

    // 4. Active employees: unique count of employees with petty cash records
    const activeAdvanceEmployees = await db.employeeAdvance.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { employeeId: true },
      distinct: ["employeeId"],
    });

    // 5. This month petty expenses
    const thisMonthExpenses = await db.pettyCashExpense.aggregate({
      where: {
        expenseDate: { gte: currentMonthStart, lte: currentMonthEnd },
        status: { not: "REJECTED" },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 6. Prev month petty expenses
    const prevMonthExpenses = await db.pettyCashExpense.aggregate({
      where: {
        expenseDate: { gte: prevMonthStart, lte: prevMonthEnd },
        status: { not: "REJECTED" },
      },
      _sum: { amount: true },
    });

    const totalAllocated = PettyCashCalculationService.roundCurrency(advanceTotals._sum.amount ?? 0);
    const totalSpent = PettyCashCalculationService.roundCurrency(spentTotals._sum.amount ?? 0);
    const totalReturned = PettyCashCalculationService.roundCurrency(settlementTotals._sum.cashReturned ?? 0);
    // Available Balance = Total Given - Total Spent (accounting for unspent float returned to company safe)
    const availableBalance = PettyCashCalculationService.roundCurrency(Math.max(0, totalAllocated - totalSpent - totalReturned));
    const totalOutstanding = availableBalance;
    const totalAdvanceCount = advanceTotals._count.id ?? 0;
    const activeEmployeeCount = activeAdvanceEmployees.length;
    const thisMonth = thisMonthExpenses._sum.amount ?? 0;
    const prevMonth = prevMonthExpenses._sum.amount ?? 0;

    const monthDeltaPct =
      prevMonth > 0
        ? Number((((thisMonth - prevMonth) / prevMonth) * 100).toFixed(1))
        : thisMonth > 0
        ? 100
        : 0;

    return successResponse({
      totalAllocated,
      totalSpent,
      totalReturned,
      availableBalance,
      totalOutstanding,
      totalAdvanceCount,
      activeEmployeeCount,
      thisMonthExpenses: thisMonth,
      thisMonthExpenseCount: thisMonthExpenses._count.id ?? 0,
      prevMonthExpenses: prevMonth,
      monthDeltaPct,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

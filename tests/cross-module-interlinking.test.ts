import { describe, it, expect } from "vitest";
import { DashboardMetricsService } from "../src/modules/dashboard/dashboard.service";
import { ExpenseService } from "../src/modules/expenses/expense.service";
import { db } from "../src/lib/db";

describe("ESPACIO ERP — Cross-Module Interlinking & Deep-Navigation Suite", () => {
  it("1. Dashboard service resolves entity deep links with URL query parameters", () => {
    const resolve = (DashboardMetricsService as any).resolveEntityUrl;
    expect(resolve("LEAD", "lead_123")).toBe("/leads?id=lead_123");
    expect(resolve("PROJECT", "proj_456")).toBe("/projects?id=proj_456");
    expect(resolve("QUOTATION", "quot_789")).toBe("/quotations/quot_789");
    expect(resolve("CLIENT", "cli_101")).toBe("/clients?id=cli_101");
    expect(resolve("EXPENSE", "exp_202")).toBe("/finance/expenses?id=exp_202");
    expect(resolve("PAYMENT", "pay_303")).toBe("/finance/payments?id=pay_303");
    expect(resolve("ADVANCE", "adv_404")).toBe("/finance/petty-cash?id=adv_404");
    expect(resolve("PETTY_CASH", "pet_505")).toBe("/finance/petty-cash?id=pet_505");
    expect(resolve("VENDOR", "ven_606")).toBe("/procurement/vendors?id=ven_606");
    expect(resolve("EMPLOYEE", "emp_707")).toBe("/employees/emp_707");
  });

  it("2. Dashboard service resolves base URLs when entityId is not provided", () => {
    const resolve = (DashboardMetricsService as any).resolveEntityUrl;
    expect(resolve("LEAD")).toBe("/leads");
    expect(resolve("PROJECT")).toBe("/projects");
    expect(resolve("QUOTATION")).toBe("/quotations");
    expect(resolve("CLIENT")).toBe("/clients");
    expect(resolve("EXPENSE")).toBe("/finance/expenses");
    expect(resolve("PAYMENT")).toBe("/finance/payments");
  });

  it("3. ExpenseService includes employee relation when retrieving expense details", async () => {
    // Find or test getExpenseById includes employee relation
    const anyExpense = await db.expense.findFirst({
      select: { id: true },
    });

    if (anyExpense) {
      const details = await ExpenseService.getExpenseById(anyExpense.id);
      expect(details).toBeDefined();
      expect("employee" in details).toBe(true);
      expect("project" in details).toBe(true);
      expect("lead" in details).toBe(true);
    }
  });
});

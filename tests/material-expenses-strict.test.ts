import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { ExpenseService } from "@/modules/expenses/expense.service";
import { IdGeneratorService } from "@/lib/id-generator";

describe("Material / Personal Expense Management - Strict Verification", () => {
  let testLeadId: string;
  let testLeadRef: string;
  let testUserId: string;

  beforeAll(async () => {
    // 1. Create a test user (Super Admin)
    const user = await db.user.upsert({
      where: { email: "material-expense-admin@espacio.test" },
      update: { accessLevel: "SUPER_ADMIN", status: "ACTIVE" },
      create: {
        id: "mat-exp-test-user-001",
        email: "material-expense-admin@espacio.test",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuv",
        fullName: "Material Expense Lead Test Admin",
        accessLevel: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });
    testUserId = user.id;

    // 2. Create a test Material Requirement Lead
    const leadRef = await IdGeneratorService.generate("LEAD");
    testLeadRef = leadRef;
    const lead = await db.lead.create({
      data: {
        referenceNo: leadRef,
        clientName: "Mr. Rajesh Sharma (Material Client)",
        phone: "+91 98765 43210",
        email: "rajesh.materials@example.com",
        location: "Whitefield, Bangalore",
        propertyTypeKey: "RESIDENTIAL",
        sourceKey: "DIRECT_SUPPLY",
        requirement: "Direct High-Grade Teak Wood & Brass Hardware Supply",
        estimatedBudget: 450000,
        priority: "HIGH",
        stage: "CONTACTED",
      },
    });
    testLeadId = lead.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testLeadId) {
      await db.expense.deleteMany({ where: { leadId: testLeadId } });
      await (db as any).activity?.deleteMany?.({ where: { entityId: testLeadId } });
      await db.auditLog.deleteMany({ where: { entityId: testLeadId } });
      await db.lead.delete({ where: { id: testLeadId } }).catch(() => {});
    }
    if (testUserId) {
      await db.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  it("1. Should record a Material Expense directly linked to a Material Lead", async () => {
    const expense = await ExpenseService.recordExpense(
      {
        expenseType: "MATERIAL",
        categoryKey: "MATERIAL",
        leadId: testLeadId,
        description: "Bulk cement and steel purchase for client requirement",
        amount: 85000,
        paymentMethod: "BANK_TRANSFER",
        vendorName: "UltraTech & Tata Tiscon Direct",
      },
      testUserId
    );

    expect(expense.id).toBeDefined();
    expect(expense.referenceNo).toMatch(/^EXP-/);
    expect(expense.leadId).toBe(testLeadId);
    expect(expense.expenseType).toBe("MATERIAL");
    expect(expense.categoryKey).toBe("MATERIAL");
    expect(expense.amount).toBe(85000);
    expect(expense.lead?.clientName).toBe("Mr. Rajesh Sharma (Material Client)");
  });

  it("2. Should fetch Material Requirement Lead expense summary with accurate totals and breakdown", async () => {
    // Add two more expenses to test category breakdown
    await ExpenseService.recordExpense(
      {
        expenseType: "MATERIAL",
        categoryKey: "TRANSPORT",
        leadId: testLeadId,
        description: "Delivery truck transport freight",
        amount: 7500,
        paymentMethod: "UPI",
      },
      testUserId
    );

    await ExpenseService.recordExpense(
      {
        expenseType: "MATERIAL",
        categoryKey: "LABOUR",
        leadId: testLeadId,
        description: "Loading and unloading charges",
        amount: 4500,
        paymentMethod: "CASH",
      },
      testUserId
    );

    const summary = await ExpenseService.getLeadExpensesSummary(testLeadId);

    expect(summary.leadId).toBe(testLeadId);
    expect(summary.totalExpenses).toBe(97000); // 85000 + 7500 + 4500
    expect(summary.expenseCount).toBe(3);

    // Verify Category Breakdown
    expect(summary.categoryBreakdown.length).toBe(3);
    const materialCat = summary.categoryBreakdown.find((c: any) => c.categoryKey === "MATERIAL");
    expect(materialCat).toBeDefined();
    expect(materialCat!.amount).toBe(85000);
    expect(materialCat!.count).toBe(1);

    const transportCat = summary.categoryBreakdown.find((c: any) => c.categoryKey === "TRANSPORT");
    expect(transportCat).toBeDefined();
    expect(transportCat!.amount).toBe(7500);

    const labourCat = summary.categoryBreakdown.find((c: any) => c.categoryKey === "LABOUR");
    expect(labourCat).toBeDefined();
    expect(labourCat!.amount).toBe(4500);
  });

  it("3. Should synchronize and display the Material Expense in Global Expense queries", async () => {
    const globalResult = await ExpenseService.getExpenses({
      leadId: testLeadId,
    });

    expect(globalResult.expenses.length).toBe(3);
    expect(globalResult.pagination.total).toBe(3);

    // Search by client name
    const searchResult = await ExpenseService.getExpenses({
      search: "Rajesh Sharma",
    });

    expect(searchResult.expenses.length).toBeGreaterThanOrEqual(3);
    const item = searchResult.expenses.find((e: any) => e.leadId === testLeadId);
    expect(item).toBeDefined();
    expect(item.lead?.clientName).toBe("Mr. Rajesh Sharma (Material Client)");
    expect(item.lead?.phone).toBe("+91 98765 43210");
  });

  it("4. Should fetch single Expense details with full Lead & Material details", async () => {
    const list = await db.expense.findMany({ where: { leadId: testLeadId } });
    const target = list[0];

    const details = await ExpenseService.getExpenseById(target.id);
    expect(details.id).toBe(target.id);
    expect(details.lead).toBeDefined();
    expect(details.lead?.clientName).toBe("Mr. Rajesh Sharma (Material Client)");
    expect(details.lead?.requirement).toBe("Direct High-Grade Teak Wood & Brass Hardware Supply");
  });

  it("5. Should dynamically update expense amount and recalculate Lead totals and Audit logs", async () => {
    const list = await db.expense.findMany({ where: { leadId: testLeadId, categoryKey: "LABOUR" } });
    const labourExpense = list[0];

    const updated = await ExpenseService.updateExpense(
      labourExpense.id,
      {
        amount: 6000,
        description: "Material Loading & Unloading (Overtime)",
      },
      testUserId
    );

    expect(updated.amount).toBe(6000);

    // Verify summary recalculation: 85000 + 7500 + 6000 = 98500
    const summary = await ExpenseService.getLeadExpensesSummary(testLeadId);
    expect(summary.totalExpenses).toBe(98500);

    // Check Audit Log
    const auditLogs = await db.auditLog.findMany({
      where: { entityId: labourExpense.id, action: "EXPENSE_UPDATED" },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
  });

  it("6. Should support deleting expense and updating lead totals dynamically", async () => {
    const list = await db.expense.findMany({ where: { leadId: testLeadId, categoryKey: "TRANSPORT" } });
    const transportExpense = list[0];

    const result = await ExpenseService.deleteExpense(transportExpense.id, testUserId);
    expect(result.success).toBe(true);

    // Verify summary recalculation: 85000 + 6000 = 91000
    const summary = await ExpenseService.getLeadExpensesSummary(testLeadId);
    expect(summary.totalExpenses).toBe(91000);
    expect(summary.expenseCount).toBe(2);

    // Check Audit Log
    const auditLogs = await db.auditLog.findMany({
      where: { entityId: transportExpense.id, action: "EXPENSE_DELETED" },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
  });
});

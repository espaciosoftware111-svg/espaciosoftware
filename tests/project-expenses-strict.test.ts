import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../src/lib/db";
import { ExpenseService } from "../src/modules/expenses/expense.service";
import { ProjectService } from "../src/modules/projects/project.service";

describe("ESPACIO ERP — Project Expense Management Strict Test Suite", () => {
  let testProjectId: string;
  let testClientId: string;
  let testAdminUserId: string;

  beforeAll(async () => {
    // 1. Get or create Admin user
    let user = await db.user.findFirst({ where: { accessLevel: "ADMIN" } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: `admin-exp-test-${Date.now()}@espacio.test`,
          fullName: "Finance Admin Tester",
          passwordHash: "dummy-hash",
          accessLevel: "ADMIN",
        },
      });
    }
    testAdminUserId = user.id;

    // 2. Get or create Client
    let client = await db.client.findFirst();
    if (!client) {
      client = await db.client.create({
        data: {
          referenceNo: `CLI-TEST-${Date.now()}`,
          fullName: "Expense Test Client",
          phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        },
      });
    }
    testClientId = client.id;

    // 3. Create dedicated Test Project with known budget
    const project = await db.project.create({
      data: {
        referenceNo: `PROJ-EXP-${Date.now()}`,
        title: "Villa 402 Modular Execution",
        clientId: testClientId,
        contractValue: 500000,
        revisedBudget: 500000,
        totalExpenses: 0,
        netProfit: 500000,
        profitMarginPct: 100.0,
        stage: "WOOD_WORK",
        status: "ACTIVE",
      },
    });
    testProjectId = project.id;
  });

  it("TEST 1: Records an expense from Project and creates ONE canonical record in Expense table", async () => {
    const expense = await ExpenseService.recordExpense(
      {
        expenseType: "PROJECT",
        projectId: testProjectId,
        categoryKey: "LABOUR",
        description: "Master Carpenter Phase 1 Advance",
        amount: 45000,
        paymentMethod: "BANK_TRANSFER",
        vendorName: "Sri Balaji Carpentry",
        referenceNoExternal: "VOUCHER-001",
        notes: "Verified by Site Engineer",
      },
      testAdminUserId
    );

    expect(expense).toBeDefined();
    expect(expense.referenceNo).toMatch(/^EXP-\d{4}-\d{4}$/);
    expect(expense.projectId).toBe(testProjectId);
    expect(expense.amount).toBe(45000);
    expect(expense.categoryKey).toBe("LABOUR");

    // Verify exactly ONE database record exists
    const inDb = await db.expense.findUnique({
      where: { id: expense.id },
    });
    expect(inDb).not.toBeNull();
    expect(inDb?.projectId).toBe(testProjectId);
  });

  it("TEST 2: Verifies same expense record is visible in Project Expense History and Global Expenses", async () => {
    const projectSummary = await ExpenseService.getProjectExpensesSummary(testProjectId);
    expect(projectSummary.expenses.length).toBeGreaterThanOrEqual(1);

    const matchInProject = projectSummary.expenses.find((e: any) => e.description === "Master Carpenter Phase 1 Advance");
    expect(matchInProject).toBeDefined();
    expect(matchInProject?.amount).toBe(45000);

    const globalExpenses = await ExpenseService.getExpenses({ projectId: testProjectId });
    const matchInGlobal = globalExpenses.expenses.find((e: any) => e.id === matchInProject?.id);
    expect(matchInGlobal).toBeDefined();
    expect(matchInGlobal?.id).toBe(matchInProject?.id);
    expect(matchInGlobal?.referenceNo).toBe(matchInProject?.referenceNo);
  });

  it("TEST 3: Dynamically accumulates multiple expenses and calculates Total Project Expenses and Margins", async () => {
    // Record second expense (Material)
    await ExpenseService.recordExpense(
      {
        expenseType: "PROJECT",
        projectId: testProjectId,
        categoryKey: "MATERIAL",
        description: "18mm Waterproof Plywood 40 Sheets",
        amount: 80000,
        paymentMethod: "BANK_TRANSFER",
        vendorName: "Century Plywood Distributor",
      },
      testAdminUserId
    );

    // Record third expense (Transport)
    await ExpenseService.recordExpense(
      {
        expenseType: "PROJECT",
        projectId: testProjectId,
        categoryKey: "TRANSPORT",
        description: "Tempo Freight Delivery to Site",
        amount: 5000,
        paymentMethod: "CASH",
        vendorName: "City Logistics",
      },
      testAdminUserId
    );

    const summary = await ExpenseService.getProjectExpensesSummary(testProjectId);
    expect(summary.totalExpenses).toBe(130000); // 45,000 + 80,000 + 5,000
    expect(summary.contractBudget).toBe(500000);
    expect(summary.remainingBudget).toBe(370000); // 500,000 - 130,000
    expect(summary.grossMarginPct).toBe(74); // (370,000 / 500,000) * 100

    // Verify Project table itself is updated
    const projectInDb = await db.project.findUnique({ where: { id: testProjectId } });
    expect(projectInDb?.totalExpenses).toBe(130000);
    expect(projectInDb?.netProfit).toBe(370000);
  });

  it("TEST 4: Calculates dynamic Category-Wise Expense Breakdown with exact amounts and percentages", async () => {
    const summary = await ExpenseService.getProjectExpensesSummary(testProjectId);
    const breakdown = summary.categoryBreakdown;

    expect(breakdown.length).toBe(3); // LABOUR, MATERIAL, TRANSPORT

    const matCat = breakdown.find((b) => b.categoryKey === "MATERIAL");
    expect(matCat).toBeDefined();
    expect(matCat?.amount).toBe(80000);
    expect(matCat?.percentage).toBe(61.5); // (80,000 / 130,000) * 100 = 61.5%

    const labCat = breakdown.find((b) => b.categoryKey === "LABOUR");
    expect(labCat).toBeDefined();
    expect(labCat?.amount).toBe(45000);
    expect(labCat?.percentage).toBe(34.6); // (45,000 / 130,000) * 100 = 34.6%

    const trCat = breakdown.find((b) => b.categoryKey === "TRANSPORT");
    expect(trCat).toBeDefined();
    expect(trCat?.amount).toBe(5000);
    expect(trCat?.percentage).toBe(3.8); // (5,000 / 130,000) * 100 = 3.8%
  });

  it("TEST 5: Synchronizes project totals automatically when an expense is updated", async () => {
    const summaryBefore = await ExpenseService.getProjectExpensesSummary(testProjectId);
    const transportExp = summaryBefore.expenses.find((e) => e.categoryKey === "TRANSPORT");
    expect(transportExp).toBeDefined();

    // Update transport amount from 5,000 to 15,000
    const updated = await ExpenseService.updateExpense(
      transportExp!.id,
      {
        amount: 15000,
        description: "Tempo Freight + Unloading Charges",
      },
      testAdminUserId
    );

    expect(updated.amount).toBe(15000);

    const summaryAfter = await ExpenseService.getProjectExpensesSummary(testProjectId);
    expect(summaryAfter.totalExpenses).toBe(140000); // 45,000 + 80,000 + 15,000
    expect(summaryAfter.remainingBudget).toBe(360000);

    const trCat = summaryAfter.categoryBreakdown.find((b) => b.categoryKey === "TRANSPORT");
    expect(trCat?.amount).toBe(15000);
  });

  it("TEST 6: Deletes expense and verifies project totals decrease immediately without dangling data", async () => {
    const summaryBefore = await ExpenseService.getProjectExpensesSummary(testProjectId);
    const labourExp = summaryBefore.expenses.find((e) => e.categoryKey === "LABOUR");
    expect(labourExp).toBeDefined();

    // Delete Labour Expense (45,000)
    const deleteResult = await ExpenseService.deleteExpense(labourExp!.id, testAdminUserId);
    expect(deleteResult.success).toBe(true);

    const summaryAfter = await ExpenseService.getProjectExpensesSummary(testProjectId);
    expect(summaryAfter.totalExpenses).toBe(95000); // 140,000 - 45,000 = 95,000
    expect(summaryAfter.remainingBudget).toBe(405000);

    const checkLabour = summaryAfter.categoryBreakdown.find((b) => b.categoryKey === "LABOUR");
    expect(checkLabour).toBeUndefined();
  });

  it("TEST 7: Preserves complete audit trail for EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED", async () => {
    const auditLogs = await db.auditLog.findMany({
      where: {
        entityType: "Expense",
        action: { in: ["EXPENSE_CREATED", "EXPENSE_UPDATED", "EXPENSE_DELETED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const actions = auditLogs.map((l) => l.action);
    expect(actions).toContain("EXPENSE_CREATED");
    expect(actions).toContain("EXPENSE_UPDATED");
    expect(actions).toContain("EXPENSE_DELETED");

    const projectActivities = await db.activityLog.findMany({
      where: {
        entityType: "Project",
        entityId: testProjectId,
        type: "EXPENSE",
      },
    });
    expect(projectActivities.length).toBeGreaterThanOrEqual(3);
  });
});

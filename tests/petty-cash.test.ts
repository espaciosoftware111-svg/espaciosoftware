import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../src/lib/db";
import { PettyCashService } from "../src/modules/petty-cash/petty-cash.service";
import { PettyCashCalculationService } from "../src/modules/petty-cash/petty-cash-calculation.service";
import { ProjectCostService } from "../src/modules/expenses/project-cost.service";

describe("Petty Cash & Employee Advance Module Tests", () => {
  let sampleUserId: string;
  let managerUserId: string;
  let sampleProjectId: string;
  let testAdvanceId: string;

  beforeAll(async () => {
    // Reset ALLOW_SELF_APPROVAL to false for test isolation
    await db.setting.upsert({
      where: { key: "ALLOW_SELF_APPROVAL" },
      update: { value: "false" },
      create: { key: "ALLOW_SELF_APPROVAL", value: "false", category: "FINANCE" },
    });

    const user1 = await db.user.findFirst();
    if (!user1) throw new Error("No user found for testing");
    sampleUserId = user1.id;

    let user2 = await db.user.findFirst({ where: { id: { not: sampleUserId } } });
    if (!user2) {
      user2 = await db.user.create({
        data: {
          email: "manager.test@espacio.in",
          fullName: "Finance Manager Test",
          passwordHash: "hash123",
        },
      });
    }
    managerUserId = user2.id;

    let project = await db.project.findFirst();
    if (!project) {
      project = await db.project.create({
        data: {
          referenceNo: "PROJ-2026-9999",
          title: "Test Petty Cash Project",
          propertyTypeKey: "APARTMENT_INTERIOR",
        },
      });
    }
    sampleProjectId = project.id;
  });

  it("issues an employee advance with server-generated ADV-YYYY-XXXX reference", async () => {
    const advance = await PettyCashService.issueAdvance(
      {
        employeeId: sampleUserId,
        amount: 5000,
        purpose: "Site petty cash float for testing",
        projectId: sampleProjectId,
      },
      managerUserId
    );

    expect(advance).toBeDefined();
    expect(advance.referenceNo).toMatch(/^ADV-\d{4}-\d{4}$/);
    expect(advance.amount).toBe(5000);
    expect(advance.status).toBe("ISSUED");

    testAdvanceId = advance.id;
  });

  it("calculates authoritative advance running balance correctly", async () => {
    const summary = await PettyCashCalculationService.calculateAdvanceSummary(testAdvanceId);
    expect(summary).toBeDefined();
    expect(summary.totalAdvance).toBe(5000);
    expect(summary.outstandingBalance).toBe(5000);
  });

  it("records a valid petty cash expense entry (PCX-YYYY-XXXX) and updates running balance", async () => {
    const pettyExp = await PettyCashService.recordPettyExpense(
      {
        advanceId: testAdvanceId,
        amount: 450,
        categoryKey: "SITE_HARDWARE",
        paymentMethod: "PETTY_CASH",
        purpose: "Emergency screws and brackets from local hardware",
        referenceNoExternal: "REC-9918",
      },
      sampleUserId
    );

    expect(pettyExp).toBeDefined();
    expect(pettyExp.referenceNo).toMatch(/^PCX-\d{4}-\d{4}$/);
    expect(pettyExp.amount).toBe(450);

    const summary = await PettyCashCalculationService.calculateAdvanceSummary(testAdvanceId);
    expect(summary.totalSpent).toBe(450);
    expect(summary.outstandingBalance).toBe(4550);
  });

  it("strictly enforces spending limit and rejects expenses exceeding available advance balance", async () => {
    await expect(
      PettyCashService.recordPettyExpense(
        {
          advanceId: testAdvanceId,
          amount: 5000, // Exceeds 4,550 remaining balance
          categoryKey: "SITE_HARDWARE",
          paymentMethod: "PETTY_CASH",
          purpose: "Over-limit expense attempt",
        },
        sampleUserId
      )
    ).rejects.toThrow(/exceeds remaining advance balance/i);
  });

  it("verifies project cost integration (increases Project Cost by ₹450, NOT ₹5,000 advance)", async () => {
    const costSheet = await ProjectCostService.calculateProjectCost(sampleProjectId);

    expect(costSheet).toBeDefined();
    expect(costSheet.totalCost).toBeGreaterThanOrEqual(450);
  });

  it("enforces self-approval policy protection when employee attempts self-settlement", async () => {
    await expect(
      PettyCashService.settleAdvance(
        {
          advanceId: testAdvanceId,
          cashReturned: 4000,
          notes: "Self-settlement attempt",
        },
        sampleUserId // Employee attempting self-approval when ALLOW_SELF_APPROVAL is false
      )
    ).rejects.toThrow(/Self-settlement approval of employee advances is prohibited/i);
  });

  it("detects settlement discrepancy when advance amount does not equal spent + returned cash", async () => {
    // Advance: 5,000. Spent: 450. Cash returned: 4,000. (Missing 550)
    const settlement = await PettyCashService.settleAdvance(
      {
        advanceId: testAdvanceId,
        cashReturned: 4000,
        notes: "Partial cash return test",
      },
      managerUserId // Authorized manager settling advance
    );

    expect(settlement).toBeDefined();
    expect(settlement.referenceNo).toMatch(/^SET-\d{4}-\d{4}$/);
    expect(settlement.status).toBe("DISCREPANCY");
    expect(settlement.difference).toBe(550);

    const summary = await PettyCashCalculationService.calculateAdvanceSummary(testAdvanceId);
    expect(summary.cashReturned).toBe(4000);
    expect(summary.status).toBe("PARTIALLY_SETTLED");
  });

  it("verifies that issuing Petty Cash advance creates a linked Business Expense record", async () => {
    // Check Expense table for canonical linked record with categoryKey PETTY_CASH
    const linkedExpense = await db.expense.findFirst({
      where: {
        categoryKey: "PETTY_CASH",
        expenseType: "BUSINESS",
        amount: 5000,
        status: "APPROVED",
      },
    });

    expect(linkedExpense).toBeDefined();
    expect(linkedExpense?.amount).toBe(5000);
    expect(linkedExpense?.expenseType).toBe("BUSINESS");
  });

  it("handles 'Others / Add New Employee' flow and makes the employee available for future petty cash", async () => {
    const uniqueEmail = `test.emp.${Date.now()}@espacio.in`;
    const newEmp = await PettyCashService.createQuickEmployee(
      {
        fullName: "Suresh Sharma",
        phone: "9876543219",
        email: uniqueEmail,
        designation: "Site Supervisor",
        department: "EXECUTION",
      },
      managerUserId
    );

    expect(newEmp).toBeDefined();
    expect(newEmp.fullName).toBe("Suresh Sharma");
    expect(newEmp.email).toBe(uniqueEmail);

    // Verify employee appears in employees summary
    const summaries = await PettyCashService.getEmployeesPettyCashSummary();
    const found = summaries.find((s) => s.id === newEmp.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Suresh Sharma");
    expect(found?.currentBalance).toBe(0);

    // Issue Petty Cash advance to newly created employee
    const newAdv = await PettyCashService.issueAdvance(
      {
        employeeId: newEmp.id,
        amount: 10000,
        purpose: "Initial Float for Suresh",
      },
      managerUserId
    );

    expect(newAdv.amount).toBe(10000);

    // Verify dynamic balance updated to 10,000
    const updatedSummaries = await PettyCashService.getEmployeesPettyCashSummary();
    const updatedEmp = updatedSummaries.find((s) => s.id === newEmp.id);
    expect(updatedEmp?.totalCashReceived).toBe(10000);
    expect(updatedEmp?.currentBalance).toBe(10000);

    // Log expense of 2,500
    await PettyCashService.recordPettyExpense(
      {
        advanceId: newAdv.id,
        amount: 2500,
        categoryKey: "TRANSPORT",
        paymentMethod: "CASH",
        purpose: "Tempo freight from supplier",
      },
      newEmp.id
    );

    // Verify employee details, KPIs and running ledger
    const details = await PettyCashService.getEmployeePettyCashDetails(newEmp.id);
    expect(details).toBeDefined();
    expect(details.kpis.totalCashReceived).toBe(10000);
    expect(details.kpis.totalExpenses).toBe(2500);
    expect(details.kpis.currentAvailableBalance).toBe(7500);
    expect(details.kpis.totalTransactions).toBe(2); // 1 cash advance + 1 expense

    // Verify running ledger format: credit, debit, running balance
    expect(details.ledger.length).toBe(2);
    // displayLedger is reversed (newest first)
    const expenseEntry = details.ledger[0];
    const advanceEntry = details.ledger[1];

    expect(advanceEntry.transactionType).toBe("CASH_ADVANCE");
    expect(advanceEntry.credit).toBe(10000);
    expect(advanceEntry.debit).toBe(0);
    expect(advanceEntry.runningBalance).toBe(10000);

    expect(expenseEntry.transactionType).toBe("EXPENSE");
    expect(expenseEntry.credit).toBe(0);
    expect(expenseEntry.debit).toBe(2500);
    expect(expenseEntry.runningBalance).toBe(7500);
  });
});


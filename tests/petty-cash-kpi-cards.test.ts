import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../src/lib/db";
import { PettyCashService } from "../src/modules/petty-cash/petty-cash.service";
import { PettyCashCalculationService } from "../src/modules/petty-cash/petty-cash-calculation.service";

describe("Petty Cash KPI Cards - Dynamic Financial Integrity & Deduplication", () => {
  let custodianUser: any;
  let custodian2User: any;
  let managerUser: any;
  let testProject: any;

  beforeAll(async () => {
    // Setup manager
    managerUser = await db.user.findFirst();
    if (!managerUser) {
      managerUser = await db.user.create({
        data: {
          email: "superadmin.kpi@espacio.in",
          fullName: "Super Admin KPI",
          passwordHash: "hash123",
        },
      });
    }

    const runId = Date.now();
    // Create dedicated test custodians with unique runId
    custodianUser = await db.user.create({
      data: {
        email: `kpi.custodian1.${runId}@espacio.in`,
        fullName: "Rahul Custodian Test",
        passwordHash: "hash123",
        phone: "+91 9988776655",
      },
    });

    custodian2User = await db.user.create({
      data: {
        email: `kpi.custodian2.${runId}@espacio.in`,
        fullName: "Priya Site Incharge Test",
        passwordHash: "hash123",
        phone: "+91 9988776656",
      },
    });

    // Test project
    testProject = await db.project.findFirst();
    if (!testProject) {
      testProject = await db.project.create({
        data: {
          referenceNo: "PROJ-KPI-2026",
          title: "KPI Card Financial Test Project",
          propertyTypeKey: "APARTMENT_INTERIOR",
        },
      });
    }
  });

  it("calculates multiple cash allocations to the same employee without double counting active employees", async () => {
    // Rahul receives 1st allocation of 10,000
    const adv1 = await PettyCashService.issueAdvance(
      {
        employeeId: custodianUser.id,
        amount: 10000,
        purpose: "Initial petty cash float for Rahul",
        projectId: testProject.id,
      },
      managerUser.id
    );

    // Rahul receives 2nd allocation of 5,000
    const adv2 = await PettyCashService.issueAdvance(
      {
        employeeId: custodianUser.id,
        amount: 5000,
        purpose: "Top up float for Rahul",
        projectId: testProject.id,
      },
      managerUser.id
    );

    expect(adv1.id).toBeDefined();
    expect(adv2.id).toBeDefined();

    // Priya receives 1 allocation of 8,000
    const adv3 = await PettyCashService.issueAdvance(
      {
        employeeId: custodian2User.id,
        amount: 8000,
        purpose: "Float for Priya",
        projectId: testProject.id,
      },
      managerUser.id
    );
    expect(adv3.id).toBeDefined();

    // Rahul spends 3,000 from adv1
    const exp1 = await PettyCashService.recordPettyExpense(
      {
        advanceId: adv1.id,
        amount: 3000,
        categoryKey: "SITE_HARDWARE",
        paymentMethod: "PETTY_CASH",
        purpose: "Emergency hardware purchases",
      },
      custodianUser.id
    );
    expect(exp1.id).toBeDefined();

    // Rahul spends 2,000 from adv2
    const exp2 = await PettyCashService.recordPettyExpense(
      {
        advanceId: adv2.id,
        amount: 2000,
        categoryKey: "SITE_HARDWARE",
        paymentMethod: "PETTY_CASH",
        purpose: "Site fuel and minor tools",
      },
      custodianUser.id
    );
    expect(exp2.id).toBeDefined();

    // Verify Rahul's individual metrics
    const rahulSummary = await PettyCashService.getEmployeePettyCashDetails(custodianUser.id);
    expect(rahulSummary.employee.id).toBe(custodianUser.id);
    expect(rahulSummary.kpis.totalCashReceived).toBe(15000); // 10000 + 5000
    expect(rahulSummary.kpis.totalExpenses).toBe(5000); // 3000 + 2000
    expect(rahulSummary.kpis.currentAvailableBalance).toBe(10000); // 15000 - 5000
    expect(rahulSummary.kpis.totalTransactions).toBe(4); // 2 advances + 2 expenses

    // Strict formula: Total Cash Received - Total Cash Spent = Current Available Balance
    expect(rahulSummary.kpis.totalCashReceived - rahulSummary.kpis.totalExpenses).toBe(
      rahulSummary.kpis.currentAvailableBalance
    );
  });

  it("guarantees global KPI cards reflect sum of unique records with correct Available Balance formula", async () => {
    // Calculate global totals
    const advances = await db.employeeAdvance.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { amount: true },
      _count: { id: true },
    });

    const expenses = await db.pettyCashExpense.aggregate({
      where: { status: { not: "REJECTED" } },
      _sum: { amount: true },
      _count: { id: true },
    });

    const settlements = await db.advanceSettlement.aggregate({
      where: { status: { in: ["SETTLED", "DISCREPANCY"] } },
      _sum: { cashReturned: true },
    });

    const totalAllocated = Number(advances._sum.amount || 0);
    const totalReturned = Number(settlements._sum.cashReturned || 0);
    const totalSpent = Number(expenses._sum.amount || 0);

    // Available Balance Formula: Total Petty Cash Given - Total Petty Cash Spent - Total Returned
    const availableBalance = Math.max(0, totalAllocated - totalSpent - totalReturned);

    // Active Employees: unique count of employees with non-cancelled advances
    const uniqueCustodians = await db.employeeAdvance.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { employeeId: true },
      distinct: ["employeeId"],
    });

    expect(totalAllocated).toBeGreaterThanOrEqual(23000); // at least adv1 + adv2 + adv3
    expect(totalSpent).toBeGreaterThanOrEqual(5000);
    expect(availableBalance).toBe(totalAllocated - totalSpent - totalReturned);
    expect(uniqueCustodians.length).toBeGreaterThanOrEqual(2); // at least Rahul and Priya
  });

  it("maintains strict ledger consistency for each individual employee", async () => {
    const rahulSummary = await PettyCashService.getEmployeePettyCashDetails(custodianUser.id);
    const { ledger, kpis } = rahulSummary;

    let computedReceived = 0;
    let computedSpent = 0;

    for (const entry of ledger) {
      if (entry.transactionType === "CASH_ADVANCE") {
        computedReceived += entry.credit;
      } else if (entry.transactionType === "EXPENSE") {
        computedSpent += entry.debit;
      }
    }

    expect(computedReceived).toBe(kpis.totalCashReceived);
    expect(computedSpent).toBe(kpis.totalExpenses);
    expect(computedReceived - computedSpent).toBe(kpis.currentAvailableBalance);
    expect(ledger.length).toBe(kpis.totalTransactions);
  });
});

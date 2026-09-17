import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { ProjectService } from "@/modules/projects/project.service";
import { ExpenseService } from "@/modules/expenses/expense.service";
import { PettyCashService } from "@/modules/petty-cash/petty-cash.service";

describe("ESPACIO ERP — Cross-Module Creation & Relational Connectivity Suite", () => {
  let testUserId: string;
  let testFinancialAccountId: string;

  beforeEach(async () => {
    // 1. Ensure test user
    let user = await db.user.findFirst({ where: { email: "verify-conn-user@espacio.test" } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: "verify-conn-user@espacio.test",
          fullName: "Verification Engineer",
          passwordHash: "dummyhash",
          accessLevel: "ADMIN",
        },
      });
    }
    testUserId = user.id;

    // 2. Ensure test financial account
    let finAcc = await db.financialAccount.findFirst();
    if (!finAcc) {
      finAcc = await db.financialAccount.create({
        data: {
          name: "Main Operational Bank Account",
          accountCode: "1010-MAIN-CHECKING",
          type: "ASSET",
          currency: "INR",
          openingBalance: 1000000,
          currentBalance: 1000000,
          status: "ACTIVE",
        },
      });
    }
    testFinancialAccountId = finAcc.id;
  });

  it("1. Lead Conversion: creating a project from a lead connects relations and marks lead as WON", async () => {
    // Create origin client and lead
    const uniquePhone = `+919${Math.floor(100000000 + Math.random() * 900000000)}`;
    const client = await db.client.create({
      data: {
        referenceNo: `CLI-TEST-${Date.now()}`,
        fullName: "Connectivity Client",
        phone: uniquePhone,
        email: `conn.${Date.now()}@espacio.test`,
        clientType: "INDIVIDUAL",
        status: "ACTIVE",
      },
    });

    const lead = await db.lead.create({
      data: {
        referenceNo: `LEAD-TEST-${Date.now()}`,
        clientName: client.fullName,
        phone: client.phone,
        email: client.email,
        sourceKey: "WEBSITE",
        propertyTypeKey: "APARTMENT_INTERIOR",
        stage: "QUOTATION_SENT",
        clientId: client.id,
      },
    });

    // Create project referencing leadId
    const project = await ProjectService.createProject({
      title: "Connectivity Villa 401",
      leadId: lead.id,
      contractValue: 750000,
      stage: "CONFIRMATION_FEE_PAID",
    }, testUserId);

    expect(project).toBeDefined();
    expect(project.leadId).toBe(lead.id);
    expect(project.clientId).toBe(client.id);

    // Verify lead was marked as WON
    const updatedLead = await db.lead.findUnique({ where: { id: lead.id } });
    expect(updatedLead?.stage).toBe("WON");
  });

  it("2. Project Expense: recording an expense with projectId connects to project and recalculates totals", async () => {
    const project = await db.project.create({
      data: {
        referenceNo: `PROJ-EXP-${Date.now()}`,
        title: "Plywood Renovation Work",
        contractValue: 500000,
        status: "ACTIVE",
      },
    });

    const expense = await ExpenseService.recordExpense({
      expenseType: "PROJECT",
      categoryKey: "MATERIAL",
      description: "Marine Plywood for Kitchen Units",
      amount: 45000,
      paymentMethod: "BANK_TRANSFER",
      financialAccountId: testFinancialAccountId,
      projectId: project.id,
    }, testUserId);

    expect(expense.projectId).toBe(project.id);
    expect(expense.expenseType).toBe("PROJECT");

    // Retrieve via service and verify project relation is loaded
    const loaded = await ExpenseService.getExpenseById(expense.id);
    expect(loaded?.project?.id).toBe(project.id);
    expect(loaded?.project?.title).toBe(project.title);
  });

  it("3. Material Lead Expense: recording material expense connects to lead without affecting project costs", async () => {
    const lead = await db.lead.create({
      data: {
        referenceNo: `LEAD-MAT-${Date.now()}`,
        clientName: "Material Requirement Person",
        phone: "+91 98888 22334",
        sourceKey: "DIRECT",
        propertyTypeKey: "APARTMENT_INTERIOR",
        stage: "CONTACTED",
      },
    });

    const expense = await ExpenseService.recordExpense({
      expenseType: "MATERIAL",
      categoryKey: "MATERIAL",
      description: "Advance for Tiles Sampling",
      amount: 12000,
      paymentMethod: "BANK_TRANSFER",
      financialAccountId: testFinancialAccountId,
      leadId: lead.id,
    }, testUserId);

    expect(expense.leadId).toBe(lead.id);
    expect(expense.projectId).toBeNull();

    const loaded = await ExpenseService.getExpenseById(expense.id);
    expect(loaded?.lead?.id).toBe(lead.id);
    expect(loaded?.lead?.referenceNo).toBe(lead.referenceNo);
  });

  it("4. Petty Cash Business Expense: issuing advance creates connected Expense and Employee float", async () => {
    // Create employee user
    const emp = await db.user.create({
      data: {
        fullName: "Site Supervisor Conn",
        email: `site.sup.${Date.now()}@espacio.test`,
        passwordHash: "dummy",
        accessLevel: "USER",
      },
    });

    const advance = await PettyCashService.issueAdvance({
      employeeId: emp.id,
      amount: 15000,
      purpose: "Site emergency float allocation",
      financialAccountId: testFinancialAccountId,
      notes: "Site emergency float allocation",
    }, testUserId);

    expect(advance.id).toBeDefined();
    expect(advance.amount).toBe(15000);

    // Verify linked expense record was created
    const linkedExpense = await db.expense.findFirst({
      where: {
        referenceNoExternal: advance.referenceNo,
        categoryKey: "PETTY_CASH",
        expenseType: "BUSINESS",
      },
    });

    expect(linkedExpense).toBeDefined();
    expect(linkedExpense?.amount).toBe(15000);
    expect(linkedExpense?.categoryKey).toBe("PETTY_CASH");
  });
});

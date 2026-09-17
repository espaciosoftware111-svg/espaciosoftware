import { db } from "@/lib/db";
import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { SettingsService } from "../settings/settings.service";
import { AuditService } from "../audit/audit.service";
import { ActivityService } from "../activity/activity.service";
import { RbacService } from "../rbac/rbac.service";
import { NotificationService } from "../notifications/notification.service";
import { PeriodLockService } from "../finance/period-lock.service";
import { FinanceCalculationService } from "../finance/finance-calculation.service";
import { serverCache } from "@/lib/server-cache";
import { ConcurrentActionGuard } from "@/lib/action-guard";
import {
  RecordExpenseInput,
  UpdateExpenseInput,
  ApproveExpenseInput,
  RejectExpenseInput,
  CancelExpenseInput,
  ReclassifyExpenseInput,
} from "@/validators/expense.schema";

export interface ExpenseFilterParams {
  expenseType?: string;
  categoryKey?: string;
  projectId?: string;
  leadId?: string;
  employeeId?: string;
  vendorId?: string;
  financialAccountId?: string;
  paymentMethod?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export class ExpenseService {
  public static async recordExpense(input: RecordExpenseInput, userId?: string) {
    const lockKey = `EXPENSE:${userId || "SYS"}:${input.amount}:${input.expenseType}:${input.projectId || input.leadId || "BUSINESS"}:${input.categoryKey}:${(input.referenceNoExternal || "").trim()}`;
    return ConcurrentActionGuard.executeWithLock(lockKey, async () => {
    if (input.expenseType === "PROJECT" && (!input.projectId || input.projectId.trim() === "")) {
      throw new ValidationError("Project selection is required for Project Expenses");
    }

    const projectId = input.expenseType === "PROJECT" ? input.projectId : null;
    const leadId = input.leadId ? input.leadId.trim() : null;

    if (projectId) {
      const project = await db.project.findUnique({ where: { id: projectId } });
      if (!project) throw new NotFoundError("Project record not found");
    }

    if (leadId) {
      const lead = await db.lead.findUnique({ where: { id: leadId } });
      if (!lead) throw new NotFoundError("Lead record not found");
    }

    const amount = FinanceCalculationService.roundMoney(input.amount);
    if (amount <= 0) throw new ValidationError("Expense amount must be greater than 0");

    const expenseDate = input.expenseDate ? new Date(input.expenseDate) : new Date();

    // 1. Check period lock
    await PeriodLockService.checkPeriodOpen(expenseDate);

    // Deduplication check for external invoice/receipt reference
    const externalRef = input.referenceNoExternal ? input.referenceNoExternal.trim() : null;
    if (externalRef && externalRef.length > 0) {
      const existingRefExpense = await db.expense.findFirst({
        where: {
          referenceNoExternal: externalRef,
          status: { notIn: ["REJECTED", "CANCELLED"] },
        },
      });
      if (existingRefExpense) {
        throw new BusinessRuleError(
          `Expense with external reference "${externalRef}" is already recorded (${existingRefExpense.referenceNo}). Duplicate expense rejected.`
        );
      }
    }

    // 2. Validate financial account if provided
    let financialAccount: any = null;
    if (input.financialAccountId) {
      financialAccount = await db.financialAccount.findUnique({ where: { id: input.financialAccountId } });
      if (!financialAccount) throw new NotFoundError("Financial account not found");
    }

    // Check if submitting user is ADMIN
    const isUserAdmin = userId ? await RbacService.isUserAdmin(userId) : false;

    // Strict 2-level rule: Non-admin user expenses are ALWAYS submitted for Admin approval
    let autoApprove = false;
    if (isUserAdmin) {
      const thresholdSetting = await SettingsService.get("AUTO_APPROVE_EXPENSES_BELOW", "50000");
      const threshold = parseFloat(thresholdSetting) || 50000;
      autoApprove = amount <= threshold;
    }

    const initialStatus = autoApprove ? "APPROVED" : "SUBMITTED";
    const referenceNo = await IdGeneratorService.generate("EXP");
    const ledgerNo = await IdGeneratorService.generate("LED");

    const expense = await db.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          referenceNo,
          expenseType: input.expenseType,
          categoryKey: input.categoryKey,
          projectId,
          leadId,
          employeeId: input.employeeId || null,
          vendorId: input.vendorId || null,
          vendorName: input.vendorName || null,
          financialAccountId: financialAccount ? financialAccount.id : null,
          description: input.description.trim(),
          amount,
          paymentMethod: input.paymentMethod,
          expenseDate,
          referenceNoExternal: input.referenceNoExternal || null,
          notes: input.notes ? input.notes.trim() : null,
          status: initialStatus,
          createdById: userId ?? null,
          approvedById: autoApprove ? userId ?? null : null,
          approvedAt: autoApprove ? new Date() : null,
        },
        include: {
          project: { select: { id: true, referenceNo: true, title: true } },
          lead: { select: { id: true, referenceNo: true, clientName: true, phone: true, requirement: true } },
          employee: { select: { id: true, employeeNo: true, fullName: true } },
          financialAccount: { select: { id: true, accountCode: true, name: true } },
        },
      });

      // If auto-approved and account linked, debit account and log ledger entry
      if (autoApprove && financialAccount) {
        const newBalance = FinanceCalculationService.roundMoney(financialAccount.currentBalance - amount);
        await tx.financialAccount.update({
          where: { id: financialAccount.id },
          data: { currentBalance: newBalance },
        });

        await tx.financialLedger.create({
          data: {
            entryNo: ledgerNo,
            transactionDate: expenseDate,
            direction: "OUTFLOW",
            sourceType: "EXPENSE",
            sourceId: created.id,
            financialAccountId: financialAccount.id,
            projectId: projectId || null,
            categoryKey: input.categoryKey,
            amount,
            paymentMethod: input.paymentMethod,
            referenceNoExt: input.referenceNoExternal || null,
            status: "RECORDED",
            notes: `Expense ${created.referenceNo}: ${input.description.trim()}`,
            createdById: userId ?? null,
          },
        });
      }

      // Automatically recalculate and sync Project totals
      if (projectId) {
        const allProjExpenses = await tx.expense.findMany({
          where: {
            projectId,
            status: { notIn: ["CANCELLED", "REJECTED"] },
          },
          select: { amount: true },
        });
        const totalExpenses = FinanceCalculationService.roundMoney(
          allProjExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
        );
        const proj = await tx.project.findUnique({ where: { id: projectId }, select: { contractValue: true } });
        const contractVal = proj?.contractValue || 0;
        const netProfit = FinanceCalculationService.roundMoney(contractVal - totalExpenses);
        const profitMarginPct = contractVal > 0 ? Number(((netProfit / contractVal) * 100).toFixed(2)) : 0;

        await tx.project.update({
          where: { id: projectId },
          data: { totalExpenses, netProfit, profitMarginPct },
        });
      }

      return created;
    });

    await AuditService.logEvent({
      userId,
      action: "EXPENSE_CREATED",
      entityType: "Expense",
      entityId: expense.id,
      newValues: {
        referenceNo: expense.referenceNo,
        amount: expense.amount,
        type: expense.expenseType,
        status: expense.status,
        projectId: expense.projectId,
        leadId: expense.leadId,
        financialAccount: financialAccount?.name,
      },
    });

    if (projectId) {
      await ActivityService.record({
        userId,
        entityType: "Project",
        entityId: projectId,
        type: "EXPENSE",
        title: `Project Expense ${expense.referenceNo} Recorded`,
        description: `Amount: ₹${amount.toLocaleString()} (${input.categoryKey}) via ${input.paymentMethod}. Status: ${expense.status}.`,
      });
    }

    if (leadId) {
      await ActivityService.record({
        userId,
        entityType: "Lead",
        entityId: leadId,
        type: "EXPENSE",
        title: `Material/Personal Expense ${expense.referenceNo} Recorded`,
        description: `Amount: ₹${amount.toLocaleString()} (${input.categoryKey}) via ${input.paymentMethod}. Status: ${expense.status}.`,
      });
    }

    // If awaiting approval, notify all ADMINs
    if (initialStatus === "SUBMITTED") {
      await NotificationService.notifyAdmins({
        type: "EXPENSE_PENDING_APPROVAL",
        category: "FINANCE",
        priority: "HIGH",
        title: "New Expense Awaiting Approval",
        message: `Expense ${expense.referenceNo} for ₹${amount.toLocaleString()} has been submitted and is pending Admin review.`,
        entityType: "Expense",
        entityId: expense.id,
        actionUrl: `/finance/expenses`,
        actorId: userId,
      });
    }

    return expense;
    });
  }

  public static async approveExpense(expenseId: string, input?: ApproveExpenseInput, userId?: string) {
    // Strict 2-level rule: Only ADMIN can approve expenses
    if (userId) {
      await RbacService.requireAdmin(userId, "ADMIN_APPROVED_EXPENSE");
    }

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: { financialAccount: true },
    });
    if (!expense) throw new NotFoundError("Expense record not found");

    if (expense.status === "APPROVED" || expense.status === "PAID") {
      throw new BusinessRuleError(`Expense ${expense.referenceNo} is already approved.`);
    }

    // Self-approval check
    if (userId && expense.createdById === userId) {
      const isSuperAdmin = await RbacService.isSuperAdmin(userId);
      const allowSelfApproval = (await SettingsService.get("ALLOW_SELF_EXPENSE_APPROVAL", "false")) === "true";
      if (!isSuperAdmin && !allowSelfApproval) {
        throw new BusinessRuleError(
          "Self-approval of submitted expenses is prohibited by policy. An independent administrator must review and approve this expense."
        );
      }
    }

    // Check period lock
    await PeriodLockService.checkPeriodOpen(expense.expenseDate);

    const ledgerNo = await IdGeneratorService.generate("LED");

    const updated = await db.$transaction(async (tx) => {
      const appExpense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: "APPROVED",
          approvedById: userId ?? null,
          approvedAt: new Date(),
          notes: input?.notes ? `${expense.notes || ""}\nApproval Note: ${input.notes}`.trim() : expense.notes,
        },
      });

      // If financial account linked, debit account and log ledger entry
      if (expense.financialAccount) {
        const newBalance = FinanceCalculationService.roundMoney(
          expense.financialAccount.currentBalance - expense.amount
        );
        await tx.financialAccount.update({
          where: { id: expense.financialAccount.id },
          data: { currentBalance: newBalance },
        });

        await tx.financialLedger.create({
          data: {
            entryNo: ledgerNo,
            transactionDate: expense.expenseDate,
            direction: "OUTFLOW",
            sourceType: "EXPENSE",
            sourceId: expense.id,
            financialAccountId: expense.financialAccount.id,
            projectId: expense.projectId || null,
            categoryKey: expense.categoryKey,
            amount: expense.amount,
            paymentMethod: expense.paymentMethod,
            referenceNoExt: expense.referenceNoExternal || null,
            status: "RECORDED",
            notes: `Expense ${expense.referenceNo}: ${expense.description}`,
            createdById: userId ?? null,
          },
        });
      }

      return appExpense;
    });

    await AuditService.logEvent({
      userId,
      action: "ADMIN_APPROVED_EXPENSE",
      entityType: "Expense",
      entityId: expenseId,
      newValues: { referenceNo: updated.referenceNo, approvedAt: updated.approvedAt, status: "APPROVED" },
    });

    if (expense.projectId) {
      await ActivityService.record({
        userId,
        entityType: "Project",
        entityId: expense.projectId,
        type: "EXPENSE",
        title: `Expense ${updated.referenceNo} Approved`,
        description: `Admin approved project cost of ₹${expense.amount.toLocaleString()}.`,
      });
    }

    if (expense.createdById && expense.createdById !== userId) {
      await NotificationService.create({
        userId: expense.createdById,
        type: "EXPENSE_APPROVED",
        category: "FINANCE",
        priority: "NORMAL",
        title: "Expense Approved",
        message: `Your expense ${expense.referenceNo} (₹${expense.amount.toLocaleString()}) has been approved.`,
        entityType: "Expense",
        entityId: expense.id,
        actionUrl: `/finance/expenses`,
        actorId: userId,
      });
    }

    return updated;
  }

  public static async rejectExpense(expenseId: string, input: RejectExpenseInput, userId?: string) {
    if (userId) {
      await RbacService.requireAdmin(userId, "ADMIN_REJECTED_EXPENSE");
    }

    const expense = await db.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new NotFoundError("Expense record not found");

    const updated = await db.expense.update({
      where: { id: expenseId },
      data: {
        status: "REJECTED",
        rejectionReason: input.rejectionReason,
      },
    });

    await AuditService.logEvent({
      userId,
      action: "ADMIN_REJECTED_EXPENSE",
      entityType: "Expense",
      entityId: expenseId,
      newValues: { referenceNo: updated.referenceNo, rejectionReason: input.rejectionReason, status: "REJECTED" },
    });

    if (expense.createdById && expense.createdById !== userId) {
      await NotificationService.create({
        userId: expense.createdById,
        type: "EXPENSE_REJECTED",
        category: "FINANCE",
        priority: "HIGH",
        title: "Expense Rejected",
        message: `Your expense ${expense.referenceNo} (₹${expense.amount.toLocaleString()}) was rejected by Admin. Reason: ${input.rejectionReason}`,
        entityType: "Expense",
        entityId: expense.id,
        actionUrl: `/finance/expenses`,
        actorId: userId,
      });
    }

    return updated;
  }

  public static async cancelExpense(expenseId: string, input: CancelExpenseInput, userId?: string) {
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: { financialAccount: true },
    });
    if (!expense) throw new NotFoundError("Expense record not found");

    if (expense.status === "CANCELLED") {
      throw new BusinessRuleError(`Expense ${expense.referenceNo} is already cancelled.`);
    }

    const cancellationDate = new Date();
    await PeriodLockService.checkPeriodOpen(cancellationDate);

    const ledgerNo = await IdGeneratorService.generate("LED");

    const updated = await db.$transaction(async (tx) => {
      const cancelled = await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: "CANCELLED",
          rejectionReason: input.cancellationReason,
        },
      });

      // If it was already approved and linked to account, restore balance and create inverse ledger entry
      if ((expense.status === "APPROVED" || expense.status === "PAID") && expense.financialAccount) {
        const newBalance = FinanceCalculationService.roundMoney(
          expense.financialAccount.currentBalance + expense.amount
        );
        await tx.financialAccount.update({
          where: { id: expense.financialAccount.id },
          data: { currentBalance: newBalance },
        });

        await tx.financialLedger.create({
          data: {
            entryNo: ledgerNo,
            transactionDate: cancellationDate,
            direction: "INFLOW",
            sourceType: "EXPENSE",
            sourceId: expense.id,
            financialAccountId: expense.financialAccount.id,
            projectId: expense.projectId || null,
            categoryKey: expense.categoryKey,
            amount: expense.amount,
            paymentMethod: expense.paymentMethod,
            referenceNoExt: expense.referenceNoExternal || null,
            status: "REVERSED",
            notes: `Cancellation reversal for ${expense.referenceNo}: ${input.cancellationReason}`,
            createdById: userId ?? null,
          },
        });
      }

      return cancelled;
    });

    await AuditService.logEvent({
      userId,
      action: "EXPENSE_CANCELLED",
      entityType: "Expense",
      entityId: expenseId,
      newValues: { referenceNo: updated.referenceNo, cancellationReason: input.cancellationReason },
    });

    return updated;
  }

  public static async reclassifyExpense(expenseId: string, input: ReclassifyExpenseInput, userId?: string) {
    const expense = await db.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new NotFoundError("Expense record not found");

    const oldLog = expense.reclassificationLog ? JSON.parse(expense.reclassificationLog) : [];
    const newLogEntry = {
      reclassifiedAt: new Date().toISOString(),
      reclassifiedById: userId ?? null,
      reason: input.reclassificationReason,
      from: { categoryKey: expense.categoryKey, expenseType: expense.expenseType, projectId: expense.projectId },
      to: {
        categoryKey: input.categoryKey || expense.categoryKey,
        expenseType: input.expenseType || expense.expenseType,
        projectId: input.projectId || expense.projectId,
      },
    };

    oldLog.push(newLogEntry);

    const newType = input.expenseType || expense.expenseType;
    const newProjectId = newType === "PROJECT" ? input.projectId || expense.projectId : null;

    if (newType === "PROJECT" && !newProjectId) {
      throw new ValidationError("Project selection is required for Project Expenses");
    }

    const updated = await db.expense.update({
      where: { id: expenseId },
      data: {
        expenseType: newType,
        categoryKey: input.categoryKey || expense.categoryKey,
        projectId: newProjectId,
        reclassificationLog: JSON.stringify(oldLog),
      },
    });

    await AuditService.logEvent({
      userId,
      action: "EXPENSE_RECLASSIFIED",
      entityType: "Expense",
      entityId: expenseId,
      oldValues: { categoryKey: expense.categoryKey, expenseType: expense.expenseType },
      newValues: {
        categoryKey: updated.categoryKey,
        expenseType: updated.expenseType,
        reason: input.reclassificationReason,
      },
    });

    return updated;
  }

  public static async getExpenses(params: ExpenseFilterParams) {
    const cacheKey = `expenses:list:${JSON.stringify(params)}`;
    const cached = serverCache.get<any>(cacheKey);
    if (cached) return cached;

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.expenseType) where.expenseType = params.expenseType;
    if (params.categoryKey) where.categoryKey = params.categoryKey;
    if (params.projectId) where.projectId = params.projectId;
    if (params.leadId) where.leadId = params.leadId;
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.financialAccountId) where.financialAccountId = params.financialAccountId;
    if (params.paymentMethod) where.paymentMethod = params.paymentMethod;
    if (params.status) where.status = params.status;

    if (params.startDate || params.endDate) {
      where.expenseDate = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }

    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim();
      where.OR = [
        { referenceNo: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { vendorName: { contains: q, mode: "insensitive" } },
        { referenceNoExternal: { contains: q, mode: "insensitive" } },
        { project: { title: { contains: q, mode: "insensitive" } } },
        { project: { referenceNo: { contains: q, mode: "insensitive" } } },
        { lead: { clientName: { contains: q, mode: "insensitive" } } },
        { lead: { referenceNo: { contains: q, mode: "insensitive" } } },
        { lead: { phone: { contains: q, mode: "insensitive" } } },
        { employee: { fullName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, expenses] = await Promise.all([
      db.expense.count({ where }),
      db.expense.findMany({
        where,
        orderBy: { expenseDate: "desc" },
        skip,
        take: limit,
        include: {
          project: { select: { id: true, referenceNo: true, title: true } },
          lead: { select: { id: true, referenceNo: true, clientName: true, phone: true, requirement: true } },
          employee: { select: { id: true, employeeNo: true, fullName: true } },
          financialAccount: { select: { id: true, accountCode: true, name: true } },
          salaryPayment: { select: { id: true, referenceNo: true, periodMonth: true, periodYear: true } },
        },
      }),
    ]);

    const result = {
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    serverCache.set(cacheKey, result, 15);
    return result;
  }

  public static async getExpenseById(id: string) {
    const expense = await db.expense.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, referenceNo: true, title: true, contractValue: true, revisedBudget: true } },
        lead: { select: { id: true, referenceNo: true, clientName: true, phone: true, requirement: true } },
        employee: { select: { id: true, employeeNo: true, fullName: true, department: true, designation: true } },
        financialAccount: true,
        salaryPayment: { select: { id: true, referenceNo: true, periodMonth: true, periodYear: true, paymentDate: true } },
      },
    });

    if (!expense) throw new NotFoundError("Expense record not found");
    return expense;
  }

  public static async updateExpense(
    expenseId: string,
    input: UpdateExpenseInput,
    userId?: string
  ) {
    const existing = await db.expense.findUnique({
      where: { id: expenseId },
      include: { financialAccount: true },
    });
    if (!existing) throw new NotFoundError("Expense record not found");

    const amount = input.amount !== undefined ? FinanceCalculationService.roundMoney(input.amount) : existing.amount;
    const expenseDate = input.expenseDate ? new Date(input.expenseDate) : existing.expenseDate;

    await PeriodLockService.checkPeriodOpen(expenseDate);

    const updated = await db.$transaction(async (tx) => {
      const exp = await tx.expense.update({
        where: { id: expenseId },
        data: {
          categoryKey: input.categoryKey || existing.categoryKey,
          description: input.description !== undefined ? input.description.trim() : existing.description,
          amount,
          paymentMethod: input.paymentMethod || existing.paymentMethod,
          expenseDate,
          leadId: input.leadId !== undefined ? (input.leadId ? input.leadId.trim() : null) : existing.leadId,
          projectId: input.projectId !== undefined ? (input.projectId ? input.projectId.trim() : null) : existing.projectId,
          vendorName: input.vendorName !== undefined ? input.vendorName || null : existing.vendorName,
          referenceNoExternal: input.referenceNoExternal !== undefined ? input.referenceNoExternal || null : existing.referenceNoExternal,
          notes: input.notes !== undefined ? input.notes || null : existing.notes,
          status: input.status || existing.status,
        },
        include: {
          project: { select: { id: true, referenceNo: true, title: true } },
          lead: { select: { id: true, referenceNo: true, clientName: true, phone: true, requirement: true } },
          employee: { select: { id: true, employeeNo: true, fullName: true } },
          financialAccount: { select: { id: true, accountCode: true, name: true } },
        },
      });

      if (existing.projectId) {
        const allProjExpenses = await tx.expense.findMany({
          where: {
            projectId: existing.projectId,
            status: { notIn: ["CANCELLED", "REJECTED"] },
          },
          select: { amount: true },
        });
        const totalExpenses = FinanceCalculationService.roundMoney(
          allProjExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
        );
        const proj = await tx.project.findUnique({ where: { id: existing.projectId }, select: { contractValue: true } });
        const contractVal = proj?.contractValue || 0;
        const netProfit = FinanceCalculationService.roundMoney(contractVal - totalExpenses);
        const profitMarginPct = contractVal > 0 ? Number(((netProfit / contractVal) * 100).toFixed(2)) : 0;

        await tx.project.update({
          where: { id: existing.projectId },
          data: { totalExpenses, netProfit, profitMarginPct },
        });
      }

      return exp;
    });

    await AuditService.logEvent({
      userId,
      action: "EXPENSE_UPDATED",
      entityType: "Expense",
      entityId: expenseId,
      oldValues: {
        amount: existing.amount,
        categoryKey: existing.categoryKey,
        description: existing.description,
      },
      newValues: {
        amount: updated.amount,
        categoryKey: updated.categoryKey,
        description: updated.description,
      },
    });

    if (existing.projectId) {
      await ActivityService.record({
        userId,
        entityType: "Project",
        entityId: existing.projectId,
        type: "EXPENSE",
        title: `Project Expense ${updated.referenceNo} Updated`,
        description: `Expense details updated to ₹${updated.amount.toLocaleString()} (${updated.categoryKey}).`,
      });
    }

    if (existing.leadId) {
      await ActivityService.record({
        userId,
        entityType: "Lead",
        entityId: existing.leadId,
        type: "EXPENSE",
        title: `Expense ${updated.referenceNo} Updated`,
        description: `Expense details updated to ₹${updated.amount.toLocaleString()} (${updated.categoryKey}).`,
      });
    }

    return updated;
  }

  public static async deleteExpense(expenseId: string, userId?: string) {
    const existing = await db.expense.findUnique({
      where: { id: expenseId },
      include: { financialAccount: true },
    });
    if (!existing) throw new NotFoundError("Expense record not found");

    const projectId = existing.projectId;
    const leadId = existing.leadId;

    await db.$transaction(async (tx) => {
      // If linked to financial account and approved, restore balance
      if ((existing.status === "APPROVED" || existing.status === "PAID") && existing.financialAccount) {
        const newBalance = FinanceCalculationService.roundMoney(
          existing.financialAccount.currentBalance + existing.amount
        );
        await tx.financialAccount.update({
          where: { id: existing.financialAccount.id },
          data: { currentBalance: newBalance },
        });
      }

      // Delete the expense record
      await tx.expense.delete({
        where: { id: expenseId },
      });

      // Recalculate project totals if linked
      if (projectId) {
        const allProjExpenses = await tx.expense.findMany({
          where: {
            projectId,
            status: { notIn: ["CANCELLED", "REJECTED"] },
          },
          select: { amount: true },
        });
        const totalExpenses = FinanceCalculationService.roundMoney(
          allProjExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
        );
        const proj = await tx.project.findUnique({ where: { id: projectId }, select: { contractValue: true } });
        const contractVal = proj?.contractValue || 0;
        const netProfit = FinanceCalculationService.roundMoney(contractVal - totalExpenses);
        const profitMarginPct = contractVal > 0 ? Number(((netProfit / contractVal) * 100).toFixed(2)) : 0;

        await tx.project.update({
          where: { id: projectId },
          data: { totalExpenses, netProfit, profitMarginPct },
        });
      }
    });

    await AuditService.logEvent({
      userId,
      action: "EXPENSE_DELETED",
      entityType: "Expense",
      entityId: expenseId,
      oldValues: {
        referenceNo: existing.referenceNo,
        amount: existing.amount,
        projectId: existing.projectId,
        leadId: existing.leadId,
      },
    });

    if (projectId) {
      await ActivityService.record({
        userId,
        entityType: "Project",
        entityId: projectId,
        type: "EXPENSE",
        title: `Project Expense ${existing.referenceNo} Removed`,
        description: `Expense record of ₹${existing.amount.toLocaleString()} was deleted.`,
      });
    }

    if (leadId) {
      await ActivityService.record({
        userId,
        entityType: "Lead",
        entityId: leadId,
        type: "EXPENSE",
        title: `Expense ${existing.referenceNo} Removed`,
        description: `Expense record of ₹${existing.amount.toLocaleString()} was deleted.`,
      });
    }

    return { success: true, message: `Expense ${existing.referenceNo} deleted successfully.` };
  }

  public static async getProjectExpensesSummary(projectId: string) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { id: true, fullName: true, phone: true } },
        expenses: {
          orderBy: { expenseDate: "desc" },
          include: {
            employee: { select: { id: true, fullName: true } },
            financialAccount: { select: { id: true, name: true, accountCode: true } },
          },
        },
      },
    });

    if (!project) throw new NotFoundError("Project record not found");

    const activeExpenses = project.expenses.filter(
      (e) => e.status !== "CANCELLED" && e.status !== "REJECTED"
    );

    const totalExpenses = FinanceCalculationService.roundMoney(
      activeExpenses.reduce((sum, e) => sum + e.amount, 0)
    );

    const contractBudget = project.contractValue || 0;
    const revisedBudget = project.revisedBudget || contractBudget;
    const remainingBudget = FinanceCalculationService.roundMoney(revisedBudget - totalExpenses);
    const grossMarginPct = revisedBudget > 0 ? Number(((remainingBudget / revisedBudget) * 100).toFixed(2)) : 0;

    // Dynamic Category Breakdown
    const categoryTotalsMap: Record<string, { categoryKey: string; amount: number; count: number }> = {};

    for (const exp of activeExpenses) {
      const cat = exp.categoryKey || "OTHER";
      if (!categoryTotalsMap[cat]) {
        categoryTotalsMap[cat] = { categoryKey: cat, amount: 0, count: 0 };
      }
      categoryTotalsMap[cat].amount = FinanceCalculationService.roundMoney(
        categoryTotalsMap[cat].amount + exp.amount
      );
      categoryTotalsMap[cat].count += 1;
    }

    const categoryBreakdown = Object.values(categoryTotalsMap)
      .map((cat) => ({
        ...cat,
        percentage: totalExpenses > 0 ? Number(((cat.amount / totalExpenses) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      projectId: project.id,
      projectReferenceNo: project.referenceNo,
      projectTitle: project.title,
      clientName: project.client?.fullName || "N/A",
      contractBudget,
      revisedBudget,
      totalExpenses,
      remainingBudget,
      grossMarginPct,
      expenseCount: project.expenses.length,
      categoryBreakdown,
      expenses: project.expenses,
    };
  }

  public static async getLeadExpensesSummary(leadId: string) {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        expenses: {
          orderBy: { expenseDate: "desc" },
          include: {
            employee: { select: { id: true, fullName: true } },
            financialAccount: { select: { id: true, name: true, accountCode: true } },
          },
        },
      },
    });

    if (!lead) throw new NotFoundError("Lead record not found");

    const activeExpenses = lead.expenses.filter(
      (e) => e.status !== "CANCELLED" && e.status !== "REJECTED"
    );

    const totalExpenses = FinanceCalculationService.roundMoney(
      activeExpenses.reduce((sum, e) => sum + e.amount, 0)
    );

    const categoryTotalsMap: Record<string, { categoryKey: string; amount: number; count: number }> = {};

    for (const exp of activeExpenses) {
      const cat = exp.categoryKey || "OTHER";
      if (!categoryTotalsMap[cat]) {
        categoryTotalsMap[cat] = { categoryKey: cat, amount: 0, count: 0 };
      }
      categoryTotalsMap[cat].amount = FinanceCalculationService.roundMoney(
        categoryTotalsMap[cat].amount + exp.amount
      );
      categoryTotalsMap[cat].count += 1;
    }

    const categoryBreakdown = Object.values(categoryTotalsMap)
      .map((cat) => ({
        ...cat,
        percentage: totalExpenses > 0 ? Number(((cat.amount / totalExpenses) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      leadId: lead.id,
      leadReferenceNo: lead.referenceNo,
      clientName: lead.clientName,
      phone: lead.phone,
      requirement: lead.requirement,
      totalExpenses,
      expenseCount: lead.expenses.length,
      categoryBreakdown,
      expenses: lead.expenses,
    };
  }

  public static async getExpensesKpi() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const activeStatuses = { notIn: ["CANCELLED", "REJECTED"] as string[] };

    const [
      allActive,
      projectActive,
      materialActive,
      businessActive,
      currentMonthAll,
      prevMonthAll,
      pendingCount,
      businessByCategory,
    ] = await Promise.all([
      db.expense.aggregate({ where: { status: activeStatuses }, _sum: { amount: true }, _count: { id: true } }),
      db.expense.aggregate({ where: { expenseType: "PROJECT", status: activeStatuses }, _sum: { amount: true }, _count: { id: true } }),
      db.expense.aggregate({ where: { expenseType: { in: ["MATERIAL", "PERSONAL"] }, status: activeStatuses }, _sum: { amount: true }, _count: { id: true } }),
      db.expense.aggregate({ where: { expenseType: "BUSINESS", status: activeStatuses }, _sum: { amount: true }, _count: { id: true } }),
      db.expense.aggregate({
        where: { status: activeStatuses, expenseDate: { gte: currentMonthStart, lte: currentMonthEnd } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      db.expense.aggregate({
        where: { status: activeStatuses, expenseDate: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { amount: true },
      }),
      db.expense.count({ where: { status: "SUBMITTED" } }),
      db.expense.groupBy({
        by: ["categoryKey"],
        where: { expenseType: "BUSINESS", status: activeStatuses },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalAll = FinanceCalculationService.roundMoney(allActive._sum.amount || 0);
    const totalProject = FinanceCalculationService.roundMoney(projectActive._sum.amount || 0);
    const totalMaterial = FinanceCalculationService.roundMoney(materialActive._sum.amount || 0);
    const totalBusiness = FinanceCalculationService.roundMoney(businessActive._sum.amount || 0);
    const thisMonthTotal = FinanceCalculationService.roundMoney(currentMonthAll._sum.amount || 0);
    const prevMonthTotal = FinanceCalculationService.roundMoney(prevMonthAll._sum.amount || 0);

    const monthDeltaPct =
      prevMonthTotal > 0
        ? Number((((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(1))
        : thisMonthTotal > 0
        ? 100
        : 0;

    const businessCategoryBreakdown = (businessByCategory || [])
      .map((c) => ({
        categoryKey: c.categoryKey,
        amount: FinanceCalculationService.roundMoney(c._sum.amount || 0),
        count: c._count.id,
        percentage: totalBusiness > 0 ? Number((((c._sum.amount || 0) / totalBusiness) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalAllExpenses: totalAll,
      totalExpenseCount: allActive._count.id || 0,
      totalProjectExpenses: totalProject,
      projectExpenseCount: projectActive._count.id || 0,
      totalMaterialExpenses: totalMaterial,
      materialExpenseCount: materialActive._count.id || 0,
      totalBusinessExpenses: totalBusiness,
      businessExpenseCount: businessActive._count.id || 0,
      thisMonthTotal,
      thisMonthCount: currentMonthAll._count.id || 0,
      prevMonthTotal,
      monthDeltaPct,
      pendingApprovalCount: pendingCount,
      businessCategoryBreakdown,
    };
  }
}

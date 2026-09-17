import { db } from "@/lib/db";
import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { FinancialCalculationService } from "./financial-calculation.service";
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
  RecordPaymentInput,
  VerifyPaymentInput,
  ReversePaymentInput,
} from "@/validators/payment.schema";

export interface PaymentFilterParams {
  quotationId?: string;
  projectId?: string;
  leadId?: string;
  clientId?: string;
  relatedType?: string; // "ALL" | "PROJECT" | "MATERIALS" | "LEAD"
  paymentMethod?: string;
  status?: string;
  financialAccountId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export class PaymentService {
  /**
   * ATOMIC CLIENT PAYMENT RECORDING (Single Source of Truth)
   * PAYMENT -> QUOTATION -> RELATED ENTITY (PROJECT / MATERIAL / LEAD)
   */
  public static async recordPayment(input: RecordPaymentInput, userId?: string) {
    const lockKey = `PAYMENT:${userId || "SYS"}:${input.amount}:${input.projectId || input.quotationId || input.clientId || input.leadId || "GEN"}:${(input.transactionReference || input.externalReference || "").trim()}`;
    return ConcurrentActionGuard.executeWithLock(lockKey, async () => {
    let quotation: any = null;
    let project: any = null;
    let lead: any = null;
    let clientId: string | undefined = input.clientId ? input.clientId.trim() : undefined;
    let projectId: string | undefined = input.projectId ? input.projectId.trim() : undefined;
    let leadId: string | undefined = input.leadId ? input.leadId.trim() : undefined;

    // 1. RESOLVE LINKED QUOTATION IF PROVIDED
    if (input.quotationId && input.quotationId.trim().length > 0) {
      quotation = await db.quotation.findUnique({
        where: { id: input.quotationId.trim() },
        include: {
          project: { select: { id: true, referenceNo: true, title: true, clientId: true } },
          lead: { select: { id: true, referenceNo: true, clientName: true, phone: true, clientId: true, requirement: true } },
          client: { select: { id: true, referenceNo: true, fullName: true, phone: true, email: true } },
        },
      });
      if (!quotation) {
        throw new NotFoundError("Linked Quotation not found");
      }

      // Inherit entity connections from Quotation
      if (!projectId && quotation.projectId) {
        projectId = quotation.projectId;
      }
      if (!leadId && quotation.leadId) {
        leadId = quotation.leadId;
      }
      if (!clientId) {
        clientId = quotation.clientId || quotation.project?.clientId || quotation.lead?.clientId || undefined;
      }
    }

    // 2. RESOLVE PROJECT IF PROVIDED / INHERITED
    if (projectId) {
      project = await db.project.findUnique({
        where: { id: projectId },
        include: { client: true },
      });
      if (!project && !quotation) {
        throw new NotFoundError("Project record not found");
      }
      if (project && !clientId && project.clientId) {
        clientId = project.clientId;
      }
    }

    // 3. RESOLVE LEAD IF PROVIDED / INHERITED
    if (leadId && !project) {
      lead = await db.lead.findUnique({
        where: { id: leadId },
        include: { client: true },
      });
      if (lead && !clientId && lead.clientId) {
        clientId = lead.clientId;
      }
    }

    const amount = FinanceCalculationService.roundMoney(input.amount);
    if (amount <= 0) throw new ValidationError("Payment amount must be greater than 0");

    const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();

    // 4. PERIOD LOCK CHECK
    await PeriodLockService.checkPeriodOpen(paymentDate);

    // 5. DUPLICATE PAYMENT / REFERENCE PROTECTION
    const externalRef = (input.transactionReference || input.externalReference || "").trim() || null;
    if (externalRef && externalRef.length > 0) {
      const existingRefPayment = await db.clientPayment.findFirst({
        where: {
          referenceNoExt: externalRef,
          status: { not: "REVERSED" },
        },
      });
      if (existingRefPayment) {
        throw new BusinessRuleError(
          `Payment with transaction reference "${externalRef}" is already recorded (${existingRefPayment.referenceNo}). Duplicate payment rejected.`
        );
      }
    }

    // 6. OVERPAYMENT VALIDATION
    const allowOverpaymentSetting = await SettingsService.get("ALLOW_OVERPAYMENT", "false");
    const allowOverpayment = allowOverpaymentSetting === "true";

    if (!allowOverpayment) {
      if (projectId) {
        const financials = await FinancialCalculationService.calculateProjectFinancials(projectId);
        if (amount > financials.remainingBalance + 0.01) {
          throw new ValidationError(
            `Payment amount (₹${amount.toLocaleString("en-IN")}) exceeds the remaining project balance (₹${financials.remainingBalance.toLocaleString("en-IN")})`
          );
        }
      } else if (quotation) {
        let currentAdvance = 0;
        try {
          if (quotation.clientSnapshot) {
            const parsed = JSON.parse(quotation.clientSnapshot);
            currentAdvance = Number(parsed.advancePaid || 0);
          }
        } catch {
          currentAdvance = 0;
        }
        const remainingQuoteBalance = Math.max(0, FinanceCalculationService.roundMoney(quotation.totalAmount - currentAdvance));
        if (amount > remainingQuoteBalance + 0.01) {
          throw new ValidationError(
            `Payment amount (₹${amount.toLocaleString("en-IN")}) exceeds the remaining quotation balance (₹${remainingQuoteBalance.toLocaleString("en-IN")})`
          );
        }
      }
    }

    // 7. VERIFY FINANCIAL ACCOUNT IF SPECIFIED
    let financialAccount: any = null;
    if (input.financialAccountId) {
      financialAccount = await db.financialAccount.findUnique({
        where: { id: input.financialAccountId },
      });
      if (!financialAccount) throw new NotFoundError("Selected financial account not found");
    }

    // 8. DETERMINE INITIAL STATUS
    const isUserAdmin = userId ? await RbacService.isUserAdmin(userId) : false;
    let autoVerify = false;
    if (isUserAdmin) {
      const autoVerifySetting = await SettingsService.get("AUTO_VERIFY_PAYMENTS", "false");
      autoVerify = autoVerifySetting === "true" || isUserAdmin;
    }

    const initialStatus = autoVerify ? "VERIFIED" : "RECORDED";
    const referenceNo = await IdGeneratorService.generate("PAY");
    const ledgerNo = await IdGeneratorService.generate("LED");

    const paymentMethod = (input.paymentMethod || input.paymentType || "BANK_TRANSFER").trim().toUpperCase();

    // 9. ATOMIC TRANSACTION: Payment + Quotation snapshot + Milestone/Receivable/Ledger
    const result = await db.$transaction(async (tx) => {
      // Step A: Create ClientPayment record
      const payment = await tx.clientPayment.create({
        data: {
          referenceNo,
          quotationId: quotation ? quotation.id : input.quotationId || null,
          projectId: projectId || null,
          leadId: leadId || null,
          clientId: clientId || null,
          milestoneId: input.milestoneId || null,
          receivableId: input.receivableId || null,
          gstInvoiceId: input.gstInvoiceId || null,
          financialAccountId: financialAccount ? financialAccount.id : null,
          amount,
          paymentDate,
          paymentMethod,
          status: initialStatus,
          referenceNoExt: externalRef,
          notes: input.notes ? input.notes.trim() : null,
          receivedById: userId ?? null,
          verifiedById: autoVerify ? userId ?? null : null,
          verifiedAt: autoVerify ? new Date() : null,
        },
        include: {
          quotation: {
            select: {
              id: true,
              referenceNo: true,
              title: true,
              totalAmount: true,
              status: true,
              clientSnapshot: true,
            },
          },
          project: { select: { id: true, referenceNo: true, title: true, stage: true, contractValue: true, revisedBudget: true } },
          lead: { select: { id: true, referenceNo: true, clientName: true, phone: true, email: true, requirement: true } },
          client: { select: { id: true, referenceNo: true, fullName: true, email: true, phone: true } },
          milestone: { select: { id: true, title: true, amount: true, paidAmount: true } },
          financialAccount: { select: { id: true, accountCode: true, name: true } },
        },
      });

      // Step B: Update Quotation advance & balance snapshot if linked
      if (quotation) {
        let snapshotObj: any = {};
        try {
          if (quotation.clientSnapshot) {
            snapshotObj = JSON.parse(quotation.clientSnapshot);
          }
        } catch {
          snapshotObj = {};
        }

        const prevAdvance = Number(snapshotObj.advancePaid || 0);
        const newAdvance = FinanceCalculationService.roundMoney(prevAdvance + amount);
        const newBalance = Math.max(0, FinanceCalculationService.roundMoney(quotation.totalAmount - newAdvance));

        snapshotObj.advancePaid = newAdvance;
        snapshotObj.balanceDue = newBalance;

        await tx.quotation.update({
          where: { id: quotation.id },
          data: {
            clientSnapshot: JSON.stringify(snapshotObj),
          },
        });
      }

      // Step C: Update Milestone paidAmount and status if linked
      if (payment.milestoneId && payment.milestone) {
        const newPaid = FinanceCalculationService.roundMoney(payment.milestone.paidAmount + amount);
        const newStatus = newPaid >= payment.milestone.amount ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : "PENDING";
        await tx.paymentMilestone.update({
          where: { id: payment.milestoneId },
          data: {
            paidAmount: newPaid,
            status: newStatus,
          },
        });
      }

      // Step D: Update ClientReceivable paidAmount and status if linked
      if (input.receivableId) {
        const rec = await tx.clientReceivable.findUnique({ where: { id: input.receivableId } });
        if (rec) {
          const newPaid = FinanceCalculationService.roundMoney(rec.paidAmount + amount);
          const newOutstanding = FinanceCalculationService.roundMoney(Math.max(0, rec.amount - newPaid));
          const newStatus = newOutstanding <= 0 ? "PAID" : "PARTIALLY_PAID";
          await tx.clientReceivable.update({
            where: { id: rec.id },
            data: {
              paidAmount: newPaid,
              outstandingAmount: newOutstanding,
              status: newStatus,
            },
          });
        }
      }

      // Step E: Update FinancialAccount balance (INFLOW credit) if linked
      if (financialAccount) {
        const newBalance = FinanceCalculationService.roundMoney(financialAccount.currentBalance + amount);
        await tx.financialAccount.update({
          where: { id: financialAccount.id },
          data: { currentBalance: newBalance },
        });
      }

      // Step F: Create FinancialLedger Entry (INFLOW) if project exists
      let ledgerEntry = null;
      if (projectId) {
        ledgerEntry = await tx.financialLedger.create({
          data: {
            entryNo: ledgerNo,
            transactionDate: paymentDate,
            direction: "INFLOW",
            sourceType: "CLIENT_PAYMENT",
            sourceId: payment.id,
            financialAccountId: financialAccount ? financialAccount.id : null,
            clientId: clientId || null,
            projectId,
            categoryKey: "REVENUE",
            amount,
            paymentMethod,
            referenceNoExt: externalRef,
            status: "RECORDED",
            notes: `Client payment ${payment.referenceNo} for ${project?.title || quotation?.title || "Quotation Settlement"}`,
            createdById: userId ?? null,
          },
        });
      }

      return { payment, ledgerEntry };
    });

    // 10. AUDIT & ACTIVITY LOGGING
    await AuditService.logEvent({
      userId,
      action: "PAYMENT_RECORDED",
      entityType: "ClientPayment",
      entityId: result.payment.id,
      newValues: {
        referenceNo: result.payment.referenceNo,
        amount: result.payment.amount,
        paymentMethod: result.payment.paymentMethod,
        transactionReference: externalRef,
        status: result.payment.status,
        quotationId: quotation?.id || null,
        quotationRef: quotation?.referenceNo || null,
        projectId: projectId || null,
        leadId: leadId || null,
        financialAccount: financialAccount?.name,
      },
    });

    if (projectId) {
      await ActivityService.record({
        userId,
        entityType: "Project",
        entityId: projectId,
        type: "PAYMENT",
        title: `Client Payment ${result.payment.referenceNo} Recorded`,
        description: `Received ₹${amount.toLocaleString("en-IN")} via ${paymentMethod}${externalRef ? ` (Ref: ${externalRef})` : ""}. Status: ${result.payment.status}.`,
      });
    }

    if (leadId) {
      await ActivityService.record({
        userId,
        entityType: "Lead",
        entityId: leadId,
        type: "PAYMENT",
        title: `Payment ${result.payment.referenceNo} Recorded for Lead`,
        description: `Received ₹${amount.toLocaleString("en-IN")} via ${paymentMethod}${externalRef ? ` (Ref: ${externalRef})` : ""}.`,
      });
    }

    // 11. NOTIFICATION TO ADMINS IF PENDING CONFIRMATION
    if (initialStatus === "RECORDED") {
      await NotificationService.notifyAdmins({
        type: "PAYMENT_PENDING_CONFIRMATION",
        category: "FINANCE",
        priority: "HIGH",
        title: "New Client Payment Recorded",
        message: `Payment ${result.payment.referenceNo} for ₹${amount.toLocaleString("en-IN")} was recorded and is pending Admin confirmation.`,
        entityType: "ClientPayment",
        entityId: result.payment.id,
        actionUrl: `/finance/payments`,
        actorId: userId,
      });
    }

    serverCache.invalidate("payments:");
    serverCache.invalidate("quotations:");
    serverCache.invalidate("projects:");
    serverCache.invalidate("dashboard:");

    return result.payment;
    });
  }

  /**
   * GENERATE FORMAL PAYMENT RECEIPT / VOUCHER
   */
  public static async getPaymentReceipt(paymentId: string) {
    const payment = await db.clientPayment.findUnique({
      where: { id: paymentId },
      include: {
        quotation: {
          select: {
            id: true,
            referenceNo: true,
            title: true,
            totalAmount: true,
            status: true,
            clientSnapshot: true,
          },
        },
        project: {
          select: {
            id: true,
            referenceNo: true,
            title: true,
            propertyTypeKey: true,
            city: true,
            state: true,
            contractValue: true,
            revisedBudget: true,
          },
        },
        lead: {
          select: {
            id: true,
            referenceNo: true,
            clientName: true,
            email: true,
            phone: true,
            requirement: true,
            location: true,
          },
        },
        client: {
          select: {
            id: true,
            referenceNo: true,
            fullName: true,
            email: true,
            phone: true,
            companyName: true,
            gstin: true,
            billingAddress: true,
          },
        },
        milestone: { select: { id: true, title: true, milestonePct: true, amount: true } },
        financialAccount: { select: { id: true, accountCode: true, name: true, type: true } },
      },
    });

    if (!payment) throw new NotFoundError("Payment record not found");

    let financialSummary = {
      totalContractValue: payment.amount,
      totalPaidToDate: payment.amount,
      remainingOutstandingBalance: 0,
    };

    if (payment.projectId) {
      const financials = await FinancialCalculationService.calculateProjectFinancials(payment.projectId);
      financialSummary = {
        totalContractValue: financials.contractBudget,
        totalPaidToDate: financials.totalVerifiedPaid,
        remainingOutstandingBalance: financials.remainingBalance,
      };
    } else if (payment.quotation) {
      financialSummary = {
        totalContractValue: payment.quotation.totalAmount,
        totalPaidToDate: payment.amount,
        remainingOutstandingBalance: Math.max(0, payment.quotation.totalAmount - payment.amount),
      };
    }

    const clientName = payment.client?.fullName || payment.lead?.clientName || "Client Record";
    const clientPhone = payment.client?.phone || payment.lead?.phone || "";

    return {
      receiptNo: `REC-${payment.referenceNo}`,
      receiptDate: payment.paymentDate,
      payment: {
        id: payment.id,
        referenceNo: payment.referenceNo,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        externalReference: payment.referenceNoExt,
        status: payment.status,
        notes: payment.notes,
      },
      client: payment.client || { fullName: clientName, phone: clientPhone },
      project: payment.project,
      quotation: payment.quotation,
      lead: payment.lead,
      milestone: payment.milestone,
      financialSummary,
      company: {
        name: "ESPACIO INTERIORS PRIVATE LIMITED",
        tagline: "Turnkey Architecture & Interior Execution",
        address: "Plot 14, Financial District, Gachibowli, Hyderabad, Telangana 500032",
        gstin: "36AAACE1234F1Z5",
        phone: "+91 40 2345 6789",
        email: "accounts@espacio.in",
        website: "https://espacio.in",
      },
    };
  }

  public static async verifyPayment(paymentId: string, input?: VerifyPaymentInput, userId?: string) {
    if (userId) {
      await RbacService.requireAdmin(userId, "ADMIN_ACCEPTED_PAYMENT");
    }

    const payment = await db.clientPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError("Payment record not found");

    if (payment.status === "VERIFIED") {
      throw new BusinessRuleError(`Payment ${payment.referenceNo} is already verified.`);
    }
    if (payment.status === "REVERSED" || payment.status === "CANCELLED") {
      throw new BusinessRuleError(`Cannot verify a ${payment.status.toLowerCase()} payment.`);
    }

    const updated = await db.clientPayment.update({
      where: { id: paymentId },
      data: {
        status: "VERIFIED",
        verifiedById: userId ?? null,
        verifiedAt: new Date(),
        notes: input?.notes ? `${payment.notes || ""}\nVerification Note: ${input.notes}`.trim() : payment.notes,
      },
    });

    await AuditService.logEvent({
      userId,
      action: "ADMIN_ACCEPTED_PAYMENT",
      entityType: "ClientPayment",
      entityId: paymentId,
      newValues: { referenceNo: updated.referenceNo, verifiedAt: updated.verifiedAt, status: "VERIFIED" },
    });

    if (payment.projectId) {
      await ActivityService.record({
        userId,
        entityType: "Project",
        entityId: payment.projectId,
        type: "PAYMENT",
        title: `Payment ${updated.referenceNo} Confirmed`,
        description: `Admin confirmed client receipt of ₹${payment.amount.toLocaleString("en-IN")}.`,
      });
    }

    if (payment.receivedById && payment.receivedById !== userId) {
      await NotificationService.create({
        userId: payment.receivedById,
        type: "PAYMENT_CONFIRMED",
        category: "FINANCE",
        priority: "NORMAL",
        title: "Payment Confirmed",
        message: `Client payment ${payment.referenceNo} (₹${payment.amount.toLocaleString("en-IN")}) has been confirmed by Admin.`,
        entityType: "ClientPayment",
        entityId: payment.id,
        actionUrl: `/finance/payments`,
        actorId: userId,
      });
    }

    serverCache.invalidate("payments:");
    serverCache.invalidate("projects:");
    serverCache.invalidate("dashboard:");

    return updated;
  }

  public static async rejectPayment(paymentId: string, input?: { rejectionReason?: string }, userId?: string) {
    if (userId) {
      await RbacService.requireAdmin(userId, "ADMIN_REJECTED_PAYMENT");
    }

    const payment = await db.clientPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError("Payment record not found");

    if (payment.status === "CANCELLED" || payment.status === "REVERSED") {
      throw new BusinessRuleError(`Payment ${payment.referenceNo} is already ${payment.status.toLowerCase()}.`);
    }

    const reason = input?.rejectionReason || "Rejected by Admin during payment confirmation review";

    const updated = await db.clientPayment.update({
      where: { id: paymentId },
      data: {
        status: "CANCELLED",
        notes: payment.notes ? `${payment.notes}\nRejection Reason: ${reason}` : `Rejection Reason: ${reason}`,
      },
    });

    await AuditService.logEvent({
      userId,
      action: "ADMIN_REJECTED_PAYMENT",
      entityType: "ClientPayment",
      entityId: paymentId,
      newValues: { referenceNo: updated.referenceNo, status: "CANCELLED", rejectionReason: reason },
    });

    if (payment.receivedById && payment.receivedById !== userId) {
      await NotificationService.create({
        userId: payment.receivedById,
        type: "PAYMENT_REJECTED",
        category: "FINANCE",
        priority: "HIGH",
        title: "Payment Rejected",
        message: `Client payment ${payment.referenceNo} (₹${payment.amount.toLocaleString("en-IN")}) was rejected by Admin. Reason: ${reason}`,
        entityType: "ClientPayment",
        entityId: payment.id,
        actionUrl: `/finance/payments`,
        actorId: userId,
      });
    }

    serverCache.invalidate("payments:");
    return updated;
  }

  /**
   * ATOMIC PAYMENT REVERSAL
   */
  public static async reversePayment(paymentId: string, input: ReversePaymentInput, userId?: string) {
    const payment = await db.clientPayment.findUnique({
      where: { id: paymentId },
      include: { milestone: true, receivable: true, financialAccount: true, quotation: true },
    });
    if (!payment) throw new NotFoundError("Payment record not found");

    if (payment.status === "REVERSED") {
      throw new BusinessRuleError(`Payment ${payment.referenceNo} has already been reversed.`);
    }

    const reversalReason = input.reversalReason || input.reason || "Payment Reversal";
    const reversalDate = new Date();

    // Check period lock
    await PeriodLockService.checkPeriodOpen(reversalDate);

    const ledgerNo = await IdGeneratorService.generate("LED");

    const result = await db.$transaction(async (tx) => {
      // Step A: Mark payment REVERSED
      const reversedPayment = await tx.clientPayment.update({
        where: { id: paymentId },
        data: {
          status: "REVERSED",
          reversedReason: reversalReason,
          notes: payment.notes
            ? `${payment.notes}\n[REVERSED on ${reversalDate.toISOString()}]: ${reversalReason}`
            : `[REVERSED on ${reversalDate.toISOString()}]: ${reversalReason}`,
        },
      });

      // Step B: If linked to quotation, reduce advancePaid
      if (payment.quotationId && payment.quotation) {
        try {
          if (payment.quotation.clientSnapshot) {
            const snapshot = JSON.parse(payment.quotation.clientSnapshot);
            const prevAdvance = Number(snapshot.advancePaid || 0);
            const newAdvance = Math.max(0, FinanceCalculationService.roundMoney(prevAdvance - payment.amount));
            const newBalance = FinanceCalculationService.roundMoney(payment.quotation.totalAmount - newAdvance);
            snapshot.advancePaid = newAdvance;
            snapshot.balanceDue = newBalance;
            await tx.quotation.update({
              where: { id: payment.quotationId },
              data: { clientSnapshot: JSON.stringify(snapshot) },
            });
          }
        } catch {
          // ignore snapshot parse errors
        }
      }

      // Step C: If milestone linked, restore balance
      if (payment.milestoneId && payment.milestone) {
        const newPaid = FinanceCalculationService.roundMoney(
          Math.max(0, payment.milestone.paidAmount - payment.amount)
        );
        const newStatus = newPaid >= payment.milestone.amount ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : "PENDING";
        await tx.paymentMilestone.update({
          where: { id: payment.milestoneId },
          data: {
            paidAmount: newPaid,
            status: newStatus,
          },
        });
      }

      // Step D: If receivable linked, restore outstanding
      if (payment.receivableId && payment.receivable) {
        const newPaid = FinanceCalculationService.roundMoney(
          Math.max(0, payment.receivable.paidAmount - payment.amount)
        );
        const newOutstanding = FinanceCalculationService.roundMoney(
          Math.min(payment.receivable.amount, payment.receivable.amount - newPaid)
        );
        const newStatus = newOutstanding <= 0 ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : "PENDING";
        await tx.clientReceivable.update({
          where: { id: payment.receivableId },
          data: {
            paidAmount: newPaid,
            outstandingAmount: newOutstanding,
            status: newStatus,
          },
        });
      }

      // Step E: Restore FinancialAccount balance (debit outflow) if linked
      if (payment.financialAccount) {
        const newBalance = FinanceCalculationService.roundMoney(
          payment.financialAccount.currentBalance - payment.amount
        );
        await tx.financialAccount.update({
          where: { id: payment.financialAccount.id },
          data: { currentBalance: newBalance },
        });
      }

      // Step F: Create inverse FinancialLedger Entry (OUTFLOW correction) if project exists
      if (payment.projectId) {
        await tx.financialLedger.create({
          data: {
            entryNo: ledgerNo,
            transactionDate: reversalDate,
            direction: "OUTFLOW",
            sourceType: "CLIENT_PAYMENT",
            sourceId: payment.id,
            financialAccountId: payment.financialAccountId || undefined,
            clientId: payment.clientId || undefined,
            projectId: payment.projectId,
            categoryKey: "REVENUE",
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            referenceNoExt: payment.referenceNoExt || undefined,
            status: "REVERSED",
            notes: `Reversal of ${payment.referenceNo}: ${reversalReason.trim()}`,
            createdById: userId ?? null,
          },
        });
      }

      return reversedPayment;
    });

    await AuditService.logEvent({
      userId,
      action: "PAYMENT_REVERSED",
      entityType: "ClientPayment",
      entityId: paymentId,
      newValues: { referenceNo: result.referenceNo, reversalReason },
    });

    if (payment.projectId) {
      await ActivityService.record({
        userId,
        entityType: "Project",
        entityId: payment.projectId,
        type: "PAYMENT",
        title: `Payment ${result.referenceNo} Reversed`,
        description: `Reversal reason: ${reversalReason}`,
      });
    }

    serverCache.invalidate("payments:");
    serverCache.invalidate("quotations:");
    serverCache.invalidate("projects:");
    return result;
  }

  /**
   * QUERY CLIENT PAYMENTS WITH DYNAMIC ENTITY ATTRIBUTION
   */
  public static async getPayments(params: PaymentFilterParams) {
    const cacheKey = `payments:list:${JSON.stringify(params)}`;
    const cached = serverCache.get<any>(cacheKey);
    if (cached) return cached;

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.quotationId) where.quotationId = params.quotationId;
    if (params.projectId) where.projectId = params.projectId;
    if (params.leadId) where.leadId = params.leadId;
    if (params.clientId) where.clientId = params.clientId;
    if (params.paymentMethod && params.paymentMethod !== "ALL") {
      where.paymentMethod = { contains: params.paymentMethod, mode: "insensitive" };
    }
    if (params.status && params.status !== "ALL") {
      where.status = { contains: params.status, mode: "insensitive" };
    }
    if (params.financialAccountId) where.financialAccountId = params.financialAccountId;

    if (params.startDate || params.endDate) {
      where.paymentDate = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }

    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim();
      where.OR = [
        { referenceNo: { contains: q, mode: "insensitive" } },
        { referenceNoExt: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { client: { fullName: { contains: q, mode: "insensitive" } } },
        { lead: { clientName: { contains: q, mode: "insensitive" } } },
        { project: { title: { contains: q, mode: "insensitive" } } },
        { project: { referenceNo: { contains: q, mode: "insensitive" } } },
        { quotation: { referenceNo: { contains: q, mode: "insensitive" } } },
        { quotation: { title: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, rawPayments] = await Promise.all([
      db.clientPayment.count({ where }),
      db.clientPayment.findMany({
        where,
        orderBy: { paymentDate: "desc" },
        skip,
        take: limit,
        include: {
          quotation: {
            select: {
              id: true,
              referenceNo: true,
              title: true,
              totalAmount: true,
              status: true,
              revision: true,
              clientSnapshot: true,
            },
          },
          project: {
            select: {
              id: true,
              referenceNo: true,
              title: true,
              stage: true,
              contractValue: true,
              revisedBudget: true,
              client: { select: { fullName: true, phone: true } },
            },
          },
          lead: {
            select: {
              id: true,
              referenceNo: true,
              clientName: true,
              phone: true,
              email: true,
              requirement: true,
              stage: true,
            },
          },
          client: {
            select: {
              id: true,
              referenceNo: true,
              fullName: true,
              phone: true,
              email: true,
            },
          },
          milestone: { select: { id: true, title: true, amount: true, paidAmount: true } },
          financialAccount: { select: { id: true, accountCode: true, name: true, type: true } },
        },
      }),
    ]);

    // Enrich each payment with relatedType and resolved display properties
    const payments = rawPayments.map((p) => {
      let resolvedType: "PROJECT" | "MATERIALS" | "LEAD" = "PROJECT";
      let quoteType: string | undefined = undefined;

      if (p.quotation?.clientSnapshot) {
        try {
          const parsed = JSON.parse(p.quotation.clientSnapshot);
          quoteType = parsed.quotationType;
        } catch {
          // ignore
        }
      }

      if (
        quoteType === "MATERIAL" ||
        p.lead?.requirement?.toUpperCase()?.includes("MATERIAL") ||
        p.quotation?.title?.toUpperCase()?.includes("MATERIAL")
      ) {
        resolvedType = "MATERIALS";
      } else if (p.project) {
        resolvedType = "PROJECT";
      } else if (p.lead) {
        resolvedType = "LEAD";
      } else if (quoteType === "PROJECT") {
        resolvedType = "PROJECT";
      }

      const clientName =
        p.client?.fullName ||
        p.lead?.clientName ||
        p.project?.client?.fullName ||
        "Client Record";

      const clientPhone =
        p.client?.phone ||
        p.lead?.phone ||
        p.project?.client?.phone ||
        "";

      return {
        ...p,
        relatedType: resolvedType,
        clientName,
        clientPhone,
      };
    });

    // If relatedType filter was passed
    const filteredPayments =
      params.relatedType && params.relatedType !== "ALL"
        ? payments.filter((p) => p.relatedType === params.relatedType)
        : payments;

    const result = {
      payments: filteredPayments,
      pagination: {
        page,
        limit,
        total: params.relatedType && params.relatedType !== "ALL" ? filteredPayments.length : total,
        totalPages: Math.ceil(
          (params.relatedType && params.relatedType !== "ALL" ? filteredPayments.length : total) / limit
        ),
      },
    };

    serverCache.set(cacheKey, result, 15);
    return result;
  }

  /**
   * GET SINGLE PAYMENT DETAILS WITH PIPELINE & FINANCIAL CONTEXT
   */
  public static async getPaymentById(id: string) {
    const payment = await db.clientPayment.findUnique({
      where: { id },
      include: {
        quotation: {
          select: {
            id: true,
            referenceNo: true,
            title: true,
            totalAmount: true,
            status: true,
            revision: true,
            clientSnapshot: true,
            validityDate: true,
            subtotal: true,
            discountAmount: true,
            taxAmount: true,
          },
        },
        project: {
          select: {
            id: true,
            referenceNo: true,
            title: true,
            stage: true,
            propertyTypeKey: true,
            siteAddress: true,
            city: true,
            state: true,
            contractValue: true,
            revisedBudget: true,
            client: true,
          },
        },
        lead: {
          select: {
            id: true,
            referenceNo: true,
            clientName: true,
            phone: true,
            email: true,
            requirement: true,
            stage: true,
            propertyTypeKey: true,
            location: true,
          },
        },
        client: true,
        milestone: true,
        financialAccount: true,
      },
    });

    if (!payment) throw new NotFoundError("Payment record not found");

    let financials: any = null;
    if (payment.projectId) {
      financials = await FinancialCalculationService.calculateProjectFinancials(payment.projectId);
    } else if (payment.quotation) {
      let currentAdvance = payment.amount;
      try {
        if (payment.quotation.clientSnapshot) {
          const snap = JSON.parse(payment.quotation.clientSnapshot);
          currentAdvance = Number(snap.advancePaid || payment.amount);
        }
      } catch {
        currentAdvance = payment.amount;
      }
      financials = {
        contractBudget: payment.quotation.totalAmount,
        revisedProjectValue: payment.quotation.totalAmount,
        totalVerifiedPaid: currentAdvance,
        totalPendingRecorded: 0,
        remainingBalance: Math.max(0, payment.quotation.totalAmount - currentAdvance),
      };
    }

    // Determine relatedType
    let resolvedType: "PROJECT" | "MATERIALS" | "LEAD" = "PROJECT";
    if (
      payment.lead?.requirement?.toUpperCase()?.includes("MATERIAL") ||
      payment.quotation?.title?.toUpperCase()?.includes("MATERIAL")
    ) {
      resolvedType = "MATERIALS";
    } else if (payment.project) {
      resolvedType = "PROJECT";
    } else if (payment.lead) {
      resolvedType = "LEAD";
    }

    return {
      payment: {
        ...payment,
        relatedType: resolvedType,
      },
      financials,
    };
  }

  /**
   * DYNAMIC PAYMENT TIMELINE FOR PROJECT
   */
  public static async getPaymentTimeline(projectId: string) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { id: true, fullName: true, referenceNo: true } },
        paymentMilestones: {
          orderBy: { dueDate: "asc" },
        },
        payments: {
          orderBy: { paymentDate: "asc" },
          include: {
            milestone: { select: { id: true, title: true } },
            financialAccount: { select: { id: true, name: true, accountCode: true } },
          },
        },
      },
    });

    if (!project) throw new NotFoundError("Project record not found");

    const events: Array<{
      id: string;
      type: "MILESTONE_SCHEDULED" | "PAYMENT_RECORDED" | "PAYMENT_VERIFIED" | "PAYMENT_REVERSED" | "MILESTONE_SETTLED";
      date: Date;
      title: string;
      description?: string;
      amount?: number;
      status?: string;
      referenceNo?: string;
      externalReference?: string;
      paymentMethod?: string;
    }> = [];

    // Add milestone events
    for (const m of project.paymentMilestones) {
      events.push({
        id: `ms-${m.id}`,
        type: "MILESTONE_SCHEDULED",
        date: m.dueDate || m.createdAt,
        title: `Milestone Scheduled: ${m.title}`,
        description: `${m.milestonePct}% milestone commitment (Due: ${m.dueDate ? new Date(m.dueDate).toLocaleDateString("en-IN") : "TBD"})`,
        amount: m.amount,
        status: m.status,
      });

      if (m.status === "PAID" && m.paidAmount >= m.amount) {
        events.push({
          id: `ms-paid-${m.id}`,
          type: "MILESTONE_SETTLED",
          date: m.updatedAt,
          title: `Milestone 100% Settled: ${m.title}`,
          description: `Total ₹${m.paidAmount.toLocaleString("en-IN")} collected in full for this milestone.`,
          amount: m.paidAmount,
          status: "PAID",
        });
      }
    }

    // Add payment events
    for (const p of project.payments) {
      events.push({
        id: `pay-${p.id}`,
        type: "PAYMENT_RECORDED",
        date: p.paymentDate,
        title: `Payment Receipt: ${p.referenceNo}`,
        description: `Received via ${p.paymentMethod.replace(/_/g, " ")}${p.referenceNoExt ? ` (Ref: ${p.referenceNoExt})` : ""}${p.milestone ? ` for ${p.milestone.title}` : ""}. Status: ${p.status}`,
        amount: p.amount,
        status: p.status,
        referenceNo: p.referenceNo,
        externalReference: p.referenceNoExt || undefined,
        paymentMethod: p.paymentMethod,
      });

      if (p.status === "VERIFIED" && p.verifiedAt) {
        events.push({
          id: `pay-ver-${p.id}`,
          type: "PAYMENT_VERIFIED",
          date: p.verifiedAt,
          title: `Payment Confirmed: ${p.referenceNo}`,
          description: `Admin verified and confirmed receipt of ₹${p.amount.toLocaleString("en-IN")}.`,
          amount: p.amount,
          status: "VERIFIED",
          referenceNo: p.referenceNo,
        });
      }

      if (p.status === "REVERSED") {
        events.push({
          id: `pay-rev-${p.id}`,
          type: "PAYMENT_REVERSED",
          date: p.updatedAt,
          title: `Payment Reversed: ${p.referenceNo}`,
          description: `Reversal Reason: ${p.reversedReason || "Administrative reversal"}. Financial balance restored.`,
          amount: p.amount,
          status: "REVERSED",
          referenceNo: p.referenceNo,
        });
      }
    }

    // Sort chronologically
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const financials = await FinancialCalculationService.calculateProjectFinancials(projectId);

    return {
      project: {
        id: project.id,
        referenceNo: project.referenceNo,
        title: project.title,
        client: project.client,
      },
      financials,
      milestones: project.paymentMilestones,
      events,
    };
  }

  /**
   * GLOBAL FINANCIAL SUMMARY FOR CLIENT PAYMENT MANAGEMENT
   * Card 1: TOTAL FINALIZED AMOUNT
   * Card 2: TOTAL PAID AMOUNT
   * Card 3: TOTAL REMAINING BALANCE
   */
  public static async getPaymentsSummary() {
    const [
      approvedQuotationsAgg,
      activeProjectsAgg,
      totalVerifiedAgg,
      totalRecordedAgg,
      totalAllPaymentsAgg,
      verifiedCount,
      recordedCount,
      reversedCount,
    ] = await Promise.all([
      db.quotation.aggregate({
        _sum: { totalAmount: true },
        where: { status: { notIn: ["REJECTED", "CANCELLED", "SUPERSEDED"] } },
      }),
      db.project.aggregate({
        _sum: { contractValue: true, revisedBudget: true },
        where: { status: { not: "CANCELLED" }, quotations: { none: {} } },
      }),
      db.clientPayment.aggregate({
        _sum: { amount: true },
        where: { status: "VERIFIED" },
      }),
      db.clientPayment.aggregate({
        _sum: { amount: true },
        where: { status: "RECORDED" },
      }),
      db.clientPayment.aggregate({
        _sum: { amount: true },
        where: { status: { not: "REVERSED" } },
      }),
      db.clientPayment.count({ where: { status: "VERIFIED" } }),
      db.clientPayment.count({ where: { status: "RECORDED" } }),
      db.clientPayment.count({ where: { status: "REVERSED" } }),
    ]);

    // Sum finalized quotations + standalone active projects
    const totalQuotationsValue = approvedQuotationsAgg._sum.totalAmount || 0;
    const standaloneProjectsValue =
      (activeProjectsAgg._sum.revisedBudget || activeProjectsAgg._sum.contractValue || 0);

    const totalFinalizedAmount = FinanceCalculationService.roundMoney(
      Math.max(totalQuotationsValue, totalQuotationsValue + standaloneProjectsValue)
    );

    // Sum all non-reversed recorded payments
    const totalPaidAmount = FinanceCalculationService.roundMoney(
      totalAllPaymentsAgg._sum.amount || 0
    );

    const totalVerifiedPaid = FinanceCalculationService.roundMoney(totalVerifiedAgg._sum.amount || 0);
    const totalPendingRecorded = FinanceCalculationService.roundMoney(totalRecordedAgg._sum.amount || 0);

    // Total Remaining Balance = Finalized Amount - Total Paid Amount
    const totalRemainingBalance = FinanceCalculationService.roundMoney(
      Math.max(0, totalFinalizedAmount - totalPaidAmount)
    );

    return {
      // 3 Global KPI Cards:
      totalFinalizedAmount,
      totalPaidAmount,
      totalRemainingBalance,

      // Secondary metrics
      totalProjectValue: totalFinalizedAmount,
      totalVerifiedPaid,
      totalPendingRecorded,
      totalOutstandingReceivables: totalRemainingBalance,

      // Status counts
      verifiedCount,
      recordedCount,
      reversedCount,
      totalPaymentsCount: verifiedCount + recordedCount + reversedCount,
    };
  }
}

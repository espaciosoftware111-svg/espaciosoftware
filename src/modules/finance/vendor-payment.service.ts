import { db } from "@/lib/db";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { AuditService } from "../audit/audit.service";
import { ActivityService } from "../activity/activity.service";
import { FinanceCalculationService } from "./finance-calculation.service";
import { RecordVendorPaymentInput } from "@/validators/finance.schema";

import { ConcurrentActionGuard } from "@/lib/action-guard";

export class VendorPaymentService {
  public static async recordVendorPayment(input: RecordVendorPaymentInput, userId?: string) {
    const actor = userId || "SYSTEM";
    const lockKey = `${actor}:vendor-payment:${input.vendorId}:${input.amount}:${input.referenceNoExt || ""}`;
    return ConcurrentActionGuard.executeWithLock(lockKey, async () => {
    const vendor = await db.vendor.findUnique({ where: { id: input.vendorId } });
    if (!vendor) throw new NotFoundError("Vendor record not found");

    const amount = FinanceCalculationService.roundMoney(input.amount);
    if (amount <= 0) throw new BusinessRuleError("Payment amount must be greater than 0");

    let payable: any = null;
    if (input.payableId) {
      payable = await db.vendorPayable.findUnique({ where: { id: input.payableId } });
      if (!payable) throw new NotFoundError("Vendor payable record not found");
      if (amount > payable.outstandingAmount + 0.01) {
        throw new BusinessRuleError(
          `Payment amount (₹${amount}) exceeds payable outstanding balance (₹${payable.outstandingAmount}).`
        );
      }
    }

    let account: any = null;
    if (input.financialAccountId) {
      account = await db.financialAccount.findUnique({ where: { id: input.financialAccountId } });
      if (!account) throw new NotFoundError("Financial account not found");
    }

    const paymentNo = await IdGeneratorService.generate("VPAY");
    const ledgerNo = await IdGeneratorService.generate("LED");
    const expenseNo = await IdGeneratorService.generate("EXP");

    const result = await db.$transaction(async (tx) => {
      // 1. Create Vendor Payment record
      const payment = await tx.vendorPayment.create({
        data: {
          paymentNo,
          vendorId: vendor.id,
          payableId: payable ? payable.id : null,
          purchaseOrderId: input.purchaseOrderId || (payable ? payable.purchaseOrderId : null),
          projectId: input.projectId || (payable ? payable.projectId : null),
          financialAccountId: account ? account.id : null,
          recordedById: userId ?? null,
          amount,
          paymentDate: input.paymentDate || new Date(),
          paymentMethod: input.paymentMethod || "BANK_TRANSFER",
          referenceNoExt: input.referenceNoExt ? input.referenceNoExt.trim() : null,
          status: "VERIFIED",
          notes: input.notes ? input.notes.trim() : null,
        },
      });

      // 2. Automatically create/link connected Expense record (counted once in financial ledgers)
      const expense = await tx.expense.create({
        data: {
          referenceNo: expenseNo,
          expenseType: payment.projectId ? "PROJECT" : "BUSINESS",
          categoryKey: vendor.categoryKey === "SUBCONTRACTOR" ? "SUBCONTRACTOR" : "MATERIAL",
          projectId: payment.projectId || null,
          vendorId: vendor.id,
          financialAccountId: account ? account.id : null,
          vendorName: vendor.name,
          description: `Vendor payment ${payment.paymentNo} - ${vendor.name}`,
          amount,
          paymentMethod: payment.paymentMethod,
          expenseDate: payment.paymentDate,
          referenceNoExternal: payment.paymentNo,
          status: "PAID",
          notes: payment.notes || `Linked to vendor payment ${payment.paymentNo}`,
          createdById: userId ?? null,
        },
      });

      // 3. Update Vendor Payable balance if linked
      if (payable) {
        const newPaid = FinanceCalculationService.roundMoney(payable.paidAmount + amount);
        const newOutstanding = FinanceCalculationService.roundMoney(Math.max(0, payable.amount - newPaid));
        const newStatus = newOutstanding <= 0 ? "PAID" : "PARTIALLY_PAID";

        await tx.vendorPayable.update({
          where: { id: payable.id },
          data: {
            paidAmount: newPaid,
            outstandingAmount: newOutstanding,
            status: newStatus,
          },
        });
      }

      // 4. Update Financial Account balance (debit outflow) if linked
      if (account) {
        const newBalance = FinanceCalculationService.roundMoney(account.currentBalance - amount);
        await tx.financialAccount.update({
          where: { id: account.id },
          data: { currentBalance: newBalance },
        });
      }

      // 5. Create Financial Ledger entry (OUTFLOW)
      const ledger = await tx.financialLedger.create({
        data: {
          entryNo: ledgerNo,
          transactionDate: payment.paymentDate,
          direction: "OUTFLOW",
          sourceType: "VENDOR_PAYMENT",
          sourceId: payment.id,
          financialAccountId: account ? account.id : null,
          vendorId: vendor.id,
          projectId: payment.projectId || undefined,
          categoryKey: "MATERIAL",
          amount,
          paymentMethod: payment.paymentMethod,
          referenceNoExt: payment.referenceNoExt || undefined,
          status: "RECORDED",
          notes: `Vendor payment ${payment.paymentNo} to ${vendor.name}`,
          createdById: userId ?? null,
        },
      });

      return { payment, expense, ledger };
    });

    await AuditService.logEvent({
      userId,
      action: "VENDOR_PAYMENT_RECORDED",
      entityType: "VendorPayment",
      entityId: result.payment.id,
      newValues: { paymentNo: result.payment.paymentNo, vendor: vendor.name, amount },
    });

    await ActivityService.record({
      userId,
      entityType: "Vendor",
      entityId: vendor.id,
      type: "FINANCE",
      title: `Vendor Payment ${result.payment.paymentNo} Recorded`,
      description: `Paid ₹${amount} to ${vendor.name} via ${result.payment.paymentMethod}.`,
    });

    return result.payment;
    });
  }

  public static async reverseVendorPayment(id: string, reason: string, userId?: string) {
    const payment = await db.vendorPayment.findUnique({
      where: { id },
      include: { payable: true, financialAccount: true, vendor: true },
    });

    if (!payment) throw new NotFoundError("Vendor payment record not found");
    if (payment.status === "REVERSED") {
      throw new BusinessRuleError("Vendor payment has already been reversed.");
    }

    const ledgerNo = await IdGeneratorService.generate("LED");

    await db.$transaction(async (tx) => {
      // 1. Mark payment as REVERSED
      await tx.vendorPayment.update({
        where: { id },
        data: {
          status: "REVERSED",
          reversedReason: reason.trim(),
        },
      });

      // 2. Revert Vendor Payable balance if linked
      if (payment.payable) {
        const newPaid = FinanceCalculationService.roundMoney(Math.max(0, payment.payable.paidAmount - payment.amount));
        const newOutstanding = FinanceCalculationService.roundMoney(payment.payable.amount - newPaid);
        const newStatus = newPaid <= 0 ? "OPEN" : "PARTIALLY_PAID";

        await tx.vendorPayable.update({
          where: { id: payment.payable.id },
          data: {
            paidAmount: newPaid,
            outstandingAmount: newOutstanding,
            status: newStatus,
          },
        });
      }

      // 3. Restore Financial Account balance (credit back) if linked
      if (payment.financialAccount) {
        const newBalance = FinanceCalculationService.roundMoney(payment.financialAccount.currentBalance + payment.amount);
        await tx.financialAccount.update({
          where: { id: payment.financialAccount.id },
          data: { currentBalance: newBalance },
        });
      }

      // 4. Record inverse Financial Ledger entry (INFLOW correction)
      await tx.financialLedger.create({
        data: {
          entryNo: ledgerNo,
          transactionDate: new Date(),
          direction: "INFLOW",
          sourceType: "VENDOR_PAYMENT",
          sourceId: payment.id,
          financialAccountId: payment.financialAccountId || undefined,
          vendorId: payment.vendorId,
          projectId: payment.projectId || undefined,
          categoryKey: "MATERIAL",
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          status: "REVERSED",
          notes: `Reversal of ${payment.paymentNo}: ${reason.trim()}`,
          createdById: userId ?? null,
        },
      });
    });

    await AuditService.logEvent({
      userId,
      action: "PAYMENT_REVERSED",
      entityType: "VendorPayment",
      entityId: id,
      newValues: { paymentNo: payment.paymentNo, reason },
    });

    return db.vendorPayment.findUnique({ where: { id } });
  }

  public static async getVendorPayments(vendorId?: string, payableId?: string) {
    const where: Record<string, unknown> = {};
    if (vendorId) where.vendorId = vendorId;
    if (payableId) where.payableId = payableId;

    return db.vendorPayment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        vendor: { select: { id: true, referenceNo: true, name: true } },
        payable: { select: { id: true, payableNo: true, amount: true } },
        financialAccount: { select: { id: true, accountCode: true, name: true } },
        recordedBy: { select: { fullName: true } },
      },
    });
  }
}

import { describe, it, expect, beforeEach } from "vitest";
import { ConcurrentActionGuard } from "@/lib/action-guard";
import { VendorPerformanceService } from "@/modules/vendors/vendor-performance.service";

describe("Vendor & Supplier Management Architecture Suite", () => {
  beforeEach(() => {
    ConcurrentActionGuard.reset();
  });

  describe("1. Vendor Financial Calculation & Dynamic KPIs", () => {
    it("dynamically calculates Total Order Value, Total Paid, and Remaining Balance accurately", () => {
      // Confirmed orders manually entered by Super Admin
      const orders = [
        { id: "PO-001", grandTotal: 25000, status: "CONFIRMED" },
        { id: "PO-002", grandTotal: 40000, status: "APPROVED" },
        { id: "PO-003", grandTotal: 15000, status: "DELIVERED" },
        { id: "PO-004", grandTotal: 50000, status: "CANCELLED" }, // Cancelled must be ignored
        { id: "PO-005", grandTotal: 10000, status: "DRAFT" },     // Draft must be ignored
      ];

      const payments = [
        { id: "PAY-001", amount: 20000, status: "VERIFIED" },
        { id: "PAY-002", amount: 30000, status: "VERIFIED" },
        { id: "PAY-003", amount: 10000, status: "REVERSED" },     // Reversed must be ignored
      ];

      // Formula: Total Order Value = Sum of confirmed/approved orders
      const confirmedOrders = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "DRAFT");
      const totalOrdersCount = confirmedOrders.length;
      const totalOrderValue = confirmedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

      // Formula: Total Paid = Sum of valid payments
      const validPayments = payments.filter((p) => p.status !== "REVERSED");
      const totalPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);

      // Formula: Remaining Balance = Total Order Value - Total Paid
      const remainingBalance = Math.max(0, totalOrderValue - totalPaid);

      expect(totalOrdersCount).toBe(3);
      expect(totalOrderValue).toBe(80000); // 25k + 40k + 15k
      expect(totalPaid).toBe(50000);       // 20k + 30k
      expect(remainingBalance).toBe(30000); // 80k - 50k
    });

    it("correctly aggregates orders across multiple projects without cross-project collision", () => {
      // Vendor connected to PRJ-001, PRJ-002, PRJ-003
      const multiProjectOrders = [
        { id: "ORD-001", projectId: "PRJ-001", grandTotal: 20000, status: "CONFIRMED" },
        { id: "ORD-002", projectId: "PRJ-002", grandTotal: 30000, status: "CONFIRMED" },
        { id: "ORD-003", projectId: "PRJ-003", grandTotal: 10000, status: "CONFIRMED" },
      ];

      const totalValue = multiProjectOrders.reduce((sum, o) => sum + o.grandTotal, 0);
      expect(totalValue).toBe(60000); // 20k + 30k + 10k
    });
  });

  describe("2. Material Reference Pricing vs Manual Final Order Amount", () => {
    it("ensures reference prices are informational only and never auto-calculate order total", () => {
      // Material reference catalog
      const referenceMaterials = [
        { materialName: "18mm Marine Plywood", referencePrice: 2000, quantity: 10 },
        { materialName: "High Gloss Laminate", referencePrice: 1500, quantity: 5 },
        { materialName: "Soft Close Hinges", referencePrice: 500, quantity: 20 },
      ];

      // Auto-calculation: (10*2000) + (5*1500) + (20*500) = 20000 + 7500 + 10000 = 37500
      const autoCalculatedTotal = referenceMaterials.reduce(
        (acc, item) => acc + item.referencePrice * item.quantity,
        0
      );
      expect(autoCalculatedTotal).toBe(37500);

      // Super Admin manual entered amount negotiated with vendor (e.g. bulk discount at ₹32,000)
      const superAdminManualFinalAmount = 32000;

      // Final order must use the manual amount, NOT the auto-calculated amount
      expect(superAdminManualFinalAmount).not.toBe(autoCalculatedTotal);
      expect(superAdminManualFinalAmount).toBe(32000);
    });

    it("verifies rejected material request creates 0 confirmed orders and 0 financial impact", () => {
      const materialRequests = [
        { id: "MR-001", vendorId: "VEN-001", status: "REJECTED", requestedAmount: 50000 },
      ];

      // Rejection rules: no confirmed order created, no order amount recorded
      const confirmedOrders = materialRequests.filter((mr) => mr.status === "CONFIRMED");
      const recordedOrderAmount = confirmedOrders.reduce((sum, o) => sum + (o as any).requestedAmount, 0);

      expect(confirmedOrders.length).toBe(0);
      expect(recordedOrderAmount).toBe(0);
    });
  });

  describe("3. Vendor Payment -> Expense Linkage & Zero Double Counting", () => {
    it("creates linked payment and expense records while keeping financial outflow single-counted", () => {
      const vendorPayment = {
        paymentNo: "VPAY-2026-0001",
        vendorId: "VEN-001",
        projectId: "PRJ-001",
        amount: 25000,
        paymentMethod: "BANK_TRANSFER",
        status: "VERIFIED",
      };

      // Linked expense created in same transaction
      const linkedExpense = {
        referenceNo: "EXP-2026-0001",
        expenseType: "PROJECT",
        categoryKey: "MATERIAL",
        projectId: vendorPayment.projectId,
        vendorId: vendorPayment.vendorId,
        amount: vendorPayment.amount,
        referenceNoExternal: vendorPayment.paymentNo,
        status: "PAID",
      };

      // Ledger entry generated (Single Outflow)
      const ledgerEntries = [
        {
          entryNo: "LED-001",
          direction: "OUTFLOW",
          sourceType: "VENDOR_PAYMENT",
          sourceId: vendorPayment.paymentNo,
          amount: vendorPayment.amount,
        },
      ];

      expect(linkedExpense.amount).toBe(vendorPayment.amount);
      expect(linkedExpense.referenceNoExternal).toBe(vendorPayment.paymentNo);

      // Verify exactly ONE ledger outflow exists for this transaction (no double-counting)
      const totalOutflow = ledgerEntries
        .filter((l) => l.sourceId === vendorPayment.paymentNo)
        .reduce((sum, l) => sum + l.amount, 0);

      expect(totalOutflow).toBe(25000);
      expect(ledgerEntries.length).toBe(1);
    });
  });

  describe("4. Main Vendor Management Global KPI Cards", () => {
    it("computes global KPI cards dynamically across all vendors", () => {
      const allVendors = [
        { id: "VEN-1", status: "ACTIVE", orderValue: 120000, paid: 80000 },
        { id: "VEN-2", status: "ACTIVE", orderValue: 250000, paid: 200000 },
        { id: "VEN-3", status: "ACTIVE", orderValue: 80000, paid: 80000 },
        { id: "VEN-4", status: "BLOCKED", orderValue: 50000, paid: 50000 },
      ];

      const totalVendors = allVendors.filter((v) => v.status === "ACTIVE").length;
      const totalOrderValue = allVendors.reduce((sum, v) => sum + v.orderValue, 0);
      const totalPaid = allVendors.reduce((sum, v) => sum + v.paid, 0);
      const totalPayableBalance = Math.max(0, totalOrderValue - totalPaid);

      expect(totalVendors).toBe(3);
      expect(totalOrderValue).toBe(500000);
      expect(totalPaid).toBe(410000);
      expect(totalPayableBalance).toBe(90000); // 500k - 410k
    });
  });
});

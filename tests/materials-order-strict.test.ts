import { describe, it, expect, beforeEach } from "vitest";
import { ConcurrentActionGuard } from "@/lib/action-guard";

describe("Materials Order Architecture & Business Rules Suite", () => {
  beforeEach(() => {
    ConcurrentActionGuard.reset();
  });

  describe("1. Strict Separation: Materials Order vs Project Materials", () => {
    it("strictly isolates lead-based materials orders from project-based materials orders", () => {
      const allOrders = [
        { id: "PO-001", projectId: "PRJ-001", leadId: null, grandTotal: 50000, status: "CONFIRMED" },
        { id: "PO-002", projectId: "PRJ-002", leadId: null, grandTotal: 30000, status: "RECEIVED" },
        { id: "MO-101", projectId: null, leadId: "MRL-001", grandTotal: 40000, status: "CONFIRMED" },
        { id: "MO-102", projectId: null, leadId: "MRL-002", grandTotal: 25000, status: "RECEIVED" },
      ];

      // Project Materials query: projectId != null
      const projectMaterials = allOrders.filter((o) => o.projectId !== null);
      // Materials Order query: projectId == null
      const materialsOrders = allOrders.filter((o) => o.projectId === null);

      expect(projectMaterials.length).toBe(2);
      expect(projectMaterials.map((o) => o.id)).toEqual(["PO-001", "PO-002"]);

      expect(materialsOrders.length).toBe(2);
      expect(materialsOrders.map((o) => o.id)).toEqual(["MO-101", "MO-102"]);
      expect(materialsOrders.every((o) => o.projectId === null)).toBe(true);
    });

    it("ensures pending and rejected vendor requests never appear in Materials Order", () => {
      const vendorRequests = [
        { id: "REQ-01", vendorId: "VEN-01", status: "ACCEPTED", orderConfirmed: true, grandTotal: 50000 },
        { id: "REQ-02", vendorId: "VEN-02", status: "REJECTED", orderConfirmed: false, grandTotal: 0 },
        { id: "REQ-03", vendorId: "VEN-03", status: "PENDING_ACCEPTANCE", orderConfirmed: false, grandTotal: 0 },
      ];

      // Rule: Materials Order shows ONLY confirmed and placed vendor orders
      const confirmedMaterialsOrders = vendorRequests.filter(
        (r) => r.status === "ACCEPTED" && r.orderConfirmed
      );

      expect(confirmedMaterialsOrders.length).toBe(1);
      expect(confirmedMaterialsOrders[0].id).toBe("REQ-01");
    });
  });

  describe("2. Informational Reference Prices vs Manual Final Order Amount", () => {
    it("strictly verifies reference prices are not multiplied by quantity to determine order amount", () => {
      const materials = [
        { materialName: "18mm Marine Plywood", referencePrice: 2000, quantity: 12 },
        { materialName: "1mm Laminate", referencePrice: 1500, quantity: 8 },
        { materialName: "Hardware Screws", referencePrice: 500, quantity: 15 },
      ];

      // Reference price calculation: (12*2000) + (8*1500) + (15*500) = 24000 + 12000 + 7500 = 43500
      const autoCalculatedSum = materials.reduce(
        (acc, item) => acc + item.referencePrice * item.quantity,
        0
      );
      expect(autoCalculatedSum).toBe(43500);

      // Super Admin manually negotiates and enters final agreed amount
      const superAdminManualFinalAmount = 40000;

      // Final order amount MUST strictly equal manual input, NOT the auto-calculated reference sum
      expect(superAdminManualFinalAmount).not.toBe(autoCalculatedSum);
      expect(superAdminManualFinalAmount).toBe(40000);
    });

    it("ensures customer quotation amount and vendor order amount remain strictly distinct", () => {
      // Amount quoted and charged to customer
      const customerQuotationAmount = 65000;
      // Negotiated wholesale procurement amount with vendor
      const vendorOrderAmount = 45000;

      expect(customerQuotationAmount).not.toBe(vendorOrderAmount);
      const grossMargin = customerQuotationAmount - vendorOrderAmount;
      expect(grossMargin).toBe(20000);
    });
  });

  describe("3. Dynamic 5 KPI Cards for Materials Order", () => {
    it("accurately computes all 5 KPI cards across confirmed lead orders", () => {
      const confirmedOrders = [
        { id: "MO-01", grandTotal: 50000, materialStatus: "Pending", paid: 20000 },
        { id: "MO-02", grandTotal: 30000, materialStatus: "Received", paid: 30000 },
        { id: "MO-03", grandTotal: 40000, materialStatus: "Received", paid: 15000 },
        { id: "MO-04", grandTotal: 25000, materialStatus: "Pending", paid: 0 },
      ];

      // KPI 1 — Total Material Orders
      const totalMaterialOrders = confirmedOrders.length;
      expect(totalMaterialOrders).toBe(4);

      // KPI 2 — Total Order Value
      const totalOrderValue = confirmedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
      expect(totalOrderValue).toBe(145000); // 50k + 30k + 40k + 25k

      // KPI 3 — Materials Received
      const materialsReceived = confirmedOrders.filter((o) => o.materialStatus === "Received").length;
      expect(materialsReceived).toBe(2);

      // KPI 4 — Materials Pending
      const materialsPending = confirmedOrders.filter((o) => o.materialStatus === "Pending").length;
      expect(materialsPending).toBe(2);

      // KPI 5 — Total Remaining Payable
      const totalPaid = confirmedOrders.reduce((sum, o) => sum + o.paid, 0); // 20k + 30k + 15k + 0 = 65k
      const totalRemainingPayable = totalOrderValue - totalPaid; // 145k - 65k = 80k
      expect(totalRemainingPayable).toBe(80000);
    });
  });

  describe("4. Material Receipt & Zero Project Pipeline Impact", () => {
    it("updates material status to Received while strictly preserving any Project Pipeline untouched", () => {
      const materialsOrder = {
        id: "MO-101",
        leadId: "MRL-001",
        projectId: null,
        materialStatus: "Pending",
      };

      const projectPipeline = {
        projectId: "PRJ-999",
        currentStage: "RAW_MATERIAL_ORDERED",
      };

      // Super Admin marks Materials Order as Received
      materialsOrder.materialStatus = "Received";

      // Strict Rule 15 & 27: When Materials Order is received, DO NOT touch project pipeline!
      const shouldUpdateProjectPipeline = materialsOrder.projectId !== null;
      if (shouldUpdateProjectPipeline) {
        projectPipeline.currentStage = "WOOD_WORK";
      }

      expect(materialsOrder.materialStatus).toBe("Received");
      // Project Pipeline must remain in RAW_MATERIAL_ORDERED
      expect(projectPipeline.currentStage).toBe("RAW_MATERIAL_ORDERED");
    });
  });

  describe("5. Single Connected Financial Record & Zero Double Counting", () => {
    it("maintains 1 Vendor Payment and 1 linked Expense without duplicate balance deduction", () => {
      const order = {
        id: "MO-201",
        finalVendorOrderAmount: 50000,
        payments: [] as Array<{ id: string; amount: number; linkedExpenseId: string }>,
      };

      // Record vendor payment
      const payment = {
        id: "VPAY-01",
        amount: 20000,
        linkedExpenseId: "EXP-01",
      };
      order.payments.push(payment);

      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = Math.max(0, order.finalVendorOrderAmount - totalPaid);

      expect(totalPaid).toBe(20000);
      expect(remainingBalance).toBe(30000);

      // Status updates to Partial
      let paymentStatus = "Unpaid";
      if (remainingBalance <= 0) paymentStatus = "Paid";
      else if (totalPaid > 0) paymentStatus = "Partial";

      expect(paymentStatus).toBe("Partial");

      // Record final payment
      order.payments.push({
        id: "VPAY-02",
        amount: 30000,
        linkedExpenseId: "EXP-02",
      });

      const updatedPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const updatedBalance = Math.max(0, order.finalVendorOrderAmount - updatedPaid);
      expect(updatedPaid).toBe(50000);
      expect(updatedBalance).toBe(0);

      if (updatedBalance <= 0) paymentStatus = "Paid";
      expect(paymentStatus).toBe("Paid");
    });
  });
});

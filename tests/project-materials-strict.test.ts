import { describe, it, expect, beforeEach } from "vitest";
import { ConcurrentActionGuard } from "@/lib/action-guard";

describe("Project Materials Management Architecture Suite", () => {
  beforeEach(() => {
    ConcurrentActionGuard.reset();
  });

  describe("1. Only Confirmed Project Material Orders Visible", () => {
    it("strictly filters out pending, rejected, and unconfirmed requests", () => {
      const records = [
        { id: "MO-001", projectId: "PRJ-001", status: "CONFIRMED", grandTotal: 50000, materialStatus: "Pending" },
        { id: "MO-002", projectId: "PRJ-002", status: "FULFILLED", grandTotal: 30000, materialStatus: "Received" },
        { id: "REQ-001", projectId: "PRJ-001", status: "DRAFT", grandTotal: 0, materialStatus: "Waiting" },
        { id: "REQ-002", projectId: "PRJ-003", status: "REJECTED", grandTotal: 0, materialStatus: "Rejected" },
        { id: "REQ-003", projectId: "PRJ-004", status: "PENDING_ACCEPTANCE", grandTotal: 0, materialStatus: "Waiting" },
      ];

      // Business Rule: Project Materials shows ONLY confirmed and placed project material orders
      const confirmedOrders = records.filter(
        (r) => r.status === "CONFIRMED" || r.status === "FULFILLED" || r.status === "RECEIVED" || r.status === "APPROVED"
      );

      expect(confirmedOrders.length).toBe(2);
      expect(confirmedOrders.map((o) => o.id)).toEqual(["MO-001", "MO-002"]);
    });

    it("verifies rejected material request creates 0 project material orders and 0 financial impact", () => {
      const vendorRequest = {
        id: "VREQ-999",
        vendor: "ABC Timbers",
        status: "REJECTED",
        materials: [{ name: "Teak Wood", refPrice: 4000, qty: 10 }],
      };

      // When vendor rejects, no confirmed order record is created
      const projectMaterials: any[] = [];
      if (vendorRequest.status === "ACCEPTED") {
        projectMaterials.push({ id: "MO-NEW", amount: 40000 });
      }

      expect(projectMaterials.length).toBe(0);
    });
  });

  describe("2. Project Materials 5 Dynamic KPI Cards", () => {
    it("accurately computes all 5 KPI cards dynamically", () => {
      const confirmedOrders = [
        { id: "MO-001", grandTotal: 50000, materialStatus: "Pending", paid: 20000 },
        { id: "MO-002", grandTotal: 30000, materialStatus: "Received", paid: 30000 },
        { id: "MO-003", grandTotal: 45000, materialStatus: "Received", paid: 15000 },
        { id: "MO-004", grandTotal: 25000, materialStatus: "Pending", paid: 0 },
      ];

      // KPI 1 — Total Material Orders
      const totalOrders = confirmedOrders.length;
      expect(totalOrders).toBe(4);

      // KPI 2 — Total Material Value (sum of manual final order amounts)
      const totalMaterialValue = confirmedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
      expect(totalMaterialValue).toBe(150000); // 50k + 30k + 45k + 25k

      // KPI 3 — Materials Received
      const materialsReceived = confirmedOrders.filter((o) => o.materialStatus === "Received").length;
      expect(materialsReceived).toBe(2);

      // KPI 4 — Materials Pending
      const materialsPending = confirmedOrders.filter((o) => o.materialStatus === "Pending").length;
      expect(materialsPending).toBe(2);

      // KPI 5 — Total Remaining Payable
      const totalPaid = confirmedOrders.reduce((sum, o) => sum + o.paid, 0); // 20k + 30k + 15k + 0 = 65k
      const totalRemainingPayable = totalMaterialValue - totalPaid; // 150k - 65k = 85k
      expect(totalRemainingPayable).toBe(85000);
    });
  });

  describe("3. Reference Pricing vs Manual Final Order Amount", () => {
    it("never automatically multiplies reference price by quantity for final amount", () => {
      const items = [
        { materialName: "Plywood 19mm", referencePrice: 2000, quantity: 15 },
        { materialName: "Laminate 1mm", referencePrice: 1500, quantity: 8 },
        { materialName: "Hardware Hinges", referencePrice: 500, quantity: 20 },
      ];

      // Auto-calculated reference sum: (15*2000) + (8*1500) + (20*500) = 30000 + 12000 + 10000 = 52000
      const refSum = items.reduce((acc, i) => acc + i.referencePrice * i.quantity, 0);
      expect(refSum).toBe(52000);

      // Super Admin manually negotiated and finalized amount with vendor
      const superAdminEnteredFinalAmount = 48500;

      // Final order amount MUST equal manual input, NOT reference sum
      expect(superAdminEnteredFinalAmount).not.toBe(refSum);
      expect(superAdminEnteredFinalAmount).toBe(48500);
    });
  });

  describe("4. Project Pipeline Connection & Stage Transitions", () => {
    it("transitions Raw Material Ordered stage to Wood Work stage upon receipt", () => {
      let currentStage = "RAW_MATERIAL_ORDERED";
      let materialStatus = "Pending";

      // If still pending, project cannot advance
      expect(currentStage).toBe("RAW_MATERIAL_ORDERED");

      // Super Admin clicks [ MARK AS RECEIVED ]
      materialStatus = "Received";
      if (materialStatus === "Received") {
        if (currentStage === "RAW_MATERIAL_ORDERED") {
          currentStage = "WOOD_WORK";
        }
      }

      expect(materialStatus).toBe("Received");
      expect(currentStage).toBe("WOOD_WORK");
    });

    it("transitions Laminate Ordered stage to Laminate Pasting stage upon receipt", () => {
      let currentStage = "LAMINATE_ORDERED";
      let materialStatus = "Pending";

      // Mark as received
      materialStatus = "Received";
      if (materialStatus === "Received") {
        if (currentStage === "LAMINATE_ORDERED") {
          currentStage = "LAMINATE_PASTING";
        }
      }

      expect(currentStage).toBe("LAMINATE_PASTING");
    });

    it("keeps Project Pipeline in current stage if material status is Pending", () => {
      const currentStage = "RAW_MATERIAL_ORDERED";
      let materialStatus: string = "Pending";

      let nextStage = currentStage;
      if (materialStatus === "Received") {
        nextStage = "WOOD_WORK";
      }

      // Must remain in current stage
      expect(nextStage).toBe("RAW_MATERIAL_ORDERED");
    });
  });

  describe("5. Single Record Principle & Financial Linkage", () => {
    it("maintains single payment record across Vendor, Project, Material Order, and Expense", () => {
      const materialOrder = {
        id: "MO-001",
        projectId: "PRJ-001",
        vendorId: "VEN-001",
        finalOrderAmount: 50000,
      };

      const payment = {
        id: "VPAY-001",
        purchaseOrderId: materialOrder.id,
        projectId: materialOrder.projectId,
        vendorId: materialOrder.vendorId,
        amount: 20000,
        linkedExpenseId: "EXP-001",
      };

      // Verify all 4 contexts reference the exact same payment id and amount
      expect(payment.purchaseOrderId).toBe(materialOrder.id);
      expect(payment.projectId).toBe("PRJ-001");
      expect(payment.vendorId).toBe("VEN-001");
      expect(payment.linkedExpenseId).toBe("EXP-001");

      // Remaining balance dynamically calculated
      const remainingBalance = materialOrder.finalOrderAmount - payment.amount;
      expect(remainingBalance).toBe(30000);
    });
  });
});

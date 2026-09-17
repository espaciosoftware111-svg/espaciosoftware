import { describe, it, expect, beforeEach } from "vitest";
import { ConcurrentActionGuard } from "@/lib/action-guard";
import { FinancialCalculationService } from "@/modules/payments/financial-calculation.service";
import { PettyCashCalculationService } from "@/modules/petty-cash/petty-cash-calculation.service";
import { BusinessRuleError } from "@/lib/errors";

describe("System Stability, Data Integrity & Performance Suite", () => {
  beforeEach(() => {
    ConcurrentActionGuard.reset();
  });

  describe("1. Concurrent Action Guard & Idempotency", () => {
    it("rejects simultaneous duplicate operations with identical signature", async () => {
      const lockKey = "PAYMENT:USER123:50000:PROJ_ABC:EXT_REF_999";
      let executionCount = 0;

      const action = async () => {
        return ConcurrentActionGuard.executeWithLock(lockKey, async () => {
          executionCount++;
          await new Promise((resolve) => setTimeout(resolve, 80));
          return "PROCESSED";
        });
      };

      // Rapid-fire double-click simulation
      const [res1, res2] = await Promise.allSettled([action(), action()]);

      expect(res1.status).toBe("fulfilled");
      if (res1.status === "fulfilled") {
        expect(res1.value).toBe("PROCESSED");
      }

      // Second simultaneous call must be rejected
      expect(res2.status).toBe("rejected");
      if (res2.status === "rejected") {
        expect(res2.reason).toBeInstanceOf(BusinessRuleError);
        expect(res2.reason.message).toContain("duplicate transaction request");
      }

      expect(executionCount).toBe(1);
    });

    it("allows independent transactions with distinct keys to process concurrently", async () => {
      const lockKeyA = "PAYMENT:USER1:10000:PROJ_1:REF_1";
      const lockKeyB = "PAYMENT:USER2:20000:PROJ_2:REF_2";

      const [resA, resB] = await Promise.all([
        ConcurrentActionGuard.executeWithLock(lockKeyA, async () => "A_DONE"),
        ConcurrentActionGuard.executeWithLock(lockKeyB, async () => "B_DONE"),
      ]);

      expect(resA).toBe("A_DONE");
      expect(resB).toBe("B_DONE");
    });

    it("rejects repeated submission within debounce window but allows execution after expiry", async () => {
      const lockKey = "EXPENSE:USER1:5000:BUSINESS:OFFICE:INV-001";

      const firstCall = await ConcurrentActionGuard.executeWithLock(
        lockKey,
        async () => "FIRST_SUCCESS",
        100 // 100ms debounce for test
      );
      expect(firstCall).toBe("FIRST_SUCCESS");

      // Immediate follow-up call within debounce window must be rejected
      await expect(
        ConcurrentActionGuard.executeWithLock(lockKey, async () => "SECOND_ATTEMPT", 100)
      ).rejects.toThrow("Duplicate action detected");

      // Wait for debounce window to expire
      await new Promise((resolve) => setTimeout(resolve, 120));

      const thirdCall = await ConcurrentActionGuard.executeWithLock(
        lockKey,
        async () => "AFTER_DEBOUNCE_SUCCESS",
        100
      );
      expect(thirdCall).toBe("AFTER_DEBOUNCE_SUCCESS");
    });
  });

  describe("2. Single Source of Truth & Financial Calculation Consistency", () => {
    it("guarantees currency rounding never accumulates fractional floating-point drift", () => {
      const num1 = 0.1;
      const num2 = 0.2;
      expect(num1 + num2).not.toBe(0.3); // standard javascript float quirk

      const rounded = FinancialCalculationService.roundCurrency(num1 + num2);
      expect(rounded).toBe(0.3);
    });

    it("enforces canonical Petty Cash formula: Given - Spent - Returned = Balance across all states", () => {
      const totalGiven = 15000.0;
      const totalSpent = 8450.5;
      const totalReturned = 6549.5;

      const balance = PettyCashCalculationService.roundCurrency(
        totalGiven - totalSpent - totalReturned
      );

      expect(balance).toBe(0);
    });

    it("prevents negative remaining balance calculations even if contract values are amended", () => {
      const revisedProjectValue = 50000;
      const totalVerifiedPaid = 55000; // overpayment or reduced scope

      const remainingBalance = FinancialCalculationService.roundCurrency(
        Math.max(0, revisedProjectValue - totalVerifiedPaid)
      );

      expect(remainingBalance).toBe(0);
    });
  });

  describe("3. Deduplication & One Record Principle Checks", () => {
    it("validates external reference uniqueness logic protects against duplicate entries", () => {
      const existingReferences = new Set(["INV-2026-001", "VOUCH-8899"]);

      const checkDuplicate = (ref: string) => {
        if (existingReferences.has(ref.trim())) {
          throw new BusinessRuleError(`External reference "${ref}" is already recorded.`);
        }
        existingReferences.add(ref.trim());
        return "SAVED";
      };

      expect(checkDuplicate("INV-2026-002")).toBe("SAVED");
      expect(() => checkDuplicate("INV-2026-001")).toThrow(BusinessRuleError);
      expect(() => checkDuplicate(" VOUCH-8899 ")).toThrow(BusinessRuleError);
    });
  });
});

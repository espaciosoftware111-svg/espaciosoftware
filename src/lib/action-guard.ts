import { BusinessRuleError } from "./errors";

/**
 * ConcurrentActionGuard
 * 
 * Provides atomic in-memory idempotency and mutex locking for financial operations.
 * Prevents race conditions, double-clicks, and repeated form submissions across:
 * - Client Payments
 * - Project Expenses
 * - Material Expenses
 * - Business Expenses
 * - Petty Cash Float Allocations
 * - Employee Petty Expenses
 */
class ActionGuard {
  private activeLocks = new Set<string>();
  private recentSignatures = new Map<string, number>();

  /**
   * Run an asynchronous business operation with an exclusive lock.
   * 
   * @param lockKey Unique signature identifying the action (e.g. `PAYMENT:${userId}:${amount}:${projectId}`)
   * @param fn The asynchronous function to execute
   * @param debounceMs Minimum time window in ms before the identical signature can be executed again (default 2500ms)
   */
  public async executeWithLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    debounceMs: number = 2500
  ): Promise<T> {
    const now = Date.now();

    // 1. Check if an identical request is actively in-flight
    if (this.activeLocks.has(lockKey)) {
      throw new BusinessRuleError(
        "A duplicate transaction request is currently processing. Please wait a moment."
      );
    }

    // 2. Check if an identical request completed within the debounce window
    const lastExecutedAt = this.recentSignatures.get(lockKey);
    if (lastExecutedAt && now - lastExecutedAt < debounceMs) {
      throw new BusinessRuleError(
        "Duplicate action detected. An identical transaction was just submitted. Please refresh or verify the ledger."
      );
    }

    // Acquire lock
    this.activeLocks.add(lockKey);
    this.recentSignatures.set(lockKey, now);

    try {
      const result = await fn();
      return result;
    } finally {
      // Release in-flight lock
      this.activeLocks.delete(lockKey);

      // Clean up stale entries after debounce period + 5s
      setTimeout(() => {
        const recorded = this.recentSignatures.get(lockKey);
        if (recorded && Date.now() - recorded >= debounceMs) {
          this.recentSignatures.delete(lockKey);
        }
      }, debounceMs + 5000);
    }
  }

  /**
   * Reset in-memory guard state (useful for automated testing)
   */
  public reset(): void {
    this.activeLocks.clear();
    this.recentSignatures.clear();
  }
}

export const ConcurrentActionGuard = new ActionGuard();

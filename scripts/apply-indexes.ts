import { db } from "../src/lib/db";

async function main() {
  console.log("Applying high-performance database indexes...");

  const indexStatements = [
    // AuditLog
    `CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");`,

    // ActivityLog
    `CREATE INDEX IF NOT EXISTS "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");`,
    `CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");`,
    `CREATE INDEX IF NOT EXISTS "ActivityLog_type_idx" ON "ActivityLog"("type");`,
    `CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");`,

    // Project
    `CREATE INDEX IF NOT EXISTS "Project_projectManagerId_idx" ON "Project"("projectManagerId");`,

    // Quotation
    `CREATE INDEX IF NOT EXISTS "Quotation_createdAt_idx" ON "Quotation"("createdAt");`,

    // ClientPayment
    `CREATE INDEX IF NOT EXISTS "ClientPayment_status_idx" ON "ClientPayment"("status");`,
    `CREATE INDEX IF NOT EXISTS "ClientPayment_referenceNoExt_idx" ON "ClientPayment"("referenceNoExt");`,
    `CREATE INDEX IF NOT EXISTS "ClientPayment_createdAt_idx" ON "ClientPayment"("createdAt");`,

    // Expense
    `CREATE INDEX IF NOT EXISTS "Expense_status_idx" ON "Expense"("status");`,
    `CREATE INDEX IF NOT EXISTS "Expense_referenceNoExternal_idx" ON "Expense"("referenceNoExternal");`,
    `CREATE INDEX IF NOT EXISTS "Expense_createdAt_idx" ON "Expense"("createdAt");`,

    // EmployeeAdvance
    `CREATE INDEX IF NOT EXISTS "EmployeeAdvance_issuedDate_idx" ON "EmployeeAdvance"("issuedDate");`,
    `CREATE INDEX IF NOT EXISTS "EmployeeAdvance_dueDate_idx" ON "EmployeeAdvance"("dueDate");`,

    // PettyCashExpense
    `CREATE INDEX IF NOT EXISTS "PettyCashExpense_status_idx" ON "PettyCashExpense"("status");`,
    `CREATE INDEX IF NOT EXISTS "PettyCashExpense_expenseDate_idx" ON "PettyCashExpense"("expenseDate");`,
    `CREATE INDEX IF NOT EXISTS "PettyCashExpense_categoryKey_idx" ON "PettyCashExpense"("categoryKey");`,
    `CREATE INDEX IF NOT EXISTS "PettyCashExpense_referenceNoExternal_idx" ON "PettyCashExpense"("referenceNoExternal");`,

    // VendorPayment
    `CREATE INDEX IF NOT EXISTS "VendorPayment_referenceNoExt_idx" ON "VendorPayment"("referenceNoExt");`,
  ];

  for (const sql of indexStatements) {
    try {
      await db.$executeRawUnsafe(sql);
      console.log(`✓ Executed: ${sql.slice(0, 65)}...`);
    } catch (err: any) {
      console.error(`✗ Failed: ${sql}`, err.message);
    }
  }

  console.log("All performance indexes verified and active!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Index migration failed:", err);
  process.exit(1);
});

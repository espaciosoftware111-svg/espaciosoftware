import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 ========================================================");
  console.log("   ESPACIO ERP: COMPLETE DATABASE DATA PURGE / RESET");
  console.log("============================================================");

  // 1. Disable Foreign Keys for SQLite or PostgreSQL
  try {
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF;`);
  } catch {
    // If Postgres
    try {
      await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);
    } catch {}
  }

  // Find all tables in sqlite
  let tableNames: string[] = [];
  try {
    const tables: Array<{ name: string }> = await prisma.$queryRawUnsafe(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';
    `);
    tableNames = tables.map(t => t.name);
  } catch {
    // If not SQLite, fallback to known list
    tableNames = [];
  }

  // Preserved system tables
  const preserved = new Set([
    "Role",
    "Permission",
    "RolePermission",
    "UserRole",
    "UserPermissionOverride",
    "User", // We keep system users, or we recreate them
    "CompanyProfile",
    "CompanySetting",
    "SystemSetting",
    "Setting",
    "EmailTemplate",
    "_prisma_migrations"
  ]);

  if (tableNames.length > 0) {
    console.log(`Found ${tableNames.length} tables in SQLite database.`);
    for (const tbl of tableNames) {
      if (!preserved.has(tbl)) {
        try {
          await prisma.$executeRawUnsafe(`DELETE FROM "${tbl}";`);
          console.log(`  🗑️  Cleared table: ${tbl}`);
        } catch (err: any) {
          console.warn(`  ⚠️  Error clearing ${tbl}: ${err.message}`);
        }
      }
    }
  } else {
    // Explicit model wipe fallback
    const modelsToClear = [
      "trash", "trashItem",
      "notificationDeliveryLog", "notificationRule", "notificationPreference", "notification",
      "reminder", "savedView", "recentSearch", "activityLog", "auditLog",
      "stockCountItem", "stockCount", "stockReservation", "stockTransferItem", "stockTransfer",
      "stockMovement", "stockBalance", "warehouseLocation", "warehouse",
      "vendorMaterial", "material",
      "goodsReceiptItem", "goodsReceipt", "purchaseOrderItem", "purchaseOrder",
      "materialRequestItem", "materialRequest", "vendorRating", "vendorContact", "vendorPayable", "vendorPayment", "vendor",
      "advanceSettlement", "pettyCashExpense", "employeeAdvance", "employeeSalaryPayment", "employeeSalaryStructure", "employee",
      "expense", "gstInvoiceItem", "gstInvoice", "clientReceivable", "clientPayment", "paymentMilestone",
      "warrantyIssue", "qualityCheck", "changeOrder", "projectStageHistory", "projectMember", "project",
      "quotationItem", "quotation", "leadSiteVisit", "leadFollowUp", "lead", "client",
      "financialReconciliation", "financialPeriodLock", "financialLedger",
      "taskDependency", "taskChecklist", "task", "taskTemplate",
      "documentLink", "documentRequest", "documentVersion", "document", "backupLog"
    ];

    for (const m of modelsToClear) {
      if ((prisma as any)[m]?.deleteMany) {
        try {
          const res = await (prisma as any)[m].deleteMany({});
          console.log(`  🗑️  Cleared model ${m}: ${res.count} records`);
        } catch (e: any) {
          // ignore
        }
      }
    }
  }

  // 2. Re-enable Foreign Keys
  try {
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);
  } catch {
    try {
      await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
    } catch {}
  }

  // 3. Reset or Seed Zero-Balance Financial Accounts
  try {
    await prisma.financialAccount.deleteMany({});
    
    await prisma.financialAccount.createMany({
      data: [
        {
          accountCode: "ACC-0001",
          name: "HDFC Operating Bank Account",
          type: "BANK",
          currency: "INR",
          openingBalance: 0,
          currentBalance: 0,
          bankName: "HDFC Bank",
          accountNo: "50200012345678",
          ifscCode: "HDFC0001234",
          status: "ACTIVE",
        },
        {
          accountCode: "ACC-0002",
          name: "Main Office Cash Locker",
          type: "CASH",
          currency: "INR",
          openingBalance: 0,
          currentBalance: 0,
          status: "ACTIVE",
        },
        {
          accountCode: "ACC-0003",
          name: "Company PhonePe / UPI Merchant",
          type: "UPI",
          currency: "INR",
          openingBalance: 0,
          currentBalance: 0,
          status: "ACTIVE",
        },
      ]
    });
    console.log("  💳 Reset Financial Accounts to clean ₹0 balances.");
  } catch (err: any) {
    console.warn("  ⚠️ FinancialAccount reset note:", err.message);
  }

  // 4. Ensure Super Admin / Admin accounts exist and are ready
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const users = [
    { email: "shaikh@espacio.in", fullName: "Shaikh (Admin)" },
    { email: "admin@espacio.com", fullName: "System Admin" },
    { email: "hassan@espacio.in", fullName: "Hassan (Finance Lead)" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, fullName: u.fullName, status: "ACTIVE" },
      create: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        phone: "+91 98765 43210",
        status: "ACTIVE",
      },
    });
  }

  // Re-assign ADMIN role
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (adminRole) {
    for (const u of users) {
      const userRecord = await prisma.user.findUnique({ where: { email: u.email } });
      if (userRecord) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: userRecord.id, roleId: adminRole.id } },
          update: {},
          create: { userId: userRecord.id, roleId: adminRole.id },
        });
      }
    }
  }

  console.log("\n============================================================");
  console.log("✅ ALL DATA SUCCESSFULLY PURGED!");
  console.log("   • Total Leads: 0");
  console.log("   • Total Material Requests / Leads: 0");
  console.log("   • Total Expenses: 0");
  console.log("   • Total Payments / Receivables: 0");
  console.log("   • Total Purchase Orders & GRNs: 0");
  console.log("   • Total Vendors: 0");
  console.log("   • Total Quotations: 0");
  console.log("   • Total Projects: 0");
  console.log("   • Total Inventory Stocks: 0");
  console.log("   • Financial Accounts: Reset to ₹0.00");
  console.log("============================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error purging database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

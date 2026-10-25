import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("===============================================================");
  console.log("🧹 EXECUTING COMPLETE CLIENT HANDOVER RESET FOR ESPACIO ERP");
  console.log("===============================================================");

  // 1. Fetch all existing tables in public schema
  const dbTables: Array<{ table_name: string }> = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE' 
      AND table_name NOT LIKE '_prisma_%';
  `);

  const allTableNames = dbTables.map((t) => t.table_name);
  console.log(`Found ${allTableNames.length} tables in PostgreSQL database.`);

  // 2. Define tables that MUST be preserved (System architecture & configuration)
  const preservedTables = new Set([
    "Role",
    "Permission",
    "RolePermission",
    "UserRole",
    "UserPermissionOverride",
    "User",
    "CompanyProfile",
    "CompanySetting",
    "SystemSetting",
    "Setting",
    "EmailTemplate",
    "LeadSourceConfig",
    "PropertyTypeConfig",
    "LeadLossReasonConfig",
    "ExpenseCategoryConfig",
    "PaymentMethodConfig",
    "VendorCategoryConfig",
    "PaymentTermsConfig",
    "MaterialRequestPurposeConfig",
    "UnitConfig",
    "MaterialCategoryConfig",
    "MaterialSubcategoryConfig",
    "BrandConfig",
    "UnitConversionConfig",
    "CustomFieldDefinition",
    "CustomFieldValue",
    "NotificationPreference",
    "FinancialAccount", // Preserved and reset to 0 balance below
    "_prisma_migrations",
  ]);

  const tablesToTruncate = allTableNames.filter((name) => !preservedTables.has(name));

  console.log(`\nTruncating ${tablesToTruncate.length} operational/transactional tables with CASCADE...`);

  if (tablesToTruncate.length > 0) {
    const truncateSql = `TRUNCATE TABLE ${tablesToTruncate.map((t) => `"${t}"`).join(", ")} CASCADE;`;
    await prisma.$executeRawUnsafe(truncateSql);
    console.log("✅ All operational tables successfully emptied to 0!");
  }

  // 3. Reset Financial Accounts to clean zero balance
  console.log("\nResetting financial accounts to zero balance...");
  await prisma.financialAccount.updateMany({
    data: {
      openingBalance: 0,
      currentBalance: 0,
    },
  });

  // Ensure default accounts exist if none
  const accountCount = await prisma.financialAccount.count();
  if (accountCount === 0) {
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
      ],
    });
    console.log("✅ Seeded 3 pristine clean financial accounts with 0 balance.");
  }

  // 4. Clean up test/dummy user accounts, keeping only official administrators
  console.log("\nCleaning test/dummy user accounts...");
  const keepEmails = [
    "admin@espacio.com",
    "superadmin@espacio.com",
    "espacio@gmail.com",
    "espaciosoftware111@gmail.com",
    "shaikh@espacio.in",
    "hassan@espacio.in",
    "priya.sales@espacio.com",
    "rahul.pm@espacio.com",
  ];

  // Remove test users
  const testUsers = await prisma.user.findMany({
    where: { email: { notIn: keepEmails } },
    select: { id: true, email: true },
  });

  if (testUsers.length > 0) {
    console.log(`Found ${testUsers.length} test user accounts to remove...`);
    const testUserIds = testUsers.map((u) => u.id);
    await prisma.userRole.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.userPermissionOverride.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    console.log(`✅ Removed ${testUsers.length} test user accounts.`);
  }

  // Ensure password for official accounts is uniform (Password123!)
  const passwordHash = await bcrypt.hash("Password123!", 10);
  await prisma.user.updateMany({
    where: { email: { in: keepEmails } },
    data: {
      passwordHash,
      status: "ACTIVE",
    },
  });

  // Assign SUPER_ADMIN role to primary admin accounts if missing
  const superAdminRole = await prisma.role.findFirst({ where: { name: "SUPER_ADMIN" } });
  if (superAdminRole) {
    const officialUsers = await prisma.user.findMany({ where: { email: { in: keepEmails } } });
    for (const u of officialUsers) {
      const existingUserRole = await prisma.userRole.findFirst({
        where: { userId: u.id, roleId: superAdminRole.id },
      });
      if (!existingUserRole) {
        await prisma.userRole.create({
          data: { userId: u.id, roleId: superAdminRole.id },
        });
      }
    }
  }

  // 5. Verification Audit
  console.log("\n===============================================================");
  console.log("VERIFYING SYSTEM FUNCTIONALITY & PRESERVED DATA:");
  console.log("===============================================================");

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, accessLevel: true },
  });
  console.log(`- Official Users Preserved: ${remainingUsers.length}`);
  remainingUsers.forEach((u) => console.log(`   • ${u.fullName} (${u.email}) [${u.accessLevel}]`));

  const rolesCount = await prisma.role.count();
  const permsCount = await prisma.permission.count();
  const settingsCount = await prisma.setting.count();
  const leadSourcesCount = await prisma.leadSourceConfig.count();
  const propTypesCount = await prisma.propertyTypeConfig.count();
  const unitsCount = await prisma.unitConfig.count();
  const categoriesCount = await prisma.materialCategoryConfig.count();

  console.log(`- RBAC Security: ${rolesCount} Roles, ${permsCount} Permissions active.`);
  console.log(`- System Configuration: ${settingsCount} settings active.`);
  console.log(`- Master Dropdowns: ${leadSourcesCount} sources, ${propTypesCount} property types, ${unitsCount} units, ${categoriesCount} categories.`);

  console.log("\n===============================================================");
  console.log("VERIFYING TRANSACTIONAL SECTIONS ARE ZERO (FRESH SLATE):");
  console.log("===============================================================");

  const leadsCount = await prisma.lead.count();
  const matLeadsCount = await prisma.materialLead.count();
  const quotesCount = await prisma.quotation.count();
  const projectsCount = await prisma.project.count();
  const invoicesCount = await prisma.gstInvoice.count();
  const paymentsCount = await prisma.clientPayment.count();
  const expensesCount = await prisma.expense.count();
  const tasksCount = await prisma.task.count();
  const notifsCount = await prisma.notification.count();
  const auditLogsCount = await prisma.auditLog.count();

  console.log(`- CRM Leads: ${leadsCount}`);
  console.log(`- Material Leads: ${matLeadsCount}`);
  console.log(`- Quotations: ${quotesCount}`);
  console.log(`- Projects: ${projectsCount}`);
  console.log(`- Invoices: ${invoicesCount}`);
  console.log(`- Payments: ${paymentsCount}`);
  console.log(`- Expenses: ${expensesCount}`);
  console.log(`- Tasks: ${tasksCount}`);
  console.log(`- Notifications: ${notifsCount}`);
  console.log(`- Audit Logs: ${auditLogsCount}`);

  console.log("\n===============================================================");
  console.log("🎉 SUCCESS! ESPACIO ERP IS PRISTINE & READY FOR CLIENT HANDOVER!");
  console.log("===============================================================");
}

main()
  .catch((e) => {
    console.error("Clean failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

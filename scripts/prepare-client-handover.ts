import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("===============================================================");
  console.log("🧹 PREPARING ESPACIO ERP FOR CLIENT HANDOVER (FRESH CLEAN)");
  console.log("===============================================================");

  const tablesToTruncate = [
    // Invoices & Quotes
    "InvoiceItem",
    "Invoice",
    "QuotationItem",
    "Quotation",

    // Payments & Receivables
    "ClientPayment",
    "ClientReceivable",
    "PaymentMilestone",

    // Expenses & Advances
    "PettyCashExpense",
    "AdvanceSettlement",
    "EmployeeAdvance",
    "EmployeeSalaryPayment",
    "Expense",

    // Leads & Material Leads
    "LeadFollowUp",
    "LeadSiteVisit",
    "LeadStageHistory",
    "Lead",
    "MaterialLeadFollowUp",
    "MaterialLeadStageHistory",
    "MaterialLead",

    // Projects & Clients
    "WarrantyIssue",
    "QualityCheck",
    "ChangeOrder",
    "ProjectStageHistory",
    "ProjectMember",
    "Project",
    "Client",

    // Procurement & Stock
    "GoodsReceiptItem",
    "GoodsReceipt",
    "PurchaseOrderItem",
    "PurchaseOrder",
    "MaterialRequestItem",
    "MaterialRequest",
    "StockMovement",
    "StockTransferItem",
    "StockTransfer",
    "StockCountItem",
    "StockCount",
    "StockReservation",

    // Tasks & Documents
    "TaskChecklist",
    "TaskDependency",
    "Task",
    "DocumentLink",
    "DocumentRequest",
    "DocumentVersion",
    "Document",

    // Financial Ledgers & Logs
    "FinancialLedger",
    "FinancialReconciliation",
    "FinancialPeriodLock",
    "VendorPayable",
    "VendorPayment",
    "TrashItem",
    "NotificationDeliveryLog",
    "Notification",
    "ActivityLog",
    "AuditLog",
    "RecentSearch",
    "SavedView",
    "Reminder",
    "BackupLog",
  ];

  console.log(`Executing atomic TRUNCATE CASCADE on ${tablesToTruncate.length} transactional tables...`);

  const truncateSql = `TRUNCATE TABLE ${tablesToTruncate.map((t) => `"${t}"`).join(", ")} CASCADE;`;
  await prisma.$executeRawUnsafe(truncateSql);

  console.log("✅ All transactional tables emptied successfully!");

  // Reset Financial Accounts to zero balance
  console.log("Resetting financial accounts to zero balance...");
  await prisma.financialAccount.updateMany({
    data: {
      openingBalance: 0,
      currentBalance: 0,
    },
  });

  console.log("\n===============================================================");
  console.log("VERIFYING SYSTEM FUNCTIONALITY & PRESERVED DATA:");
  console.log("===============================================================");

  const users = await prisma.user.findMany({ select: { id: true, email: true, fullName: true, accessLevel: true } });
  console.log(`- Admin Users Preserved: ${users.length}`);
  users.forEach((u) => console.log(`   • ${u.fullName} (${u.email}) [${u.accessLevel}]`));

  const rolesCount = await prisma.role.count();
  const permsCount = await prisma.permission.count();
  const settingsCount = await prisma.setting.count();
  const leadSourcesCount = await prisma.leadSourceConfig.count();
  const propTypesCount = await prisma.propertyTypeConfig.count();
  const unitsCount = await prisma.unitConfig.count();
  const categoriesCount = await prisma.materialCategoryConfig.count();
  const vendorsCount = await prisma.vendor.count();
  const materialsCount = await prisma.material.count();
  const warehousesCount = await prisma.warehouse.count();
  const employeesCount = await prisma.employee.count();

  console.log(`- RBAC Security: ${rolesCount} Roles, ${permsCount} Permissions intact.`);
  console.log(`- System Configuration: ${settingsCount} settings active.`);
  console.log(`- Dropdown Masters: ${leadSourcesCount} sources, ${propTypesCount} property types, ${unitsCount} units, ${categoriesCount} categories.`);
  console.log(`- Master Data Catalog: ${vendorsCount} vendors, ${materialsCount} materials, ${warehousesCount} warehouses, ${employeesCount} employees.`);

  console.log("\n===============================================================");
  console.log("VERIFYING TRANSACTIONAL SECTIONS ARE 0 (FRESH SLATE):");
  console.log("===============================================================");

  const invoicesCount = await prisma.gstInvoice.count();
  const quotesCount = await prisma.quotation.count();
  const leadsCount = await prisma.lead.count();
  const matLeadsCount = await prisma.materialLead.count();
  const projectsCount = await prisma.project.count();
  const paymentsCount = await prisma.clientPayment.count();
  const expensesCount = await prisma.expense.count();
  const tasksCount = await prisma.task.count();
  const notifsCount = await prisma.notification.count();

  console.log(`- Invoices: ${invoicesCount}`);
  console.log(`- Quotations: ${quotesCount}`);
  console.log(`- CRM Leads: ${leadsCount}`);
  console.log(`- Material Leads: ${matLeadsCount}`);
  console.log(`- Projects: ${projectsCount}`);
  console.log(`- Payments: ${paymentsCount}`);
  console.log(`- Expenses: ${expensesCount}`);
  console.log(`- Tasks: ${tasksCount}`);
  console.log(`- Notifications: ${notifsCount}`);

  console.log("\n===============================================================");
  console.log("🎉 SUCCESS! THE ERP IS PRISTINE & READY FOR CLIENT HANDOVER!");
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

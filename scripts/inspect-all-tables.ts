import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface TableCategory {
  phase: string;
  category: string;
  models: { name: string; key: keyof PrismaClient }[];
}

const MODULE_TABLES: TableCategory[] = [
  {
    phase: "Phase 1",
    category: "Security, RBAC & Core Auditing",
    models: [
      { name: "User", key: "user" as any },
      { name: "Role", key: "role" as any },
      { name: "Permission", key: "permission" as any },
      { name: "UserRole", key: "userRole" as any },
      { name: "RolePermission", key: "rolePermission" as any },
      { name: "UserPermissionOverride", key: "userPermissionOverride" as any },
      { name: "AuditLog", key: "auditLog" as any },
      { name: "ActivityLog", key: "activityLog" as any },
      { name: "Notification", key: "notification" as any },
      { name: "NotificationPreference", key: "notificationPreference" as any },
      { name: "NotificationRule", key: "notificationRule" as any },
      { name: "NotificationDeliveryLog", key: "notificationDeliveryLog" as any },
      { name: "SavedView", key: "savedView" as any },
      { name: "RecentSearch", key: "recentSearch" as any },
      { name: "Reminder", key: "reminder" as any }
    ]
  },
  {
    phase: "Phase 2",
    category: "CRM, Leads & Client 360",
    models: [
      { name: "Lead", key: "lead" as any },
      { name: "LeadFollowUp", key: "leadFollowUp" as any },
      { name: "LeadSiteVisit", key: "leadSiteVisit" as any },
      { name: "Client", key: "client" as any }
    ]
  },
  {
    phase: "Phase 3",
    category: "Quotations, Estimations & BOQ Engine",
    models: [
      { name: "Quotation", key: "quotation" as any },
      { name: "QuotationItem", key: "quotationItem" as any }
    ]
  },
  {
    phase: "Phase 4",
    category: "Project Execution, Stages, Change Orders & Quality",
    models: [
      { name: "Project", key: "project" as any },
      { name: "ProjectMember", key: "projectMember" as any },
      { name: "ProjectStageHistory", key: "projectStageHistory" as any },
      { name: "ChangeOrder", key: "changeOrder" as any },
      { name: "QualityCheck", key: "qualityCheck" as any },
      { name: "WarrantyIssue", key: "warrantyIssue" as any }
    ]
  },
  {
    phase: "Phase 5",
    category: "Client Billing, Milestones, Receivables & Invoicing",
    models: [
      { name: "PaymentMilestone", key: "paymentMilestone" as any },
      { name: "ClientPayment", key: "clientPayment" as any },
      { name: "ClientReceivable", key: "clientReceivable" as any },
      { name: "GstInvoice", key: "gstInvoice" as any },
      { name: "GstInvoiceItem", key: "gstInvoiceItem" as any }
    ]
  },
  {
    phase: "Phase 6",
    category: "Expenses, Salaries, Petty Cash & Advances",
    models: [
      { name: "Expense", key: "expense" as any },
      { name: "Employee", key: "employee" as any },
      { name: "EmployeeSalaryStructure", key: "employeeSalaryStructure" as any },
      { name: "EmployeeSalaryPayment", key: "employeeSalaryPayment" as any },
      { name: "EmployeeAdvance", key: "employeeAdvance" as any },
      { name: "PettyCashExpense", key: "pettyCashExpense" as any },
      { name: "AdvanceSettlement", key: "advanceSettlement" as any }
    ]
  },
  {
    phase: "Phase 7",
    category: "Procurement, Purchase Orders, GRN & Vendor Payables",
    models: [
      { name: "Vendor", key: "vendor" as any },
      { name: "VendorContact", key: "vendorContact" as any },
      { name: "VendorRating", key: "vendorRating" as any },
      { name: "MaterialRequest", key: "materialRequest" as any },
      { name: "MaterialRequestItem", key: "materialRequestItem" as any },
      { name: "PurchaseOrder", key: "purchaseOrder" as any },
      { name: "PurchaseOrderItem", key: "purchaseOrderItem" as any },
      { name: "GoodsReceipt", key: "goodsReceipt" as any },
      { name: "GoodsReceiptItem", key: "goodsReceiptItem" as any },
      { name: "VendorPayable", key: "vendorPayable" as any },
      { name: "VendorPayment", key: "vendorPayment" as any }
    ]
  },
  {
    phase: "Phase 8",
    category: "Inventory, Warehouses, Stock Transfers & Stock Counts",
    models: [
      { name: "Material", key: "material" as any },
      { name: "VendorMaterial", key: "vendorMaterial" as any },
      { name: "Warehouse", key: "warehouse" as any },
      { name: "WarehouseLocation", key: "warehouseLocation" as any },
      { name: "StockBalance", key: "stockBalance" as any },
      { name: "StockMovement", key: "stockMovement" as any },
      { name: "StockTransfer", key: "stockTransfer" as any },
      { name: "StockTransferItem", key: "stockTransferItem" as any },
      { name: "StockReservation", key: "stockReservation" as any },
      { name: "StockCount", key: "stockCount" as any },
      { name: "StockCountItem", key: "stockCountItem" as any }
    ]
  },
  {
    phase: "Phase 9",
    category: "Financial Control, Accounts, Ledger & Period Locks",
    models: [
      { name: "FinancialAccount", key: "financialAccount" as any },
      { name: "FinancialLedger", key: "financialLedger" as any },
      { name: "FinancialPeriodLock", key: "financialPeriodLock" as any },
      { name: "FinancialReconciliation", key: "financialReconciliation" as any }
    ]
  },
  {
    phase: "Phase 10",
    category: "Task Delegation, Documents, Storage & System Settings",
    models: [
      { name: "Task", key: "task" as any },
      { name: "TaskChecklist", key: "taskChecklist" as any },
      { name: "TaskDependency", key: "taskDependency" as any },
      { name: "TaskTemplate", key: "taskTemplate" as any },
      { name: "Document", key: "document" as any },
      { name: "DocumentVersion", key: "documentVersion" as any },
      { name: "DocumentLink", key: "documentLink" as any },
      { name: "DocumentRequest", key: "documentRequest" as any },
      { name: "CompanyProfile", key: "companyProfile" as any },
      { name: "BackupLog", key: "backupLog" as any },
      { name: "EmailTemplate", key: "emailTemplate" as any }
    ]
  }
];

async function checkAllTables() {
  console.log("================================================================================");
  console.log("             ESPACIO ERP — COMPLETE DATABASE TABLES AUDIT ACROSS ALL PHASES      ");
  console.log("================================================================================\n");

  let totalTables = 0;
  let verifiedTables = 0;
  let totalRecordsAcrossDb = 0;

  for (const group of MODULE_TABLES) {
    console.log(`\n🔹 [${group.phase}] ${group.category}`);
    console.log("--------------------------------------------------------------------------------");
    
    for (const model of group.models) {
      totalTables++;
      try {
        const delegate = (db as any)[model.key];
        if (delegate && typeof delegate.count === "function") {
          const count = await delegate.count();
          verifiedTables++;
          totalRecordsAcrossDb += count;
          console.log(`  ✓ Table: [${model.name.padEnd(26)}] | Status: ACTIVE IN DB | Records: ${count}`);
        } else {
          console.log(`  ✗ Table: [${model.name.padEnd(26)}] | Status: NOT FOUND IN CLIENT`);
        }
      } catch (err: any) {
        console.log(`  ⚠️ Table: [${model.name.padEnd(26)}] | Status: ERROR (${err.message})`);
      }
    }
  }

  console.log("\n================================================================================");
  console.log(`AUDIT RESULT: ${verifiedTables} / ${totalTables} Database Tables Active in PostgreSQL.`);
  console.log(`Total Stored Database Records: ${totalRecordsAcrossDb}`);
  console.log("================================================================================");
}

checkAllTables()
  .catch((err) => {
    console.error("Audit error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

// @ts-ignore
import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const sqlite = new DatabaseSync("prisma/starter.db");

function getRows(tableName: string): any[] {
  try {
    return sqlite.prepare(`SELECT * FROM "${tableName}"`).all() as any[];
  } catch (e: any) {
    console.log(`Could not read ${tableName}: ${e.message}`);
    return [];
  }
}

// Convert SQLite types to JS/Prisma types
function sanitizeRow(row: any, fieldMap: Map<string, any>): any {
  const clean: any = {};
  for (const [key, val] of Object.entries(row)) {
    const field = fieldMap.get(key);
    // Ignore columns not in Prisma schema or relation objects
    if (!field || field.kind === "object") continue;

    if (val === null || val === undefined) {
      clean[key] = null;
      continue;
    }

    if (field.type === "DateTime") {
      clean[key] = new Date(typeof val === "number" ? val : isNaN(Number(val)) ? String(val) : Number(val));
    } else if (field.type === "Boolean") {
      clean[key] = val === 1 || val === true || val === "1" || val === "true";
    } else if (field.type === "Int") {
      clean[key] = parseInt(String(val), 10);
    } else if (field.type === "Float") {
      clean[key] = parseFloat(String(val));
    } else if (field.type === "Json") {
      try {
        clean[key] = typeof val === "string" ? JSON.parse(val) : val;
      } catch {
        clean[key] = val;
      }
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

const runtimeModels = (prisma as any)._runtimeDataModel?.models || {};

async function syncTable(modelName: string, tableName: string = modelName) {
  const rows = getRows(tableName);
  if (rows.length === 0) return;

  const modelDef = runtimeModels[modelName];
  if (!modelDef) {
    console.warn(`No runtime model for ${modelName}`);
    return;
  }

  const fieldMap = new Map<string, any>();
  for (const f of modelDef.fields) {
    fieldMap.set(f.name, f);
  }

  const delegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const delegate = (prisma as any)[delegateName];
  if (!delegate) {
    console.warn(`No delegate for model ${modelName}`);
    return;
  }

  const cleanRows = rows.map((r) => sanitizeRow(r, fieldMap));

  let inserted = 0;
  for (let i = 0; i < cleanRows.length; i += 25) {
    const chunk = cleanRows.slice(i, i + 25);
    try {
      const res = await delegate.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      inserted += res.count;
    } catch (err: any) {
      // Fallback: insert one by one with upsert/skip
      for (const single of chunk) {
        try {
          if (single.id) {
            await delegate.upsert({
              where: { id: single.id },
              update: {},
              create: single,
            });
          } else {
            await delegate.create({ data: single });
          }
          inserted++;
        } catch (singleErr: any) {
          // ignore duplicates
        }
      }
    }
  }

  console.log(`✅ ${modelName}: Synced ${inserted}/${rows.length} records`);
}

async function main() {
  console.log("🚀 Starting data sync from starter.db to Supabase PostgreSQL...\n");

  const tablesInOrder = [
    "Role",
    "Permission",
    "RolePermission",
    "User",
    "UserRole",
    "UserPermissionOverride",
    "Setting",
    "CompanyProfile",
    "LeadSourceConfig",
    "PropertyTypeConfig",
    "ExpenseCategoryConfig",
    "CustomFieldDefinition",
    "CustomFieldValue",
    "FinancialAccount",
    "Warehouse",
    "Material",
    "StockBalance",
    "StockCount",
    "StockCountItem",
    "Employee",
    "Vendor",
    "VendorContact",
    "VendorRating",
    "Client",
    "Lead",
    "LeadFollowUp",
    "LeadSiteVisit",
    "LeadStageHistory",
    "Project",
    "ProjectStageHistory",
    "Quotation",
    "QuotationItem",
    "QualityCheck",
    "PurchaseOrder",
    "PurchaseOrderItem",
    "TaskTemplate",
    "Task",
    "TaskChecklist",
    "TaskDependency",
    "Document",
    "DocumentVersion",
    "DocumentLink",
    "DocumentRequest",
    "GstInvoice",
    "GstInvoiceItem",
    "ClientPayment",
    "VendorPayment",
    "Expense",
    "EmployeeSalaryStructure",
    "EmployeeSalaryPayment",
    "AdvanceSettlement",
    "FinancialPeriodLock",
    "SavedView",
    "Reminder",
    "NotificationPreference",
    "EmailTemplate",
    "BackupLog",
    "TrashItem",
  ];

  for (const t of tablesInOrder) {
    await syncTable(t);
  }

  console.log("\n🎉 Full Data Synchronization Complete!");

  const leadCount = await prisma.lead.count();
  const projectCount = await prisma.project.count();
  const userCount = await prisma.user.count();
  const clientCount = await prisma.client.count();
  const qtnCount = await prisma.quotation.count();
  console.log(`\nVerification in Supabase:`);
  console.log(`- Leads in Supabase     : ${leadCount}`);
  console.log(`- Projects in Supabase  : ${projectCount}`);
  console.log(`- Clients in Supabase   : ${clientCount}`);
  console.log(`- Quotations in Supabase: ${qtnCount}`);
  console.log(`- Users in Supabase     : ${userCount}`);
}

main()
  .catch((e) => console.error("Migration error:", e))
  .finally(() => prisma.$disconnect());

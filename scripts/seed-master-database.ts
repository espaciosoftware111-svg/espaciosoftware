import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const ALL_PERMISSIONS = [
  // CRM
  { code: "leads:read", module: "CRM", description: "View leads and pipeline" },
  { code: "leads:write", module: "CRM", description: "Create and edit leads" },
  { code: "leads:assign", module: "CRM", description: "Assign leads to team members" },
  { code: "leads:convert", module: "CRM", description: "Convert Won leads into execution projects" },
  { code: "leads:delete", module: "CRM", description: "Archive or delete lead records" },
  { code: "leads:manage_followups", module: "CRM", description: "Schedule and complete follow-ups" },
  { code: "clients:read", module: "CRM", description: "View client directory and account balances" },
  { code: "clients:write", module: "CRM", description: "Create and update client details" },

  // PROJECTS
  { code: "projects:read", module: "PROJECTS", description: "View project records and workspace" },
  { code: "projects:write", module: "PROJECTS", description: "Create and edit project attributes" },
  { code: "projects:stage_change", module: "PROJECTS", description: "Advance or update project execution stage" },
  { code: "projects:change_order", module: "PROJECTS", description: "Create and submit scope change orders" },
  { code: "projects:quality_check", module: "PROJECTS", description: "Perform quality check inspections" },
  { code: "projects:handover", module: "PROJECTS", description: "Execute project handover and warranty initialization" },
  { code: "projects:warranty", module: "PROJECTS", description: "Log and resolve warranty complaint issues" },
  { code: "tasks:read", module: "PROJECTS", description: "View tasks, checklists, and Kanban board" },
  { code: "tasks:write", module: "PROJECTS", description: "Create, update, and complete tasks" },
  { code: "calendar:read", module: "PROJECTS", description: "View operations and milestone calendar" },
  { code: "calendar:write", module: "PROJECTS", description: "Schedule events and follow-ups on calendar" },

  // SALES
  { code: "quotations:read", module: "SALES", description: "View BOQ quotations and estimates" },
  { code: "quotations:write", module: "SALES", description: "Create and edit draft quotations" },
  { code: "quotations:approve", module: "SALES", description: "Approve quotations and finalize estimates" },

  // FINANCE
  { code: "finance:view", module: "FINANCE", description: "View financial hub and cash flow overview" },
  { code: "finance:receivables", module: "FINANCE", description: "Manage client receivables and due tracking" },
  { code: "finance:payables", module: "FINANCE", description: "Manage vendor payables and outstanding bills" },
  { code: "finance:payments", module: "FINANCE", description: "Record vendor payments and manage bank payouts" },
  { code: "finance:invoices", module: "FINANCE", description: "Generate GST tax invoices and PDF notes" },
  { code: "finance:period_lock", module: "FINANCE", description: "Close and reopen accounting periods" },
  { code: "finance:admin", module: "FINANCE", description: "Full financial administration and account setup" },
  { code: "payments:read", module: "FINANCE", description: "View client payments, receivables, and timelines" },
  { code: "payments:write", module: "FINANCE", description: "Record client payments" },
  { code: "payments:verify", module: "FINANCE", description: "Verify recorded client payments" },
  { code: "payments:reverse", module: "FINANCE", description: "Execute controlled payment reversals" },
  { code: "payments:cancel", module: "FINANCE", description: "Cancel unverified payment records" },
  { code: "expenses:read", module: "FINANCE", description: "View business and project expenses & cost sheets" },
  { code: "expenses:write", module: "FINANCE", description: "Record business and project expenses" },
  { code: "expenses:submit", module: "FINANCE", description: "Submit expenses for approval" },
  { code: "expenses:approve", module: "FINANCE", description: "Approve submitted business/project expenses" },
  { code: "expenses:reject", module: "FINANCE", description: "Reject submitted expense requests" },
  { code: "expenses:cancel", module: "FINANCE", description: "Cancel recorded expenses with audit log" },
  { code: "expenses:reclassify", module: "FINANCE", description: "Reclassify expense categories or type" },
  { code: "petty_cash:read", module: "FINANCE", description: "View employee petty cash advances and ledgers" },
  { code: "petty_cash:write", module: "FINANCE", description: "Issue employee advances and top-ups" },
  { code: "petty_cash:approve", module: "FINANCE", description: "Approve requested employee advances" },
  { code: "petty_cash:record_expense", module: "FINANCE", description: "Record petty expenses against an advance" },
  { code: "petty_cash:settle", module: "FINANCE", description: "Submit advance settlements and cash returns" },
  { code: "petty_cash:approve_settlement", module: "FINANCE", description: "Approve finalized advance settlements" },
  { code: "petty_cash:view_all", module: "FINANCE", description: "View petty cash activity across all employees" },

  // PROCUREMENT
  { code: "vendors:read", module: "PROCUREMENT", description: "View vendor directory, contacts, and performance" },
  { code: "vendors:write", module: "PROCUREMENT", description: "Create and edit vendor master records" },
  { code: "vendors:deactivate", module: "PROCUREMENT", description: "Deactivate or archive supplier profiles" },
  { code: "vendors:block", module: "PROCUREMENT", description: "Block vendors from future procurement" },
  { code: "vendors:rate", module: "PROCUREMENT", description: "Submit quality and delivery ratings for suppliers" },
  { code: "vendors:view_financials", module: "PROCUREMENT", description: "View sensitive vendor bank & payable details" },
  { code: "material_requests:read", module: "PROCUREMENT", description: "View material requests and item requirements" },
  { code: "material_requests:write", module: "PROCUREMENT", description: "Create and edit material requests" },
  { code: "material_requests:approve", module: "PROCUREMENT", description: "Approve submitted material requests" },
  { code: "material_requests:reject", module: "PROCUREMENT", description: "Reject material request items" },
  { code: "purchase_orders:read", module: "PROCUREMENT", description: "View purchase orders and delivery status" },
  { code: "purchase_orders:write", module: "PROCUREMENT", description: "Create and edit draft purchase orders" },
  { code: "purchase_orders:approve", module: "PROCUREMENT", description: "Approve submitted purchase orders" },
  { code: "purchase_orders:send", module: "PROCUREMENT", description: "Issue and send purchase orders to suppliers" },
  { code: "purchase_orders:cancel", module: "PROCUREMENT", description: "Cancel purchase orders with reason log" },
  { code: "goods_receipts:read", module: "PROCUREMENT", description: "View goods receipt notes and inspection logs" },
  { code: "goods_receipts:write", module: "PROCUREMENT", description: "Record goods receipts (GRN) and material inspection" },

  // INVENTORY
  { code: "inventory:read", module: "INVENTORY", description: "View material master, stock balances, and movements" },
  { code: "inventory:write", module: "INVENTORY", description: "Create and edit material master and warehouse profiles" },
  { code: "inventory:transfers", module: "INVENTORY", description: "Initiate, approve, and receive stock transfers" },
  { code: "inventory:adjust", module: "INVENTORY", description: "Perform authorized physical stock adjustments" },
  { code: "inventory:counts", module: "INVENTORY", description: "Create and approve physical stock counts" },
  { code: "inventory:admin", module: "INVENTORY", description: "Manage inventory valuation and unit conversions" },

  // PEOPLE & EMPLOYEES
  { code: "employees:read", module: "PEOPLE", description: "View employee profiles and team directory" },
  { code: "employees:write", module: "PEOPLE", description: "Create and edit employee profiles" },
  { code: "employees:deactivate", module: "PEOPLE", description: "Deactivate employee accounts" },
  { code: "employees:manage_salary", module: "PEOPLE", description: "Manage employee salary structure and payroll credits" },
  { code: "employees:manage_permissions", module: "PEOPLE", description: "Manage custom module and action permissions" },

  // ANALYTICS & REPORTS
  { code: "reports:read", module: "ANALYTICS", description: "View operational reports and business metrics" },
  { code: "reports:financial", module: "ANALYTICS", description: "View detailed financial statements and profit & loss" },
  { code: "reports:export", module: "ANALYTICS", description: "Export reports in PDF and CSV format" },

  // SYSTEM & ADMIN
  { code: "system:admin", module: "SYSTEM", description: "Full system administration" },
  { code: "config:manage", module: "SYSTEM", description: "Manage dynamic ERP configuration & taxonomies" },
  { code: "settings:manage", module: "SYSTEM", description: "Manage company settings and preferences" },
  { code: "audit:read", module: "SYSTEM", description: "View immutable system audit logs" },
  { code: "documents:read", module: "SYSTEM", description: "View digital documents and project archives" },
  { code: "documents:write", module: "SYSTEM", description: "Upload and manage digital document versions" },
  { code: "search:read", module: "SYSTEM", description: "Execute global quick search across all modules" },
];

async function main() {
  console.log("⚡ Starting Full Database Sync & Seeding for ESPACIO ERP...");

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const now = new Date();
  const year = now.getFullYear();

  // 1. Seed Permissions
  console.log("-> Seeding system permissions...");
  const permMap: Record<string, string> = {};
  for (const p of ALL_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { module: p.module, description: p.description },
      create: p,
    });
    permMap[p.code] = perm.id;
  }
  console.log(`✅ ${ALL_PERMISSIONS.length} Permissions synced.`);

  // 2. Seed Roles
  console.log("-> Seeding roles...");
  const allPermIds = Object.values(permMap);
  const roles = [
    { name: "SUPER_ADMIN", description: "Universal Super Administrator with full privileges", isSystem: true, permIds: allPermIds },
    { name: "ADMIN", description: "System Administrator", isSystem: true, permIds: allPermIds },
    { name: "LEADERSHIP", description: "Executive Leadership & Directors", isSystem: true, permIds: allPermIds },
    { name: "SALES", description: "Sales & Client Relationship Managers", isSystem: true, permIds: [
      permMap["leads:read"], permMap["leads:write"], permMap["leads:assign"], permMap["leads:convert"], permMap["leads:manage_followups"],
      permMap["clients:read"], permMap["clients:write"], permMap["quotations:read"], permMap["quotations:write"], permMap["calendar:read"], permMap["tasks:read"]
    ].filter(Boolean) },
    { name: "DESIGN", description: "Designers & 3D Visualizers", isSystem: true, permIds: [
      permMap["projects:read"], permMap["quotations:read"], permMap["documents:read"], permMap["documents:write"], permMap["tasks:read"], permMap["tasks:write"]
    ].filter(Boolean) },
    { name: "PROJECT", description: "Project Managers & Site Engineers", isSystem: true, permIds: [
      permMap["projects:read"], permMap["projects:write"], permMap["projects:stage_change"], permMap["projects:change_order"], permMap["projects:quality_check"],
      permMap["projects:handover"], permMap["projects:warranty"], permMap["tasks:read"], permMap["tasks:write"], permMap["material_requests:read"],
      permMap["material_requests:write"], permMap["goods_receipts:read"], permMap["goods_receipts:write"], permMap["petty_cash:record_expense"], permMap["expenses:submit"]
    ].filter(Boolean) },
    { name: "FINANCE", description: "Finance, Billing & Accounts Officers", isSystem: true, permIds: [
      permMap["finance:view"], permMap["finance:receivables"], permMap["finance:payables"], permMap["finance:payments"], permMap["finance:invoices"],
      permMap["finance:period_lock"], permMap["payments:read"], permMap["payments:write"], permMap["payments:verify"], permMap["payments:reverse"],
      permMap["expenses:read"], permMap["expenses:write"], permMap["expenses:approve"], permMap["petty_cash:read"], permMap["petty_cash:write"],
      permMap["petty_cash:settle"], permMap["vendors:read"], permMap["vendors:view_financials"], permMap["reports:financial"]
    ].filter(Boolean) },
    { name: "USER", description: "Standard Organization User", isSystem: true, permIds: [permMap["leads:read"], permMap["projects:read"], permMap["tasks:read"]].filter(Boolean) },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, isSystem: r.isSystem },
      create: { name: r.name, description: r.description, isSystem: r.isSystem },
    });
    roleMap[r.name] = role.id;

    for (const permId of r.permIds) {
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
          update: {},
          create: { roleId: role.id, permissionId: permId },
        });
      }
    }
  }
  console.log(`✅ ${roles.length} System Roles & Permissions mapped.`);

  // 3. Seed Users
  console.log("-> Seeding team users...");
  const adminCom = await prisma.user.upsert({
    where: { email: "admin@espacio.com" },
    update: { passwordHash, accessLevel: "SUPER_ADMIN", status: "ACTIVE" },
    create: { email: "admin@espacio.com", passwordHash, fullName: "System Super Admin", accessLevel: "SUPER_ADMIN", phone: "+91 98480 11111", status: "ACTIVE" },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminCom.id, roleId: roleMap["SUPER_ADMIN"] } },
    update: {},
    create: { userId: adminCom.id, roleId: roleMap["SUPER_ADMIN"] },
  });

  const shaikhUser = await prisma.user.upsert({
    where: { email: "shaikh@espacio.in" },
    update: { passwordHash, accessLevel: "SUPER_ADMIN", status: "ACTIVE" },
    create: { email: "shaikh@espacio.in", passwordHash, fullName: "Shaikh (Director & Super Admin)", accessLevel: "SUPER_ADMIN", phone: "+91 98480 22222", status: "ACTIVE" },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: shaikhUser.id, roleId: roleMap["SUPER_ADMIN"] } },
    update: {},
    create: { userId: shaikhUser.id, roleId: roleMap["SUPER_ADMIN"] },
  });

  const hassanUser = await prisma.user.upsert({
    where: { email: "hassan@espacio.com" },
    update: { passwordHash, accessLevel: "ADMIN", status: "ACTIVE" },
    create: { email: "hassan@espacio.com", passwordHash, fullName: "Hassan (Finance Lead)", accessLevel: "ADMIN", phone: "+91 98480 33333", status: "ACTIVE" },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: hassanUser.id, roleId: roleMap["FINANCE"] } },
    update: {},
    create: { userId: hassanUser.id, roleId: roleMap["FINANCE"] },
  });

  const priyaUser = await prisma.user.upsert({
    where: { email: "priya.sales@espacio.com" },
    update: { passwordHash, accessLevel: "USER", status: "ACTIVE" },
    create: { email: "priya.sales@espacio.com", passwordHash, fullName: "Priya Sharma (Senior Sales Consultant)", accessLevel: "USER", phone: "+91 98480 44444", status: "ACTIVE" },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: priyaUser.id, roleId: roleMap["SALES"] } },
    update: {},
    create: { userId: priyaUser.id, roleId: roleMap["SALES"] },
  });

  const rahulUser = await prisma.user.upsert({
    where: { email: "rahul.pm@espacio.com" },
    update: { passwordHash, accessLevel: "USER", status: "ACTIVE" },
    create: { email: "rahul.pm@espacio.com", passwordHash, fullName: "Rahul Varma (Project Manager)", accessLevel: "USER", phone: "+91 98480 55555", status: "ACTIVE" },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: rahulUser.id, roleId: roleMap["PROJECT"] } },
    update: {},
    create: { userId: rahulUser.id, roleId: roleMap["PROJECT"] },
  });

  // 4. Seed Dynamic Taxonomy & Master Configuration Tables
  console.log("-> Seeding master taxonomy & config tables...");

  const leadSources = [
    { key: "INSTAGRAM", name: "Instagram / Meta Ads", displayOrder: 1 },
    { key: "REFERRAL", name: "Client Referral", displayOrder: 2 },
    { key: "WEBSITE", name: "Official Website", displayOrder: 3 },
    { key: "ARCHITECT", name: "Architect / Builder Tie-up", displayOrder: 4 },
    { key: "WALK_IN", name: "Experience Center Walk-in", displayOrder: 5 },
    { key: "HOUSING_PORTAL", name: "Housing.com / MagicBricks", displayOrder: 6 },
    { key: "OTHER", name: "Other Channel", displayOrder: 7 },
  ];
  for (const s of leadSources) {
    await prisma.leadSourceConfig.upsert({ where: { key: s.key }, update: { name: s.name, displayOrder: s.displayOrder }, create: s });
  }

  const propTypes = [
    { key: "APARTMENT_INTERIOR", name: "Luxury Apartment (2BHK / 3BHK / 4BHK)", displayOrder: 1 },
    { key: "VILLA_INTERIOR", name: "Independent Villa / Gated Community", displayOrder: 2 },
    { key: "PENTHOUSE", name: "Ultra-Luxury Penthouse / Duplex", displayOrder: 3 },
    { key: "COMMERCIAL_OFFICE", name: "Commercial Office & Corporate Space", displayOrder: 4 },
    { key: "RENOVATION", name: "Residential Renovation & Makeover", displayOrder: 5 },
  ];
  for (const p of propTypes) {
    await prisma.propertyTypeConfig.upsert({ where: { key: p.key }, update: { name: p.name, displayOrder: p.displayOrder }, create: p });
  }

  const lossReasons = [
    { key: "BUDGET_MISMATCH", name: "Client Budget Too Low / Price Constraint", displayOrder: 1 },
    { key: "CHOSE_COMPETITOR", name: "Chose Another Interior Studio", displayOrder: 2 },
    { key: "PROJECT_POSTPONED", name: "Handover Delayed / Project Put on Hold", displayOrder: 3 },
    { key: "TIMELINE_CONSTRAINT", name: "Unachievable Delivery Timeline Requested", displayOrder: 4 },
    { key: "LOCATION_UNSERVICEABLE", name: "Site Location Outside Service Area", displayOrder: 5 },
    { key: "OTHER", name: "Other Reason", displayOrder: 6 },
  ];
  for (const lr of lossReasons) {
    await prisma.leadLossReasonConfig.upsert({ where: { key: lr.key }, update: { name: lr.name, displayOrder: lr.displayOrder }, create: lr });
  }

  const expenseCategories = [
    { key: "MATERIAL_PROCUREMENT", name: "Raw Materials & Panels", type: "PROJECT", displayOrder: 1 },
    { key: "LABOR_CARPENTRY", name: "Carpentry & Fabrication Labor", type: "PROJECT", displayOrder: 2 },
    { key: "HARDWARE_FITTINGS", name: "Architectural Hardware & Hinges", type: "PROJECT", displayOrder: 3 },
    { key: "ELECTRICAL_LIGHTING", name: "Lighting, LED Strips & Automation", type: "PROJECT", displayOrder: 4 },
    { key: "PAINT_POLISH", name: "PU Finish, Melamine & Wall Emulsion", type: "PROJECT", displayOrder: 5 },
    { key: "CIVIL_TILE_WORK", name: "Civil, Countertops & Tile Masonry", type: "PROJECT", displayOrder: 6 },
    { key: "LOGISTICS_TRANSPORT", name: "Site Transport & Vehicle Freight", type: "PROJECT", displayOrder: 7 },
    { key: "OFFICE_RENT", name: "Experience Center & Office Lease", type: "BUSINESS", displayOrder: 8 },
    { key: "SALARIES", name: "Staff Payroll & Retainers", type: "BUSINESS", displayOrder: 9 },
    { key: "MARKETING_ADS", name: "Marketing, Google & Meta Ads", type: "BUSINESS", displayOrder: 10 },
    { key: "OFFICE_UTILITIES", name: "Electricity, Internet & Utilities", type: "BUSINESS", displayOrder: 11 },
  ];
  for (const ec of expenseCategories) {
    await prisma.expenseCategoryConfig.upsert({ where: { key: ec.key }, update: { name: ec.name, type: ec.type, displayOrder: ec.displayOrder }, create: ec });
  }

  const paymentMethods = [
    { key: "BANK_TRANSFER", name: "Bank Transfer (NEFT / RTGS / IMPS)", displayOrder: 1 },
    { key: "UPI", name: "UPI (PhonePe, GPay, Paytm)", displayOrder: 2 },
    { key: "CHEQUE", name: "Account Payee Cheque", displayOrder: 3 },
    { key: "CREDIT_CARD", name: "Corporate / Credit Card", displayOrder: 4 },
    { key: "CASH", name: "Petty Cash Locker", displayOrder: 5 },
  ];
  for (const pm of paymentMethods) {
    await prisma.paymentMethodConfig.upsert({ where: { key: pm.key }, update: { name: pm.name, displayOrder: pm.displayOrder }, create: pm });
  }

  const vendorCategories = [
    { key: "PLYWOOD", name: "Plywood, MDF & HDHMR Panels", displayOrder: 1 },
    { key: "HARDWARE", name: "Architectural & Kitchen Hardware", displayOrder: 2 },
    { key: "LAMINATE", name: "Laminates, Acrylics & Veneers", displayOrder: 3 },
    { key: "PAINT", name: "Paints, Primers & PU Polish", displayOrder: 4 },
    { key: "GLASS", name: "Glass, Mirrors & Fluted Partitions", displayOrder: 5 },
    { key: "ELECTRICAL", name: "Conduits, Switches & Smart Lights", displayOrder: 6 },
    { key: "SANITARY", name: "Sanitaryware, Quartz & Countertops", displayOrder: 7 },
    { key: "FABRIC", name: "Curtains, Upholstery & Soft Furnishings", displayOrder: 8 },
    { key: "OTHER", name: "General Hardware & Consumables", displayOrder: 9 },
  ];
  for (const vc of vendorCategories) {
    await prisma.vendorCategoryConfig.upsert({ where: { key: vc.key }, update: { name: vc.name, displayOrder: vc.displayOrder }, create: vc });
  }

  const paymentTerms = [
    { key: "ADVANCE_100", name: "100% Advance Payment", days: 0, displayOrder: 1 },
    { key: "COD", name: "Cash on Delivery", days: 0, displayOrder: 2 },
    { key: "DAYS_15", name: "Net 15 Days", days: 15, displayOrder: 3 },
    { key: "DAYS_30", name: "Net 30 Days", days: 30, displayOrder: 4 },
    { key: "DAYS_45", name: "Net 45 Days", days: 45, displayOrder: 5 },
    { key: "DAYS_60", name: "Net 60 Days", days: 60, displayOrder: 6 },
  ];
  for (const pt of paymentTerms) {
    await prisma.paymentTermsConfig.upsert({ where: { key: pt.key }, update: { name: pt.name, days: pt.days, displayOrder: pt.displayOrder }, create: pt });
  }

  const units = [
    { key: "SQFT", name: "Square Feet (Sq.Ft)", displayOrder: 1 },
    { key: "RFT", name: "Running Feet (R.Ft)", displayOrder: 2 },
    { key: "NOS", name: "Numbers / Units (Nos)", displayOrder: 3 },
    { key: "SHEET", name: "Full Board / Sheet (8x4)", displayOrder: 4 },
    { key: "BOX", name: "Carton Box", displayOrder: 5 },
    { key: "KG", name: "Kilogram (Kg)", displayOrder: 6 },
    { key: "LTR", name: "Liter (Ltr)", displayOrder: 7 },
    { key: "SET", name: "Complete Assembly Set", displayOrder: 8 },
    { key: "BAG", name: "Bag (50 Kg)", displayOrder: 9 },
  ];
  for (const u of units) {
    await prisma.unitConfig.upsert({ where: { key: u.key }, update: { name: u.name, displayOrder: u.displayOrder }, create: u });
  }

  const brands = [
    { key: "CENTURY_PLY", name: "Century Ply", displayOrder: 1 },
    { key: "GREENPLY", name: "Greenply Industries", displayOrder: 2 },
    { key: "HETTICH", name: "Hettich Germany", displayOrder: 3 },
    { key: "HAFELE", name: "Hafele Germany", displayOrder: 4 },
    { key: "ASIAN_PAINTS", name: "Asian Paints Royale", displayOrder: 5 },
    { key: "MERINO", name: "Merino Laminates", displayOrder: 6 },
    { key: "GODREJ", name: "Godrej Locking Solutions", displayOrder: 7 },
    { key: "PHILIPS", name: "Philips Professional Lighting", displayOrder: 8 },
    { key: "SAINT_GOBAIN", name: "Saint-Gobain Glass", displayOrder: 9 },
  ];
  for (const b of brands) {
    await prisma.brandConfig.upsert({ where: { key: b.key }, update: { name: b.name, displayOrder: b.displayOrder }, create: b });
  }

  const matReqPurposes = [
    { key: "SITE_EXECUTION", name: "Active Site Execution Work", displayOrder: 1 },
    { key: "FACTORY_WOODWORK", name: "Factory Modular Production", displayOrder: 2 },
    { key: "SAMPLE_MOCKUP", name: "Design Sample & Client Mockup", displayOrder: 3 },
    { key: "WARRANTY_REPAIR", name: "Post-Handover Warranty Service", displayOrder: 4 },
  ];
  for (const mrp of matReqPurposes) {
    await prisma.materialRequestPurposeConfig.upsert({ where: { key: mrp.key }, update: { name: mrp.name, displayOrder: mrp.displayOrder }, create: mrp });
  }

  // Material Categories & Subcategories
  const plyCat = await prisma.materialCategoryConfig.upsert({
    where: { key: "PLYWOOD" },
    update: { name: "Plywood & Engineering Panels", displayOrder: 1 },
    create: { key: "PLYWOOD", name: "Plywood & Engineering Panels", displayOrder: 1 },
  });
  await prisma.materialSubcategoryConfig.upsert({
    where: { key: "BWP_710" },
    update: { name: "Marine Grade BWP IS:710", categoryId: plyCat.id },
    create: { key: "BWP_710", name: "Marine Grade BWP IS:710", categoryId: plyCat.id, displayOrder: 1 },
  });
  await prisma.materialSubcategoryConfig.upsert({
    where: { key: "HDHMR_PANEL" },
    update: { name: "High Density Moisture Resistant (HDHMR)", categoryId: plyCat.id },
    create: { key: "HDHMR_PANEL", name: "High Density Moisture Resistant (HDHMR)", categoryId: plyCat.id, displayOrder: 2 },
  });

  const hardCat = await prisma.materialCategoryConfig.upsert({
    where: { key: "HARDWARE" },
    update: { name: "Architectural Hardware & Hinges", displayOrder: 2 },
    create: { key: "HARDWARE", name: "Architectural Hardware & Hinges", displayOrder: 2 },
  });
  await prisma.materialSubcategoryConfig.upsert({
    where: { key: "HINGES_SOFTCLOSE" },
    update: { name: "Soft-Close Hinges & Dampers", categoryId: hardCat.id },
    create: { key: "HINGES_SOFTCLOSE", name: "Soft-Close Hinges & Dampers", categoryId: hardCat.id, displayOrder: 1 },
  });
  await prisma.materialSubcategoryConfig.upsert({
    where: { key: "TELESCOPIC_CHANNELS" },
    update: { name: "Tandem Boxes & Drawer Runners", categoryId: hardCat.id },
    create: { key: "TELESCOPIC_CHANNELS", name: "Tandem Boxes & Drawer Runners", categoryId: hardCat.id, displayOrder: 2 },
  });

  // Company Profile
  await prisma.companyProfile.upsert({
    where: { id: "ESPACIO-MAIN-PROFILE" },
    update: {},
    create: {
      id: "ESPACIO-MAIN-PROFILE",
      companyName: "ESPACIO INTERIOR DESIGNS & ARCHITECTURE",
      legalName: "Espacio Living Spaces Pvt. Ltd.",
      tagline: "Turnkey Luxury Residential & Commercial Interior Architecture",
      phone: "+91 98480 99999",
      whatsApp: "+91 98480 99999",
      email: "contact@espacio.com",
      website: "https://espacio.com",
      addressLine: "Plot 88, Road No 36, Jubilee Hills",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      postalCode: "500033",
      gstin: "36AAACE1234F1Z8",
    },
  });

  // Settings
  const defaultSettings = [
    { key: "COMPANY_CURRENCY", value: "INR", category: "COMPANY", description: "Default accounting currency" },
    { key: "GST_DEFAULT_RATE", value: "18", category: "FINANCE", description: "Default GST percentage on quotations" },
    { key: "DEFAULT_WARRANTY_MONTHS", value: "120", category: "PROJECT", description: "Default warranty duration in months (10 years)" },
    { key: "NOTIFICATION_EMAIL_ALERTS", value: "true", category: "NOTIFICATIONS", description: "Enable email notification dispatches" },
  ];
  for (const s of defaultSettings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value, description: s.description }, create: s });
  }

  // 5. Seed Financial Accounts
  console.log("-> Seeding financial accounts...");
  const hdfc = await prisma.financialAccount.upsert({
    where: { accountCode: "ACC-HDFC-001" },
    update: { currentBalance: 2450000 },
    create: {
      accountCode: "ACC-HDFC-001",
      name: "HDFC Current Account (Operations)",
      type: "BANK",
      bankName: "HDFC Bank Ltd",
      accountNo: "50200088991122",
      ifscCode: "HDFC0001234",
      currency: "INR",
      openingBalance: 1500000,
      currentBalance: 2450000,
      status: "ACTIVE",
    },
  });

  const cashLocker = await prisma.financialAccount.upsert({
    where: { accountCode: "ACC-CASH-001" },
    update: { currentBalance: 180000 },
    create: {
      accountCode: "ACC-CASH-001",
      name: "Main Office Cash Locker",
      type: "CASH",
      currency: "INR",
      openingBalance: 100000,
      currentBalance: 180000,
      status: "ACTIVE",
    },
  });

  const upiAcc = await prisma.financialAccount.upsert({
    where: { accountCode: "ACC-UPI-001" },
    update: { currentBalance: 95000 },
    create: {
      accountCode: "ACC-UPI-001",
      name: "Company PhonePe / UPI Merchant",
      type: "UPI",
      currency: "INR",
      openingBalance: 50000,
      currentBalance: 95000,
      status: "ACTIVE",
    },
  });

  // 6. Seed CRM Leads & Clients
  console.log("-> Seeding CRM leads & clients...");
  const lead1 = await prisma.lead.upsert({
    where: { referenceNo: `LEAD-${year}-0001` },
    update: {},
    create: {
      referenceNo: `LEAD-${year}-0001`,
      clientName: "Vikram Malhotra",
      phone: "+91 98480 11223",
      email: "vikram.malhotra@gmail.com",
      sourceKey: "INSTAGRAM",
      propertyTypeKey: "APARTMENT_INTERIOR",
      location: "Rainbow Vistas, Tower 4, Flat 1201, Kukatpally, Hyderabad",
      estimatedBudget: 3500000,
      requirement: "Complete contemporary Italian veneer finish for 3BHK with false ceiling & smart ambient lighting.",
      priority: "HIGH",
      stage: "WON",
      assignedToId: priyaUser.id,
    },
  });

  const lead2 = await prisma.lead.upsert({
    where: { referenceNo: `LEAD-${year}-0002` },
    update: {},
    create: {
      referenceNo: `LEAD-${year}-0002`,
      clientName: "Dr. Ananya Roy",
      phone: "+91 98110 55443",
      email: "dr.ananya@royhealth.in",
      sourceKey: "WEBSITE",
      propertyTypeKey: "VILLA_INTERIOR",
      location: "Gachibowli Palm Springs Villa 44, Hyderabad",
      estimatedBudget: 6800000,
      requirement: "Classical European luxury interior styling with solid teakwood paneling, walk-in closets & quartz island modular kitchen.",
      priority: "URGENT",
      stage: "QUOTATION_SENT",
      assignedToId: priyaUser.id,
    },
  });

  const lead3 = await prisma.lead.upsert({
    where: { referenceNo: `LEAD-${year}-0003` },
    update: {},
    create: {
      referenceNo: `LEAD-${year}-0003`,
      clientName: "Naveen Chari",
      phone: "+91 97000 66778",
      email: "naveen.chari@techsoft.com",
      sourceKey: "REFERRAL",
      propertyTypeKey: "APARTMENT_INTERIOR",
      location: "My Home Bhooja, Block B, Flat 2204, Hitec City",
      estimatedBudget: 4200000,
      requirement: "Minimalist Scandinavian aesthetic with PU finish shutters, acoustic media room and automated motorized blinds.",
      priority: "MEDIUM",
      stage: "SITE_VISIT_SCHEDULED",
      assignedToId: priyaUser.id,
    },
  });

  const client1 = await prisma.client.upsert({
    where: { referenceNo: `CLI-${year}-0001` },
    update: {},
    create: {
      referenceNo: `CLI-${year}-0001`,
      leadId: lead1.id,
      fullName: "Vikram Malhotra",
      phone: "+91 98480 11223",
      email: "vikram.malhotra@gmail.com",
      address: "Rainbow Vistas, Tower 4, Flat 1201, Kukatpally",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500072",
      gstin: "36ABCDE1234F1Z5",
      clientType: "INDIVIDUAL",
      status: "ACTIVE",
    },
  });

  // 7. Seed Project
  console.log("-> Seeding project and execution tracking...");
  const project1 = await prisma.project.upsert({
    where: { referenceNo: `PROJ-${year}-0001` },
    update: {},
    create: {
      referenceNo: `PROJ-${year}-0001`,
      leadId: lead1.id,
      clientId: client1.id,
      title: "Vikram Malhotra 3BHK Turnkey Interior Execution",
      description: "Complete premium turnkey interior execution including living room veneer paneling, master bedroom acoustic wardrobe, and modular kitchen.",
      propertyTypeKey: "APARTMENT_INTERIOR",
      status: "ACTIVE",
      priority: "HIGH",
      stage: "WOOD_WORK",
      siteAddress: "Rainbow Vistas, Tower 4, Flat 1201, Kukatpally, Hyderabad",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500072",
      contractValue: 3500000,
      revisedBudget: 3500000,
      totalExpenses: 1420000,
      netProfit: 2080000,
      profitMarginPct: 59.4,
      startDate: new Date(Date.now() - 30 * 86400000),
      targetCompletionDate: new Date(Date.now() + 60 * 86400000),
      projectManagerId: rahulUser.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: rahulUser.id } },
    update: {},
    create: { projectId: project1.id, userId: rahulUser.id, role: "PROJECT_MANAGER" },
  });

  const m1 = await prisma.paymentMilestone.upsert({
    where: { id: `MS-${project1.id}-1` },
    update: {},
    create: {
      id: `MS-${project1.id}-1`,
      projectId: project1.id,
      title: "Booking & 3D Design Sign-Off (20%)",
      milestonePct: 20,
      amount: 700000,
      paidAmount: 700000,
      status: "PAID",
      dueDate: new Date(Date.now() - 25 * 86400000),
    },
  });

  const m2 = await prisma.paymentMilestone.upsert({
    where: { id: `MS-${project1.id}-2` },
    update: {},
    create: {
      id: `MS-${project1.id}-2`,
      projectId: project1.id,
      title: "Woodwork & Carcass Delivery (40%)",
      milestonePct: 40,
      amount: 1400000,
      paidAmount: 1400000,
      status: "PAID",
      dueDate: new Date(Date.now() - 10 * 86400000),
    },
  });

  await prisma.clientPayment.upsert({
    where: { referenceNo: `PAY-${year}-0001` },
    update: {},
    create: {
      referenceNo: `PAY-${year}-0001`,
      projectId: project1.id,
      clientId: client1.id,
      milestoneId: m1.id,
      financialAccountId: hdfc.id,
      amount: 700000,
      paymentDate: new Date(Date.now() - 25 * 86400000),
      paymentMethod: "BANK_TRANSFER",
      referenceNoExt: "NEFT-HDFC-99881122",
      status: "VERIFIED",
      notes: "Advance 20% confirmation fee received via NEFT",
    },
  });

  // 8. Seed Quotation
  console.log("-> Seeding quotation...");
  const quote1 = await prisma.quotation.upsert({
    where: { referenceNo: `Q-${year}-0001` },
    update: {},
    create: {
      referenceNo: `Q-${year}-0001`,
      title: "Turnkey Interior BOQ - Vikram Malhotra 3BHK",
      projectId: project1.id,
      leadId: lead1.id,
      clientId: client1.id,
      createdById: priyaUser.id,
      status: "APPROVED",
      revision: 1,
      subtotal: 2966101.69,
      taxRate: 18,
      taxAmount: 533898.31,
      totalAmount: 3500000,
      approvedAt: new Date(Date.now() - 28 * 86400000),
      approvedById: adminCom.id,
      clientApprovedName: "Vikram Malhotra",
      termsAndConditions: "1. 20% Advance on 3D Approval\n2. 40% on Carcass Delivery\n3. 30% on Polish/Laminate Pasting\n4. 10% on Final Handover\n5. 10-Year Warranty on Hardware",
    },
  });

  await prisma.quotationItem.upsert({
    where: { id: `QI-${quote1.id}-1` },
    update: {},
    create: {
      id: `QI-${quote1.id}-1`,
      quotationId: quote1.id,
      room: "Living & Dining Area",
      category: "Wall Paneling & TV Unit",
      itemType: "CUSTOM",
      itemDescription: "Italian Fluted Veneer feature wall with floating matte black console and concealed ambient LED backlighting.",
      quantity: 180,
      unitKey: "SQFT",
      unitRate: 1850,
      totalAmount: 333000,
      sortOrder: 1,
    },
  });

  // 9. Seed Vendors & Purchase Orders
  console.log("-> Seeding vendors & purchase orders...");
  const vendor1 = await prisma.vendor.upsert({
    where: { referenceNo: `VEN-${year}-0001` },
    update: {},
    create: {
      referenceNo: `VEN-${year}-0001`,
      name: "Sri Sai Plywood & Hardware Supplies",
      legalName: "Sri Sai Plywood Enterprises Pvt Ltd",
      contactPerson: "Venkat Rao",
      phone: "+91 98480 12345",
      email: "sai.plywood@gmail.com",
      address: "Plot 14, Timber Depot Road, Goshamahal, Hyderabad",
      city: "Hyderabad",
      state: "Telangana",
      gstin: "36ABCDE1234F1Z5",
      paymentTermsKey: "DAYS_30",
      creditLimit: 500000,
      status: "ACTIVE",
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { referenceNo: `VEN-${year}-0002` },
    update: {},
    create: {
      referenceNo: `VEN-${year}-0002`,
      name: "Hafele & Hettich Hardware Studio",
      legalName: "German Hardware Distributions LLP",
      contactPerson: "Rajesh Jain",
      phone: "+91 98480 67890",
      email: "orders@germanhardware.in",
      address: "MG Road, Secunderabad",
      city: "Hyderabad",
      state: "Telangana",
      gstin: "36AAACH9876K1Z2",
      paymentTermsKey: "DAYS_15",
      creditLimit: 300000,
      status: "ACTIVE",
    },
  });

  await prisma.purchaseOrder.upsert({
    where: { referenceNo: `PO-${year}-0001` },
    update: {},
    create: {
      referenceNo: `PO-${year}-0001`,
      projectId: project1.id,
      vendorId: vendor1.id,
      grandTotal: 385000,
      subtotal: 385000,
      status: "APPROVED",
      notes: "Commercial Marine Grade BWP Plywood 18mm & 12mm for Malhotra Project",
    },
  });

  // 10. Seed Warehouses & Inventory Catalog
  console.log("-> Seeding warehouse & inventory catalog...");
  const wh = await prisma.warehouse.upsert({
    where: { warehouseCode: "WH-0001" },
    update: {},
    create: {
      warehouseCode: "WH-0001",
      name: "Central Factory & Logistics Depot",
      type: "MAIN_GODOWN",
      address: "Industrial Area Phase 2, Jeedimetla, Hyderabad",
      city: "Hyderabad",
      status: "ACTIVE",
    },
  });

  const mat1 = await prisma.material.upsert({
    where: { materialCode: "MAT-2026-0001" },
    update: {},
    create: {
      materialCode: "MAT-2026-0001",
      sku: "SKU-PLY-BWP-18MM",
      name: "Century Ply Club Prime 18mm 710 BWP Marine",
      categoryKey: "PLYWOOD",
      baseUnitKey: "SHEET",
      standardCost: 3850,
      minStock: 50,
      status: "ACTIVE",
    },
  });

  await prisma.stockBalance.upsert({
    where: { materialId_warehouseId: { materialId: mat1.id, warehouseId: wh.id } },
    update: { physicalStock: 120, availableStock: 120 },
    create: { materialId: mat1.id, warehouseId: wh.id, physicalStock: 120, availableStock: 120 },
  });

  // 11. Seed Employees
  console.log("-> Seeding employees...");
  await prisma.employee.upsert({
    where: { email: rahulUser.email },
    update: {},
    create: {
      employeeNo: "EMP-2026-0001",
      userId: rahulUser.id,
      fullName: rahulUser.fullName,
      email: rahulUser.email,
      phone: rahulUser.phone,
      designation: "Senior Project Lead",
      department: "OPERATIONS",
      joiningDate: new Date("2024-01-15"),
      status: "ACTIVE",
    },
  });

  await prisma.employee.upsert({
    where: { email: priyaUser.email },
    update: {},
    create: {
      employeeNo: "EMP-2026-0002",
      userId: priyaUser.id,
      fullName: priyaUser.fullName,
      email: priyaUser.email,
      phone: priyaUser.phone,
      designation: "Lead Interior Consultant",
      department: "SALES",
      joiningDate: new Date("2024-03-01"),
      status: "ACTIVE",
    },
  });

  // 12. Seed Tasks & Expenses
  console.log("-> Seeding operational tasks & cost expenses...");
  await prisma.task.upsert({
    where: { referenceNo: `TSK-${year}-0001` },
    update: {},
    create: {
      referenceNo: `TSK-${year}-0001`,
      title: "Complete Living Room Carcass Inspection & Electrical Conduit Verification",
      description: "Inspect living room plywood frame alignment, electrical wall cutouts for TV unit, and verify switchboard depths before veneer pasting.",
      projectId: project1.id,
      assigneeId: rahulUser.id,
      createdById: adminCom.id,
      priority: "HIGH",
      status: "IN_PROGRESS",
      startDate: new Date(Date.now() - 2 * 86400000),
      dueAt: new Date(Date.now() + 3 * 86400000),
    },
  });

  await prisma.expense.upsert({
    where: { referenceNo: `EXP-${year}-0001` },
    update: {},
    create: {
      referenceNo: `EXP-${year}-0001`,
      projectId: project1.id,
      financialAccountId: hdfc.id,
      categoryKey: "MATERIAL_PROCUREMENT",
      expenseType: "PROJECT",
      description: "Bulk plywood procurement for Malhotra project living & master bedroom framing",
      paymentMethod: "BANK_TRANSFER",
      amount: 385000,
      expenseDate: new Date(Date.now() - 18 * 86400000),
      status: "APPROVED",
      createdById: rahulUser.id,
      approvedById: adminCom.id,
      approvedAt: new Date(Date.now() - 17 * 86400000),
      vendorName: "Sri Sai Plywood & Hardware Supplies",
    },
  });

  console.log("🎉 MASTER DATABASE SEEDING COMPLETED SUCCESSFULLY! All tables live and connected!");
}

main()
  .catch((e) => {
    console.error("❌ Master Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

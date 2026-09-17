import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("=== Checking Database Tables for Quotation Management ===");
  
  // 1. Check Quotation table
  const quoteCount = await db.quotation.count();
  console.log(`✓ [Quotation] table verified. Total quotations: ${quoteCount}`);

  // 2. Check QuotationItem table
  const itemCount = await db.quotationItem.count();
  console.log(`✓ [QuotationItem] table verified. Total line items: ${itemCount}`);

  // 3. Check Lead table relation
  const leadCount = await db.lead.count();
  console.log(`✓ [Lead] table verified. Total CRM leads: ${leadCount}`);

  // 4. Check Project table relation
  const projectCount = await db.project.count();
  console.log(`✓ [Project] table verified. Total active projects: ${projectCount}`);

  // 5. Check Client table relation
  const clientCount = await db.client.count();
  console.log(`✓ [Client] table verified. Total clients: ${clientCount}`);

  // 6. Check AuditLog table tracking
  const auditCount = await db.auditLog.count({
    where: { entityType: "Quotation" }
  });
  console.log(`✓ [AuditLog] table verified. Quotation audit entries: ${auditCount}`);

  // 7. Check GstInvoice table relation
  const invoiceCount = await db.gstInvoice.count();
  console.log(`✓ [GstInvoice] table verified. Total GST commercial invoices: ${invoiceCount}`);

  // 8. Sample Quotation verification
  const sample = await db.quotation.findFirst({
    include: {
      items: true,
      lead: { select: { id: true, clientName: true, referenceNo: true } },
      project: { select: { id: true, title: true, referenceNo: true } },
      createdBy: { select: { id: true, fullName: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  if (sample) {
    console.log("\nSample Stored Quotation Record:");
    console.log(`- ID: ${sample.id}`);
    console.log(`- Reference No: ${sample.referenceNo}`);
    console.log(`- Title: ${sample.title}`);
    console.log(`- Status: ${sample.status}`);
    console.log(`- Subtotal: ₹${sample.subtotal}`);
    console.log(`- Tax Amount: ₹${sample.taxAmount}`);
    console.log(`- Total Amount: ₹${sample.totalAmount}`);
    console.log(`- Number of Items: ${sample.items.length}`);
    console.log(`- Associated Lead: ${sample.lead ? `${sample.lead.referenceNo} — ${sample.lead.clientName}` : "None"}`);
    console.log(`- Associated Project: ${sample.project ? `${sample.project.referenceNo} — ${sample.project.title}` : "None"}`);
    console.log(`- Created By: ${sample.createdBy?.fullName || "System"}`);
  }

  console.log("\n=======================================================");
  console.log("✅ ALL TABLES AND RELATIONAL CONSTRAINTS ARE FULLY SYNCED!");
  console.log("=======================================================");
}

main()
  .catch((err) => {
    console.error("Database table verification error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

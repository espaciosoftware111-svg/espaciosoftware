import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Renaming GstInvoice and GstInvoiceItem tables to Invoice and InvoiceItem...");

  await prisma.$executeRawUnsafe(`CREATE OR REPLACE VIEW "Payment" AS SELECT * FROM "ClientPayment";`);
  console.log("✅ Created 'Payment' view mapping to 'ClientPayment'!");

  // Create Payment view so user can find 'Payment' easily under P
  await prisma.$executeRawUnsafe(`CREATE OR REPLACE VIEW "Payment" AS SELECT * FROM "ClientPayment";`);
  console.log("✅ Created 'Payment' view mapping to 'ClientPayment'!");

  // Verify counts in Invoice table
  const countInvoices: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "Invoice";`);
  console.log(`Total records in 'Invoice' table: ${countInvoices[0]?.count}`);

  const countItems: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "InvoiceItem";`);
  console.log(`Total records in 'InvoiceItem' table: ${countItems[0]?.count}`);
}

main()
  .catch((e) => {
    console.error("Rename failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

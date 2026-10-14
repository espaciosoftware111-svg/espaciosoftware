import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const leads = await prisma.lead.findMany({
    select: { id: true, referenceNo: true, clientName: true },
  });

  const materialLeads = await prisma.materialLead.findMany({
    select: {
      id: true,
      referenceNo: true,
      customerName: true,
      primaryContact: true,
      location: true,
      stage: true,
      status: true,
    },
  });

  const tables: Array<{ table_name: string }> = await prisma.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log("All tables in Supabase public schema:");
  console.log(tables.map((t) => t.table_name).join(", "));

  const quotationCount = await prisma.quotation.count();
  const gstInvoiceCount = await prisma.gstInvoice.count();
  const gstInvoiceItemCount = await prisma.gstInvoiceItem.count();
  console.log(`\nQuotation count: ${quotationCount}`);
  console.log(`GstInvoice count: ${gstInvoiceCount}`);
  console.log(`GstInvoiceItem count: ${gstInvoiceItemCount}`);
}

check()
  .catch((e) => console.error("Error:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });

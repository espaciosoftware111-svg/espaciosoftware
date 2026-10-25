import { db } from "../src/lib/db";

async function main() {
  console.log("Migrating ERP Lead & Material Lead reference numbers to ESP-LEAD-XXXX and ESP-MAT-XXXX...");

  // 1. Leads
  const leads = await db.lead.findMany({
    where: {
      OR: [
        { referenceNo: { startsWith: "ESP-0" } },
        { referenceNo: { startsWith: "ESP-1" } },
      ],
    },
    select: { id: true, referenceNo: true, clientName: true },
  });

  for (const lead of leads) {
    const match = lead.referenceNo.match(/ESP-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const newRef = `ESP-LEAD-${String(num).padStart(4, "0")}`;
      await db.lead.update({
        where: { id: lead.id },
        data: { referenceNo: newRef },
      });
      console.log(`Updated Lead ${lead.clientName}: ${lead.referenceNo} -> ${newRef}`);
    }
  }

  // 2. Material Leads
  const matLeads = await db.materialLead.findMany({
    where: {
      OR: [
        { referenceNo: { startsWith: "MAT-0" } },
        { referenceNo: { startsWith: "MAT-1" } },
      ],
    },
    select: { id: true, referenceNo: true, customerName: true },
  });

  for (const ml of matLeads) {
    const match = ml.referenceNo.match(/MAT-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const newRef = `ESP-MAT-${String(num).padStart(4, "0")}`;
      await db.materialLead.update({
        where: { id: ml.id },
        data: { referenceNo: newRef },
      });
      console.log(`Updated Material Lead ${ml.customerName}: ${ml.referenceNo} -> ${newRef}`);
    }
  }

  console.log("Migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

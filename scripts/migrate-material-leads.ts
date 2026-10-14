import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting migration of Material Leads from Lead table to dedicated MaterialLead table...");

  const leadsToMigrate = await prisma.lead.findMany({
    where: {
      OR: [
        { referenceNo: { startsWith: "MAT-LEAD-" } },
        { propertyTypeKey: "MATERIAL_SUPPLY" },
      ],
    },
    include: {
      followUps: true,
      stageHistory: true,
    },
  });

  console.log(`Found ${leadsToMigrate.length} material lead(s) in Lead table to migrate.`);

  for (const lead of leadsToMigrate) {
    console.log(`Migrating lead ${lead.referenceNo} (${lead.clientName})...`);

    // Parse notes to extract secondaryContact, requirements, etc.
    let secondaryContact: string | null = null;
    let requirements: string | null = null;
    let customSource: string | null = null;
    let websiteData: string | null = null;
    let vendorRequests: string | null = null;
    let linkedOrderId: string | null = null;
    let linkedOrderRef: string | null = null;
    let cleanedNotes = lead.notes || "";

    if (lead.notes && lead.notes.includes("[MATERIAL_LEAD_METADATA]:")) {
      try {
        const parts = lead.notes.split("[MATERIAL_LEAD_METADATA]:");
        cleanedNotes = parts[0].trim();
        const rawJson = parts[1].trim();
        const parsed = JSON.parse(rawJson);
        secondaryContact = parsed.secondaryContact || null;
        requirements = parsed.requirements ? JSON.stringify(parsed.requirements) : null;
        customSource = parsed.customSource || null;
        websiteData = parsed.websiteData ? JSON.stringify(parsed.websiteData) : null;
        vendorRequests = parsed.vendorRequests ? JSON.stringify(parsed.vendorRequests) : null;
        linkedOrderId = parsed.linkedOrderId || null;
        linkedOrderRef = parsed.linkedOrderRef || null;
      } catch (err) {
        console.warn(`Could not parse JSON metadata for lead ${lead.referenceNo}:`, err);
      }
    }

    // Upsert into MaterialLead table
    const createdMaterialLead = await prisma.materialLead.upsert({
      where: { referenceNo: lead.referenceNo },
      update: {
        customerName: lead.clientName,
        primaryContact: lead.phone,
        secondaryContact,
        email: lead.email,
        location: lead.location || "N/A",
        sourceKey: lead.sourceKey,
        customSource,
        requirement: lead.requirement || "Materials Order & Supply",
        propertyTypeKey: "MATERIAL_SUPPLY",
        status: lead.stage,
        stage: lead.stage,
        priority: lead.priority,
        requirements,
        notes: cleanedNotes,
        tags: lead.tags,
        assignedToId: lead.assignedToId,
        vendorRequests,
        linkedOrderId,
        linkedOrderRef,
        websiteData,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
      create: {
        id: lead.id,
        referenceNo: lead.referenceNo,
        customerName: lead.clientName,
        primaryContact: lead.phone,
        secondaryContact,
        email: lead.email,
        location: lead.location || "N/A",
        sourceKey: lead.sourceKey,
        customSource,
        requirement: lead.requirement || "Materials Order & Supply",
        propertyTypeKey: "MATERIAL_SUPPLY",
        status: lead.stage,
        stage: lead.stage,
        priority: lead.priority,
        requirements,
        notes: cleanedNotes,
        tags: lead.tags,
        assignedToId: lead.assignedToId,
        vendorRequests,
        linkedOrderId,
        linkedOrderRef,
        websiteData,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
    });

    console.log(`Created MaterialLead record ID: ${createdMaterialLead.id}`);

    // Migrate follow-ups
    for (const fu of lead.followUps) {
      await prisma.materialLeadFollowUp.create({
        data: {
          id: fu.id,
          materialLeadId: createdMaterialLead.id,
          followUpDate: fu.followUpDate,
          type: fu.type,
          notes: fu.notes,
          outcomeNotes: fu.outcomeNotes,
          status: fu.status,
          completedAt: fu.completedAt,
          assignedToId: fu.assignedToId,
          createdAt: fu.createdAt,
          updatedAt: fu.updatedAt,
        },
      }).catch((e) => console.warn(`FollowUp ${fu.id} already exists or error:`, e.message));
    }

    // Migrate stage history
    for (const sh of lead.stageHistory) {
      await prisma.materialLeadStageHistory.create({
        data: {
          id: sh.id,
          materialLeadId: createdMaterialLead.id,
          fromStage: sh.fromStage,
          toStage: sh.toStage,
          changedById: sh.changedById,
          notes: sh.notes,
          createdAt: sh.createdAt,
        },
      }).catch((e) => console.warn(`StageHistory ${sh.id} already exists or error:`, e.message));
    }

    // Update Quotations, ClientPayments, Expenses to link to materialLeadId
    await prisma.quotation.updateMany({
      where: { leadId: lead.id },
      data: { materialLeadId: createdMaterialLead.id, leadId: null },
    });

    await prisma.clientPayment.updateMany({
      where: { leadId: lead.id },
      data: { materialLeadId: createdMaterialLead.id, leadId: null },
    });

    await prisma.expense.updateMany({
      where: { leadId: lead.id },
      data: { materialLeadId: createdMaterialLead.id, leadId: null },
    });

    // Delete the lead from Lead table
    await prisma.leadFollowUp.deleteMany({ where: { leadId: lead.id } });
    await prisma.leadSiteVisit.deleteMany({ where: { leadId: lead.id } });
    await prisma.leadStageHistory.deleteMany({ where: { leadId: lead.id } });

    await prisma.lead.delete({
      where: { id: lead.id },
    });

    console.log(`Successfully migrated and purged ${lead.referenceNo} from Lead table.`);
  }

  console.log("✅ Material Leads migration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

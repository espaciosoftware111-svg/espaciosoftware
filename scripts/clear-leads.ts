import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all lead records and resetting lead section to 0...");

  // 1. Unlink foreign key relations
  const unlinkedProjects = await prisma.project.updateMany({
    where: { leadId: { not: null } },
    data: { leadId: null },
  });
  console.log(`Unlinked ${unlinkedProjects.count} project(s) from leads.`);

  const unlinkedQuotations = await prisma.quotation.updateMany({
    where: { leadId: { not: null } },
    data: { leadId: null },
  });
  console.log(`Unlinked ${unlinkedQuotations.count} quotation(s) from leads.`);

  const unlinkedExpenses = await prisma.expense.updateMany({
    where: { leadId: { not: null } },
    data: { leadId: null },
  });
  console.log(`Unlinked ${unlinkedExpenses.count} expense(s) from leads.`);

  const unlinkedClients = await prisma.client.updateMany({
    where: { leadId: { not: null } },
    data: { leadId: null },
  });
  console.log(`Unlinked ${unlinkedClients.count} client(s) from leads.`);

  const unlinkedTasks = await prisma.task.updateMany({
    where: { leadId: { not: null } },
    data: { leadId: null },
  });
  console.log(`Unlinked ${unlinkedTasks.count} task(s) from leads.`);

  const unlinkedDocuments = await prisma.document.updateMany({
    where: { leadId: { not: null } },
    data: { leadId: null },
  });
  console.log(`Unlinked ${unlinkedDocuments.count} document(s) from leads.`);

  const unlinkedPayments = await prisma.clientPayment.updateMany({
    where: { leadId: { not: null } },
    data: { leadId: null },
  });
  console.log(`Unlinked ${unlinkedPayments.count} client payment(s) from leads.`);

  // 2. Delete child records of leads
  const deletedFollowUps = await prisma.leadFollowUp.deleteMany({});
  console.log(`Deleted ${deletedFollowUps.count} lead follow-up(s).`);

  const deletedSiteVisits = await prisma.leadSiteVisit.deleteMany({});
  console.log(`Deleted ${deletedSiteVisits.count} lead site visit(s).`);

  const deletedStageHistory = await prisma.leadStageHistory.deleteMany({});
  console.log(`Deleted ${deletedStageHistory.count} lead stage history record(s).`);

  const deletedActivities = await prisma.activityLog.deleteMany({
    where: { entityType: "Lead" },
  });
  console.log(`Deleted ${deletedActivities.count} lead activity log(s).`);

  const deletedTrash = await prisma.trashItem.deleteMany({
    where: { entityType: "Lead" },
  });
  console.log(`Deleted ${deletedTrash.count} lead trash item(s).`);

  const deletedNotifications = await prisma.notification.deleteMany({
    where: { entityType: "Lead" },
  });
  console.log(`Deleted ${deletedNotifications.count} lead notification(s).`);

  // 3. Delete all leads
  const deletedLeads = await prisma.lead.deleteMany({});
  console.log(`✅ Successfully deleted ${deletedLeads.count} lead(s). All leads are now 0!`);

  // Verify
  const remainingCount = await prisma.lead.count();
  console.log(`Verification: Remaining lead count in database is ${remainingCount}.`);
}

main()
  .catch((err) => {
    console.error("❌ Error clearing leads:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

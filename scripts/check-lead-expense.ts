import { db } from '../src/lib/db';

async function main() {
  try {
    const e = await db.expense.findFirst({
      select: {
        id: true,
        referenceNo: true,
        leadId: true,
        lead: {
          select: { id: true, clientName: true, phone: true }
        }
      }
    });
    console.log('Successfully queried Expense with lead relation:', e);
  } catch (err: any) {
    console.error('Error during query:', err.message);
    if (err.message.includes('column "leadId" does not exist') || err.message.includes('leadId')) {
      console.log('Need to run raw alter table...');
      await db.$executeRawUnsafe(`ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "leadId" TEXT;`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Expense_leadId_idx" ON "Expense"("leadId");`);
      await db.$executeRawUnsafe(`DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_leadId_fkey') THEN
          ALTER TABLE "Expense" ADD CONSTRAINT "Expense_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;`);
      console.log('ALTER TABLE executed successfully');
    }
  } finally {
    await db.$disconnect();
  }
}

main();

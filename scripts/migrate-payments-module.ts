import { db } from "../src/lib/db";

async function main() {
  console.log("Migrating ClientPayment schema additions...");

  await db.$executeRawUnsafe(`
    DO $$
    BEGIN
      -- 1. Add quotationId to ClientPayment
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientPayment' AND column_name = 'quotationId'
      ) THEN
        ALTER TABLE "ClientPayment" ADD COLUMN "quotationId" TEXT;
        CREATE INDEX IF NOT EXISTS "ClientPayment_quotationId_idx" ON "ClientPayment"("quotationId");
      END IF;

      -- 2. Add leadId to ClientPayment
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientPayment' AND column_name = 'leadId'
      ) THEN
        ALTER TABLE "ClientPayment" ADD COLUMN "leadId" TEXT;
        CREATE INDEX IF NOT EXISTS "ClientPayment_leadId_idx" ON "ClientPayment"("leadId");
      END IF;

      -- 3. Make projectId nullable in ClientPayment if it isn't already
      ALTER TABLE "ClientPayment" ALTER COLUMN "projectId" DROP NOT NULL;

    END $$;
  `);

  console.log("Successfully migrated ClientPayment columns (quotationId, leadId, nullable projectId).");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

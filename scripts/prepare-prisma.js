const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Detect database provider from DATABASE_URL, DATABASE_URL_SUPABASE, or Vercel Postgres env vars
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_SUPABASE ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  '';
const isPostgres =
  dbUrl.startsWith('postgres://') ||
  dbUrl.startsWith('postgresql://') ||
  dbUrl.includes('supabase.co') ||
  dbUrl.includes('pooler.supabase.com');

if (isPostgres || !dbUrl) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  if (!process.env.DATABASE_URL && dbUrl) {
    process.env.DATABASE_URL = dbUrl;
  }
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log(`[prepare-prisma] Configured Prisma datasource provider successfully`);

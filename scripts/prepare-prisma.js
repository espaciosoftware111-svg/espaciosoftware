const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Detect database provider from DATABASE_URL
const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

if (isPostgres) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  
  // Ensure both starter.db and dev.db exist
  const prismaDir = path.join(__dirname, '..', 'prisma');
  const starterDb = path.join(prismaDir, 'starter.db');
  const devDb = path.join(prismaDir, 'dev.db');

  if (fs.existsSync(starterDb) && !fs.existsSync(devDb)) {
    try {
      fs.copyFileSync(starterDb, devDb);
      console.log('[prepare-prisma] Initialized prisma/dev.db from starter.db');
    } catch (e) {
      console.warn('[prepare-prisma] Warning copying starter.db:', e.message);
    }
  } else if (fs.existsSync(devDb) && !fs.existsSync(starterDb)) {
    try {
      fs.copyFileSync(devDb, starterDb);
      console.log('[prepare-prisma] Created prisma/starter.db from dev.db');
    } catch (e) {
      console.warn('[prepare-prisma] Warning copying dev.db:', e.message);
    }
  }

  // Ensure DATABASE_URL is defined so prisma generate never fails if env var is missing on Vercel
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log(`[prepare-prisma] Configured Prisma datasource provider as '${targetProvider}'`);

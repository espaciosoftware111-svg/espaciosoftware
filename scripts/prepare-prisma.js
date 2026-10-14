const fs = require('fs');
const path = require('path');

// 1. Load environment variables from .env if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Strictly enforce postgresql for Supabase cloud database
schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

// Ensure directUrl is preserved for migrations and pooler bypass
if (!schema.includes('directUrl')) {
  schema = schema.replace(
    /url\s*=\s*env\("DATABASE_URL"\)/,
    'url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")'
  );
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log(`[prepare-prisma] Configured Prisma datasource provider strictly as 'postgresql'`);

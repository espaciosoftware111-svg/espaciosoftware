import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getResolvedDatabaseUrl(): string | undefined {
  if (typeof window !== "undefined") {
    return undefined;
  }

  const envUrl =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_SUPABASE ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;
  const isPostgres = !!(
    envUrl &&
    (envUrl.startsWith("postgres://") ||
      envUrl.startsWith("postgresql://") ||
      envUrl.includes("supabase.co") ||
      envUrl.includes("pooler.supabase.com"))
  );

  if (isPostgres && envUrl) {
    let tunedUrl = envUrl;
    // Auto-tune Supabase PgBouncer pooler URL for serverless / Vercel
    if (tunedUrl.includes("pooler.supabase.com") || tunedUrl.includes("pgbouncer=true")) {
      try {
        const parsed = new URL(tunedUrl);
        // In serverless, enforce connection_limit=1 to prevent PgBouncer pool exhaustion
        parsed.searchParams.set("connection_limit", "1");
        parsed.searchParams.set("pool_timeout", "15");
        parsed.searchParams.set("connect_timeout", "15");
        if (parsed.port === "6543") {
          parsed.searchParams.set("pgbouncer", "true");
        }
        tunedUrl = parsed.toString();
      } catch {
        if (tunedUrl.includes("connection_limit=")) {
          tunedUrl = tunedUrl.replace(/connection_limit=\d+/, "connection_limit=1");
        } else {
          tunedUrl += (tunedUrl.includes("?") ? "&" : "?") + "connection_limit=1";
        }
        if (!tunedUrl.includes("pool_timeout=")) tunedUrl += "&pool_timeout=15";
        if (!tunedUrl.includes("connect_timeout=")) tunedUrl += "&connect_timeout=15";
        if (tunedUrl.includes(":6543") && !tunedUrl.includes("pgbouncer=true")) {
          tunedUrl += "&pgbouncer=true";
        }
      }
    }
    return tunedUrl;
  }

  // Serverless / Vercel runtime handling for SQLite fallback
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    try {
      const fs = require("fs");
      const path = require("path");
      const tmpDbPath = path.join("/tmp", "espacio-erp.db");

      if (!fs.existsSync(tmpDbPath)) {
        const searchPaths = [
          path.join(process.cwd(), "prisma", "starter.db"),
          path.join(process.cwd(), "prisma", "dev.db"),
          path.join(__dirname, "..", "..", "prisma", "starter.db"),
          path.join(__dirname, "..", "..", "prisma", "dev.db"),
          path.join("/var", "task", "prisma", "starter.db"),
          path.join("/var", "task", "prisma", "dev.db"),
        ];

        for (const p of searchPaths) {
          if (fs.existsSync(p)) {
            try {
              fs.copyFileSync(p, tmpDbPath);
              try {
                fs.chmodSync(tmpDbPath, 0o666);
              } catch {}
              console.log(`[db] Initialized SQLite database in /tmp from ${p}`);
              break;
            } catch (e) {
              console.error(`[db] Failed to copy database from ${p}:`, e);
            }
          }
        }
      }

      const resolved = `file:${tmpDbPath}`;
      process.env.DATABASE_URL = resolved;
      return resolved;
    } catch (err) {
      console.warn("[db] Error initializing /tmp SQLite database:", err);
    }
  }

  return envUrl;
}

const resolvedUrl = getResolvedDatabaseUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(resolvedUrl ? { datasources: { db: { url: resolvedUrl } } } : {}),
    log: ["error"],
  });

// CRITICAL FIX FOR NEXT.JS & VERCEL:
// Always cache PrismaClient in globalForPrisma across ALL environments (including production).
// Without this, every serverless API route execution creates a new PrismaClient connection,
// rapidly exhausting Supabase's PgBouncer pool and causing ECHECKOUTTIMEOUT.
globalForPrisma.prisma = db;

/**
 * Resilient Database execution helper with exponential backoff retry.
 * Handles transient Supabase PgBouncer pooler connection reconnects (10054, P1001, P1017, P2024, ECHECKOUTTIMEOUT).
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 400
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isConnectionError =
        err?.message?.includes("Can't reach database") ||
        err?.message?.includes("connection") ||
        err?.message?.includes("timeout") ||
        err?.message?.includes("ECHECKOUTTIMEOUT") ||
        err?.message?.includes("Transaction mode") ||
        err?.message?.includes("unable to check out connection") ||
        err?.message?.includes("socket") ||
        err?.message?.includes("forcibly closed") ||
        err?.code === "P1001" ||
        err?.code === "P1017" ||
        err?.code === "P2024";

      if (isConnectionError && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getResolvedDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL;
  const isPostgres = !!(envUrl && (envUrl.startsWith("postgres://") || envUrl.startsWith("postgresql://")));

  if (isPostgres) {
    return envUrl;
  }

  // Serverless / Vercel runtime handling
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
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

      let copied = false;
      for (const p of searchPaths) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpDbPath);
            try {
              fs.chmodSync(tmpDbPath, 0o666);
            } catch {}
            copied = true;
            console.log(`[db] Initialized SQLite database in /tmp from ${p}`);
            break;
          } catch (e) {
            console.error(`[db] Failed to copy database from ${p}:`, e);
          }
        }
      }

      if (!copied) {
        console.warn("[db] No starter SQLite database found in search paths; creating new empty /tmp/espacio-erp.db");
        try {
          fs.writeFileSync(tmpDbPath, "");
          try {
            fs.chmodSync(tmpDbPath, 0o666);
          } catch {}
        } catch (e) {
          console.error("[db] Could not create placeholder in /tmp:", e);
        }
      }
    }

    const resolved = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = resolved;
    return resolved;
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

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Resilient Database execution helper with exponential backoff retry.
 * Handles transient Supabase PgBouncer pooler connection reconnects (10054, P1001, P1017, P2024).
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

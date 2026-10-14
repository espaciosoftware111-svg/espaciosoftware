import { z } from "zod";

const SUPABASE_FALLBACK_URL =
  "postgresql://postgres.smldrxmmsyxbbrlaazaq:Erp%40espacio123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connection_limit=5&pool_timeout=20";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000"),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().default(SUPABASE_FALLBACK_URL),
  JWT_SECRET: z.string().min(16).default("espacio-erp-dev-secret-change-in-production-min-32-chars!"),
  SESSION_MAX_AGE_SECONDS: z.number().default(28800), // 8 hours
  NEXT_PUBLIC_APP_NAME: z.string().default("ESPACIO ERP"),
  NEXT_PUBLIC_APP_VERSION: z.string().default("1.0.0-foundation"),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_JWKS_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const rawDbUrl =
    (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")
      ? process.env.DATABASE_URL
      : undefined) ||
    process.env.DATABASE_URL_SUPABASE ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    SUPABASE_FALLBACK_URL;

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    DATABASE_URL: rawDbUrl,
    JWT_SECRET: process.env.JWT_SECRET,
    SESSION_MAX_AGE_SECONDS: process.env.SESSION_MAX_AGE_SECONDS ? parseInt(process.env.SESSION_MAX_AGE_SECONDS, 10) : undefined,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_JWKS_URL: process.env.SUPABASE_JWKS_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    console.error("❌ Invalid environment configuration:", parsed.error.format());
    throw new Error("Invalid environment configuration");
  }

  // Ensure process.env.DATABASE_URL is set so Prisma query engine schema validation never fails
  process.env.DATABASE_URL = parsed.data.DATABASE_URL;

  return parsed.data;
}

export const env = getEnv();

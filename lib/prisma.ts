import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 uses the query compiler and connects through a driver adapter.
// For Supabase PostgreSQL we use the `pg` adapter with the pooled connection
// string from DATABASE_URL.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function isUsableUrl(value: string | undefined): value is string {
  // Skip empty values and unfilled placeholders like the ones in .env.example
  // (e.g. "postgresql://postgres.<ref>:<password>@...").
  if (!value || value.includes("<")) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Accept either an explicit DATABASE_URL or the variables provided by the
// Supabase/Vercel integration (POSTGRES_PRISMA_URL / POSTGRES_URL are pooled).
// The first *valid* URL wins, so a leftover placeholder doesn't break startup.
function runtimeConnectionString(): string | undefined {
  return [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
  ].find(isUsableUrl);
}

// Supabase's pooler presents a certificate chain that node-postgres (pg v8)
// treats as `verify-full` when `sslmode=require`, which rejects the chain.
// Force `sslmode=no-verify` so the connection stays TLS-encrypted but does not
// fail certificate verification.
function withRelaxedSsl(connectionString?: string): string | undefined {
  if (!connectionString) return connectionString;
  try {
    const url = new URL(connectionString);
    url.searchParams.set("sslmode", "no-verify");
    return url.toString();
  } catch {
    return connectionString;
  }
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: withRelaxedSsl(runtimeConnectionString()),
  });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

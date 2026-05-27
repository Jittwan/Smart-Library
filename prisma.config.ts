import { defineConfig } from "prisma/config";

// Skip empty values and unfilled placeholders (e.g. "...<ref>...<password>...").
function isUsableUrl(value: string | undefined): value is string {
  if (!value || value.includes("<")) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Prisma 7 moved the connection URL out of schema.prisma.
// The URL is only needed for migration / introspection commands.
// Runtime connections are made through the driver adapter in lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.ts",
  },
  datasource: {
    // Migrations/introspection use a direct (non-pooled) connection when
    // available (Supabase: port 5432), falling back to the pooled URL.
    // The first valid URL wins, so a leftover placeholder doesn't break.
    url:
      [
        process.env.DIRECT_URL,
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.DATABASE_URL,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL,
      ].find(isUsableUrl) ?? "",
  },
});

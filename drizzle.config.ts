import { defineConfig } from "drizzle-kit";

/**
 * Migration configuration.
 *
 * Migrations are generated into ./drizzle and committed, so the exact SQL that
 * will run against the real database is reviewable in a pull request rather
 * than generated on the fly at deploy time.
 *
 * WHY THIS USES A DIFFERENT CONNECTION FROM THE APPLICATION
 *
 * A hosted Postgres like Supabase offers two ways in, and they are not
 * interchangeable:
 *
 *   transaction pooler (port 6543)  what the website uses. It hands a
 *     connection back the moment each statement finishes, which is what lets a
 *     few hundred serverless functions share a small connection limit. It
 *     cannot hold anything open across statements, so it cannot run a
 *     migration.
 *
 *   direct or session (port 5432)  one real connection, held for as long as
 *     you need it. Slow to open, few of them available, and exactly right for
 *     a migration, which has to run its statements in one transaction.
 *
 * So DIRECT_DATABASE_URL is used here when it is set. Without it this falls
 * back to DATABASE_URL, which is correct for a database on your own machine
 * and wrong for a pooled hosted one; the error you would get is a confusing
 * complaint about prepared statements rather than anything about pooling.
 */
const url = process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || "";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});

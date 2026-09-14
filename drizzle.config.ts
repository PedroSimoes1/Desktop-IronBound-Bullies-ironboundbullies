import { defineConfig } from "drizzle-kit";

/**
 * Migration configuration.
 *
 * Migrations are generated into ./drizzle and committed, so the exact SQL that
 * will run against the real database is reviewable in a pull request rather
 * than generated on the fly at deploy time.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});

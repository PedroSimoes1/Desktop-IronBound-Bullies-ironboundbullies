import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * The database connection.
 *
 * Server only. `import "server-only"` makes the build fail rather than letting
 * a connection string reach a browser bundle, which is the kind of mistake
 * that is invisible until it is on someone's screen.
 *
 * One connection pool per process, reused across hot reloads in development so
 * a few hundred edits do not open a few hundred connections and exhaust the
 * database's limit.
 */

import "server-only";

declare global {
  var __ironboundDb: ReturnType<typeof createClient> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in; see README.md for how to get the value.",
    );
  }

  const sql = postgres(url, {
    // Serverless functions are short-lived and numerous, so each one holds the
    // smallest pool that still works rather than its own generous handful.
    max: process.env.VERCEL ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(sql, { schema });
}

export const db = globalThis.__ironboundDb ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__ironboundDb = db;
}

export { schema };

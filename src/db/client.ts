import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "@/lib/env";
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
 *
 * The connection string is read through lib/env, which is the only place that
 * decides what a missing or wrong variable should say. This file used to print
 * its own message telling the reader to edit .env.local, which is exactly the
 * wrong advice when the build that failed was running on Vercel.
 */

import "server-only";

declare global {
  var __ironboundDb: ReturnType<typeof createClient> | undefined;
}

function createClient() {
  const sql = postgres(databaseUrl(), {
    // Serverless functions are short-lived and numerous, so each one holds the
    // smallest pool that still works rather than its own generous handful.
    max: process.env.VERCEL ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    /**
     * No prepared statements.
     *
     * A hosted Postgres is reached through a transaction pooler, which hands
     * the connection to somebody else the moment a statement finishes. A
     * prepared statement is remembered on one connection, so the next query
     * that tries to use it lands somewhere that has never heard of it and
     * fails with "prepared statement does not exist". It fails intermittently,
     * under load, which is the worst way for anything to fail.
     *
     * The cost of turning them off is a few microseconds per query, and it is
     * close to nothing here anyway: a serverless function answers one request
     * and exits, so a prepared statement would almost never be reused.
     */
    prepare: false,
  });

  return drizzle(sql, { schema });
}

export const db = globalThis.__ironboundDb ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__ironboundDb = db;
}

export { schema };

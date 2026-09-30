/**
 * Sets up a hosted database in one command.
 *
 *   npm run db:setup
 *
 * Reads the connection strings from .env.local, runs the migrations, imports
 * the dogs if the database is empty, and prints what it found. Safe to run
 * again: it will not touch records that are already there.
 *
 * The point of this file is that the hosted database is the one step where a
 * mistake is expensive and hard to undo. Doing it as three remembered commands
 * invites running the import twice, or running a migration through the wrong
 * connection and reading a confusing error. This does them in the right order,
 * through the right connection, and says what happened.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

/* ---------------------------------------------------------------------------
   CONFIGURATION
   -------------------------------------------------------------------------- */

/** Reads .env.local without a dependency. Values may be quoted. */
function readEnvFile() {
  const file = path.join(root, ".env.local");
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    out[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const fromFile = readEnvFile();
const value = (name) => (process.env[name]?.trim() || fromFile[name]?.trim() || "");

const appUrl = value("DATABASE_URL");
const directUrl = value("DIRECT_DATABASE_URL") || appUrl;

const say = (line = "") => console.log(line);
const fail = (lines) => {
  say();
  for (const line of lines) say(`  ${line}`);
  say();
  process.exit(1);
};

if (!appUrl) {
  fail([
    "DATABASE_URL is not set.",
    "",
    "Put it in .env.local, or pass it on the command line:",
    "  DATABASE_URL='postgresql://...' npm run db:setup",
  ]);
}

/** Never print a connection string: it contains the password. */
const describe = (url) => {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "(unreadable connection string)";
  }
};

const isPooled = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.port === "6543" || parsed.hostname.includes("pooler");
  } catch {
    return false;
  }
};

say();
say("  Hosted database setup");
say(`  website connects to:  ${describe(appUrl)}`);
say(`  migrations run on:    ${describe(directUrl)}`);
say();

if (isPooled(directUrl)) {
  fail([
    "The migration connection looks like a pooled one.",
    "",
    `  ${describe(directUrl)}`,
    "",
    "A pooler hands the connection to somebody else between statements, so it",
    "cannot run a migration. Set DIRECT_DATABASE_URL to the direct connection:",
    "",
    "  Supabase -> Project Settings -> Database -> Connection string,",
    "  then choose the DIRECT connection (port 5432, host starts with db.).",
    "",
    "Leave DATABASE_URL as the transaction pooler; that one is right for the site.",
  ]);
}

/* ---------------------------------------------------------------------------
   THE STEPS
   -------------------------------------------------------------------------- */

const run = (label, command, args, env) => {
  say(`  ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    fail([`${label} failed. Nothing further was run.`]);
  }
  say();
};

run("1. Creating the tables (migrations)", "npx", ["drizzle-kit", "migrate"], {
  DATABASE_URL: directUrl,
  DIRECT_DATABASE_URL: directUrl,
});

/* Does it already have dogs? If so the import is skipped, because re-running
   it would put the original descriptions and prices back over whatever the
   owner has since changed. The import script refuses too; this just says so in
   a sentence rather than an error. */
const countDogs = spawnSync(
  "node",
  [
    "-e",
    `import('postgres').then(async ({default: postgres}) => {
       const sql = postgres(process.env.DIRECT_DATABASE_URL, { max: 1, prepare: false });
       try {
         const [row] = await sql\`select count(*)::int as n from dogs\`;
         console.log(row.n);
       } catch { console.log("0"); }
       await sql.end();
     })`,
  ],
  { cwd: root, encoding: "utf8", env: { ...process.env, DIRECT_DATABASE_URL: directUrl } },
);

const existing = Number.parseInt((countDogs.stdout ?? "0").trim(), 10) || 0;

if (existing > 0) {
  say(`  2. Skipping the import: the database already holds ${existing} dogs.`);
  say("     Re-importing would put the original descriptions and prices back");
  say("     over anything the owner has changed since.");
  say();
} else {
  run("2. Importing the dogs, photographs and breedings", "npm", ["run", "db:import"], {
    DATABASE_URL: directUrl,
  });
}

/* ---------------------------------------------------------------------------
   WHAT IS IN THERE NOW
   -------------------------------------------------------------------------- */

const summary = spawnSync(
  "node",
  [
    "-e",
    `import('postgres').then(async ({default: postgres}) => {
       const sql = postgres(process.env.DIRECT_DATABASE_URL, { max: 1, prepare: false });
       const rows = await sql\`
         select 'kennels' as t, count(*)::int as n from kennels
         union all select 'dogs', count(*)::int from dogs
         union all select 'photographs', count(*)::int from photos
         union all select 'breedings', count(*)::int from breedings
         union all select 'accounts', count(*)::int from users
         union all select 'unpublished drafts', count(*)::int from dog_drafts\`;
       for (const r of rows) console.log('     ' + String(r.n).padStart(4) + '  ' + r.t);
       await sql.end();
     })`,
  ],
  { cwd: root, encoding: "utf8", env: { ...process.env, DIRECT_DATABASE_URL: directUrl } },
);

say("  3. What the database holds now");
say();
say((summary.stdout ?? "").trimEnd());
say();
say("  Done. Next: create the owner account with");
say("    npm run owner:create -- --email <their email> --name \"<their name>\" --generate");
say();

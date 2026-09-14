#!/usr/bin/env node
/**
 * Start a throwaway Postgres for local development.
 *
 * You do not need this if you are pointing DATABASE_URL at the Neon database.
 * It exists so the site can be run, built and tested with no network and no
 * account, which is how the whole data layer was developed.
 *
 *   npm run db:local          start it (prints the connection string)
 *   npm run db:local stop     stop it
 *   npm run db:local reset    delete everything and start fresh
 *
 * The data lives outside the repository and is not backed up. It is scratch.
 */

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

const PORT = 5433;
const DB = "ironbound";
const DATA = "/var/lib/postgresql/ironbound";
const URL = `postgresql://postgres@localhost:${PORT}/${DB}`;

function binDir() {
  const root = "/usr/lib/postgresql";
  if (!existsSync(root)) {
    console.error(
      "Postgres is not installed.\n" +
        "  macOS:  brew install postgresql@16\n" +
        "  Debian: sudo apt-get install postgresql\n" +
        "Or skip this entirely and point DATABASE_URL at your Neon database.",
    );
    process.exit(1);
  }
  const versions = readdirSync(root).sort();
  return `${root}/${versions[versions.length - 1]}/bin`;
}

const asPostgres = (cmd) =>
  process.getuid?.() === 0 ? execSync(`su postgres -c ${JSON.stringify(cmd)}`, { stdio: "inherit" }) : execSync(cmd, { stdio: "inherit" });

const BIN = binDir();
const action = process.argv[2] ?? "start";

if (action === "stop") {
  try {
    asPostgres(`${BIN}/pg_ctl -D ${DATA} stop`);
  } catch {
    console.log("Not running.");
  }
  process.exit(0);
}

if (action === "reset") {
  try {
    asPostgres(`${BIN}/pg_ctl -D ${DATA} stop`);
  } catch {
    /* not running, which is fine */
  }
  execSync(`rm -rf ${DATA}`, { stdio: "inherit" });
}

if (!existsSync(`${DATA}/base`)) {
  execSync(`mkdir -p ${DATA} && chown -R postgres:postgres ${DATA} 2>/dev/null || true`, { stdio: "inherit" });
  asPostgres(`${BIN}/initdb -D ${DATA} -U postgres --auth=trust`);
}

try {
  asPostgres(`${BIN}/pg_ctl -D ${DATA} -l ${DATA}/server.log -o "-p ${PORT} -k /tmp" start`);
} catch {
  console.log("Already running.");
}

// Give the socket a moment, then make sure the database exists.
execSync("sleep 2");
try {
  execFileSync(`${BIN}/createdb`, ["-h", "/tmp", "-p", String(PORT), "-U", "postgres", DB], { stdio: "pipe" });
} catch {
  /* already there */
}

console.log(`\nPostgres is up.\n\n  DATABASE_URL="${URL}"\n`);
console.log("Next:  npm run db:migrate     create the tables");
console.log("       npm run db:import      load the dogs, photographs and breedings\n");

/**
 * Create or update an owner account.
 *
 * This is the administrator's tool. There is no public sign-up page and there
 * never will be: the only people who can reach the dashboard are the ones an
 * administrator deliberately put there.
 *
 *   npm run owner:create -- --email someone@example.com --name "Their Name"
 *   npm run owner:create -- --email someone@example.com --admin
 *   npm run owner:password -- --email someone@example.com
 *   npm run owner:list
 *
 * The password is never passed on the command line, because a command line
 * ends up in shell history and in process listings where other users can read
 * it. It is either typed at a hidden prompt or generated here and printed once.
 *
 * Setting a password bumps the account's password version, which signs out
 * every device that account was signed in on. That is the intended way to
 * recover an account somebody else may have reached.
 */

import { randomBytes, randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import postgres from "postgres";
import { hashPassword, passwordProblem } from "../src/lib/auth/password.ts";

type Args = Record<string, string | boolean>;

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

/** Reads a password without echoing it to the screen. */
async function promptHidden(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const stdout = process.stdout as NodeJS.WriteStream & { _writeToOutput?: (s: string) => void };
  process.stdout.write(question);
  const original = stdout.write.bind(stdout);
  // Swallow the echo of what is typed, but let the newline through.
  stdout.write = ((chunk: string, ...rest: unknown[]) =>
    typeof chunk === "string" && chunk !== "\n" && chunk !== "\r\n" ? true : original(chunk, ...(rest as []))) as typeof stdout.write;
  try {
    const answer = await rl.question("");
    return answer;
  } finally {
    stdout.write = original;
    rl.close();
    process.stdout.write("\n");
  }
}

/** A password nobody has to invent, and nobody will reuse. */
function generatePassword(): string {
  // Avoids characters that are hard to read aloud or retype: 0/O, 1/l/I.
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(24);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

const KENNEL = { id: "ironbound", slug: "ironbound-bullies", name: "Ironbound Bullies" };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = process.argv[2]?.startsWith("--") ? "create" : process.argv[2];
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Run `npm run db:local` first, or point it at Supabase.");
    process.exit(1);
  }
  const sql = postgres(url, { max: 1 });

  try {
    if (command === "list") {
      const rows = await sql<{ email: string; name: string | null; role: string; kennel: string; disabled: boolean; last: Date | null }[]>`
        select u.email, u.name, m.role, k.name as kennel, u.disabled, u.last_sign_in_at as last
        from users u
        left join memberships m on m.user_id = u.id
        left join kennels k on k.id = m.kennel_id
        order by u.created_at`;
      if (rows.length === 0) {
        console.log("No accounts yet. Create one with:\n  npm run owner:create -- --email someone@example.com");
      } else {
        console.log("\nAccounts:\n");
        for (const r of rows) {
          const seen = r.last ? r.last.toISOString().slice(0, 16).replace("T", " ") : "never signed in";
          console.log(`  ${r.email}${r.disabled ? "  [DISABLED]" : ""}`);
          console.log(`      ${r.role ?? "no role"} of ${r.kennel ?? "no kennel"}, ${seen}\n`);
        }
      }
      return;
    }

    const email = String(args.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      console.error('An email address is required:  npm run owner:create -- --email someone@example.com');
      process.exit(1);
    }

    // A password is either typed at a hidden prompt or generated once.
    let password: string;
    let generated = false;
    if (args.generate || !process.stdin.isTTY) {
      password = generatePassword();
      generated = true;
    } else {
      password = await promptHidden(`Password for ${email} (leave empty to generate one): `);
      if (password.trim() === "") {
        password = generatePassword();
        generated = true;
      } else {
        const problem = passwordProblem(password);
        if (problem) {
          console.error(`\n  ${problem}\n`);
          process.exit(1);
        }
        const again = await promptHidden("Type it again: ");
        if (again !== password) {
          console.error("\n  Those did not match.\n");
          process.exit(1);
        }
      }
    }

    const { hash, salt } = await hashPassword(password);
    const role = args.admin ? "admin" : "owner";

    await sql.begin(async (tx) => {
      await tx`insert into kennels (id, slug, name) values (${KENNEL.id}, ${KENNEL.slug}, ${KENNEL.name}) on conflict (id) do nothing`;

      const [existing] = await tx<{ id: string; password_version: number }[]>`
        select id, password_version from users where email = ${email}`;

      let userId: string;
      if (existing) {
        userId = existing.id;
        // Bumping the version signs out every device this account was on.
        await tx`
          update users
          set password_hash = ${hash}, password_salt = ${salt},
              password_version = ${existing.password_version + 1},
              disabled = false,
              name = coalesce(${args.name ? String(args.name) : null}, name)
          where id = ${userId}`;
        await tx`delete from sessions where user_id = ${userId}`;
        console.log(`\n  Updated ${email}. Every device it was signed in on has been signed out.`);
      } else {
        userId = randomUUID();
        await tx`
          insert into users (id, email, name, password_hash, password_salt)
          values (${userId}, ${email}, ${args.name ? String(args.name) : null}, ${hash}, ${salt})`;
        console.log(`\n  Created ${email}.`);
      }

      await tx`
        insert into memberships (id, user_id, kennel_id, role)
        values (${randomUUID()}, ${userId}, ${KENNEL.id}, ${role})
        on conflict (user_id, kennel_id) do update set role = ${role}`;
      console.log(`  Role: ${role} of ${KENNEL.name}.`);
    });

    if (generated) {
      console.log("\n  ------------------------------------------------------------");
      console.log("  PASSWORD (shown once, it is not stored anywhere in readable form)");
      console.log(`\n      ${password}\n`);
      console.log("  Send it to them in a message that is not email if you can,");
      console.log("  and tell them to change it after signing in.");
      console.log("  ------------------------------------------------------------\n");
    } else {
      console.log("  Password set.\n");
    }
    console.log("  They sign in at /owner/login\n");
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

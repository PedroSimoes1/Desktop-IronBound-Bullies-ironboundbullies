import "server-only";

/**
 * Environment variables, checked once and explained when they are wrong.
 *
 * The Preview build failed with "DATABASE_URL is not set" thrown from deep
 * inside a page render, which tells you what is missing but nothing about how
 * to fix it. Reading the variables here instead means a misconfigured
 * deployment fails at the top of the build with a message naming the variable,
 * where it comes from and where to put it.
 *
 * Deliberately NOT done: falling back to sample data when the database is
 * unreachable. A build that quietly succeeds with invented dogs is worse than
 * one that fails, because the failure is then discovered by a customer.
 */

export type Environment = "development" | "preview" | "production";

/** Which deployment this is. Vercel sets VERCEL_ENV; locally there is none. */
export const deployment: Environment =
  process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : "development";

export const isProductionDeployment = deployment === "production";

interface Missing {
  name: string;
  why: string;
  where: string;
}

function fail(missing: Missing[]): never {
  const lines = [
    "",
    "  Ironbound Bullies cannot start: required configuration is missing.",
    "",
    ...missing.flatMap((m) => [`  ${m.name}`, `      what it is:  ${m.why}`, `      where to set it: ${m.where}`, ""]),
    "  Local development:  copy .env.example to .env.local and fill it in,",
    "                      or run `npm run db:local` for a throwaway database.",
    "  Vercel:             Project -> Settings -> Environment Variables.",
    "                      Tick Production, Preview AND Development, then redeploy.",
    "",
    "  Full setup instructions are in README.md under 'Environment variables'.",
    "",
  ];
  throw new Error(lines.join("\n"));
}

function required(name: string, why: string, where: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") fail([{ name, why, where }]);
  return value;
}

/**
 * The database connection string.
 *
 * Read lazily rather than at module load: importing this file must not throw,
 * or the error surfaces as an unrelated module-resolution failure that is much
 * harder to read than the message above.
 */
export function databaseUrl(): string {
  const url = required(
    "DATABASE_URL",
    "the Postgres connection string",
    "Supabase: Project Settings -> Database -> Connection string -> Transaction pooler. Use the POOLED one.",
  );

  /* The two things people actually paste by mistake: the project's API URL
     (https://...) from the page above the one they wanted, and the whole psql
     command line with the string buried in it. Both produce a connection error
     ten minutes later that says nothing about either. */
  if (!/^postgres(ql)?:\/\//.test(url.trim())) {
    fail([
      {
        name: "DATABASE_URL",
        why: `does not look like a Postgres connection string. It should begin with postgresql:// and this one begins with "${url.trim().slice(0, 12)}..."`,
        where: "Supabase: Project Settings -> Database -> Connection string -> Transaction pooler. Copy the string itself, not the psql command or the API URL.",
      },
    ]);
  }
  return url.trim();
}

/**
 * Secret used to sign session cookies.
 *
 * Any long random string. `openssl rand -base64 32` produces a good one.
 * Changing it signs every existing session out, which is the intended way to
 * revoke all sessions at once.
 */
export function sessionSecret(): string {
  return required("SESSION_SECRET", "a random string used to sign sign-in cookies", "generate with: openssl rand -base64 32");
}

/**
 * Where uploaded photographs go.
 *
 * "local" writes to .uploads/ in the project, which is how the upload flow is
 * developed and tested without an account. Anything else is a cloud bucket and
 * needs its own credentials. A production deployment refuses to use "local",
 * because a serverless filesystem is wiped between requests and the owner's
 * photographs would silently vanish.
 */
export function storageDriver(): "local" | "supabase" {
  const raw = process.env.PHOTO_STORAGE ?? (deployment === "development" ? "local" : "supabase");
  if (raw !== "local" && raw !== "supabase") {
    fail([{ name: "PHOTO_STORAGE", why: `must be "local" or "supabase" (found "${raw}")`, where: "Vercel environment variables, or .env.local" }]);
  }
  if (raw === "local" && deployment !== "development") {
    fail([
      {
        name: "PHOTO_STORAGE",
        why: 'is set to "local", but a deployed server has no lasting filesystem, so uploaded photographs would be lost',
        where: 'set it to "supabase" on Vercel and add the three SUPABASE_ variables',
      },
    ]);
  }
  return raw;
}

export function supabaseStorage() {
  return {
    url: required("SUPABASE_URL", "your Supabase project URL", "Supabase: Project Settings -> API -> Project URL"),
    serviceKey: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      "the service role key, used only on the server to write photographs",
      "Supabase: Project Settings -> API -> service_role. NEVER put this in a NEXT_PUBLIC_ variable.",
    ),
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "dog-photos",
  };
}

/**
 * Checks everything at once, for the build to call before it renders a page.
 * Reports every missing variable together rather than one per attempt.
 */
export function assertConfigured(): void {
  const missing: Missing[] = [];
  const check = (name: string, why: string, where: string) => {
    const v = process.env[name];
    if (!v || v.trim() === "") missing.push({ name, why, where });
  };

  check("DATABASE_URL", "the Postgres connection string", "Supabase: Project Settings -> Database -> Connection string (pooled)");
  check("SESSION_SECRET", "a random string used to sign sign-in cookies", "generate with: openssl rand -base64 32");
  if (missing.length) fail(missing);
}

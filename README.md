# Ironbound Bullies 2.0

The independent website for Ironbound Bullies, an Exotic Bully kennel in Northern New Jersey — replacing the profile currently hosted at `kenneldatabase.vercel.app/ironboundbullies` with a premium, photography-driven brand site and a phone-friendly owner dashboard.

This README is written so that someone can return months from now and understand the project. It grows with each stage.

## Status

| Stage | What it delivers | State |
|---|---|---|
| 0 | Audit, design directions, sitemap, architecture, admin plan, domain/deploy plan (see the project documents) | Done |
| 1 | Project foundation: tokens, fonts, core components, living style sheet, 404/error pages | Done |
| 2 | Photo inventory and focal points, cinematic homepage hero, featured dogs, dog collection and profiles, available page, inquiry form preview (branch `taste-skill-test`) | Done |
| **2.5** | **Design refinement: homepage story, staggered studs section, breedings, about, typographic roster instead of empty photo frames, floating header, inquiry types, real contact details** (branch `taste-refinement-v1`) | **Done, awaiting owner review** |
| 3 | Android Chrome compatibility for the public site and the owner screens (branch `android-compat-v1`) | Done |
| **5** | **Database, owner sign-in, editing, photo upload — the owner area works against Postgres** (branch `database-v1`) | **Done locally, waiting on the hosted database** |
| 4 | Inquiry form delivery (validation, spam protection) and owner inbox | Next |
| 6 | Productions and gallery (blocked: the 22 production photographs have no names yet) | Blocked |
| 7 | SEO (sitemap, structured data, OG images), analytics, legal pages | Planned |
| 8 | QA on real devices, domain, launch | Planned |

## Architecture (plain English)

One Next.js application does everything: it renders the public pages, it hosts the owner area at `/owner`, and it handles the inquiry form. There is no separate API server and no second language in production. The dogs, photographs and breedings live in Postgres; photographs the owner uploads live in object storage. Python appears only as developer tooling (`tools/`), never in production.

**How the two halves fit together, in plain English.** A visitor never touches the database. The public pages are built once, as files, from whatever the database said at build time, so they are as fast as a folder of HTML. When the owner presses **Publish**, the application rebuilds only the pages that changed. Everything he does before pressing Publish is a *draft*: it is saved, it survives a phone dying, it is visible from his other devices, and the website keeps showing the old version until he says so.

That split is the reason for two sets of queries. `src/db/queries/public.ts` lists, column by column, the handful of fields a visitor is allowed to see, and never reads drafts or notes at all. `src/db/queries/owner.ts` is the only thing that reads the private side, and every one of its functions takes a kennel id and filters on it.

**How a request is kept honest.** Every private page and every action goes through `src/lib/auth/guard.ts`. It answers three questions in order: who is asking, which kennel owns the row they named, and do those match. The id in a form is only ever used to look a row up; the row's own `kennelId` is what decides. Passing another kennel's id gets the same "does not exist" answer as passing a made-up one, so it cannot be used to find out what exists either. Hiding a button in the browser is not security and is not relied on anywhere.

```
src/
  app/                 routes (Next.js App Router). Each folder is a URL.
    layout.tsx         the shell every page shares: fonts, header, footer, metadata defaults
    page.tsx           "/"  — homepage: hero, statement, studs, breedings, females, inquiry
    dogs/              "/dogs", "/dogs/studs", "/dogs/females", "/dogs/[slug]" profiles
    breedings/         "/breedings" the two verified pairings
    about/             "/about" the kennel's own statement and its contact channels
    available/         "/available" (honest empty state until dogs are verified)
    contact/           "/contact" inquiry form (preview; delivery arrives in Stage 4)
    design-system/     "/design-system" — the living style sheet (never indexed)
    not-found.tsx      404 page · error.tsx — application error page
    fonts.ts           the two type families, loaded with next/font/local
  components/
    ui/                building blocks: Button, StatusLabel, Container, Section, Wordmark, form/
    dogs/              DogCard, DogCollection (picture cards plus a typographic roster)
    home/              Hero (carousel), StudsSection, HomeSections
    site/              SiteHeader (floating, native <dialog> menu), SiteFooter
  content/             dogs.ts, photos.ts, breedings.ts — the original records, now only the seed for `npm run db:import`
  db/
    schema.ts          every table, in one file: kennels, users, memberships, sessions, dogs, photos, breedings, drafts, notes
    client.ts          the one database connection
    queries/public.ts  what a visitor may read. An explicit column list, no drafts, no notes
    queries/owner.ts   what a signed-in owner may read, always filtered by his kennel
    queries/shape.ts   database rows → the Dog and Photo the components already expected
  app/owner/           the owner area: Today, Dogs, one dog, Litters, Inquiries, sign-in
    actions.ts         every write the owner can make, as Server Actions
  lib/
    auth/password.ts   scrypt hashing, from Node's own crypto. No dependency
    auth/session.ts    signing in and out, session cookies, sign-in throttling
    auth/guard.ts      the one place that decides who may touch which kennel
    env.ts             reads and checks configuration; says exactly what is missing and where to set it
    storage.ts         photograph storage: one interface, a local driver and a Supabase driver
  photos/              web masters of the owner's photographs (metadata-free; see docs/image-inventory.md)
  lib/
    domain/            TypeScript models: Dog, Photo (+ focal point), Breeding, Inquiry; format helpers
    images/focal.ts    focal point → CSS object-position
    color/contrast.ts  WCAG contrast maths (used by the style sheet)
    navigation.ts      the primary menu · site.ts — site name, tagline, URL
  styles/
    tokens.css         EVERY color, size, spacing, radius, duration. The single source of truth.
    typography.css     the named text styles (display-hero, display-1…3, label, body, lede, numeric)
    globals.css        reset, base, focus ring, reduced-motion
    tokens.ts          the few token values JavaScript needs (breakpoints, durations)
  fonts/               self-hosted .woff2 files + licenses (built by tools/fonts/build_fonts.py)
drizzle/               database migrations, in order. Committed, never edited after being applied
tests/owner.e2e.mjs    the owner area, end to end, against a real database and a real browser
tools/
  fonts/build_fonts.py Python dev tool: fetch, subset and convert the fonts (not used at runtime)
  photos/prepare_photos.py Python dev tool: originals → metadata-free web masters
docs/image-inventory.md  every photograph: identity, focal points, best use, overlay concerns
scripts/check-copy.mjs   copy rule: no em/en dashes in visitor-facing strings (npm run lint:copy)
scripts/owner-account.ts create an owner account or change a password (npm run owner:create)
scripts/local-postgres.mjs a Postgres on your own machine for development (npm run db:local)
```

Design rules the code enforces: two type families, three button variants, status as text (no badges), no shadows on the public site, no raw CSS values where a token exists, visible focus on every interactive element, motion that respects `prefers-reduced-motion`.

## Running it on your own computer

You need **Node.js 22 or newer** (nodejs.org, LTS) and **Git**. Then, in Terminal:

```bash
cd ironboundbullies
npm install          # downloads the dependencies into node_modules/ (one time, and after pulling changes)
cp .env.example .env.local
npm run dev          # starts the development server
```

`.env.local` needs one thing filled in before the site will start: `DATABASE_URL`. If it is missing the application says so in plain English and names both the file and the Vercel setting, rather than failing with a stack trace.

There is no session secret. The sign-in cookie carries 32 random bytes and the database stores only a hash of them, so there is nothing to sign and no key to lose.

For `DATABASE_URL` you can either paste the string from the hosted database, or run one on your own machine:

```bash
npm run db:local     # starts Postgres on port 5433 and prints the string to paste in
npm run db:setup     # migrations, then the dogs, then a summary of what is there
npm run owner:create -- --email you@example.com --name "Your Name" --admin --generate
```

`npm run db:setup` is the one to use against a **hosted** database too. It runs the migrations
through the direct connection, imports the dogs only if the database is empty, and prints what
it found. Running it twice is safe: the second run skips the import rather than putting the
original descriptions and prices back over the owner's edits.

The last command prints a password **once**. It is never stored anywhere readable, never passed on the command line, and never printed again: to change it, run the command again for the same email, which also signs that person out everywhere.

Then open `http://localhost:3000` for the site and `http://localhost:3000/owner` for the owner area.

Other commands:

```bash
npm run build        # production build — this is what Vercel runs; it fails on type errors
npm run start        # serve the production build locally on port 3000
npm run lint         # code-quality checks
npm run lint:copy    # no em-dashes or en-dashes in visitor-facing text
npm run typecheck    # TypeScript only
npm run test:e2e     # the owner area, end to end (see below)
npm run db:studio    # a browser window onto the database tables
npm run owner:list   # who has an account, and what they can reach
npm run db:local stop    # stop the local Postgres · `reset` throws it away and starts again
npm run fonts        # rebuild src/fonts from the upstream sources (needs Python 3 + `pip install fonttools brotli`)
```

### The end to end tests

`npm run test:e2e` drives a real browser against a real database: it signs in with a real password, saves, publishes, uploads a photograph, and reads the public pages back to see whether the change arrived. Nothing in it is mocked, and it puts every row it touched back before it exits.

```bash
npm run build && npm run start &      # it tests the production build, which is what ships
OWNER_TEST_EMAIL=owner@example.test \
OWNER_TEST_PASSWORD='the password owner:create printed' \
DATABASE_URL='postgresql://postgres@localhost:5433/ironbound' \
npm run test:e2e
```

Point it at a development database, never the real one. It needs a browser the first time: `npx playwright install chromium`. Screenshots of every step land in `/tmp/owner-e2e`.

`npm run test:storage` covers the other half: the Supabase storage driver, against a stand-in
Supabase. Uploads in development go to a folder on disk, so the bucket path only wakes up on a
deployed site; this checks the request we send is the right shape — method, path, both
authorisation headers, content type, the exact bytes — and that a missing bucket and a wrong
key each produce a message naming the actual problem. It needs no account and no network.

### Photographs: what is drafted and what is not

Descriptions, prices and availability are **drafted**: they are saved, they survive everything,
and the website keeps showing the old values until Publish. Photographs are **not**. An upload
appears on the website as soon as it finishes, and a removal disappears from it just as fast.

That is deliberate for this milestone rather than an oversight. A photograph is either one the
owner wants up or one he does not, and holding it in a draft would mean he could not see it on
the real page before committing to it. If that turns out to be wrong in practice, photographs
can join the draft cycle without changing anything else, because publishing already runs
through one place. Deleting the main photograph promotes the next one automatically, so a
published page is never left without a picture.

## Environments

| | Where | Data | Photographs | Indexed by Google? |
|---|---|---|---|---|
| Local | your computer, `npm run dev` | your own Postgres (`npm run db:local`) | a `.uploads` folder, git-ignored | no |
| Preview | Vercel, one URL per branch / pull request | a separate database, never the real one | Supabase Storage | no — `noindex` is sent automatically |
| Production | Vercel, the custom domain | the real database | Supabase Storage | yes |

The `robots` metadata in `src/app/layout.tsx` only allows indexing when `VERCEL_ENV=production`. The owner area is `noindex` in every environment. Never experiment on production.

### Environment variables

Every variable is documented in `.env.example`. Real values live only in Vercel's environment settings and in a local `.env.local` that Git ignores — never in the repository, never in a chat message, never in a screenshot.

| Variable | Where it is needed | What it is |
|---|---|---|
| `DATABASE_URL` | everywhere | the Postgres connection string. Use the **transaction pooler** (port 6543) |
| `DIRECT_DATABASE_URL` | migrations only | the same database, **direct** (port 5432). Not needed on Vercel |
| `PHOTO_STORAGE` | optional | `local` or `supabase`. Defaults correctly; `local` is refused when deployed |
| `SUPABASE_URL` | Preview, Production | the project URL. Also read at **build** time, so uploaded photographs render |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview, Production | server only. Never in a `NEXT_PUBLIC_` variable |
| `SUPABASE_STORAGE_BUCKET` | optional | defaults to `dog-photos`. The bucket must be **public** |

### Two connection strings, and why

A hosted Postgres gives you more than one way in, and they are not interchangeable.

The **transaction pooler** (port 6543) hands the connection back the instant each statement
finishes. That is what lets hundreds of short-lived serverless functions share a small
connection limit, and it is what the website uses. Because it cannot hold anything open
between statements, the driver runs with `prepare: false` — a prepared statement would be
remembered on one connection and then looked for on another, which fails under load and
nowhere else.

The **direct connection** (port 5432) is one real connection held for as long as you need it.
Migrations need that, because a migration is one transaction from beginning to end. So
`DIRECT_DATABASE_URL` exists, and `npm run db:setup` refuses to run migrations through a
pooled URL rather than letting you read a confusing error an hour later.

`src/lib/env.ts` checks these at startup and reports **all** the missing ones at once, with the exact name and where to set it. It never quietly substitutes a default, because a site that appears to work on the wrong database is worse than one that refuses to start.

### Backups

Every dog fact, price, breeding and note is a row in Postgres. Supabase's free plan keeps daily backups for seven days; the paid plan extends that. Before any risky change, `pg_dump` the database to a file and keep it somewhere that is not the same account. The photographs in `src/photos/` are in Git, so they cannot be lost; photographs the owner uploads exist only in storage, which is the part worth copying.

## Deployment

Push to GitHub → Vercel builds a preview for the branch → test on desktop, iPhone, Android → owner reviews the preview link → merge to `main` → production deploys. Rollback is one click in Vercel (promote a previous deployment).

Domain: `ironboundbullies.com` was verified available on 2026-09-09 (not yet purchased). Canonical host will be the apex domain; `www` redirects to it.

## Ownership

Every account (domain registrar, Vercel, GitHub, database, storage, email, analytics, Search Console) is to be created in the business owner's name with the developer added as a collaborator. See the Phase 0 document, Part 7.

## Verifying before launch

Automated: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e`, Lighthouse (performance, accessibility, best practices, SEO). Manual: iPhone Safari, iPhone Chrome, Android Chrome, Samsung Internet, iPad, laptop, desktop, ultrawide — no horizontal scroll, all tap targets ≥ 48px, keyboard navigation through every page.

The end to end suite covers 84 checks: signed-out visitors are redirected rather than shown a 404; a wrong password does not say which half was wrong and does not lose the typed email; repeated wrong passwords lock the account and the right password is refused while the lock holds; an edit is written to the database, survives a reload, and is visible from a second device; a draft stays off the public site and publishing reaches it; a photograph uploads with its real pixel size under a name the uploader did not choose, reorders, and is deleted from storage when removed; one kennel cannot reach another's dog by URL or by tampering with the form; private notes and drafts appear on none of the public pages; and no owner screen scrolls sideways or hides a control under the bottom bar at 390, 360 and 412px.

Latest results (Lighthouse, mobile emulation with real throttling): home — Performance 92, Accessibility 100, Best Practices 100, LCP 1.8s, CLS 0.01; dog profile — Performance 97; breedings — 98; about — 98. SEO reports ~65 in non-production builds purely because of the intentional `noindex`.

Verified across 65 page and viewport combinations at 390, 430, 768, 1440, and 2560px: no horizontal overflow anywhere, no broken images, exactly one `h1` per page, no undersized controls. The hero responds to keyboard, click and swipe, pauses when the visitor takes over, and drops its drift under reduced motion. The header floats over the photography and becomes a blurred bar past 24px of scroll. The mobile menu traps focus, closes on Escape, returns focus to the button that opened it, and leaves the page behind it unreachable.

### Business facts that must be confirmed before launch

The phone number, email address and Instagram handle rendered in the footer, on `/about` and on `/contact` were migrated from the kennel's current public profile and live in `src/lib/site.ts`. They are audit items V10 and V11: confirm them, and decide whether the aol address is replaced by a domain address, before the site goes live. `src/content/dogs.ts` and `src/content/breedings.ts` carry the same caveat for every dog fact and both pairings.

# Ironbound Bullies 2.0

The independent website for Ironbound Bullies, an Exotic Bully kennel in Northern New Jersey — replacing the profile currently hosted at `kenneldatabase.vercel.app/ironboundbullies` with a premium, photography-driven brand site and a phone-friendly owner dashboard.

This README is written so that someone can return months from now and understand the project. It grows with each stage.

## Status

| Stage | What it delivers | State |
|---|---|---|
| 0 | Audit, design directions, sitemap, architecture, admin plan, domain/deploy plan (see the project documents) | Done |
| **1** | **Project foundation: tokens, fonts, core components, living style sheet, 404/error pages** | **Done — this is what you are looking at** |
| 2 | Photo inventory and focal points → cinematic homepage hero | Next |
| 3 | Dog collection + profile pages, breedings, productions, available | Planned |
| 4 | Inquiry form (spam-protected) and owner inbox | Planned |
| 5 | Database + owner dashboard (/admin), photo upload pipeline | Planned |
| 6 | SEO (sitemap, structured data, OG images), analytics, legal pages | Planned |
| 7 | QA on real devices, domain, launch | Planned |

## Architecture (plain English)

One Next.js application does everything: it renders the public pages, it will host the owner dashboard at `/admin`, and it handles the inquiry form. There is no separate API server and no second language in production. Data will live in Postgres and photographs in object storage (added in Stage 5). Python appears only as developer tooling (`tools/`), never in production.

```
src/
  app/                 routes (Next.js App Router). Each folder is a URL.
    layout.tsx         the shell every page shares: fonts, header, footer, metadata defaults
    page.tsx           "/"  — stage-1 landing page (the cinematic hero replaces it in Stage 2)
    design-system/     "/design-system" — the living style sheet (never indexed)
    not-found.tsx      404 page · error.tsx — application error page
    fonts.ts           the two type families, loaded with next/font/local
  components/
    ui/                building blocks: Button, StatusLabel, Container, Section, Wordmark, form/
    dogs/              DogCard (more dog components arrive in Stage 3)
    site/              SiteHeader, SiteFooter
  lib/
    domain/            TypeScript models: Dog, Photo (+ focal point), Breeding, Inquiry
    images/focal.ts    focal point → CSS object-position
    color/contrast.ts  WCAG contrast maths (used by the style sheet)
    navigation.ts      the primary menu · site.ts — site name, tagline, URL
  styles/
    tokens.css         EVERY color, size, spacing, radius, duration. The single source of truth.
    typography.css     the named text styles (display-hero, display-1…3, label, body, lede, numeric)
    globals.css        reset, base, focus ring, reduced-motion
    tokens.ts          the few token values JavaScript needs (breakpoints, durations)
  fonts/               self-hosted .woff2 files + licenses (built by tools/fonts/build_fonts.py)
tools/
  fonts/build_fonts.py Python dev tool: fetch, subset and convert the fonts (not used at runtime)
```

Design rules the code enforces: two type families, three button variants, status as text (no badges), no shadows on the public site, no raw CSS values where a token exists, visible focus on every interactive element, motion that respects `prefers-reduced-motion`.

## Running it on your own computer

You need **Node.js 22 or newer** (nodejs.org, LTS) and **Git**. Then, in Terminal:

```bash
cd ironboundbullies
npm install          # downloads the dependencies into node_modules/ (one time, and after pulling changes)
npm run dev          # starts the development server
```

Open `http://localhost:3000` in a browser. The page reloads automatically when you save a file. Press `Ctrl+C` in Terminal to stop the server.

Other commands:

```bash
npm run build        # production build — this is what Vercel runs; it fails on type errors
npm run start        # serve the production build locally on port 3000
npm run lint         # code-quality checks
npm run typecheck    # TypeScript only
npm run fonts        # rebuild src/fonts from the upstream sources (needs Python 3 + `pip install fonttools brotli`)
```

## Environments

| | Where | Data | Indexed by Google? |
|---|---|---|---|
| Local | your computer, `npm run dev` | sample data (Stage 5: a local/dev database) | no |
| Preview | Vercel, one URL per branch / pull request | a throwaway copy (Stage 5) | no — `noindex` is sent automatically |
| Production | Vercel, the custom domain | the real database | yes |

The `robots` metadata in `src/app/layout.tsx` only allows indexing when `VERCEL_ENV=production`. Never experiment on production.

### Environment variables

None are required yet. When they are introduced (Stage 4–5) they will be listed here and in `.env.example`; real values live only in Vercel's environment settings and in a local `.env.local` that Git ignores.

## Deployment

Push to GitHub → Vercel builds a preview for the branch → test on desktop, iPhone, Android → owner reviews the preview link → merge to `main` → production deploys. Rollback is one click in Vercel (promote a previous deployment).

Domain: `ironboundbullies.com` was verified available on 2026-09-09 (not yet purchased). Canonical host will be the apex domain; `www` redirects to it.

## Ownership

Every account (domain registrar, Vercel, GitHub, database, storage, email, analytics, Search Console) is to be created in the business owner's name with the developer added as a collaborator. See the Phase 0 document, Part 7.

## Verifying before launch

Automated: `npm run lint`, `npm run typecheck`, `npm run build`, Lighthouse (performance, accessibility, best practices, SEO). Manual: iPhone Safari, iPhone Chrome, Android Chrome, Samsung Internet, iPad, laptop, desktop, ultrawide — no horizontal scroll, all tap targets ≥ 48px, keyboard navigation through every page.

Stage 1 results (mobile simulation): home page — Performance 97, Accessibility 100, Best Practices 100; design-system page — Accessibility 100, Best Practices 100. (SEO reports 60 in non-production builds purely because of the intentional `noindex`.)

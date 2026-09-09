@AGENTS.md

# Project conventions — Ironbound Bullies 2.0

Read README.md first. Then these rules, which apply to every change:

- **Never invent business data.** Dog facts, prices, dates, pedigrees, contact details, claims about health or registration come from the owner. Unknown → omit the field or use `[TO BE PROVIDED]`. Existing facts read from the old profile are marked VERIFY until confirmed.
- **Tokens first.** No raw colors, sizes, spacings, radii, or durations in component CSS when `src/styles/tokens.css` has a token for it. Add a token if one is missing; do not scatter values.
- **Two type families, three button variants, status as text.** Do not add fonts, button styles, badges, shadows, gradients (other than the photo scrims), or icon sets.
- **Server Components by default.** Add `"use client"` only for real interactivity (the header menu, the carousel, forms with live validation). Keep client components small.
- **Photography rules.** Every image has explicit dimensions, alt text, and a focal point; `object-position` comes from `focalToObjectPosition`, never a hard-coded `center`. Only the first hero image gets `priority`.
- **Accessibility is not optional.** Visible focus, labels on every control, 48px tap targets on mobile, `prefers-reduced-motion` respected, WCAG AA contrast (the design-system page computes it).
- **Empty labels never render.** If a value is missing, the label is missing too.
- **Commits** are small and logically separated; messages explain *why*. Working functionality is not changed without saying why.
- **Explain major technical decisions in plain English** to the project owner (Pedro), but do not simplify the engineering.

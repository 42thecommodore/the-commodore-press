# Commodore Press — deploying & maintaining

The whole site is **one file**: `commodore-press.html`. No build step, no dependencies, no server code, no tracking.

## Publish it

Any static host works. The two easiest:

**GitHub Pages** — make a repo, rename the file `index.html`, push, then Settings → Pages → deploy from branch. Your site lives at `username.github.io/repo` (or bring a custom domain like `commodorepress.com` for ~$10/yr).

**Netlify / Cloudflare Pages** — drag the file (renamed `index.html`) into their drop zone. Done. Both are free at this scale and both handle a custom domain in one screen.

To update the live site, edit the file and push/re-drop it. That's the entire pipeline.

## Edit content

Everything lives as plain data near the bottom of the file, in the script block. Each wing has one clearly labelled constant:

| Wing | Constant | One entry looks like |
|---|---|---|
| I · The Press | `BOOKS` / `ADJACENT` | `{id, title, sub, field, years, cover…, claim, lede, copy[], timeline[], figures[], facts[], contested, changed, keep, across[], reading[]}` |
| II · Lives | `LIVES` | `{id, n, years, place, field, group, cover…, lede, copy[], bio{}, contested, keep, across[]}` |
| III · The Atlas | `DOMAINS`, `PRINCIPLES`, `PEOPLE` | a person: `{name, domain, role, take, p[principle ids], kept[]}` |
| IV · Manuals | `MANUALS` | volumes → `entries[]` + `heur[]` |
| V · The Slipway | `SLIPWAY` | `convs[]`, `book[]` (lessons: `{k, t, a}`), `chandlery[]`, `note` |
| Colophon | `CORRECTIONS` | append, never delete |

Counts on the front door, the search index, and the shelf layouts all compute themselves from these arrays — add an entry and everything updates.

## House rules (the site promises these publicly)

- Every figure carries a **named source**; disputes go in `contested`.
- Corrections are **appended** to `CORRECTIONS`, never silently patched.
- `keep` is the one-line takeaway shown as "If you keep one line."
- Lines credited "after" someone are compressed notes, not quotes.

## Portraits

Duotone plates are base64 data-URIs in the `PLATES` constant, keyed by the life's `id`. To add one: find a **public-domain** image (Wikimedia Commons, checking the license box), then reduce it to the house look — grayscale → sepia duotone (ink `#1E1C18` to paper `#EEE7D6`), ~260×325, JPEG quality ~60 — and paste the data-URI in. A life without a plate automatically shows the press mark, with the explanation already in the colophon. Keep the colophon credit line accurate if you ever add a non-PD (CC-BY) image.

## Features to know about

- **Search**: the `/` key or the nav button; indexes every title, life, source, position and lesson.
- **Night reading**: the ◐ toggle; follows the visitor's system preference by default, remembered per-browser.
- **Daily plate**: the front-door portrait rotates by date — nothing to maintain.
- Keyboard: `/` search · `S` shelf view · `R` random · `←/→` browse · `Esc` close.

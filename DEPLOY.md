# Deploying and maintaining the Press

`dist/index.html` is the entire website — one file, no dependencies, no server code, no tracking. Everything below is about getting that file onto the internet and keeping it current.

## Publish it once

### GitHub Pages (recommended — it checks your work)

1. Make a repository and push this folder to it.
2. Settings → Pages → Source: **GitHub Actions**.
3. Done. `.github/workflows/deploy.yml` runs on every push to `main`: it validates the house rules, builds, and deploys.

The gate matters. **If `npm run check` fails, the deploy stops and the live site is left alone** — a half-written entry or a broken cross-link can't reach readers.

### Netlify or Cloudflare Pages (fastest)

Run `npm run build`, then drag the `dist` folder into their drop zone. Both are free at this scale and both add a custom domain in one screen.

### A custom domain

Around $10/yr. Point it at your host, then add a `CNAME` file containing the bare domain to `dist/` (GitHub Pages) or set it in the host's dashboard.

## Update it, forever

The loop is always the same:

```bash
npm start          # preview while you write
npm run check      # the house rules
npm run build      # regenerate dist/index.html
git push           # (GitHub Pages) — or re-drop dist/ on Netlify
```

Commit `content/` and `dist/` together so the deployable file always matches its sources.

## Where each thing lives

| To change… | Edit |
|---|---|
| a title | `content/books/NN-slug.json` |
| the adjacent shelf | `content/adjacent/` |
| a life | `content/lives/NN-slug.json` |
| a portrait | `assets/plates/<life-id>.jpg` — via `npm run plate` |
| the Atlas | `content/atlas/{domains,domain-colors,principles,people,sources}.json` |
| a field manual | `content/manuals/NN-slug.json` |
| the trade book | `content/slipway/slipway.json` |
| corrections | **`npm run correct`** — never by hand |
| a genuinely http-only link | `content/http-allowlist.json`, with a reason and a date |
| how it looks | `theme/press.css` |
| how it behaves | `theme/press.js` |
| the page frame, meta tags, colophon | `templates/shell.html` |

Shelf order comes from the `NN-` filename prefix. Counts on the front door, the search index and the shelf layouts all compute themselves — add a file and everything updates.

## Adding things

```bash
npm run new book "The Heated Disk" -- --field Science
npm run new life "Marcus Aurelius" -- --field Philosophy
npm run new adjacent "The Listening List"
npm run new manual "On Judgement"
```

Each writes a stub with an unused livery and every field marked `TODO`. `npm run check` refuses to build until each one is answered — that is the quality gate, not an annoyance.

## Portraits

```bash
npm run plate -- ~/Downloads/portrait.jpg marcus-aurelius
```

Scales, centre-crops to 260×325, converts to the house ink-to-paper duotone, writes ~12 KB to `assets/plates/marcus-aurelius.jpg`. **The filename must match the life's `id`** or the plate never appears; a life without one shows the press mark, which the colophon already explains.

Only use public-domain images — Wikimedia Commons with the licence box actually checked, or a national archive with a clear rights statement. A CC-BY image is usable but requires updating the colophon credit line in the same change.

## Health checks

```bash
npm run stats     # inventory + editorial backlog
npm run check     # the house rules
```

`stats` is the one to run at the start of a session: it names the lives missing plates, the entries that link to nothing, and the titles that name nothing contested.

## If a build ever looks wrong

`npm run verify -- <old.html> <new.html>` deep-compares the content of two built files and reports any wing that differs. It was written to prove the original hand-made site and the first generated build were identical, and it still works for checking any two builds against each other.

# Deploying and maintaining the Press

`dist/index.html` is the entire website — one file, no dependencies, no server code, no tracking. Everything below is about getting that file onto the internet and keeping it current.

**This site is already published**, at **https://42thecommodore.github.io/the-commodore-press/**, from `github.com/42thecommodore/the-commodore-press`. If you only want to update it, skip to *Update it, forever*.

## Publish it once

### GitHub Pages (recommended — it checks your work)

1. Make a repository and push this folder to it.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.** It saves on selection; there is no Save button, which is the step people miss.
3. Done. `.github/workflows/deploy.yml` runs on every push to `main`: it validates the house rules, builds, and deploys.

Step 2 is not optional and cannot be automated. Until Pages is switched on, every run fails at `configure-pages` with *"Get Pages site failed… verify that the repository has Pages enabled."* The action has an `enablement: true` input that looks like it solves this; it does not, because creating a Pages site needs repo-admin rights and the workflow token only ever holds `pages: write`. Enable it by hand once, then re-run the failed workflow.

The gate matters. **If `npm run check` fails, the deploy stops and the live site is left alone** — a half-written entry or a broken cross-link can't reach readers.

### Netlify or Cloudflare Pages (fastest)

Run `npm run build`, then drag the `dist` folder into their drop zone. Both are free at this scale and both add a custom domain in one screen.

### A custom domain

Around $10/yr. Point it at your host, then add a `CNAME` file containing the bare domain to `dist/` (GitHub Pages) or set it in the host's dashboard.

## Update it, forever

Write, look at it, ship it:

```bash
npm start
```

Preview on :4321; it rebuilds and reloads as you save. When the entry is finished, one command does the rest:

```bash
npm run ship -- "Press: add The Heated Disk"
```

That runs the house rules, rebuilds `dist/index.html`, commits `content/` and `dist/` together so the deployable file always matches its sources, and pushes. GitHub Actions then runs the same check again before deploying — about two minutes to live. **If the check fails at either end, nothing is committed and nothing is deployed.**

It refuses to run without a message, and refuses a message under twelve characters. A commit nobody can read in six months is worth less than no commit.

If you would rather do it by hand, the long form is unchanged:

```bash
npm run check && npm run build && git add -A && git commit -m "Press: ..." && git push
```

## Where each thing lives

| To change… | Edit |
|---|---|
| a title | `content/books/NN-slug.json` |
| the adjacent shelf | `content/adjacent/` |
| a life | `content/lives/NN-slug.json` |
| a portrait | `assets/plates/<life-id>.jpg` — via `npm run plate` |
| the Atlas | `content/atlas/{domains,domain-colors,principles,people,sources}.json` |
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

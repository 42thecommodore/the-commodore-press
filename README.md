# The Commodore Press

A working library in three wings, published as one self-contained web page.

**Read it: https://42thecommodore.github.io/the-commodore-press/**

**Twenty-one titles. Thirty-two lives. Thirty-four people in the Atlas, across twelve principles.** Every claim carries its source and the place it is still argued.

---

## Start here

```bash
npm start
```

Opens a preview on **http://localhost:4321**. Edit anything in `content/` and the page rebuilds and reloads itself. No install step — there are no dependencies.

**Changing something that is already there?** **[EDITING.md](EDITING.md)** is the plain-language guide: finding the right file, what every field means, the ten everyday edits, and what to do when the check says no. Open the folder in VS Code or Cursor and hovering any field explains it.

## The five commands you actually need

| I want to… | Run |
|---|---|
| see where things stand | `npm run stats` |
| write a new title | `npm run new book "The Heated Disk"` |
| add a life | `npm run new life "Marcus Aurelius"` |
| make a portrait plate | `npm run plate -- photo.jpg marcus-aurelius` |
| publish | `npm run ship -- "Press: add The Heated Disk"` |

`ship` runs the house rules, rebuilds the page, commits and pushes. GitHub Actions checks it again and deploys — about two minutes. If the check fails, nothing is committed and the live site is left alone.

## How it fits together

Everything you write lives in **`content/`** — one file per title and per life. The build folds those, the design in `theme/`, and the portraits in `assets/plates/` into a single **`dist/index.html`**. That one file is the whole website: drop it on any host and you are live.

```
content/  +  theme/  +  assets/   →   dist/index.html
 (what)      (how it        (the         (the site)
             looks)       portraits)
```

Nothing is generated that you cannot read, and nothing is hidden in a database.

## The house rules

The site makes four promises to its readers, printed in the colophon. `npm run check` enforces them, and the deploy refuses to run if any is broken:

1. **Every figure carries a named source.** A number with no source does not ship.
2. **Disputes are printed, not hidden** — that is what `contested` is for.
3. **Corrections are appended, never silently patched.** `npm run correct` is the only way to touch them.
4. **Lines credited "after" someone are compressed notes, not quotations.**

## Working with Claude

Seven skills live in `.claude/skills/`. Ask in plain language and the right one loads:

- *"how's the Press doing?"* → **press-status** — inventory, backlog, what to pick up
- *"add a title about X"* → **press-new-title** — research, fact-check, write, shelve
- *"add a life for Y"* → **press-new-life** — including sourcing a public-domain portrait
- *"make a plate from this photo"* → **press-plate**
- *"check this entry is right"* → **press-factcheck** — verifies figures against primary sources
- *"we got something wrong"* → **press-correct**
- *"publish it"* → **press-publish**

Each one encodes the house standard, so the fiftieth entry is held to the same bar as the first. Publishing is the one thing Claude will never do on its own — `/press-publish` only runs when you ask for it.

## What is enforced, not just written down

Two of the house rules are hooks, not instructions — they hold regardless of how long a session has run or what a scraped page says:

- **`dist/` is unwritable by hand.** Edit the source and rebuild.
- **`corrections.json` can only be appended to.** The colophon promises readers exactly that.

And every edit under `content/` triggers the validator automatically, so a broken entry surfaces the moment it is written rather than at publish time.

## Running it as a house

`dashboard/` holds the operating layer: **commissions.md** is the queue (six fixed statuses, read by `npm run stats`), **rhythm.md** is the weekly loop — commission, research, draft, check, publish — and **changelog.md** records changes to the *rules* so the standard does not quietly drift.

## Why it is built this way

See **[ENGINEERING.md](ENGINEERING.md)** — the three tiers of rule (enforced by a hook, gated by the validator, merely asked), why there are no dependencies, how the style guide is measured rather than asserted, and the portrait that does not ship.

## Publishing

See **[DEPLOY.md](DEPLOY.md)**. Short version: push to GitHub and the included workflow checks, builds and deploys to Pages. Free at this scale.

## In the reader

`/` search · `S` spines · `R` random · `←/→` browse · `Esc` close · `◐` night reading

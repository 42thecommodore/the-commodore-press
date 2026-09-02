# The Commodore Press

A working library in five wings, published as one self-contained web page.

**Twenty titles. Twenty-six lives. Thirty-one people in the Atlas. Four field manuals. A trade book of operating lessons.** Every claim carries its source and the place it is still argued.

---

## Start here

```bash
npm start
```

Opens a preview on **http://localhost:4321**. Edit anything in `content/` and the page rebuilds and reloads itself. No install step — there are no dependencies.

## The five commands you actually need

| I want to… | Run |
|---|---|
| see where things stand | `npm run stats` |
| write a new title | `npm run new book "The Heated Disk"` |
| add a life | `npm run new life "Marcus Aurelius"` |
| make a portrait plate | `npm run plate -- photo.jpg marcus-aurelius` |
| publish | `npm run check && npm run build` |

## How it fits together

Everything you write lives in **`content/`** — one file per title, per life, per manual. The build folds those, the design in `theme/`, and the portraits in `assets/plates/` into a single **`dist/index.html`**. That one file is the whole website: drop it on any host and you are live.

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

Each one encodes the house standard, so the fiftieth entry is held to the same bar as the first.

## Publishing

See **[DEPLOY.md](DEPLOY.md)**. Short version: push to GitHub and the included workflow checks, builds and deploys to Pages — or drag `dist/index.html` into Netlify. Both are free at this scale.

## In the reader

`/` search · `S` shelf view · `R` random · `←/→` browse · `Esc` close · `◐` night reading

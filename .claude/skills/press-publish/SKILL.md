---
name: press-publish
description: Validate, build and publish the Commodore Press site. Use when the user wants to publish, deploy, ship, push live, or update the live Commodore Press site.
argument-hint: "[what changed]"
disable-model-invocation: true
allowed-tools: Bash(npm run check) Bash(npm run build) Bash(git status:*) Bash(git diff:*) Bash(git log:*)
---

# Publishing

The site is one self-contained file. There is no server, no database and no build to break in production — `dist/index.html` is the whole thing.

## 1. Never publish without checking

```bash
npm run check
```

Errors block. This is the gate that keeps a half-written entry or a broken cross-link off the live site. If the user asks to publish while there are errors, say what is broken and fix it first — do not publish around it.

## 2. Build

```bash
npm run build
```

Writes `dist/index.html` (plus a matching `404.html`, `robots.txt`, `.nojekyll`). Report the size — if it has jumped a lot, a plate is probably oversized; `npm run check` will name it.

## 3. Look at it before it goes out

```bash
npm start
```

Click through: the front door, one title, one life with a plate, the Atlas, search (`/`), and the night toggle. A build can pass every check and still look wrong.

## 4. Publish

**If the repo is on GitHub** — commit and push. `.github/workflows/deploy.yml` runs the check, builds, and deploys to Pages. If the check fails, the deploy stops and the live site is left alone, which is the intended behaviour.

```bash
git add -A && git commit -m "Press: <what changed>" && git push
```

**If not** — drag `dist/index.html` into Netlify or Cloudflare Pages. Rename to `index.html` if the host asks.

Confirm the live URL actually updated before telling the user it is done.

## 5. Committing

Commit content and the built `dist/` together, so the deployable file always matches its sources. Write the message as the house would: what changed, plainly. "Press: add The Heated Disk; correct Harrison's prize."

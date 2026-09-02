---
name: press-plate
description: Make a duotone portrait plate for a Commodore Press Life from a public-domain image, at the house size and finish. Use when the user wants to add, replace, or fix a portrait, plate, or image on the Press.
argument-hint: "[image path] [life-id]"
allowed-tools: Bash(npm run plate:*) Bash(npm run stats) Bash(npm run check) WebSearch WebFetch Read Glob
---

# Making a plate

Plates are the house's duotone portraits: 260×325, ink `#1E1C18` to paper `#EEE7D6`, about 12 KB each, keyed to a Life's `id`.

## 1. Which lives need one

```bash
npm run stats
```

Anything reported as `has no plate` is showing the press mark instead.

## 2. Find an image you are actually allowed to use

This is the step that matters, and the one worth being slow about.

- **Wikimedia Commons** — open the file page and read the licence box. "Public domain" or PD-old / PD-US is fine. CC-BY and CC-BY-SA are usable but **require a credit line in the colophon**, updated in the same change.
- **National archives and libraries** — Library of Congress, national portrait collections, and similar usually state rights clearly on the item page.
- Do not assume an old subject means an old image. A 2019 photograph of a 1st-century bust is a new copyrightable work.
- If you cannot establish the licence, do not use the image. The press mark is a perfectly good fallback and the colophon already explains it.

Prefer a head-and-shoulders framing — the plate is a centred crop to a 4:5 portrait, so a full-body image will lose most of the body anyway.

## 3. Make it

```bash
npm run plate -- ~/Downloads/portrait.jpg marcus-aurelius
```

The id must match the life's `id` exactly, or the plate silently never appears. Options: `--w`, `--h`, `--q` (JPEG quality, default 60).

## 4. Look at it

Actually open the result. The tool stretches contrast to the full range, which rescues flat scans but can blow out an already-high-contrast image. If it looks harsh, re-run with a gentler quality or crop the source differently first. If it comes out over 60 KB, `npm run check` will say so — re-run with `--q 45`.

## 5. Credit, then check

If the image was not public domain, update the colophon credit line in `templates/shell.html` or the relevant content file in the same change. Then:

```bash
npm run check && npm start
```

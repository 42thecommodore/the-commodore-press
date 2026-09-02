---
name: press-new-life
description: Add a Life to Wing II of the Commodore Press — research the person, write the entry to house standard, source a public-domain portrait, and make the duotone plate. Use when the user wants to add a life, a person, a biography, or a portrait to the Press.
argument-hint: "[name of the person]"
allowed-tools: Bash(npm run new:*) Bash(npm run plate:*) Bash(npm run check) WebSearch WebFetch Read Write Edit Glob Grep
---

# Adding a Life

A Life is not a summary of a Wikipedia page. It is: what the situation actually was, what the person did, and the part usually left out.

## 1. Scaffold

```bash
npm run new life "Marcus Aurelius" -- --field Philosophy
```

Writes `content/lives/NN-marcus-aurelius.json` with an unused livery and every field a `TODO`.

## 2. Research

Web search first, memory never. What you are looking for:

- **The situation.** What constraints was this person actually under? Most lives are misread because the constraints are forgotten.
- **What they did.** Specific, dated, attributable. Not "revolutionised the field."
- **The cost, or the part usually left out.** The Press does not do hagiography. Aurelius persecuted Christians. Carnegie's Homestead. Whatever it is, it goes in.
- **The best biography** — for `bio`. `why` explains why this one and not the famous one. The site turns `bio` into a WorldCat "find the book" link, so the title and author must be exact.
- **What is disputed** — for `contested`.

## 3. Write

`copy` is three paragraphs: situation, action, cost. `lede` is the hook. `keep` is the one line a reader takes away from *this* life — drawn from the entry's own argument, not a general maxim.

Add two or three `across` links; a Life that connects to a title in Wing I or a principle in the Atlas is worth far more than one standing alone.

## 4. The plate

Portraits are duotone plates keyed to the life's `id`. Without one the entry shows the press mark — acceptable, but a plate is much better.

**Licensing is not optional.** Use a genuinely public-domain image: Wikimedia Commons with the licence box checked, or a national archive / library collection with a clear PD statement. Check the box, do not assume from age. If the best available image is CC-BY rather than PD, it can be used — but the colophon credit line must be updated in the same change.

Save the source image, then:

```bash
npm run plate -- <path-to-image> marcus-aurelius
```

It scales, centre-crops to 260×325, converts to the house ink-to-paper duotone, and writes `assets/plates/marcus-aurelius.jpg` at about 12 KB. The filename must match the life's `id` exactly or the plate will never show. Look at the result before moving on.

## 5. Check

```bash
npm run check && npm start
```

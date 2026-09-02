---
name: press-status
description: Report where the Commodore Press stands — what is on the shelves, what is half-finished, what breaks the house rules, and what to pick up next. Use when the user asks how the site is doing, what needs work, what to write next, or opens a working session on the Press.
---

# Press status

Open every working session with this. It takes ten seconds and stops you guessing.

## Run

```bash
npm run stats && npm run check
```

`stats` is the inventory and the to-do list. `check` is the house rules — it exits non-zero if anything is actually broken.

## Read the output

**Errors** block publication. Fix before anything else. The common ones:
- `is still a TODO` — a scaffolded entry nobody finished. Either finish it or delete the file.
- `points at "…", which does not exist` — a cross-wing link whose target was renamed. Fix the `to`, never delete the link silently.
- `has a number with no source line` — the house rule. Find the source or cut the number.

**Warnings** never block, but they are the editorial backlog:
- `no portrait` — a Life showing the press mark instead of a plate. Fix with `press-plate`.
- `links to no other wing` — the entry is an island. The Press earns its shape from cross-links; an entry with no `across` is worth less than one with two.
- `names nothing contested` — every real claim has an argument against it. Say what it is.

## Then say what to do next

Do not just paste the output. Give the user the two or three things actually worth doing, in order, and say why. Prefer:

1. anything that breaks a promise the site makes publicly (a missing source, a broken link)
2. finishing something half-written over starting something new
3. cross-links, which cost minutes and make the whole library denser

If everything is clean, say so plainly and suggest the next title or life from what the shelves are thin on — check which `field` values are underrepresented in `content/books/` before suggesting.

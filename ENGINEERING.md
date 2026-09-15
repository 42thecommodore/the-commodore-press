# Notes on the build

What is actually engineered here, and why it is shaped this way. `README.md` says what the
site is; `EDITING.md` says how to run it. This is the argument behind both.

---

## The product is trust, so the engineering is about making promises mechanical

The site sells one thing: **every claim carries its source and the place it is still
argued.** Five promises sit in the colophon where readers can hold the house to them.

A promise printed on a page is worth whatever the author's discipline is worth on a bad
day. So the interesting question is not *did we write the rule down* — it is *which rules
deserve to be enforced by something other than good intentions*, and the answer is not all
of them.

Three tiers, deliberately:

| Tier | Mechanism | What lives here |
|---|---|---|
| Enforced | a hook that denies the edit | `dist/` is unwritable by hand; `corrections.json` is append-only |
| Gated | `npm run check`, exit 1 | a figure with no source, a broken cross-link, an unanswered `TODO`, a field name no schema knows |
| Asked | `CLAUDE.md`, the skills | house voice, what earns a shelf, when to research |

The top tier is two rules, not twenty. Both of them protect a promise a reader can check:
that corrections are appended and never quietly patched, and that the deployable file
always matches its sources. Everything softer is a gate or a convention, because
over-enforcing is its own failure — a guardrail that fires on ordinary work gets disabled.

## The deploy is the same gate, run twice

```
npm run ship  →  check → build → commit → push
                   ↓ fail: nothing committed, nothing pushed
GitHub Actions →  check → build → deploy
                   ↓ fail: the live site is left exactly as it was
```

Running `npm run check` in CI before `deploy-pages` is the whole quality system in one
line of YAML. A half-written entry cannot reach a reader even if someone pushes in a
hurry, because the deploy declines to run. Failure leaves the previous site standing,
which is the correct default for a library.

## No dependencies, on purpose

61 content files. About 2,300 lines of hand-written JavaScript and CSS. No
`node_modules`, no framework, no database, no tracking. `npm install` does nothing
because there is nothing to install.

That is a durability argument, not an aesthetic one. A site with a dependency tree is a
site that stops building on a schedule set by other people. This one will build in ten
years on whatever Node exists then, and if it does not, `dist/index.html` is still a
complete, readable website on its own.

The plate-maker is the sharp edge of that: `tools/plate.mjs` does duotone conversion with
macOS `sips` for scaling and a hand-rolled PNG decode over `zlib` for the pixels, rather
than pulling in an image library.

## The style guide is measured, not asserted

`npm run voice` reads `content/` and reports the real numbers — median sentence length per
field, punctuation rates per thousand words, first-person density, the tic counts.

Every figure in the house voice guide came out of that script. When a splitting pass moved
the Lives wing from a 26-word median to 19.5, the guide was updated from a new measurement,
not from an impression that it read better.

This is the same rule the content obeys — *counts come from the corpus, not from memory* —
turned on the writing guide itself. It means the guide can be wrong and be caught, which
is more than most style guides can say.

## Decisions carry triggers

The site is one self-contained file. The cost is that portraits are inlined as base64, so
every reader downloads all of them to reach a front door that shows none: **333 KB of 659
KB, about half the page.**

Keeping the single file is the right call today and the wrong one eventually. Rather than
trust anyone to remember that, `npm run build` prints the plate share on every build and
says plainly at 1 MB that the decision is due again. A decision with an expiry date and no
alarm is a decision nobody takes twice.

## Corrections are an asset

Four printed so far, each appended and visible. `npm run correct` is the only way to add
one, and the hook means there is no other way even for an agent in a hurry.

A house that prints what it got wrong is read differently from one that does not. The
append-only constraint is what converts an embarrassment into evidence — you cannot
retroactively become a house that was always right, which is exactly the point.

## The interesting part is what does not ship

On 15 September the house was asked to add a portrait plate for Henrietta Lacks. The
research came back: the one openly licensed image on Wikimedia Commons was uploaded from a
university Flickr post whose own caption names the book's publisher as its source, so the
licence was applied by someone who could not grant it. The Kadir Nelson portrait is
copyright reserved. Getty and Science Source license period photographs of her as
rights-managed. The Lacks Estate holds that family photographs are its property and were
published without approval.

So there is no plate, and the entry now says why. For a life about a woman whose cells
were taken without consent, a portrait nobody consented to would have repeated the wrong
the entry describes.

The capability was never the hard part. Knowing that the answer was *no*, and that the
absence should be argued on the page rather than hidden, is the part worth having.

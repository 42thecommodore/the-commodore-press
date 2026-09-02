# The commissioning queue

What is in flight, and what stage it is at. One row per piece. `npm run stats` reads this
file, so keep the table shape and use only the statuses below.

## The status set — do not invent new ones

`idea` → `commissioned` → `drafting` → `fact-check` → `ready` → `published`

A fixed set is what makes this queryable and what lets anyone see the pipeline at a glance.
`fact-check` is a real stage, not a formality: nothing moves to `ready` until every figure
in it carries a named source.

## In flight

| Status | Wing | Working title | Why it earns a place | Source lead | Next action |
|---|---|---|---|---|---|
| commissioned | Lives | Henrietta Lacks — plate | Entry is written; shows the press mark. The best-known photo is a family snapshot with unclear rights | Wikimedia Commons licence box | confirm a PD/CC image exists, else leave plateless on purpose |
| commissioned | Lives | Maurice Hilleman — plate | Entry is written; shows the press mark | Wikimedia Commons / NIH or Merck archive rights | confirm licence, make plate |
| idea | Press | — | Fields thin on the shelf: run `npm run stats` and look at what `field` values are underrepresented | — | pick one |

## Retired

Move finished rows here with the date, rather than deleting them. The record of what the
house chose to publish, and when, is worth more than a tidy table.

| Date | Wing | Title | Note |
|---|---|---|---|
| 2026-09-01 | All | Cross-links for the 16 island entries | 41 links across 24 entries; every title and life now connects to at least one other wing |

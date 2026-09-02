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
| fact-check | Lives | Henrietta Lacks — plate | Commons `File:Henrietta_Lacks.jpg` is tagged CC BY-SA 2.0 by Oregon State University (Flickr), but it is a 1940s family photograph OSU almost certainly does not own — the licence is likely invalid. Given the entry is *about* consent, the press mark may be the honest choice | commons.wikimedia.org/wiki/File:Henrietta_Lacks.jpg | Luca to decide: plateless on purpose, or find a genuinely cleared image |
| ready | Lives | Maurice Hilleman — plate | Commons `File:Hilleman-Walter-Reed.jpeg`, PD-USGov (Walter Reed Army Medical Center, 1958; NLM order B014616). Clean | commons.wikimedia.org/wiki/File:Hilleman-Walter-Reed.jpeg | download (230 KB) → `npm run plate` |
| idea | Press | — | Fields thin on the shelf: run `npm run stats` and look at what `field` values are underrepresented | — | pick one |

## Retired

Move finished rows here with the date, rather than deleting them. The record of what the
house chose to publish, and when, is worth more than a tidy table.

| Date | Wing | Title | Note |
|---|---|---|---|
| 2026-09-01 | All | Cross-links for the 16 island entries | 41 links across 24 entries; every title and life now connects to at least one other wing |

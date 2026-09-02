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
| idea | Lives | Henrietta Lacks | Already in the Atlas with no plate; the consent story is the point, and it is usually told wrong | Skloot, *The Immortal Life of Henrietta Lacks* | find a PD image, or write the entry plateless |
| idea | Lives | Maurice Hilleman | Nine of the fourteen routine childhood vaccines; almost nobody knows the name | Offit, *Vaccinated* | plate + entry |
| idea | Press | — | Fields thin on the shelf: run `npm run stats` and look at what `field` values are underrepresented | — | pick one |

## Retired

Move finished rows here with the date, rather than deleting them. The record of what the
house chose to publish, and when, is worth more than a tidy table.

| Date | Wing | Title | Note |
|---|---|---|---|
| — | — | — | — |

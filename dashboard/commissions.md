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
| idea | Press | Fifty Questions (adjacent) | Luca's own 'My Parents, In Their Words' guide — StoryCorps-sourced; would sit on the adjacent shelf as a working document | Drive: My-Parents-In-Their-Words | decide whether it belongs on a public shelf |
| idea | Lives | — | Fields thin on the shelf: run `npm run stats` and look at what `field` values are underrepresented | — | pick one |
| fact-check | Lives | Mandela — name the collaborator | `contested` says Long Walk to Freedom was "substantially shaped with a collaborator". An unnamed hand in the one field that exists to name people is the worst version of the intensifier tic | Sampson's biography; the book's own front matter | name him, or cut the clause |
| fact-check | Lives | MLK — name the historians | `contested` says Garrow's handling of the newly released FBI material "drew significant criticism from historians". Which historians, on what evidentiary point | the 2019 coverage of the Garrow essay and the replies to it | name two, with the objection |

## Retired

Move finished rows here with the date, rather than deleting them. The record of what the
house chose to publish, and when, is worth more than a tidy table.

| Date | Wing | Title | Note |
|---|---|---|---|
| 2026-09-01 | Press | The Baptism and the Chain | Built from Luca's UCLA honors paper on Kripke and LLM reference. Pagination of the Mandelkern & Linzen citation corrected to the journal's |
| 2026-09-01 | Atlas | Boccara, Yahalom, Holman | Three people from the Drive — the Pickleball Doc interview prep, the True Classic interview questions, the People doc |
| 2026-09-01 | Slipway | Andrew (The Water Map) + Venture Deals | One conversation and six lessons from Luca's own founder interview and book notes |
| 2026-09-01 | Lives | Maurice Hilleman — plate | PD-USGov, Walter Reed 1958. Made with `npm run plate` |
| 2026-09-01 | Lives | Henrietta Lacks — plateless, on purpose | The only Commons image carries a licence its uploader likely could not grant; for an entry about consent, the press mark is the honest choice. House decision, Luca, 2026-09-01 |
| 2026-09-01 | All | Cross-links for the 16 island entries | 41 links across 24 entries; every title and life now connects to at least one other wing |

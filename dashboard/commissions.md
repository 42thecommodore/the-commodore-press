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
| 2026-09-15 | Lives | Henrietta Lacks — plate re-tested, decision stands | Asked again whether any image can lawfully be used. No. The one openly licensed Commons file (CC BY-SA 2.0) was uploaded in April 2025 from an Oregon State Flickr post whose own caption names Crown Books — the publisher — as its source, so the licence was applied by someone who could not grant it; Commons' Flickr review confirms only that the tag existed, not that it was valid. The Kadir Nelson portrait at the NPG is "© 2017 Kadir Nelson, usage conditions apply". Getty and Science Source license period photographs of her as rights-managed. The Lacks Estate holds that family photographs are its property and were published without approval. `contested` now carries this, so the absent plate reads as the entry's argument rather than a gap |
| 2026-09-15 | All | Shareable at last | No `og:image` existed, so every link pasted into Slack, iMessage or LinkedIn rendered as a bare grey rectangle. `npm run card` now renders assets/og.png at 1200×630 in the house livery with counts read from `content/`; the build copies it to dist/ and emits a sitemap. Added og:url, twitter:card, canonical and JSON-LD |
| 2026-09-15 | Lives | Mandela — the collaborator named | `contested` said the book was "substantially shaped with a collaborator". It was Richard Stengel, credited in the acknowledgements with editing the early chapters and writing the later ones; Mandela began the manuscript on Robben Island in 1974, the kept copy was confiscated, a smuggled one survived. Not a correction — nothing published was wrong, the research was unfinished |
| 2026-09-15 | Lives | MLK — the historians named | `contested` said Garrow "drew significant criticism from historians". Now Simon Balto on the unattributed margin note over a typed summary of a tape Garrow never heard, sealed until 2027, and Barbara Ransby in the New York Times on whose voice readers are asked to believe. Glenda Gilmore and Nathan Connolly also objected, but only via a secondary account of the Washington Post piece — left out until the original is opened |
| 2026-09-15 | All | One file, until 1 MB | The page is 655 KB and the 25 plates are 51% of it, inlined as base64; the front door shows none of them and pays for all of them. Kept as one self-contained file — that is what makes the archive durable and the deploy trivial, and 655 KB is not yet a reader's problem. `npm run build` now prints the plate share every time and says so plainly at 1 MB, where the decision gets taken again: keep the text inline, move the plates out as real files with `loading="lazy"`. House decision, Luca, 2026-09-15 |
| 2026-09-01 | All | Cross-links for the 16 island entries | 41 links across 24 entries; every title and life now connects to at least one other wing |

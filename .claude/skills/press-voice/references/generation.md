# Generating in the house voice

`voice.md` says what to keep and cut. `registers.md` says which surface you are on. **This
file is for producing new prose that reads as the house's** — its sentence rhythm, its
paragraph architecture, its punctuation — without importing the residue of a first draft.

**The principle in one line: copy the structure, not the slips.**

---

## What gets edited out — measured

Rate per 1,000 words in the author corpus: dictated freewrites against the prose he
actually submitted. These are not style preferences. They are his own edits, quantified.

| | freewrites | papers | emails |
|---|---|---|---|
| "as well" | **11.25** | 0.30 | 2.10 |
| "(be/was) able to" | **11.35** | 0.20 | **0.00** |
| "I think" | **3.92** | 0.10 | 0.00 |

"I was able to" appears 48 times in the freewrites and zero times in any email he sent.
Generating prose with these in it is not writing in the voice; it is writing in the rough
draft. Target the right-hand columns — and note that `content/` currently sits at zero on
all three, which is the standard to hold.

## What gets added when he edits

| | freewrites | papers | syllabus | emails |
|---|---|---|---|---|
| parentheticals | 0.80 | 12.26 | 29.09 | 3.15 |
| colons mid-sentence | 0.80 | 3.52 | 27.51 | 0.00 |
| em dashes | 0.10 | 1.21 | 0.45 | 4.20 |

**The parenthetical is his signature punctuation and an editing-stage addition** — a
fifteenfold jump from dictation to paper. He uses it to qualify a claim without weakening
the sentence it sits in.

---

## The house punctuation profile — measured off `content/`

Per 1,000 words.

| surface | em dash | colon | parenthesis | semicolon |
|---|---|---|---|---|
| titles `copy` | 13.8 | 7.4 | **1.5** | 2.5 |
| lives `copy` | 7.7 | 6.3 | 1.9 | 2.5 |
| titles `contested` | 18.2 | 4.1 | 5.8 | 9.9 |
| lives `contested` | 8.9 | 4.7 | 3.8 | 8.1 |
| `changed` | 11.6 | 9.8 | 0.9 | 3.6 |
| `keep` | 19.9 | 5.7 | 0.0 | 11.4 |
| atlas `take` | **24.8** | 1.7 | 0.0 | 3.3 |
| atlas `kept` | 20.6 | 6.9 | 0.0 | 10.3 |

Two things fall out of this, and both are actionable.

**The house leans on the em dash harder than any register in the author corpus — around
fourteen per thousand words in the titles and eight in the lives, against 1.21 in his papers
and 4.20 in his emails. The Atlas runs 24.8, the highest on the site**, and that one is
structural rather than careless: `take` averages nine-word sentences, so a qualification
has nowhere to go but a dash. That is not automatically wrong; a dash carrying an apposition or a turn is
doing structural work, and the corpus uses it that way more often than not. But it is the
one punctuation mark with no natural ceiling, and `voice.md` bans it for drama. When a
paragraph has three, two of them are decoration.

**The parenthetical is still scarce — 1.5 per 1k in the titles' entry prose and 1.9 in the
lives, and zero across the whole Atlas, against 12.26 in his papers.** The qualification that would have gone in brackets is currently going into an
em-dash aside instead. This is the cheapest available improvement to the house prose:
where the instinct is to hedge the main clause or throw a third dash at it, use a
parenthesis. `contested` already does this at 3.8–5.8 per 1k, which is why it is the most
carefully argued field on the site.

**The colon is the pivot, and `changed` is where it lives now**, at 9.8 per 1k. Setup
left, payoff right. Wing IV ran it at 11.4 and Wing IV is gone; if the rate across the
house drifts down, that is the reason and not a fault.

---

## Sentence targets by field

Measured off `content/`. Aim here; do not count obsessively.

| surface | median | mean | ≤ 10 words | first person / 1k |
|---|---|---|---|---|
| titles `copy` | 18 | 20.5 | 26% | 0.5 |
| lives `copy` | 17 | 19.1 | 22% | 1.1 |
| `contested` | 19 | 20.5–21.0 | 19–27% | 0.0 |
| `changed` | 16 | 19.6 | 21% | **34.0** |
| `lede` | 13 | 16.5 | 31% | 6.9 |
| `claim` | **8** | 8.8 | 74% | 0.0 |
| `keep` | 9–12 | 11.0–11.5 | 44–53% | 0.0 |
| atlas `take` | **9** | 8.8 | 74% | 0.0 |
| atlas `kept` | 10 | 10.3 | 61% | 13.7 |
| atlas `gloss` | 8.5 | 8.0 | 92% | 0.0 |

Re-measured 2026-09-19, when the lives had grown from 26 entries to 32 and the Atlas was
brought into `npm run voice` for the first time. **The lives came in at a 17-word median,
below the titles' 18** — the splitting pass logged in `passes.md` has held, and the wing
that used to be the clottiest prose in the house is now the shortest-sentenced of the two
entry wings.

**One sentence in four in a title's `copy` is ten words or shorter.** The long sentences
work because short declaratives carry the load between them. A paragraph with no short
sentence in it is not house prose, however correct it is.

**The first-person dial has three settings and they are thirty-fold apart.** `copy` is
effectively impersonal at 0.5 to 1.1. The Atlas's `kept` sits in the middle at 13.7 —
lines kept in someone else's own voice. `changed` is at 34, near the density of his own
correspondence. Writing `changed` at
`copy` density produces a paragraph that is technically fine and does not do the field's
job.

**The lives have no dial at all.** Wing II carries no `changed` field, so the people wing
— the one a reader is most likely to arrive at — runs at 1.1 first-person markers per
thousand words with no surface anywhere on it where the house says what it got wrong about
a person. That is a structural gap, not a style one, and it is logged in
`dashboard/commissions.md`.

---

## Paragraph architectures that are actually in use

Build from these rather than from a generic topic-sentence template.

**The title entry** (`01-compounding-machines`) — four paragraphs, four jobs:
> the phenomenon, with its numbers and names → the ingredients, stated unglamorously →
> **the mechanism people underrate** → the uncomfortable half, which turns on the entry's
> own argument

**The life** (`16-john-snow`, `20-norman-borlaug`) — three paragraphs:
> what the person actually did, mechanically → what it cost or what it displaced → what
> the popular version gets wrong

**The `contested` block** — one paragraph, four moves:
> name the standing objection → give it its strongest evidence → concede what is genuinely
> unknown → say what would settle it, or say that nothing currently would

**The `changed` note** — three sentences, no more:
> what I used to think → what I now think → why the difference matters to the argument

**The Atlas `take`** — two sentences, the second turning after a dash:
> what they teach, stated flat → the turn that makes it worth keeping

**The applied recommendation**, if an entry ever proposes something:
> credit the thing generously, with its own numbers → name the gap in one flat sentence →
> **propose one named instrument, not a theme** → run a worked example → verdict

That third move is worth its own note. The author's strongest applied writing does not
recommend a direction; it names an object — a scorecard, published annually, rating each
supplier group low/medium/high, with a worked case attached. Named deliverables beat
paragraphs of aspiration. If a recommendation cannot be named, it is not finished.

---

## Sentence-level moves to reach for

**Number instead of adjective.** "ten Nobel Prizes", "36% replicated", "a twenty-year
programme", "a town of 8,000". Never "significant", "substantial", "a great deal of".

**Name the thing rather than the category.** Bardeen, Brattain and Shockley — not "the
researchers". Bell Labs, PARC, DARPA — not "several institutions".

**Colon as pivot.** Setup left, payoff right. Highest yield in `changed`.

**Parenthesis as qualifier.** Where the instinct is to hedge the main clause, bracket the
qualification instead and leave the claim intact. The house is under-using this; see the
punctuation profile above.

**Concessive turn on "still", "and yet", "that doesn't make".** "That doesn't make the
philosophy wrong — it makes it the thing that let a free system stay useful for fifty
years." Concede the ground, then say precisely what remains.

**Verdict sentence to close.** Land the paragraph; do not trail off. Put the best phrase
last. "The physics was merely impossible; the governance was harder."

**The admitted reversal, once.** In `changed`, at the close. Never twice, never in `copy`.

---

## Clean, not sanitised

**Fix silently, every time**
- spelling, subject–verb agreement, tense drift, dropped words
- proper nouns — check every name, place, institution and title against the source
- scaffolding: `TODO`, `(source)`, `???`, `(analysis)`, `[NEED: …]`, joke placeholders
- inconsistent capitalisation and acronym forms across an entry
- the tics in the table above

**Never "fix"**
- a plain short sentence, by expanding it into a sophisticated one
- an aphoristic `keep`, by making it grammatically fuller
- the admitted reversal in `changed`, however unpolished it looks
- stated uncertainty, by resolving it — "genuinely unknown" is a finding
- a concession in `contested`, by weakening it so the entry wins

**The failure mode to watch for:** editing house prose until it reads as generically
competent. Competent is not the target. An entry with one blunt sentence and one awkward
admission in it is worth more than one where every sentence is smooth, because only one of
those survives a reader who checks the sources.

---

## Check the draft before handing it over

1. Does a short sentence appear at least every fourth sentence in `copy`?
2. Is there a sentence that says what actually caused what? Quote it. If you cannot, the
   research is not finished.
3. Is every abstraction carried by a named specific — a proper noun, a number, a person?
4. Does any paragraph end on its weakest clause? Move the good phrase to the end.
5. Does any paragraph carry three em dashes? Two of them are decoration; one may want to
   be a parenthesis.
6. Zero instances of "as well", "was able to", "I think" outside `changed`?
7. Is `changed` at first-person density, and does it reach its third beat?
8. Would the `keep` fit any other entry on the shelf? Then rewrite it from the mechanism.
9. Could any sentence be moved into a different entry unchanged? Cut it.
10. Then run the proofread gate in `voice.md`, then `npm run check`. Every time.

---

## Re-measuring

Every house number in these files came from:

```bash
npm run voice
```

It reads `content/` and prints the per-field profile. Run it if the shelves grow
substantially and update the tables from its output. **Do not update these numbers by
estimating them** — that is the same failure as an unsourced figure in an entry, and the
house rule is the same.

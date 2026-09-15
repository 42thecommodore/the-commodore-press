# Voice fingerprint

Two corpora sit behind this file. The **house corpus** is everything under `content/` —
21 titles, 26 lives, 4 manuals, roughly 17,000 words of published prose. The **author
corpus** is the voice study this skill was adapted from: ~9,900 words of dictated
freewrites against five sent emails, four philosophy papers, a syllabus, a public post,
and two applied-analysis papers.

Counts below are literal. House counts were measured off `content/`; author counts come
from the study and are carried over because they are measurements, not opinions.

**Read `registers.md` alongside this file** — the house has six writing surfaces and the
rules below land differently in each. **Read `generation.md`** when you are producing new
prose rather than editing existing prose.

---

## Keep — this is the actual voice

**Named specifics.** Real proper nouns, real numbers, and the thing rather than its
category. This is the single best habit in the house and the most easily eroded.

> Bardeen, Brattain and Shockley · 1947 · ten Nobel Prizes · 97 studies with significant
> original effects, 36% replicated · a twenty-year programme · a factory down the hall

Never generalise these upward. "Several researchers" is a worse sentence than three
names, always, and it is also less checkable — which is the whole product.

**The mechanism sentence.** Every good entry has one sentence that says what actually
caused what, and it is usually the third or fourth sentence of the first paragraph. It is
the entry. Find it in a draft; if it is not there, the draft is a list of facts.

> "The mechanism people underrate is proximity to manufacturing."

**The list that *is* the argument.** When the enumeration carries the claim, keep every
item. Do not compress it into a summarising phrase.

> "the transistor in 1947, Shannon's information theory in 1948, the first practical
> silicon solar cell, the communications satellite, Unix and C, the charge-coupled
> device, and — by accident, while trying to eliminate noise from a horn antenna — the
> cosmic microwave background"

The temptation is to write "an extraordinary run of inventions." That sentence is
shorter and worth less.

**The quiet correction.** The house's best entries fix a factoid the popular version gets
wrong, without announcing that they are doing it. "Moore's Law was never a law." "Peer
review was invented as an administrative convenience by an overworked secretary." Look
for this opportunity in every piece; it is stated as a house rule in `CLAUDE.md` and it is
the difference between a summary and an entry.

**The admitted reversal.** `changed` is the most personal field on the site and it works
because it concedes something real:

> "I used to think the lesson was 'hire brilliant people and leave them alone.' I now
> think that's the part everyone copies and it doesn't work by itself."
> "I used to read the curves as a law of nature."
> "I assumed the hard part was the physics."

This is the author's signature move wearing house clothes — see **The signature move**
below. Protect every instance. Never smooth one into a summary of the entry.

**The objection at full strength.** `contested` names who disagrees and why, and it does
not soften them. A `contested` that reads "some scholars disagree" is a failure of the
field, not a fulfilment of it.

**Uncertainty stated as a position.** "Whether these places were engines of progress or
unusually well-documented lottery tickets is the argument that actually matters." That is
not a hedge. It is a claim about which question is live, and it is stronger than picking
a side you cannot defend.

**Odd small details.** Shannon on a unicycle in the corridor. The horn antenna's hiss.
Jobs walking out of PARC with the interface. These are what a reader remembers a week
later, and they cost one clause each.

---

## Cut — filler, hedging, and dictation residue

The house corpus is currently almost clean of these. The point of the table is to keep it
that way — the author corpus shows what accumulates when prose is dictated and not edited
back down.

| Tic | in `content/` | in the author's freewrites | Fix |
|---|---|---|---|
| "as well" | **0** | 113 · 11.25 per 1k | Delete. Almost never load-bearing. |
| "(be/was) able to" | **0** | 73 · 11.35 per 1k | Use the verb. "was able to teach" → "taught". |
| "I think" | **0** | 39 · 3.92 per 1k | Delete unless it marks real uncertainty. Never in `copy`. |
| "and also" | 0 | 32 | Pick one. |
| "one of the things" | 0 | 22 | Name the thing. |
| "super" | 0 | 18 | Cut. |
| "the ability to X" | 0 | frequent | "X-ing", or just X. |

**"was able to" is the highest-leverage fix in the author corpus.** It puts a pane of
glass between the subject and their own action. Nobody managed to build the thing; they
built it.

**Intensifiers standing where a number belongs.** The corpus holds seven instances of
*very / significant / substantial / remarkable*, and all seven are load-bearing — "significant
original effects" and "replicated significantly" are statistical terms, "substantially
revised by historians" and "very different rates" are doing real comparative work, "the
very stubbornness that had isolated him" is a demonstrative rather than an intensifier,
and "That's still remarkable, and still enough to plan a datacenter around" is the
concessive turn that `registers.md` holds up as the model for `changed` — the adjective
is immediately cashed out in the clause after it.

Two soft ones have been closed, and how they closed is the lesson. Both sat in
`contested`, which is the field that exists to name people, so an adjective standing in
for a name was the worst available version of the tic:

> "substantially shaped with a collaborator" — *mandela* · now Richard Stengel, credited
> in the book's own acknowledgements with editing the early chapters and writing the later
> ones
> "drew significant criticism from historians" — *mlk* · now Simon Balto on the
> unattributed margin note, and Barbara Ransby in the *New York Times* on whose voice the
> reader is actually being asked to believe

**Neither was a style problem. Both were unfinished research**, and neither could be fixed
by editing the sentence — only by going and finding the name. Do not paper one over by
softening the prose. Find the name, or leave the flag standing.

A third instance, "grew substantially faster over the following century" in *movable-type*,
closed the other way, by deletion: Dittmar's 35-percentage-point estimate was already in
the next sentence, so the adjective was doing nothing the number was not doing better.
Those are the only two endings — a name, or a cut.

**Citation stacking.** Not a risk in `copy`, which takes no inline citations, but the
same reflex shows up as `facts` entries whose `s` names a summary rather than the thing
itself. Cite the primary paper, the archive, the official statistic — see `CLAUDE.md`.

---

## Before / after

Built from real house sentences. Method, not templates.

> **Loose:** "A number of important research organisations were responsible for a
> significant share of twentieth-century invention."
> **House:** "A few research organisations produced the century. The structure was the
> invention."

> **Loose:** "The replication crisis showed that many psychology results do not hold up."
> **House:** "The Reproducibility Project attempted 100 psychology studies; of the 97
> with significant original effects, 36% replicated significantly. Not fraud."

> **Loose:** "There is significant debate among historians about this."
> **House:** name the historian, name the objection, name what would settle it.

> **Loose:** "I have come to appreciate the importance of organisational factors."
> **House:** "The physics was merely impossible; the governance was harder."

---

## Banned

- "in an era of", "in today's world", any throat-clearing opener
- rhetorical questions used as structure
- "not just X, but Y" as a rhetorical spine
- **adjective-first praise with nothing under it** — "compelling examination",
  "meticulous research", "profound questions". This is the flattest register in the
  author corpus and it surfaces whenever the writer has no real stake in the subject. If
  a paragraph starts reading like a back cover, the research is thin — go back to it.
- calling the site or its subjects "fascinating", "remarkable", "extraordinary" in place
  of the fact that would make a reader think so
- em dashes used for drama rather than structure — see `generation.md`, where the house's
  own em-dash rate is measured and is high
- any sentence that would survive unchanged in a different entry about a different subject

The test: if the sentence could be moved into another entry without editing, it is not
carrying anything.

---

## Things to watch

**The lives used to run long, and will again.** `lives` copy sat at a 26-word median with
9% of sentences at ten words or fewer — the clottiest prose in the house — until a
splitting pass brought it to 19.5 and 21%, alongside the titles' 18 and 26%. Biography
invites subordinate clauses stacked three deep, so this is the wing that drifts back
first. Check it before anything else, and split them again.

**Ending on the weakest clause.** The best phrase in a paragraph is often buried in the
middle, with the paragraph trailing off into a qualifier. Move the good part to the end.
The corpus does this well and it is the first thing lost in a hurried draft:

> "The physics was merely impossible; the governance was harder."
> "Effort inside a badly chosen game is the most expensive thing there is, because it
> looks exactly like progress."

**Listing without ranking.** Eight items at equal weight is a research note, not an
entry. In four paragraphs, two get named and the rest go.

**Hedging a real claim into nothing.** "This may have been somewhat significant" is an
argument wearing a disguise. Make the claim, then put the objection in `contested` where
it belongs. The `contested` field exists precisely so `copy` does not have to hedge.

---

## The signature move

Across every surface, the same thing recurs: **an awkward truth admitted about the
author's own prior position, usually right before the close, which disarms the reader
completely.**

> "I used to think the lesson was 'hire brilliant people and leave them alone.'"
> "I assumed the hard part was the physics."
> "I used to think the philosophy caused the success. The licensing accident probably
> did more."

It is the whole reason `changed` is a field rather than a nicety. It is also what makes
the corrections page an asset instead of an embarrassment: a house that prints what it
got wrong is read differently from one that does not.

**One instance per entry, placed at the close.** Two turns it into a mannerism. Never
edit one out for sounding unpolished — that is the polish.

---

## The proofread gate

**This is a release blocker, not a style note.** The author's documented failure mode is
shipping scaffolding: a submitted paper spelling one acronym four ways, another citing a
monograph titled "banna banna banna" and leaving two bare `(source)` markers in the text,
a third shipping `(analysis)` — a note-to-self about what a paragraph was meant to do —
inside a finished sentence.

This project scaffolds every new entry with `TODO`, which is the same hazard with a
better name. `npm run check` catches those. It does not catch the rest.

Before any entry, correction or queue note is called done:

```bash
grep -rn "TODO\|(source)\|???\|(analysis)\|TK\b\|\[NEED" content/
npm run check
```

Then, by eye:

1. Read once for sense, once for spelling, once for proper nouns specifically.
2. Check every name, place, institution and title against the source you actually opened.
3. Confirm each `facts[].s` names where you looked, not where the number is repeated.
4. Confirm nothing in quotation marks is a paraphrase. Anything compressed is "after
   <name>" — the colophon has already had to print one correction for a Kipling line
   credited to Rockefeller.
5. Say what you fixed, so the pattern is visible and not just the clean copy.

An entry that spells a historian's name two ways will not survive a reader looking for a
reason to distrust the shelf.

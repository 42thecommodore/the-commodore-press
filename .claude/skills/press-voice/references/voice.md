# Voice fingerprint

Two corpora sit behind this file. The **house corpus** is everything under `content/` —
21 titles, 32 lives, 4 manuals, 34 Atlas people, roughly 30,700 words of published prose.
The **author corpus** is the voice study this skill was adapted from, which grew from
~9,900 words to roughly 30,000 in September 2026: dictated freewrites, nine sent email
threads, ten academic papers across two institutions, a syllabus he wrote and taught, two
course proposals, a public post, coaching journals from age seventeen, and two
application essays.

**The September expansion changed two things here** and nothing else. It added the
fifteen distinctiveness moves — the additive pass below, which is the half of the work
the first version of this file did not have — and it added **Register 0**, which corrects
the diagnosis of what a flat draft has drifted toward. Both are documented below.

Counts below are literal. House counts were measured off `content/` by
`npm run voice`; author counts come from the study and are carried over because they are
measurements, not opinions.

**Read `registers.md` alongside this file** — the house has seven writing surfaces and the
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

## The additive pass — what makes a page the house's

The keep and cut lists above are subtractive. They stop a draft being anyone's; they
cannot make it this house's. A draft can pass every rule on this page and still read as
competent and belong to nobody, which is the failure the colophon cannot absorb — a
library whose entries could have come from anywhere is a library with no reason to be
trusted over anywhere.

The author study behind this skill isolated fifteen recurring moves across six registers
and two years of his writing. Ten of them survive the translation into a house voice
written under a house name; the other five are first-person correspondence moves with
nowhere to land here. **Any entry carries at least four of the ten, including at least
one of the first three.**

### The three that are rare, and carry the entry

**1. Lead with the disqualification, then convert it.** Open on what the subject lacked,
failed at, or was refused, and let the achievement land against it. **This is already the
Lives' dominant opening — ten of the thirty-two ledes do it outright**, and several more
do it in the first paragraph of `copy`, against four of twenty-one in the titles.

> "He failed at every goal he ever set — the Pole, the crossing — and brought every man
> home." *(shackleton)*
> "Denied a formal Latin education, he turned his outsider's status into a method."
> *(leonardo)*
> "He held no great office, wrote no system of philosophy, and died believing he had
> failed." *(confucius)*
> "He never won an election and never ran a city." *(robert-moses)*

The conversion is the whole move. A disqualification with nothing built on it is a
downbeat opening; the point is that the lack turns out to be the mechanism. Leonardo's
exclusion from Latin *is* why he trusted observation. Do not write one without the other.

**2. The list that is the argument.** Already in the keep list above, and it is the move
most often lost to a summarising phrase. Seven things named beats "an extraordinary run".

**3. The quiet correction.** Already in the keep list. The house rule in `CLAUDE.md` asks
for it in every piece, and it is what separates an entry from a summary.

### The seven that are reliable

**4. A number where an adjective wants to go.** The lives run **35.3 numbers per 1,000
words against the titles' 23.4** — the people wing is the most quantified prose on the
site, which is the opposite of what biography usually does. Protect that.

**5. Close on a bare number.** Five of the fifty-three entries end their last paragraph
on one, and they are among the strongest closes in the corpus. It is a deliberate refusal
to editorialise: the figure is the comment.

> "The average American's blood lead fell 78 per cent between 1976–80 and 1988–91."
> *(clair-patterson)*

Five in fifty-three is room to grow. It is not room to make it a mannerism.

**6. Build the example yourself, and say that you did.** Where the corpus has no worked
case, construct one and flag it as constructed. Never let a built example pass as a found
one.

**7. Admit the work is unfinished.** "The counterfactual is genuinely unknown." Unknown is
a finding and the house already writes it as one — see `contested` in `registers.md`.

**8. Downgrade the house's own position first.** This is `changed`, and it is the move the
whole site is organised around. See **The signature move** below.

**9. The odd small detail.** Already in the keep list. One clause each, and they are what
a reader still has a week later.

**10. Personal stake, flat, once, then dropped.** One clause, never a paragraph. In the
titles it lives in `lede` — the one apparatus field carrying first person at all, at 6.9
per 1,000 words. The failure is letting it become a paragraph about the author.

### The five that do not translate

Locating himself physically before speaking; handing the reader an exit ("no worries if
you are swamped"); the three-word closer; his aphorisms verbatim; and being self-aware
about cliché. These are correspondence moves and they belong in a letter signed with a
name. **They are still live for anything sent outward from the house** — see *Off-site
surfaces* in `registers.md`.

---

## The calibration test — committee, or person

Faster than any word list, and the single most useful thing the study produced.

The author's own course proposal holds both of his registers 131 words apart: the course
description at **53.4 institutional phrases per thousand words**, and the section headed
"Why I want to do this course" at **zero**. Same writer, same afternoon, same subject. The
only variable is who he thought was reading.

**Read any paragraph and ask which half it belongs to.**

The committee half reaches for *more than just a game, case study, intersects with,
broader societal forces, interdisciplinary*. The person half says *"I have seen people
bring their babies to the court."*

`npm run voice` now prints this as a rate per surface. **Every surface of this house
currently measures 0.0**, against 23.0 in the scholarship essay he actually submitted to a
foundation. That is the number to defend, and the one to check first when a wing feels
flat.

---

## Register 0 — the drift is not toward a machine

**This is the most important correction the study makes to how drift gets diagnosed
here.** When a draft goes generic, the instinct is to say it sounds AI-written and reach
for the cut list. That diagnosis is wrong, and it sends the fix in the wrong direction.

Both of the author's application essays — written by hand, years before any of this — are
full of exactly what the **Banned** list above exists to keep out: *all walks of life, the
vibrant tapestry, the relentless pursuit of knowledge, fostering open-mindedness, a
pivotal role, valuable insights, countless opportunities.* Twenty-three generic phrases
per thousand words in one of them, against 0.8 to 2.9 in everything he edits.

Note *all walks of life*. The keep list above says never compress a list of occupations
into that phrase. **He wrote the phrase himself, in the essay where he was trying
hardest.**

So: a flat entry has not drifted toward a machine style. It has drifted toward the
application reflex, which is the same thing wearing his name, and it appears exactly where
the writing is trying hardest to be taken seriously. On this site that means the entries
about the biggest subjects and the ones aimed at a reader imagined as a sceptic.

**The fix is not a thesaurus. It is a reader.** Write the paragraph to one person who
already knows the subject and will notice if you round a number. That is what the whole
apparatus — `facts`, `contested`, the corrections page — is built to make impossible to
fake.

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

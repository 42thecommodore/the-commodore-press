# Six surfaces

The Press is not written in one voice at one length. It has six writing surfaces, and
they differ measurably — from `copy`, which is almost impersonal at 0.5 first-person
markers per thousand words, to `changed` at 34. Pick the surface deliberately before
writing a line.

Every number below was measured off `content/`. The method is in `generation.md`.

---

## 1. Entry prose — `copy` in a title or a life

Evidence: `content/books/01-compounding-machines.json`, `content/books/10-being-wrong.json`,
`content/lives/16-john-snow.json`.

| | titles | lives |
|---|---|---|
| paragraphs per entry | 4 | 3 |
| median words per paragraph | 75 | 56 |
| median sentence | **18 words** | **19.5 words** |
| sentences ≤ 10 words | 26% | 21% |
| first person per 1k | 0.5 | 0.7 |

This is most of the site, and it is written as argument rather than as summary.

**Four paragraphs, four jobs.** The titles that work run: the phenomenon with its
numbers → the ingredients or the mechanism → **the mechanism people underrate** → the
uncomfortable half. That third paragraph is the entry. If a draft has no sentence that
says what actually caused what, it is a list of facts wearing an entry's clothes.

**Numbers inside the sentence, not appended to it.** "Ten Nobel Prizes have gone to work
done there." Not "the lab was highly decorated (10 Nobel Prizes)."

**Names, not roles.** Bardeen, Brattain and Shockley. Mervin Kelly. Penzias and Wilson.
The house reaches past the abstraction for the person every time, and it is the same
instinct that makes `figures` a required field.

**The complication is stated, not hedged.** The fourth paragraph regularly turns on the
entry's own argument — the funding model was a monopoly rent and antitrust removed it;
Xerox invented the personal computer and shipped almost none of it. `copy` says the
awkward part out loud; `contested` then names who argues about it.

**Watch: the lives drift long.** They were the clottiest prose on the site — a 26-word
median, one sentence in ten at ten words or fewer — and a splitting pass moved them to
19.5 and 21%, next to the titles' 18 and 26% on harder material. Biography invites
subordinate clauses stacked three deep, so the drift is structural and it will come back.
Split them.

---

## 2. The apparatus — `claim`, `lede`, `facts`, `figures`, `timeline`

Compressed to the edge of terseness. These are read in a glance, often before the entry.

| | median sentence | ≤ 10 words | longest |
|---|---|---|---|
| `claim` | **8 words** | 74% | 20 |
| `lede` | 15 words | 32% | 33 |
| `figures[].d` | 16 words | — | — |

**`claim` is two short sentences, and the second one turns.**

> "A few research organisations produced the century. The structure was the invention."
> "Moore's Law was never a law. It was a schedule everyone agreed to believe."
> "Peer review was invented as an administrative convenience by an overworked secretary."

Setup then reversal, or a flat correction delivered in one clause. Nothing decorative
survives at eight words. If you cannot write the `claim`, the research is not finished —
that is stated as a rule in `press-new-title` and it is true.

**`lede` is a hook, not a summary.** It may restate nothing the `claim` says. It runs
roughly twice the `claim`'s length and it is the one apparatus field where a first-person
marker occasionally appears.

**`figures[].d` is one line on what the person actually did**, and the good ones carry a
detail that is not a credential:

> "Bell Labs president who designed the building so people from different disciplines
> were forced to walk past each other."
> "Invented information theory, then rode a unicycle down the corridors of the
> institution that let him."

**`facts` is a number and the place you looked.** `b` is the figure, `s` is the named
source. It is a field in both entry wings — the lives got it on 2026-09-19, and they are
the wing that needs it more: `lives.copy` runs 35.3 numbers per 1,000 words against the
titles' 23.4. Nothing else belongs in either. See `content/CLAUDE.md`.

**`timeline` is turning points, not chronology.** Six or so dated entries, each one a
thing that changed the story. "Steve Jobs visits PARC. Xerox gets stock; the industry
gets the interface." A year with nothing that turned does not earn a row.

---

## 3. `contested` — the objection at full strength

Median sentence 19–20 words. Zero first-person markers. The highest density of qualifying
punctuation on the site: parentheses at 4–5 per 1k against 1.5–1.8 in `copy`, semicolons
at 8–10 against 2.1–2.6.

That punctuation profile is the field doing its job. This is where a claim gets
conditions attached, and the conditions are what make the rest of the entry trustworthy.

**Name the objector.** "Survivorship bias is the standing objection." Who holds it, on
what evidence, and — where it exists — what would settle it.

**State it at its strongest.** A `contested` written to be easily answered is worse than
no `contested`, because it advertises that the objection was considered and then
defanged. The validator flags an entry that "names nothing contested"; it cannot flag an
entry that names something weak. That is on you.

**Concede where the concession is real.** "the counterfactual — how much of this would
have arrived anyway, slightly later, somewhere else — is genuinely unknown." Unknown is a
finding. Write it as one.

**Never "some disagree."** If no name can be attached, the research is not done.

---

## 4. `changed` — the admitted reversal

Median sentence 16 words. **34 first-person markers per 1,000 words — seventy times the
density of `copy`.** This is deliberate and it is the most personal prose on the site.

**Three beats, in this order:**

> what I used to think, stated plainly → what I now think → **why the difference matters**

> "I used to think the philosophy caused the success. The licensing accident probably did
> more. That doesn't make the philosophy wrong — it makes it the thing that let a free
> system stay useful for fifty years rather than the thing that spread it in the first
> place."

**The third beat is the one that gets dropped, and it is the one that earns the field.**
A `changed` that stops after "I now think X" is a fact about the author. A `changed` that
says what the revision costs the argument is a fact about the world.

**Concede without collapsing.** "That's still remarkable, and still enough to plan a
datacenter around — it just isn't the same kind of statement as thermodynamics." He gives
the old view its due and then names precisely what it is not.

**Never write it as summary.** The failure mode is a `changed` that restates the `claim`
in the first person. If the sentence would be true without the words "used to", it is not
a reversal.

---

## 5. `keep` — the line a reader leaves with

Median 16 words per line; the shortest is 11, the longest 36. Sentence median 9 words,
and roughly half of all sentences in the field are ten words or fewer. The heaviest
punctuation on the site: em dashes at ~19 per 1k, semicolons at 11 in the titles.

That profile describes the shape exactly — **a compressed claim, then a turn after a
dash or a semicolon.**

> "Moore's Law was a schedule everyone agreed to believe. Coordination is a technology."
> "A smooth curve in a proxy is still a bet dressed as a result. Plan around it; don't
> worship it."
> "Merit over bloodline was a weapon before it was a value."
> "Spend twenty years looking for what would refute you. Then publish."

**It must come from this entry's argument.** A `keep` that would fit any entry is a
proverb, and proverbs are banned — it is a house rule in `CLAUDE.md`, and it is the
single most common way the field goes wrong.

**Test it alone.** Read the line with the entry covered. If it still says something
specific and slightly surprising, it works. If it reads like advice, rewrite it from the
mechanism.

**An imperative is allowed; a platitude is not.** "Give the standard away." "Then
publish." These earn the mood because the entry has just shown the cost of not doing it.

---

## 6. The Atlas — Wing III

Evidence: `content/atlas/people.json`, `content/atlas/principles.json`.

| field | n | median sentence | ≤ 10 words | first person / 1k |
|---|---|---|---|---|
| `take` | 34 | **9 words** | 74% | 0.0 |
| `kept` | 104 | 10 words | 61% | 13.7 |
| `gloss` | 12 | 8.5 words | 92% | 0.0 |
| `role` | 34 | 4 words | 97% | 0.0 |

**`take` is a `claim` wearing a different hat.** Nine words at the median against the
`claim`'s eight, and 74% at ten words or fewer in both — the two fields landed on the
same shape independently, which is the strongest evidence in the corpus that the shape is
the house's and not the wing's. Write a `take` the way `press-new-title` says to write a
`claim`: two short sentences, the second one turning.

> "Attention is the discipline of the tracker. The information is there — you have to
> teach yourself to see it."

Setup, then the turn after the dash. The Atlas runs **24.8 em dashes per 1,000 words,
the highest rate on the site**, and this is why: at nine words a sentence there is no
room for a subordinate clause, so the qualification hangs off a dash instead.

**`take` is your reading of them, not their summary of themselves.** The field is what
they teach as the house understands it. A `take` that could be lifted from a jacket blurb
has failed the same test a `keep` fails.

**`kept` is the field with the sharpest promise attached to it.** It runs at 13.7
first-person markers per 1,000 words, second only to `changed`, because
the lines are kept in the speaker's own voice. The schema states the rule and it is the
colophon's: *quotation marks only for words you have seen verbatim in the source.* No
line in the Atlas currently uses them, and none should acquire them without the recording
or the page open in front of you.

**The marker convention, now that the Atlas is the only wing that keeps lines.** Wing V
marked a compressed line `after Jason Nazar` before it was removed; the Atlas prints its
kept lines under a name with an em-dash bullet and no marker at all. Neither claims a
quotation, so neither broke the promise — but the Atlas is now carrying the convention
alone, and `after <name>` is the form the colophon describes. Where a `kept` line is your
compressed note rather than something you heard, write it that way.

**`gloss` is one clause, lower case, no full stop.** "the resistance is the signal, not
the obstacle." It explains the principle's name; it does not restate it. Twelve of these
exist and they are the most compressed writing on the site after `claim`.

**`role` is the semicolon field.** "Lion tracker; author, The Lion Tracker's Guide to
Life." Four words at the median, and the semicolon separates who they are from what they
made. It carries 132 semicolons per 1,000 words for that reason alone — do not read that
number as a style to imitate anywhere else.

---

## Off-site surfaces

**Corrections.** `npm run correct -- "Title." "Body."` Title states what was wrong in a
clause. Body says what it said, what is true, and where the error came from. No apology
paragraph — the appending *is* the apology, and the colophon has already promised it.
Never hand-edit `content/corrections.json`.

**The queue.** `dashboard/commissions.md` uses six fixed statuses and `npm run stats`
flags anything outside the set. Notes there are for the next person to open the file: what
is blocked and on what. One line. No status invented on the fly.

**Anything sent outward** — an email, an ask, a note to a source — takes the author's
correspondence register, and it is where the five moves that do not fit an entry belong
(see **The additive pass** in `voice.md`): promise brevity and keep it, lead with the work already done
rather than the request, ask one real question, and close on something given back. It is
his strongest register and it is documented in the study this skill was adapted from.

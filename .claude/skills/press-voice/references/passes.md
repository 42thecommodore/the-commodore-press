# The shelf pass

Editing prose that is already published, a whole wing at a time.

The skill's default is the editor's loop in `SKILL.md`: a draft arrives, you quote what
works, quote the filler, hand back the tightened version. A pass is the other mode. The
shelves are already up, `npm run voice` says one wing has drifted, and the work is
twenty-six files in one sitting. It is the most dangerous mode in this skill, because
every file it touches is something a reader may already have read.

---

## The correction boundary

The colophon promises that corrections are appended, never silently patched. A pass runs
straight at that promise, so the line is drawn here rather than left to judgement in the
middle of the twentieth file.

**Rhythm is not a correction.** Splitting a 34-word sentence at its semicolon. Moving an
aside out of a third em dash and into a parenthesis. Moving the best clause to the end of
the paragraph. Deleting an adjective that the number in the next sentence already earned.
None of that changes what the entry asserts. Edit freely.

**Anything that changes what a sentence asserts is a correction**, and it goes through
`npm run correct` before the prose is touched: a figure, a date, a name, an attribution,
who is said to have argued what, or a claim quietly narrowed or widened. "Roughly ninety
per cent" becoming "eighty-eight per cent" is a correction even when the new number is
better sourced. Especially then.

The test: **could a reader who saved the old page tell the house had changed its mind?**
If yes, print it. If the only difference is where the sentence breathes, it is a pass.

A pass that finds a wrong figure stops being a pass. Finish the correction first, on its
own, and then go back to the rhythm work — mixed together, neither is reviewable.

---

## Running one

1. **Measure first.** `npm run voice`. The pass is aimed at a number, not at a feeling
   about the prose. Write down what the number is before you start.
2. **Take the worst wing only.** One surface, one sitting. A pass across `copy` and
   `contested` and `keep` at once produces a diff nobody can read, and the register
   differences in `registers.md` are exactly what gets flattened.
3. **Make only the four edits** below.
4. **Re-measure.** `npm run voice` again. If the median did not move, the pass was
   cosmetic and the diff should be thrown away rather than committed.
5. **`npm run check`**, then the proofread gate in `voice.md`, then `npm run build`.
6. **Log it**, one row in the Retired table of `dashboard/commissions.md`, with the two
   numbers. The next person to open the file needs to know the wing was swept and when.

## The four edits a pass is allowed to make

- **Split.** A sentence carrying two independent clauses becomes two sentences. This is
  the whole of the lives pass and it moved the median from 26 words to 19.5.
- **Re-punctuate.** Third em dash in a paragraph becomes a parenthesis. `generation.md`
  measures the house at 13.9 dashes per 1,000 words against 1.5 parentheses; the
  qualification is already there, it is just wearing the wrong mark.
- **Re-end.** The strongest phrase moves to the end of the paragraph; the trailing
  qualifier moves into the middle or goes.
- **Delete an unearned adjective** — only where the number or name that replaces it is
  already in the sentence next door. If it is not, the adjective is unfinished research:
  flag it and leave it standing. `voice.md` has the two that are still open.

## What a pass may not do

- Rewrite a `changed` note. It is the most personal prose on the site and the whole point
  of it is that it sounds like one person admitting something.
- Smooth a `contested` into balance. It is supposed to be one-sided; that is the field.
- Touch a `keep` line for rhythm. A `keep` is written from its own entry's argument and it
  has to survive being read alone — that is a rewrite, not a pass.
- Regularise the wings toward each other. The lives are shorter-paragraphed than the
  titles and the manuals are shorter than both, and those are house facts, not drift.

---

## Why this file exists

Drift is structural, not careless. Biography pulls toward subordinate clauses stacked
three deep, which is why the lives were the clottiest prose in the house and why they will
be again. The pass is the maintenance interval for that, and the numbers in
`generation.md` are what tells you it is due — not a re-read, which always reads fine.

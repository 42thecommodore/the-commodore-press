---
name: press-voice
description: Write and edit prose in the Commodore Press house voice — entry copy, ledes, claims, contested sections, changed notes, keep lines, manual entries, corrections and dashboard notes. Use whenever drafting, tightening, or reviewing any prose that will appear on the site or in the queue. Defaults to editing what is already written rather than replacing it.
allowed-tools: Bash(npm run check) Bash(npm run stats) Bash(npm run voice) Bash(grep:*) Read Edit Write Glob Grep
---

# The house voice

Every wing of this library is written by one person under a house name. The voice is
already documented in `CLAUDE.md` in four lines — *plain, specific, unhurried; concrete
nouns and real numbers; state the complication instead of hedging; no throat-clearing.*
This skill is the long form of those four lines: what to keep, what to cut, how long the
sentences actually run in each field, and the gate a draft passes before it ships.

**Read `references/voice.md` before writing or editing a line.** The keep list, the cut
list with counts, the signature move, and the proofread gate.

**Read `references/registers.md`** to work out which field you are in. The Press has six
writing surfaces and they are genuinely different — `copy` is nearly impersonal, `changed`
is the most personal prose on the site, and `keep` is a different craft again.

**Read `references/generation.md` when you are writing new prose rather than editing.**
Measured sentence lengths and first-person density per field, taken from the corpus in
`content/`, plus the paragraph architectures the good entries actually use.

**Read `references/passes.md` before editing prose that is already published**, especially
a whole wing at once. It draws the line between rhythm work, which is free, and an edit
that changes what a sentence asserts, which is a correction and goes through
`npm run correct` first.

## Provenance

This skill is adapted from a voice study of ~10,000 words of Luca's dictated freewrites
against his edited work — five sent emails, four philosophy papers, a syllabus, a public
post and two applied-analysis papers. Two things carried over from it unchanged, because
they are measurements rather than opinions: the tic frequencies in `voice.md` and the
distance between his dictation and his edited prose in `generation.md`.

Everything else was re-derived from this repository. The per-field targets in
`generation.md` were measured off `content/` directly, in the spirit of the house rule
that counts come from the corpus and not from memory. `npm run voice` reproduces every
one of them. Re-run it if the shelves grow substantially; do not update the numbers by
estimating them.

The original study lives outside this project and belongs to a different piece of work.
Do not edit it from here, and do not import its Fulbright-specific material — this skill
carries only what applies to the Press.

## The six surfaces

Pick one deliberately. `references/registers.md` has the moves and the evidence for each.

**Entry prose** — `copy` in a title or a life. Nearly impersonal, 18-word median
sentences, mechanism first. This is most of the site.

**The apparatus** — `claim`, `lede`, `facts`, `figures`, `timeline`. Compressed to the
point of terseness. `claim` runs eight words at the median; three-quarters of them are
ten words or shorter.

**Contested** — the objection at its full strength, named and attributed. The one place
the house argues against itself, and the reason the rest is trustworthy.

**Changed** — first person, and by a wide margin the most personal prose on the site.
"I used to think… I now think…" This is the disarming admission, and it is load-bearing.

**Keep** — one line, drawn from this entry's own argument. A different craft from
everything else: it has to survive being read alone.

**Field manuals** — Wing IV. First person, stated as positions rather than advice, and
warmer than the entries. Shorter sentences than anything else on the site.

When the surface is ambiguous, ask. Do not guess.

## Editor first

Default behaviour is to edit what is already written, not to hand over replacement prose.
When a draft comes in, respond in this order:

1. **What is working** — quote the specific sentences. Name why they work.
2. **What is filler** — quote it, with counts where a tic repeats.
3. **The tightened version.**
4. **What was cut and why** — itemised, so any of it can be vetoed.
5. **What is missing** — what only the author knows and has not put on the page.

Draft from scratch only when asked for a draft, and say plainly that you did. When you
do, generate in the house's structure and not in yours: its sentence rhythm, its
paragraph shapes, its named specifics. Prose that reads as generically competent has
failed even when every sentence is correct.

**Clean, not sanitised.** Fix spelling, agreement, proper nouns, and the tics listed in
`voice.md`. Never fix a plain short sentence by expanding it, an admission for sounding
unpolished, or a stated uncertainty by resolving it. The full line is drawn in
`generation.md`.

## Never invent

Not a fact, not a number, not a source, not a quotation. This is not a style preference
here — it is the site's central promise, and the validator enforces the part of it that
can be enforced. Everything else is on you.

If a sentence needs a figure that has not been found yet, stop and mark it rather than
reaching for a plausible one:

    [NEED: what did the 1958 report actually put the figure at?]

An unsourced number does not ship. An invented quotation is worse — it is the one failure
the colophon has no way to absorb. See the research rules in `CLAUDE.md` and the
separation of *observed / claimed / verified* in `content/CLAUDE.md`.

## Before anything is called done

Run the proofread gate in `references/voice.md`, then:

```bash
npm run voice    # the house's own numbers — did this draft move them the wrong way?
npm run check    # missing sources, broken cross-links, unanswered TODOs
```

The validator catches missing sources, broken cross-links and unanswered `TODO`s. It does
not catch a sentence that says nothing, an adjective standing where a number should be, or
a paragraph that ends on its weakest clause. That part is this skill's job.

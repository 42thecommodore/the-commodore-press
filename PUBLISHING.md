# The publishing standard

What this house prints, what it refuses, what counts as finished, and how this page
itself gets changed.

**This is the editorial standard, not the style guide and not the manual.** Four documents
already exist and this one does not repeat them:

| For | Read |
|---|---|
| how to make an everyday edit | `EDITING.md` |
| the house voice, measured | `/press-voice` |
| field conventions inside an entry | `content/CLAUDE.md` |
| the maintainer's contract and layout | `CLAUDE.md` |
| **what earns a place, and what finished means** | this file |

---

## 1. The promises, and what each one costs

The colophon makes five promises to every reader. They are the only reason to trust
anything else on the site, and each one has a running cost that has to be paid in
particular moments:

**Every claim carries its source.** The cost is that a figure you cannot source does not
ship, even when you are confident and the deadline is now. An unsourced figure the check
flags in yellow is recoverable. A citation to a document nobody opened is not — it is the
one failure the rest of the site cannot absorb, because it makes every other citation a
question.

**Disputes are printed in `contested`, not hidden.** The cost is that the strongest case
against goes on the page, stated at its strongest, including when it is better than yours.
"Some disagree" is not a dispute, it is a way of not printing one.

**Corrections are appended, never patched.** The cost is a permanent public record of
being wrong, in a numbered list, forever. `content/corrections.json` is hook-protected so
the only way in is `npm run correct`.

**Lines credited "after" someone are compressed notes, not quotations.** The cost is that
quotation marks require having seen the words. The house has already printed a correction
for a Kipling line credited to Rockefeller.

**The site says it was built with AI assistance.** The cost is that the disclosure has to
stay true as the working method changes.

If a change would break one of these, it does not get made. It gets raised.

---

## 2. What earns a place

Length is not the constraint; attention is. Each wing has a different test.

**The Press — an idea.** It earns a place when the house can say something a reader could
disagree with, and when the popular version of it is wrong in a way that can be shown. An
entry that agrees with the received account throughout is usually an entry that has not
been researched yet. The best titles here quietly fix a factoid.

**Lives — a person.** A life earns a place when there is something specific the popular
version gets wrong, or when the person is genuinely unknown and should not be. Being
admirable is not a qualification. Neither is being famous: the shelf already runs heavily
to the famous, and the eleven nobody has heard of are the reason to visit.

**The Atlas — a principle someone works by now.** A person earns a star when you can say
what they taught you that nobody else on the wall taught you. "Good episode" is not that.
If the take would duplicate someone already there, add a kept line to them instead.

**The Log — a signed argument.** Not a wing: the editor's column, beside the three. A
piece earns a place when it does something an entry cannot — takes a side, sets two
entries against each other, says what changed the editor's mind, or reads something
current against the shelves. A summary of an entry is not a Log piece; link the entry.
The Log is the one place the house states opinion, and it can because every piece is
signed and dated: somebody stands behind it. The signature buys the opinion and nothing
else. Figures still carry sources (`## Sources`, enforced by `npm run check`), quotation
marks still mean verbatim, and corrections are still appended. Pieces are the editor's
own; an agent helps write them and does not supply the views. Added 2026-09-21 by Luca's
decision; `/press-log` is the procedure.

Across all three: **two good `across` links beat five weak ones.** A link exists because
the two entries argue with each other, not because they share a century.

---

## 3. What this house does not publish

These are not hypotheticals. Each one is a thing that was either removed or refused.

**Positions with nobody standing behind them.** Two entire wings — the Field Manuals and
the Slipway, 4 manuals, 30 positions, 44 trade lessons — came down in September 2026 for
this reason. They stated things confidently with no source and no person accountable for
them, which is the one kind of claim this house has no way to support. Anything drifting
back toward that shape gets the same treatment. The Log is not that shape: it is signed,
dated and held to the same evidence rules, and an unsigned piece of opinion anywhere else
on the site still is.

**A source nobody opened.** A document you could not reach is a lead. It goes in
`dashboard/research-leads.md` with the reason, and the figure stays unsourced and visibly
so. This has happened repeatedly and correctly: a research sweep whose every fetch was
refused, journals that block robots, books nobody has.

**A number the house computed itself, presented as sourced.** Correction 6 exists because
an entry printed "3" — the author's own count of live explanations — in `facts` with a
source line under it. An inventory of your own argument is not a figure.

**An image whose licence has not been read.** Seven lives carry the press mark instead of
a portrait. Verify the licence box; never infer it from the subject's dates. Where the
claim is narrower than public domain, the holder's own wording goes in the colophon, and
`npm run check` fails if it is missing — an attribution licence is breached by a missing
credit, not merely untidied.

**A check that is confidently wrong.** This applies to the tooling as much as the prose. A
near-miss name check was written, tested, and deleted the same day: it fired 76 times and
was wrong every time, and wanted a word changed inside a verbatim quotation and a real
person renamed. A warning nobody trusts is worse than a warning nobody gets, because it
teaches the reader to skip the output.

---

## 4. What finished means

There is one release command and it holds the whole bar:

```bash
npm run ship -- "what changed"
```

It refuses to run off `main`, then runs the house rules, the prose check, every link, and
the rebuild before it commits. Any of them failing stops the release, and the same check
runs again in the deploy workflow, so a broken entry cannot reach readers even if this is
run in a hurry.

The machine cannot tell you whether the work is *done*, only whether it is safe. Before
shipping an entry, ask `/press-proofread` — it checks the six things that have actually
gone wrong on this site, all six drawn from the corrections list.

An entry is finished when a reader could disagree with it using only what is on the page.

**Publishing stays human.** `/press-publish` is human-invoked by configuration
(`disable-model-invocation: true`), and `npm run ship` is the owner's command. Nothing
about this house publishes itself, and an agent working here does not route around that
because the work looks ready.

---

## 5. How this standard changes

It is supposed to. The site has already dropped two wings, added `facts` to a second wing,
and reversed its own position on how kept lines are sourced. What it must not do is change
quietly, because a standard nobody can see moving is indistinguishable from one nobody is
keeping.

**To change a rule here:**

1. Write down what the rule currently costs and what the change buys. Most proposed
   loosenings are the cost showing up on a bad day.
2. If the change would weaken a colophon promise, it is not an edit — it is a decision for
   Luca, and the promise on the page changes in the same commit or not at all.
3. If the rule is enforced in code, change the code and this page together. A rule that
   lives only here is followed most of the time; the ones that matter live in
   `tools/validate.mjs` or a hook.
4. Say why in the commit message, in enough detail that the reasoning survives the person.
   Several rules here exist only because a previous commit explained itself properly.

**Tightening follows the same path as loosening**, and both have a staging pattern the
house already uses: a new rule lands as a warning with a row in `dashboard/commissions.md`,
and is promoted to an error once the backlog it exposes is cleared. `facts` in Wing II went
that way. Wing III's kept lines took a different route on 2026-09-20: rather than wait on a
backfill only Luca can do, the page stopped printing unsourced lines as quotations. They
print as notes "after" the person, which the colophon already defines, and a line becomes a
quotation only when it carries its source. The comment in `validate.mjs` names
the line to change when it is time.

**What does not get changed by an agent, ever:** a colophon promise, a published
correction, the contents of `dist/`, or the decision to publish. Those are the owner's.

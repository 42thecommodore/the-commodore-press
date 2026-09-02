---
name: press-new-title
description: Commission and write a new title for Wing I of the Commodore Press — research it, fact-check every figure, write the entry to house standard, and shelve it. Use when the user wants to add a book, a title, an idea, or an entry to the Press.
---

# Commissioning a title

A title in Wing I is an argument with its receipts attached. The standard is not "interesting" — it is *sourced, contested, and useful*.

## 1. Scaffold

```bash
npm run new book "The Heated Disk" -- --field Science
```

This writes `content/books/NN-the-heated-disk.json`, already carrying a livery (cover colours and motif) that no other title uses. Every field is a `TODO`, and `npm run check` will refuse to build until each is answered. That is deliberate — do not delete a TODO you have not answered.

## 2. Research before writing a word

Use web search. Do not write from memory: the house rule is that every figure carries a named source, and you cannot name a source you did not look at.

Find, in this order:
- **The mechanism.** What actually caused what. This is the entry.
- **The numbers.** Each one needs a source you have actually seen. Prefer the primary paper, the archive, the official statistic — not a summary of it.
- **The argument against.** Every real claim has one. If you cannot find a serious objection, you have not read enough.
- **The correction.** Popular versions of good stories are usually wrong somewhere. Find the wrong part. The Press's best entries are the ones that quietly fix a factoid.

## 3. Fill the fields

| Field | What it has to be |
|---|---|
| `claim` | The argument in one sentence. If you cannot write it, you are not ready. |
| `lede` | The opening line. A hook, not a summary. |
| `copy` | Three or four paragraphs: the mechanism, the evidence, the complication. Never a list of facts. |
| `timeline` | Dated turning points, not a chronology of everything. Six or so. |
| `figures` | The people, one line each on what they actually did. |
| `facts` | `b` is the number, `s` is the named source. **A number with no source does not ship.** |
| `contested` | Where it is still argued, and by whom. Name the objection honestly, at its strongest. |
| `changed` | What changed your mind, or what evidence would. |
| `reading` | At least one real, working link. `why` says why this one and not the famous one. |
| `keep` | **The one line a reader keeps.** Written from this entry's own argument, not a proverb. One sentence. |
| `across` | Two or three links to other wings. See below. |

## 4. Cross-link it

`across` is what makes the library a library instead of a pile. Each entry is `{to, label, txt}` where `to` is `press:<book-id>`, `lives:<life-id>`, `manuals:<i|ii|iii|iv>` or `atlas:<principle-id>`.

Read a few existing entries' `across` blocks first — the `txt` is a fragment continuing the label, starting with an em dash. Two good links beat five weak ones. Add the reciprocal link on the other entry too.

## 5. Check and preview

```bash
npm run check
npm start          # http://localhost:4321, reloads as you save
```

Fix every error. Warnings are judgement calls — but "names nothing contested" almost always means you skipped step 2.

## The house voice

Plain, specific, unhurried. Concrete nouns and real numbers. No throat-clearing, no "in today's fast-paced world", no rhetorical questions. State the complication rather than hedging around it. Lines credited "after" someone are compressed notes, not quotations — never put words in quotation marks unless they are verbatim and you have the source.

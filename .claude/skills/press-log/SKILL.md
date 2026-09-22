---
name: press-log
description: Draft, edit or finish a piece for the Log, the Commodore Press editor's signed column — an argument with the library and the people in it, in Markdown in content/log/. Use when the user wants to write a Log piece, a column, a blog post, an essay, a newsletter issue, or "something of my own" for the Press.
allowed-tools: Bash(npm run check) Bash(npm run new:*) Bash(npm run proofread:*) Bash(npm run voice) Read Edit Write Glob Grep
---

# Writing for the Log

The Log is Luca's column, under his name, beside the three wings. It exists because two
earlier wings came down for stating positions with nobody standing behind them. The Log
is the fix for that, not a return to it: every piece is signed and dated, so opinion is
allowed here in a way it is not in an entry. What the signature does not buy is a pass on
evidence.

**The pieces are Luca's.** This skill helps him write them; it does not write opinions
for him. If he has not said what he thinks, ask. A Log piece that states a view he does
not hold is a position with nobody standing behind it — the exact thing that was removed.

---

## The file

```bash
npm run new log "The question goes with the number"
```

That writes `content/log/YYYY-MM-DD-slug.md` as a draft. The top block is the front matter
(`schemas/log.schema.json` explains each name); everything below it is plain Markdown.
It stays off the site until `status: published`.

- `title` — a claim, not a topic. "The question goes with the number", not "On measurement".
- `dek` — one line saying what the piece argues. It is also the share card and the email
  preview, so it has to work alone.
- `across` — what the piece argues with: `press:<id>`, `lives:<id>`, `atlas:<principle>`.
  This is what makes it this house's column rather than any blog. A piece that touches
  nothing on the shelves should say why it belongs here at all.
- Inside the prose, `[Forty-Two](press:forty-two)` links to that entry's page.

## What earns a place

A Log piece earns its place when it does something an entry cannot: takes a side, joins
two entries that argue with each other, reports what changed Luca's mind, or reads a
current event against something on the shelves. A summary of an entry is not a Log piece;
link the entry.

## The rules that do not relax

- **Figures carry sources.** Any hard number needs a line in `## Sources` naming where it
  was actually read. `npm run check` fails a published piece that states one without that
  section. Research before writing; never write a figure from memory.
- **Quotation marks mean verbatim**, with the source in view. Otherwise "after <name>".
  A quotation goes on its own `>` line with its source in `## Sources`.
- **A source nobody opened is a lead**, not a source. It goes in `dashboard/research-leads.md`.
- **Corrections are appended** with `npm run correct`, the same as everywhere else, and the
  piece is fixed in the same change. Never quietly edit a published piece's claim.

## Voice

Load `/press-voice` first. The Log is closest to its **Changed** surface — first person,
the admitted reversal, specific about what moved — with the **claim**'s discipline in the
title and dek. Paragraph length and sentence rhythm follow the entry prose. It is signed,
so "I think" is honest here; it is still not a substitute for the reason.

## Finished

1. Every TODO answered, `status: published`.
2. `npm run check` and `npm run proofread` pass.
3. `/press-proofread` on the file — quotations and sources are what a machine cannot see.
4. Publishing stays Luca's: `npm run ship`, or `/press-publish`, invoked by him.

Once published it is on `/log/`, in the sitemap, and in `feed.xml` in full, which is what a
newsletter service reads to send it as an issue.

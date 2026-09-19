# Working inside content/

This file loads only when you touch a file in this folder, so it holds the entry-level
conventions that would otherwise bloat the root contract.

## The shape of a file

One JSON file per entry. The `NN-` prefix fixes shelf order; the build sorts by filename.
The `id` is the permalink — renaming one breaks every `across` link pointing at it and any
URL a reader saved. Rename only deliberately, and fix the referrers in the same change.

## Fields that carry a promise

| Field | The promise |
|---|---|
| `facts[].s` | The named source for the number in `facts[].b`. **A number with no source does not ship.** Titles and lives alike. |
| `contested` | Where this is still argued, and by whom, stated at its strongest. Not "some disagree". |
| `reading[].u` | A real, working link. http is allowed only with a reason in `http-allowlist.json`. |
| `keep` | The one line a reader takes away, drawn from *this* entry's argument. Not a proverb. |
| `bio` | Exact title and author — the site turns it into a WorldCat lookup, so a typo breaks it. |

## Three things to keep separate

Never let these blur into one another — it is how a library ends up defending a statistic
nobody can source:

- **what was observed** — goes in `copy`
- **what someone claimed** — attributed, in `figures` or `copy`, with the claimant named
- **what is verified** — goes in `facts`, with `s` naming where you actually looked

## Quotation marks mean verbatim

If it is in quotation marks, it is word-for-word and you have seen the source. Everything
else is written as "after <name>" — the colophon tells readers those are compressed notes,
not quotes. The house has already had to print a correction for a Kipling line credited to
Rockefeller; do not add a second.

## across

`press:<id>` · `lives:<id>` · `atlas:<principle-id>`.
`txt` is a fragment continuing `label`, opening with an em dash. Add the reciprocal link on
the other entry. Two good links beat five weak ones.

## The prose itself

`/press-voice` carries the house voice in long form: what each field's sentences actually
run to, the six surfaces and how they differ, and the proofread gate. Load it before
writing or tightening any of these fields, not after.

## Before you say you are done

`npm run check` — it is fast, and it is the whole quality gate.

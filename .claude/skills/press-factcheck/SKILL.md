---
name: press-factcheck
description: Fact-check an existing Commodore Press entry against real sources — verify every figure, test the contested section, check that links still resolve, and issue a correction if something is wrong. Use when the user asks to check, verify, audit, or fact-check a title, life, or claim on the Press.
argument-hint: "[title, life or claim to check]"
allowed-tools: Bash(npm run check) Bash(npm run correct:*) WebSearch WebFetch Read Edit Glob Grep
---

# Fact-checking an entry

The Press's whole claim is that its figures carry sources. That is only true if someone checks. This is that job.

## 1. Read the entry

```bash
cat content/books/<file>.json      # or content/lives/<file>.json
```

List every checkable assertion: every number in `facts`, every date in `timeline`, every attributed action in `figures`, every claim in `copy` that a reader could look up.

## 2. Check each one against a real source

Use web search, one claim at a time. Rules:

- **Go to the primary source** where one exists — the paper, the statute, the archive, the agency's own figures. A secondary source that agrees with the entry is not confirmation; it may be where the error came from.
- **A number without a denominator is not a fact.** "80% of X" means nothing until you know 80% of what. This is the single most common error in this genre.
- **Check attributed quotations hardest.** Misattribution is the standard failure mode — the house has already had to correct a Kipling line credited to Rockefeller. If you cannot find the verbatim source, the quotation comes out.
- **Dates drift.** Check the year in the timeline against the source, not against another summary.

## 3. Check the links still work

```bash
node -e 'const j=require("./content/books/<file>.json");(j.reading||[]).forEach(r=>console.log(r.u))' \
  | xargs -I{} sh -c 'printf "%-70s " "{}"; curl -sS -o /dev/null -w "%{http_code}\n" --max-time 12 -L "{}"'
```

A 404 or a redirect to a parked domain means the link must be replaced, not deleted. If a link is genuinely http-only, record it with a reason in `content/http-allowlist.json` rather than leaving the validator warning to be ignored forever.

## 4. Strengthen `contested`

Search specifically for the strongest objection to the entry's argument, by name. If `contested` is vague ("some historians disagree"), replace it with the actual disagreement and who holds it.

## 5. If something is wrong

Fix the entry **and** issue a correction. The site promises corrections are appended, never silently patched:

```bash
npm run correct -- "Harrison's prize." "I had written that Harrison was paid the prize in 1773. He received £8,750 from Parliament that year; the statutory £20,000 was never awarded to anyone."
```

Say what the earlier draft claimed, then what the evidence shows. Never edit or remove an existing correction.

## 6. Report

Tell the user, per claim: **confirmed** (with the source), **corrected** (with what changed), or **could not verify** (say so — do not quietly leave it standing). Then:

```bash
npm run check
```

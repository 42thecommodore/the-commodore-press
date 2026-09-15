---
name: press-correct
description: Issue a correction on the Commodore Press — append it to the public corrections list and fix the underlying entry. Use when something on the site is found to be wrong, or the user wants to correct, retract, or amend a published claim.
argument-hint: "[what was wrong]"
allowed-tools: Bash(npm run correct:*) Bash(npm run check) Bash(npm run build) Read Edit Glob Grep
---

# Issuing a correction

The colophon promises: **corrections are appended, never silently patched.** That promise is the reason to trust anything else on the site, so it is not negotiable.

**Load `/press-voice` before writing one.** `references/registers.md` carries the correction register: the title states what was wrong in a clause, the body says what it said, what is true, and where the error came from. No apology paragraph — the appending is the apology.

## 1. Fix the entry itself

Edit the file in `content/` so the site now says the true thing. Do not delete the passage and move on — the correction has to describe what changed, so know exactly what the earlier draft claimed.

## 2. Append the correction

```bash
npm run correct -- "Short title." "What the earlier draft said, then what the evidence actually shows."
```

The tool stamps the date and appends. It cannot rewrite or remove an existing correction, which is the point.

Write it the way the existing ones are written — look at `content/corrections.json` first. The pattern is:

> *What I had written.* → *What the evidence shows.* → *What still stands.*

Good corrections are specific and unembarrassed. From the house's own:

> "I had repeated the standard story that John Snow removed the pump handle and stopped the 1854 outbreak. Whitehead's own figures show fatal attacks had already fallen from 142 on 1 September to 14 by the 8th, the day the handle came off, and Snow never claimed otherwise."

Note what it does: names the wrong version, gives the actual figures with their source, and says plainly that the original claim was never made by the person it was attributed to. It does not apologise and it does not hedge.

## 3. Say what survives

If the entry's argument still holds after the correction, say so in the correction itself — "The point about his temperament stands; the quotation is gone." A correction that leaves the reader unsure what to believe has done half a job.

## 4. Rebuild

```bash
npm run check && npm run build
```

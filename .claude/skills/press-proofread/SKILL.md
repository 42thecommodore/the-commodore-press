---
name: press-proofread
description: The release gate for the Commodore Press — the last read before anything ships. Runs the mechanical checks, then reads for what a machine cannot see: a figure carried from memory, a quotation that is not verbatim, the popular version repeated, a source nobody opened. Use when an entry is called done, before `npm run ship` or `/press-publish`, or when asked whether something is ready. Checking only; it does not rewrite for style.
---

# The release gate

**This is not a voice pass.** For prose use `/press-voice`, which edits. This skill only
asks whether the page is safe to print. If something is a style problem, name it and
leave it.

Run it on what is about to ship: a new title, a new life, an edited entry, or the whole
house before a publish.

---

## Run the machine first

```bash
npm run check       # shape: fields, sources on figures, well-formed links, contrast
npm run proofread   # prose: placeholder text, repeated words, punctuation slips
npm run links       # every link the site prints still opens
```

`npm run check` must exit clean. The other two report; you read what they say. None of
them can do the work below.

---

## Then read for the six things that have actually gone wrong here

The house keeps its failures in public, in `content/corrections.json`. Eight so far, and
they fall into six kinds. **Every example below is real and is on the site.** Check for
these in the order given — the early ones are the ones that cost trust.

### 1. A quotation that was never said, or not said by them

The first correction the house ever printed: a line about keeping your head while others
lose theirs was attributed to **John D. Rockefeller**. It is Kipling.

- Anything inside quotation marks is verbatim and you have seen the source. Not
  paraphrased, not tightened, not modernised.
- A famous line attributed to a famous person is the highest-risk sentence on any page.
  Famous quotations migrate to more famous mouths. Check the attribution, not just the
  words.
- If you cannot verify it, it is not a quotation. Write it as "after <name>", which the
  colophon already promises means a compressed note rather than a quote.
- **Never repair a quotation to match house spelling.** A life of *Vasily* Arkhipov
  quotes Thomas Blanton saying "Vasili" — the quote is correct as printed and must stay.

### 2. The popular version, repeated

The house's whole edge is quietly fixing the version everyone knows. So the failure that
matters most is printing that version by accident.

- **John Snow and the Broad Street pump**: the standard story is that removing the handle
  stopped the outbreak. Whitehead's own figures show deaths had already collapsed.
- **Harrison and the longitude prize**: the popular version is a stitch-up. He was funded
  for decades and received £23,065; the prize was never awarded to anyone.

For every entry ask: *what does the popular account say, and does this page repeat it?*
If the page agrees with the popular account, that is not automatically wrong — but it is
the sentence to go and check.

### 3. A number carried from memory

Every figure the house has had to correct came from a remembered factoid.

- **Railway mania**: a draft said ~6,000 miles authorised at the peak. It is ~9,500 across
  263 Acts.
- **Harrison's payment**: a draft said he was paid the prize in 1773. He got £8,750 from
  Parliament that year, £23,065 across all awards, and never the prize.

Every `facts[]` entry needs `b` and `s`, and `npm run check` enforces that much. What it
cannot check is whether `s` is a document someone opened. Read each one and ask: *did
anyone actually look at this?*

### 4. A count dressed up as a sourced figure

**The Great Divergence printed "3"** — the live explanations — in `facts`, with a source
line. It was the author's own count, and the entry itself discussed more than three.

A number is only a fact if someone outside this house published it. An inventory of the
page's own argument is not a figure. If it is worth saying, say it in prose.

### 5. A source that does not exist

**The Banking Model listed a Stanford Encyclopedia entry on Paulo Freire.** There is no
such entry; Freire appears there only inside other articles. The link had been dead since
publication.

- `npm run links` catches the dead URL. It cannot catch a live URL under a wrong name.
- Check that the named publication actually published the named thing. A reference work
  credited with an article it never ran is the worst version of this, because the name
  does the persuading.
- A source you could not open is a lead. Put it in `dashboard/research-leads.md` and say
  so. Never write a source line for a document nobody read.

### 6. A date that is nearly right

**The Unix Bargain dated the C rewrite to 1972.** Ritchie puts the kernel rewrite in the
summer of 1973, and says portability barely mattered at the time — it became the point
with the 1977 Interdata port. Three facts, all slightly off, all plausible.

Near-right dates survive every read because nothing about them looks wrong. Check
timeline years against the source, not against the rest of the page.

---

## Also check, quickly

- **Counts in the colophon are generated, not typed.** The disclosure said "one CC BY
  credit" long after the body had grown to three. If you see a number written by hand
  where `{{W_PLATELESS_CAP}}` or `{{N_CCPLATES}}` should be, that is a bug.
- **`across` links have their reciprocal**, except `atlas:` links, which are one-way.
- **Plates are licensed.** Anything not plain public domain is in
  `content/plate-licences.json` with the exact credit line, and that line is in the
  colophon. Verify the licence box; do not infer it from the subject's dates.
- **`keep` comes from the entry's own argument**, not a general maxim.
- **Ids are permalinks.** If one changed, every referrer changed in the same commit.

---

## What to report back

Four short sections.

1. **Blockers.** An unverified quotation, a figure with no source anyone opened, a dead
   or misnamed source, a `check` failure. Nothing ships with one of these.
2. **Checked and stands.** The claims you verified and what you verified them against.
   This matters as much as the blockers — it is the record that the reading happened.
3. **Unverified.** Anything you could not open, with where it went in
   `dashboard/research-leads.md`.
4. **Style, named not fixed.** Anything for `/press-voice` to decide.

If it is clean, say so in one line. Do not invent findings to look thorough.

---

## Three rules that override the urge to tidy

**Do not fix style here.** Not a deliberate fragment, not a short sentence, not a stated
uncertainty, not a repetition that is doing work — the subtitle *"What makes law law"* is
correct and a checker has already been wrong about it once.

**Do not silently patch a published claim.** If something on the live site is wrong, it
gets a correction: `npm run correct -- "Title." "Body."`. Appending is the promise, and
`content/corrections.json` is hook-protected so the only way in is that command.

**Do not change a name to match another spelling without checking who it is.** A check
that did this automatically was removed from `tools/proofread.mjs` on 2026-09-20 after it
tried to rename Claire Ernhart — a real person — to Clair Patterson. Two people in this
house's subject matter are one letter apart far more often than one of them is misspelt.

# The working rhythm

A queue that does not produce decisions on a cadence is just a folder. This is the loop
the house runs on. It is a weekly shape, not a schedule to feel guilty about.

| | Your decision | The system's task | Artifact |
|---|---|---|---|
| **Commission** | What earns a place on the shelf | `/press-status`, then pick from the thin fields | a row in `dashboard/commissions.md` |
| **Research** | Which sources count | `/press-new-title` or `/press-new-life` — research before a word is written | a stub with real sources, no TODOs left |
| **Draft** | The argument, and the one line to keep | write `claim`, `copy`, `contested`, `keep` | the entry in `content/` |
| **Check** | Whether it is actually true | `/press-factcheck` — every figure against a primary source | confirmed / corrected / unverified, per claim |
| **Publish** | The final call — always yours | `/press-publish` | a build, and a live update |

## The two rules that keep it honest

**Nothing publishes without a person.** `/press-publish` is deliberately set so Claude will
never invoke it on its own; you have to ask. The deploy is gated on `npm run check` as well,
so a broken entry cannot reach readers even if someone pushes in a hurry.

**Corrections are a stage, not a failure.** The house has printed four. Each one made the
site more trustworthy, not less. When `/press-factcheck` finds something wrong, that is the
system working.

## What to measure

The tempting numbers are visits. The useful ones are about the house itself:

- **Entries that needed a correction after publishing** — if this is zero, the fact-checking
  is either excellent or not happening.
- **Titles with no `contested` section** — the count of entries where the argument against
  was skipped.
- **Lives with no plate, entries with no cross-links** — `npm run stats` reports both.
- **Which skills you actually reach for twice.** A skill invoked once was a bad skill; fix
  it or delete it.

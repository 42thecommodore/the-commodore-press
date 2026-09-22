---
name: press-note
description: Turn a podcast, talk or interview you have just watched into Wing III of the Commodore Press — a person in the Atlas, your take on what they teach, the principles they sit on, and any lines you kept with the episode and timestamp attached. Use when the user says they watched or listened to something and wants to add it, add a note, add someone to the Atlas, or capture what stuck.
---

# Capturing what you heard

Wing III is the people the house listens to now. This skill turns one episode into that,
with the sources attached at capture — which is the only moment they are cheap.

**The thing that makes this wing hard is not writing it. It is that you will not remember
where you heard the line.** Six months on, a kept line with no episode is unusable: it
cannot be checked, and the house cannot stand behind it. So the source goes on at capture
or the line does not go in.

---

## What you are producing

One entry in `content/atlas/people.json`:

```json
{
  "name": "Their name",
  "domain": "found | market | mind | craft | recov | inner",
  "role": "Who they are, in a line",
  "take": "Your own compression of what they teach. A sentence or two.",
  "p": ["track", "hard"],
  "kept": [
    { "k": "A short line, as they said it.", "s": "Founders #312, 14:20" }
  ]
}
```

`npm run new` does not scaffold Atlas people — this is a hand edit to one array. Copy the
nearest existing block rather than typing a fresh one.

---

## The four decisions, in order

### 1. Does this person earn a place?

Thirty-four people is already a lot, and the Atlas gets weaker as it gets longer. A
person earns a place when **you can say what they taught you that nobody else on the wall
taught you.** "Good episode" is not that. If the take would duplicate someone already
there, add a kept line to the existing person instead of a new star.

### 2. The take — your words, not theirs

`take` is the one field that is supposed to be yours. It has the `claim`'s shape: a
statement with a position in it, not a summary of the episode.

- Good: what they actually believe, stated plainly enough that someone could disagree.
- Bad: "He talks about discipline and focus." That is a topic list, not a take.

Write it from what you understood, not from a transcript. If the honest version is a
compression of something they said rather than your own read, mark it `after <name>` —
the colophon already tells readers that is what "after" means.

### 3. Kept lines — verbatim, short, and sourced

A kept line prints under their name and reads as a quotation to anyone looking at it.
So it is held to the quotation rule, exactly like a figure is held to its source:

- **Verbatim.** The words as said. Not tidied, not tightened, not modernised. If you are
  working from memory of the gist, it is not a kept line — put it in `take`, or write it
  `after <name>`.
- **Short.** A sentence or two. The existing lines average sixty characters. Keeping a
  paragraph is not capturing a line, it is transcribing, and that is both a different
  thing and not ours to publish.
- **Sourced.** `s` has to be precise enough to go and check: `"Founders #312, 14:20"`, or
  an episode URL. "The Founders podcast" is not a source; it is a show.
- **Few.** Three or four from an episode is a lot. One that you actually think about is
  worth more than six you will never reread.

If the show is not in `content/atlas/sources.json`, add it there too — that list is the
shows, the `s` field is the episode.

### 4. Which principles

`p` holds ids from `content/atlas/principles.json`, and they are what draw the lines in
the Atlas — a person with none floats unconnected, and `npm run check` says so.

**A new principle needs at least two people.** The Atlas only renders constellations with
two or more members (`ACTIVE_PR` in `theme/press.js`), so a principle invented for one
person will not draw at all. Either find the second person already on the wall who
belongs to it, or use an existing principle and wait.

---

## Then

```bash
npm run check
```

It will tell you if the domain or a principle id is wrong, if the person floats with no
principle, and if any kept line is missing its source. Then `npm start` and look at the
Atlas — the person should appear as a star with lines running to the people they share
principles with. If they float alone, the `p` list is the reason.

---

## Two things this skill will not do

**It will not write a source you did not see.** If you cannot remember the episode, the
line does not go in with a guessed timestamp. An entry with a thin `take` and no kept
lines is recoverable; a fabricated citation is the one failure the colophon cannot
absorb, and Wing III is the wing where the people quoted are alive to be misquoted.

**It will not transcribe.** We publish your compression and a few short attributed lines.
If what you want is the whole argument, the entry to write is a Press title with a
reading list, not an Atlas star.

---

## The backlog this wing is carrying

104 kept lines across 30 people were written before `kept` could hold a source. Since
2026-09-20 a bare string prints as a note, "after <name>", labelled as not a quotation, so
they no longer break the promise. They become quotations only when Luca re-hears them and
gives each an `s` — never an agent's guess. A line you capture now with its source goes in
as `{ k, s }`; one you only have the gist of goes in as a plain string, and prints as a note.

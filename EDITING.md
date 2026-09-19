# Editing the Press

The guide for keeping the Press yourself. You never need to touch code: every word on the site lives in a small text file in `content/`, and the tools tell you in plain language when something is off.

---

## Set up once

1. **Open the folder in VS Code** (or Cursor): *File → Open Folder… →* `The Commodore`. Opening the whole folder, not a single file, is what switches on the help described below.
2. **Open the terminal** inside it (*View → Terminal*) and run:

   ```bash
   npm start
   ```

3. Open **http://localhost:4321**. Leave it open beside the editor. Every time you save, the page rebuilds and reloads itself.

## What the editor does for you

- **Hover any field name** — `"s"`, `"keep"`, `"contested"` — and it tells you what the field is for and what the house expects in it.
- **A red squiggle is a mistake**: a bad colour, a link that is not a link, a field the site does not know. *View → Problems* lists them all.
- **Press `ctrl+space`** inside a `{ }` to list the fields you are allowed to add there.
- **Long paragraphs wrap**, so you can read what you are editing.
- **`dist/` and `content/corrections.json` open read-only.** The first is generated; the second is append-only. Both are explained below.

The explanations come from `schemas/`. `npm run check` reads the same files, so the help and the check can never disagree.

## Find the thing you want to change

- **`cmd+P`** and type part of the name — `heated`, `gandhi`, `compound`. Every entry is a file named after itself.
- **`cmd+shift+F`** and paste a sentence you saw on the site. It finds the file it came from.

| To change… | Open |
|---|---|
| a title | `content/books/NN-name.json` |
| the adjacent shelf | `content/adjacent/` |
| a life | `content/lives/NN-name.json` |
| a person in the Atlas | `content/atlas/people.json` |
| a principle or domain | `content/atlas/principles.json`, `domains.json` |
| a portrait | `npm run plate` — see below |
| a published mistake | `npm run correct` — never by hand |

## The short field names, decoded

The files use one-letter names to stay compact. Hover any of them in the editor; this is the same list on paper.

| Where | Letters | Mean |
|---|---|---|
| `facts` | `b` · `s` | the **big** number · its **source** |
| `figures` | `n` · `d` | **name** · **description** |
| `timeline` | `y` · `t` | **year** · **text** |
| `reading` | `t` · `a` · `u` · `why` | **title** · **author** · **url** · why this one |
| `bio` (lives) | `t` · `a` · `y` · `why` | **title** · **author** · **year** · why this one |
| `across` | `to` · `label` · `txt` | where it points · its name · the dash-led note |
| a life | `n` | the person's **name** |
| atlas `people` | `take` · `kept` · `p` | your reading of them · lines kept from them · principle ids |

If you type the long word by mistake — `"source"` instead of `"s"` — the check catches it and tells you the right one.

---

## Everyday edits

### 1. Fix a typo or tighten a sentence

Find it with `cmd+shift+F`, change the words, save. The preview reloads. That is the whole edit.

### 2. Add a figure

Every number carries its source. In the entry's `facts` list, add a block — mind the comma between blocks:

```json
"facts": [
  { "b": "1902", "s": "'Science and Hypothesis' — the disk, and the conventionalist thesis" },
  { "b": "~2,000 yrs", "s": "Of failed attempts to prove the parallel postulate" }
]
```

A number with no `s` fails the check. That is deliberate: it is the first promise in the colophon.

### 3. Add a further-reading link

```json
{ "t": "Science and Hypothesis", "a": "Henri Poincaré, 1902", "u": "https://www.gutenberg.org/ebooks/37157", "why": "Free, short chapters, and the source." }
```

Use `https://`. If a site genuinely only works over http, record why in `content/http-allowlist.json`.

### 4. Link two entries together

In `across`, point at the other entry by its `id` (the first line of its file):

```json
{ "to": "press:being-wrong", "label": "Being Wrong Productively", "txt": "— why naive falsification fails." }
```

`press:` for titles, `lives:` for lives, `atlas:` plus a principle id. Then add the link back on the other entry — except for `atlas:` links, which the principles do not carry back. The check fails if a link points at something that does not exist.

### 5. Change shelf order

The number at the front of the filename is the order. Rename `05-the-box.json` to `03-the-box.json` and renumber the others to make room. Leave the `id` inside the file alone.

### 6. Add a person to the Atlas

In `content/atlas/people.json`, copy an existing `{ … }` block, paste it after the last one with a comma between, and rewrite it. `domain` must be one of the domain ids; `p` lists principle ids. Hover either for the list.

`take` is your reading of what they teach, in a sentence or two. `kept` is the lines you kept from them. **Quotation marks mean you have seen the words**; where a line is your compressed note of their idea rather than what they said, write it `after <name>` — the colophon tells readers so, and it is the promise that is easiest to break by accident.

### 7. Add a new title or life

```bash
npm run new book "The Title"
```

Or `life "Their Name"` or `adjacent "…"`. It writes a file with an unused cover and every field marked `TODO`. The check refuses to pass until each one is answered. For a life, make the portrait from a public-domain image:

```bash
npm run plate -- ~/Downloads/portrait.jpg their-name
```

The last word must match the life's `id`.

### 9. Take something down

Delete the file. Run `npm run check`: it names every link elsewhere that now points nowhere, so you can remove those too. Remember the `id` was a permalink — anyone who saved that link will land on the front door.

### 10. Something already published was wrong

Do two things. Fix the entry, and print the correction:

```bash
npm run correct -- "Short title." "What was wrong, what is right, and how you know."
```

Never quietly edit the mistake away. Corrections are appended, never patched — it is one of the five promises the site makes.

---

## The four rules of the file format

Nearly every broken file is one of these.

1. **Text goes in straight double quotes:** `"like this"`. A `"` *inside* the text ends it early — use the typographic `“ ”` the house already uses.
2. **A comma between items, and none after the last** one before a `}` or `]`.
3. **One paragraph, one line.** No pressing Return inside quotes; the editor wraps it for you.
4. **`[ ]` is a list, `{ }` is a group of fields.** Every one you open, close.

## When the check says no

`npm run check` runs every rule. When a save breaks a file, the preview shows the same message in the browser. Fix the **first** error first — one broken file often makes a second error appear elsewhere, such as a link to it that suddenly "does not exist".

**A missing comma** — it points at the line, with a caret under the spot:

```
✗ content/books/17-heated-disk.json: not valid JSON — line 5, column 3
    4 │   "title": "The Heated Disk"
    5 │   "sub": "Is space a fact or a choice?",
          ^
        Expected ',' or '}' after property value
        A missing comma at the end of the line above.
```

**A misspelt field** — valid to the file format, silently dropped by the page, so the check refuses it:

```
✗ content/books/17-heated-disk.json: unknown field `chnaged` — did you mean `changed`? The site ignores it, so it would not show.
✗ content/books/17-heated-disk.json: unknown field `facts[0].source` — did you mean `s`? The site ignores it, so it would not show.
```

**The rest read as sentences:** `facts[0] has a number with no source line`, `across[1] points at "press:heated-disk", which does not exist`, `copy[2] is still a TODO`. Warnings in yellow never block publishing; errors in red do.

## Publish

```bash
npm run ship -- "Press: fix the date in The Heated Disk"
```

It runs the check, rebuilds, saves a snapshot to git and pushes. The live site updates in about two minutes. If the check fails, nothing is sent and the live site is left alone. Write the message as a sentence you will understand in six months.

## Undo

**Before you ship**, to throw away every unshipped change to one file and go back to the last published version:

```bash
git restore content/books/17-heated-disk.json
```

That discards your edits to that file for good, so be sure. `cmd+Z` in the editor is gentler for a recent slip.

**After you ship**, fix it and ship again. If readers could have seen a wrong claim, it is a correction (edit 10).

## Asking Claude instead

Open the folder in Claude and ask in plain words. It knows the house rules and runs the check after every edit.

- *"Fix the typo in the second paragraph of The Heated Disk."*
- *"Add a reading link to the Gandhi entry for Ambedkar's Annihilation of Caste."*
- *"Check the Marie Curie entry is right."*
- *"How's the Press doing — what should I work on?"*

It cannot edit `dist/` or rewrite corrections, and it never publishes unless you ask for it by name with `/press-publish`.

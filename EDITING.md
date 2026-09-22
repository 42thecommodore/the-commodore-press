# Editing the Press

The guide for keeping the Press yourself. You never need to touch code: every word on the site lives in a small text file in `content/`, and the tools tell you in plain language when something is off.

## The whole job, in five commands

| When | Run | What it does |
|---|---|---|
| You sit down to work | `npm run ready` | One screen: what is done, what is not, and the next thing to do |
| While you write | `npm start` | The site on http://localhost:4321, reloading every time you save |
| You want to write something of your own | `npm run new log "Title"` | Starts a Log piece as a draft (§9) |
| You think you are done | `npm run check` | The house rules, in plain language |
| You want readers to see it | `npm run ship -- "what changed"` | Checks everything, then publishes; the live site updates in about two minutes |

Everything else in this guide is detail. If you only remember one, remember `npm run ready`.

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
| a plate's licence and credit | `content/plate-licences.json` |
| a published mistake | `npm run correct` — never by hand |

## The short field names, decoded

The files use one-letter names to stay compact. Hover any of them in the editor; this is the same list on paper.

| Where | Letters | Mean |
|---|---|---|
| `facts` | `b` · `s` | the **big** number · its **source** |
| `figures` | `n` · `d` | **name** · **description** |
| `timeline` | `y` · `t` | **year** · **text** |
| `reading` | `t` · `a` · `u` · `why` | **title** · **author** · **url** · why this one |
| `bio` (lives) | `t` · `a` · `y` · `why` · `u` | **title** · **author** · **year** · why this one · a **link**, only when the place to start is not a book (an article, an exhibition) |
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
  { "b": "1,926 ft", "s": "Lift over the Tehachapi Mountains at the Edmonston Pumping Plant: California Department of Water Resources, 'SWP Facilities'" }
]
```

`s` has two halves with a colon between them: **what the number counts**, then **the document you read it in**. A number with no `s` fails the check, and an `s` with no colon gets a yellow warning, because a description of a number is not a source. That is deliberate: it is the first promise in the colophon. If you could not open the document, it is not a source yet — put it in `dashboard/research-leads.md` instead.

**`facts` works in a life as well as a title**, and it prints the same "By the numbers"
panel in the reader. It was added to Wing II on 2026-09-19, because the lives carry the
denser numbers of the two wings — 35.3 per thousand words against the titles' 23.4 — and
had nowhere to source them. If a life states money, a percentage, a magnitude or a
measured quantity and has no `facts` list, the check refuses it (it was a yellow warning until every life had been sourced, on 2026-09-21):

```
content/lives/24-andrew-carnegie.json: states "$480 million" with no `facts` block
```

Years, ages and centuries are not flagged; the entry's own `years` already carries those.

### 3. Add a further-reading link

```json
{ "t": "Science and Hypothesis", "a": "Henri Poincaré, 1902", "u": "https://www.gutenberg.org/ebooks/37157", "why": "Free, short chapters, and the source." }
```

Use `https://`. If a site genuinely only works over http, record why in `content/http-allowlist.json`.

**Link the work, not a page about it.** For a book, use a library lookup — `https://search.worldcat.org/search?q=` followed by the title and author — or the publisher's page. For a paper, the paper. A Wikipedia link is fine when it is honestly what you mean, but then write "Wikipedia" in `a`; the check refuses a Wikipedia link labelled as the book itself.

`npm run check` proves the link is *well-formed*. Only `npm run links` proves it still
*opens*:

```bash
npm run links
```

It visits every link the site prints and fails on any that is dead. Links that a
publisher blocks to robots are listed separately as unconfirmed — those are worth
opening by hand once, but they are not errors. It caches its results, so a second run
is quick; `npm run links -- --all` re-checks everything from scratch.

Run it every month or two. Link rot is silent: the page looks perfect and the reading
list points at nothing. Eight of them had accumulated by September 2026.

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

`take` is your reading of what they teach, in a sentence or two — your words, not theirs.

`kept` is the lines you kept from them, and each one owes a source the same way a number does. A kept line prints under their name, so a reader takes it as a quotation whatever the punctuation:

```json
"kept": [
  { "k": "The line, exactly as they said it.", "s": "Founders #312, 14:20" }
]
```

`s` has to be precise enough to go and check — an episode and a timestamp, or an episode URL. The name of the show is not a source; the episode is. Where a line is your compressed note of their idea rather than what they said, write it as a plain string instead — that is the note shape below.

A plain string is a **note**, not a quotation. It prints under "Notes I kept · after <name>", in italic, with a line telling the reader no episode was recorded. That is honest as it stands, and the check does not complain about it. 104 of the old lines are notes now. When you re-hear one, give it its source and it moves up to "Lines I kept" as a quotation. Nobody else can say which episode a line came from, and a guessed timestamp is worse than leaving it a note.

Ask Claude for `/press-note` when you have just watched something — it writes the whole block with the source attached while you still remember it.

### 7. Add a new title or life

```bash
npm run new book "The Title"
```

Or `life "Their Name"` or `adjacent "…"`. It writes a file with an unused cover and every field marked `TODO`. The check refuses to pass until each one is answered. For a life, make the portrait from a public-domain image:

```bash
npm run plate -- ~/Downloads/portrait.jpg their-name
```

The last word must match the life's `id`.

### 8. The About page

`content/about.md` is plain writing, not JSON: `#` for the title, `##` for a heading, a blank line between paragraphs, `- ` for a list, `*italic*`, `**bold**`, `[words](https://link)`. Counts like `{{N_LIVES}}` fill themselves in.

**The page stays off the site until the editor section no longer says TODO.** Write it, save, and the preview shows it at `/about/`. The footer of the library and of every entry page then links your name to it.

### 9. Write for the Log

The Log is your column: signed, dated, and the one place on the site for your own opinion.

```bash
npm run new log "The question goes with the number"
```

That makes `content/log/<today>-the-question-goes-with-the-number.md`. Open it and write. The block between the `---` lines at the top is the front matter:

- `title` — a claim, not a topic
- `dek` — one line saying what the piece argues; it is also the share card and the email preview
- `across` — what it argues with: `press:forty-two, lives:john-snow, atlas:track`
- `status` — `draft` stays off the site; change it to `published` when it is ready

Below that it is plain writing. A blank line between paragraphs. `[Forty-Two](press:forty-two)` links to that entry. A line starting `>` is a quotation, and only if you have the words in front of you. Any number needs a line under `## Sources` saying where you read it; the check will not let a published piece through without one.

Once published it appears at `/log/`, in the library's menu, in search, and in `feed.xml` in full. The Log link shows up in the library only once there is a published piece. Ask Claude for `/press-log` to draft with you.

### 10. Turn on the newsletter

Pick a service and make an account. Then open `content/newsletter.json` and fill in two lines:

```json
"provider": "Buttondown",
"action": "https://buttondown.com/YOUR-USERNAME/embed-subscribe",
```

That's it. A sign-up box appears under every entry, on the About page and on every Log piece, and the colophon gains a sentence telling readers who holds their address. The check refuses a form with no `provider`, because that sentence would print with a blank in it. Other services work the same way: their embed instructions give you the `action` address and the name of the email box (`field`).

Sending each new Log piece automatically means pointing the service's RSS-to-email feature at `…/feed.xml`. At Buttondown that is a paid feature; otherwise, paste each piece into an issue by hand.

### 11. Use your own domain

Buy the domain, point it at GitHub Pages (GitHub's "Managing a custom domain" page has the DNS records), then in the repository on GitHub: *Settings → Secrets and variables → Actions → Variables → New variable*, name `SITE_URL`, value `https://yourdomain.com`. The next publish moves every link, share card, sitemap entry and feed item to the new address.

### 12. Take something down

Delete the file. Run `npm run check`: it names every link elsewhere that now points nowhere, so you can remove those too. Remember the `id` was a permalink — anyone who saved that link will land on the front door.

### 13. Get found by search engines

The build already does the technical part: a page for every entry, a contents page that links them all, a sitemap with the real date each entry last changed, and `llms.txt` for AI search tools. What it cannot do is tell Google the site exists.

1. Go to Google Search Console, add the site, and choose the **HTML file** method. Google gives you a file like `google1a2b3c.html`.
2. Put that file in `assets/root/`. The build copies anything there to the top of the site.
3. Ship, click **Verify** in Search Console, then submit `sitemap.xml`.

Bing Webmaster Tools works the same way with its `BingSiteAuth.xml`. Do it again after moving to your own domain.

### 14. Something already published was wrong

After `npm run correct`, add the correction's number to the entry it is about: `"corrected": [14]`. The entry then prints the correction itself, so someone reading it learns what changed without finding the colophon. The check refuses a number that does not exist.

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

## What the house will and will not print

`PUBLISHING.md` is the short version of the editorial standard: what earns a place on each
shelf, the five kinds of thing this house does not publish and why, what finished means,
and — the part worth knowing — how to change one of those rules when it stops making
sense. It is written to be argued with rather than obeyed.

## The last read before it ships

`npm run check` proves the shape of a file. It cannot read. Before anything goes live,
run the prose check too:

```bash
npm run proofread
```

It catches only what a machine can be certain of — a note to yourself left in the text,
a word typed twice, a space before a comma. It deliberately does **not** guess at
misspelt names: it tried, and it wanted to rename a real person and to edit a word
inside a direct quotation, so that job went back to a reader.

For the reading itself, ask Claude for `/press-proofread`. It checks the six things that
have actually gone wrong on this site — a quotation that was never said, the popular
version repeated by accident, a number from memory, a count dressed up as a figure, a
source that does not exist, and a date that is nearly right. All six are in the
corrections list, which is where it learned them.

## Publish

```bash
npm run ship -- "Press: fix the date in The Heated Disk"
```

It runs the whole gate in order — the house rules, the prose check, every link, then the rebuild — and only then commits and pushes. The live site updates in about two minutes. If anything fails, nothing is sent and the live site is left alone. Write the message as a sentence you will understand in six months.

**It will refuse to run unless you are on `main`.** `ship` publishes whatever branch you are standing on, so running it from a half-finished branch would put that branch in front of readers. If that is genuinely what you want, add `--allow-branch`. Offline, add `--skip-links` — though the link check caches for a fortnight, so it is usually instant.

### The link to share

Every title and life also gets a page of its own, built from the same file: `…/t/forty-two/` for a title, `…/l/john-snow/` for a life. **That is the link to post or send.** It shows the entry's own name and summary in the preview card (a life shows its portrait), and it is the page search engines find. The `#t/…` address in the library's bar previews as the front door. In the library, the reader's **Share this entry** button copies the right one (or opens your phone's share sheet). Every entry page also has a share bar — copy, email, X, LinkedIn — and one under the line to keep, which shares that line with the entry. None of it loads anything from the social networks: they are plain links. Nothing to maintain: the build makes these pages, and the sitemap, on every run.

The preview card for a title is a picture in the title's own colours, made by `npm run card` (it needs Google Chrome installed). When you rename a title, rewrite its claim or add a new one, the check says so in yellow — run `npm run card` and look at the pictures in `assets/cards/` before shipping.

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

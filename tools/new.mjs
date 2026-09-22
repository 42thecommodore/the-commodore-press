/* Commodore Press scaffolder — writes a correctly-shaped, house-rule-complete stub.
   Usage: node tools/new.mjs book "The Heated Disk" [--field Science]
          node tools/new.mjs life "Marcus Aurelius" [--field Philosophy]
          node tools/new.mjs adjacent "Title"
          node tools/new.mjs log "The question goes with the number"
   Every stub is deliberately full of TODOs: `npm run check` will refuse to pass
   until each one is answered, which is the point. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const kind = argv[0];
const title = argv.find((a, i) => i > 0 && !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };

const KINDS = ["book", "adjacent", "life", "log"];
if (!KINDS.includes(kind) || !title) {
  console.error(`usage: node tools/new.mjs <${KINDS.join("|")}> "Title" [--field Science]`);
  process.exit(1);
}

const slug = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* A Log piece is Markdown, not JSON, and needs no livery: it is the editor's column, not
   a book on a shelf. It starts as a draft, which stays off the site until status changes. */
if (kind === "log") {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(ROOT, "content/log");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${date}-${slug(title)}.md`);
  if (fs.existsSync(file)) { console.error("already exists: " + file); process.exit(1); }
  fs.writeFileSync(file, `---
title: ${title}
date: ${date}
dek: TODO — one line saying what this piece argues
across: TODO — what it argues with, e.g. press:forty-two, lives:john-snow, atlas:track
status: draft
---
TODO — write the piece. Plain paragraphs, a blank line between them.

Link to the library like this: [Forty-Two](press:forty-two), [John Snow](lives:john-snow).
A quotation goes on its own line starting with > and only if you have the words in front of you.

## Sources

- TODO — where each figure came from, one line each. Delete this section if the piece states none.
`);
  const rel = path.relative(ROOT, file);
  console.log(`\n  new Log piece: ${rel}  (draft — not on the site yet)\n\n  Next:`);
  [`/press-voice        — the house voice, then write`, `answer every TODO in ${rel}`,
   `change  status: draft  to  status: published`, `npm run check`].forEach((x, i) => console.log(`    ${i + 1}. ${x}`));
  console.log();
  process.exit(0);
}

/* house liveries — a title's binding, not decoration: pick one that isn't in use */
const LIVERIES = [
  { cover: "#0F4C46", spineC: "#0A3833", ink: "#F4EFE2", accent: "#E4C57E" },
  { cover: "#232E78", spineC: "#18205A", ink: "#EFF1FA", accent: "#9FD3EC" },
  { cover: "#6B1E2A", spineC: "#4E141E", ink: "#F7EBDF", accent: "#E7BE8A" },
  { cover: "#3F4A24", spineC: "#2C3418", ink: "#F1F3E2", accent: "#D6E39C" },
  { cover: "#264653", spineC: "#17323D", ink: "#EAF1F4", accent: "#A8CBD6" },
  { cover: "#5A3A21", spineC: "#402714", ink: "#F6EEDF", accent: "#E0C08A" },
  { cover: "#3C2C5C", spineC: "#2A1D44", ink: "#F0EBFA", accent: "#CDB9EE" },
  { cover: "#26262B", spineC: "#171719", ink: "#EDEDEF", accent: "#C6CBD4" },
  { cover: "#10305C", spineC: "#0A2242", ink: "#EFF2F8", accent: "#D6BE86" },
  { cover: "#2A2F45", spineC: "#1B1F30", ink: "#F0EFEA", accent: "#C9B98E" },
];
const MOTIFS = ["rings", "lines", "grid", "dots", "conic"];

const readAll = d => { const f = path.join(ROOT, d); return fs.existsSync(f) ? fs.readdirSync(f).filter(x => x.endsWith(".json")).sort() : []; };
const used = new Set();
for (const d of ["content/books", "content/adjacent", "content/lives"])
  for (const f of readAll(d)) { const j = JSON.parse(fs.readFileSync(path.join(ROOT, d, f), "utf8")); used.add(j.cover); }
/* Every palette livery is now in use, so the fallback runs every time. It used to key off
   `used.size` — the count of DISTINCT covers — which does not move when a new stub reuses
   a palette colour, so two scaffolds in a row came out in the identical livery. Keying off
   the entry count, which always increments, at least makes consecutive stubs differ. */
const entries = ["content/books", "content/adjacent", "content/lives"].reduce((n, d) => n + readAll(d).length, 0);
const fresh = LIVERIES.find(l => !used.has(l.cover));
const livery = fresh || LIVERIES[entries % LIVERIES.length];
const motif = MOTIFS[entries % MOTIFS.length];

const TODO = t => `TODO — ${t}`;
const dirFor = { book: "content/books", adjacent: "content/adjacent", life: "content/lives" }[kind];
const existing = readAll(dirFor);
const next = String(existing.length + 1).padStart(2, "0");
const id = slug(title);
const file = path.join(ROOT, dirFor, `${next}-${id}.json`);
if (fs.existsSync(file)) { console.error("already exists: " + file); process.exit(1); }

let body;
if (kind === "book" || kind === "adjacent") {
  body = {
    id, keep: TODO("the one line a reader should keep. One sentence, no hedging."),
    title, sub: TODO("the subtitle — what this is actually about"),
    field: flag("field", TODO("Science / Technology / History / Philosophy / Economics …")),
    spineTitle: title, years: TODO("e.g. 1925–1979"),
    ...livery, motif,
    claim: TODO("the argument in one sentence. If you cannot write it, you are not ready to write the entry."),
    lede: TODO("the opening line — the hook"),
    copy: [TODO("paragraph 1 — the mechanism"), TODO("paragraph 2 — the evidence"), TODO("paragraph 3 — the complication")],
    timeline: [{ y: TODO("year"), t: TODO("what happened") }],
    figures: [{ n: TODO("name"), d: TODO("what they did, in one line") }],
    facts: [{ b: TODO("the number"), s: TODO("what it counts: the document you read it in — house rule, no bare figures") }],
    contested: TODO("where this is still argued, and by whom. Say so plainly."),
    changed: TODO("what changed your mind, or what would."),
    across: [],
    reading: [{ t: TODO("book title"), a: TODO("author"), u: TODO("https://… a real link"), why: TODO("why this one") }],
  };
} else if (kind === "life") {
  body = {
    id, keep: TODO("the one line to keep from this life"),
    n: title, years: TODO("e.g. 1809–1865"), place: TODO("where"),
    field: flag("field", TODO("the field")), group: flag("group", TODO("shelf grouping")),
    ...livery, motif,
    lede: TODO("the opening line"),
    copy: [TODO("paragraph 1 — the situation"), TODO("paragraph 2 — what they actually did"), TODO("paragraph 3 — the cost, or the part usually left out")],
    bio: { t: TODO("the best biography"), a: TODO("its author"), y: TODO("year"), why: TODO("why this one and not the famous one") },
    contested: TODO("what is disputed about this life"),
    across: [],
  };
} else {
  const n = existing.length + 1;
  body = {
    id: ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"][n - 1] || String(n),
    num: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][n - 1] || String(n),
    title, accent: livery.accent,
    dek: TODO("one line under the title"),
    entries: [{ k: TODO("the premise"), h: TODO("the heading, as a claim"), p: [TODO("paragraph")] }],
    heur: [{ b: TODO("the heuristic, in one line"), s: TODO("the gloss") }],
  };
}

fs.writeFileSync(file, JSON.stringify(body, null, 2) + "\n");
const rel = path.relative(ROOT, file);
console.log(`\n  new ${kind}: ${rel}`);
console.log(`  livery: ${livery.cover} / ${motif}`);
if (!fresh) console.log(`  ⚠ every house livery is already in use — this one repeats ${livery.cover}.\n    Pick a distinct cover/spineC/ink/accent by hand before shelving it.`);
const steps = [
  `/press-voice        — the house voice, before you write a line`,
  `answer every TODO in ${rel}`,
  ...(kind === "life" ? [`make the plate:  node tools/plate.mjs <image> ${id}`] : []),
  `npm run check       — the house rules will tell you what is still missing`,
  `npm run build`,
];
console.log(`\n  Next:`);
steps.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
console.log();

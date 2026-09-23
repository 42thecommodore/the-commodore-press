/* Commodore Press — what is new in the listening notes.
   Usage: npm run notes -- "~/Downloads/People 🫂.md"
     (Google Docs: File → Download → Markdown. The "# Name" headings are what this reads.)

   Compares the notes doc with content/atlas/people.json and echoes.json, and writes a review
   to .private/notes-review.md: people in the doc who are not on the chart, lines under people
   who are, and ideas that turn up under more than one person (constellation candidates).

   It changes nothing on the site. The doc is private and full of personal lines, so the
   review goes to .private/, which git ignores: nothing from the doc can be pushed by
   accident. You choose what to add, then `npm run new person` or edit people.json. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2];
if (!arg) {
  console.error('\n  usage: npm run notes -- "path/to/People.md"\n  Google Docs: File → Download → Markdown (.md), then point this at the file.\n');
  process.exit(1);
}
const file = arg.replace(/^~(?=\/)/, os.homedir());
if (!fs.existsSync(file)) { console.error(`\n  no file at ${file}\n`); process.exit(1); }

const people = JSON.parse(fs.readFileSync(path.join(ROOT, "content/atlas/people.json"), "utf8"));
const echoes = JSON.parse(fs.readFileSync(path.join(ROOT, "content/atlas/echoes.json"), "utf8"));

/* the doc's own spellings and section names, mapped to the chart's */
const ALIAS = { "micheal easter": "Michael Easter", "jason calicanus": "Jason Calacanis", "william hockley": "William Hockey",
  "pablo’s holman": "Pablos Holman", "pablo's holman": "Pablos Holman", "richard h thaler": "Richard Thaler",
  "boyd varty and others": "Boyd Varty", "boyd part 3": "Boyd Varty", "damon lines": "Damon West", "fred again": "Fred again.." };
/* headings that are topics, not people */
const SKIP = /^(general|idk who this was|is vc for me+|stats to make movies|open claw|tab)\b/i;

const norm = t => t.toLowerCase().replace(/[“”"’'`*_\\]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set("the a an and or but of to in on for with is are be you your it that this what when where who how i we they them their my me our as at by from if not do does did can will just so have has more most all any some there then than into out up about get go going being".split(" "));
const words = t => new Set(norm(t).split(" ").filter(w => w.length > 3 && !STOP.has(w)));
const jac = (a, b) => { let n = 0; for (const w of a) if (b.has(w)) n++; return n / (a.size + b.size - n || 1); };

/* read the doc: "# Name" starts a person; every other non-empty line under it is a note */
const doc = new Map();
let who = null;
for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
  const h = raw.match(/^#{1,3}\s+(.+?)\s*:?\s*$/);
  if (h) {
    const name = h[1].replace(/[*_\\]/g, "").trim();
    if (SKIP.test(name)) { who = null; continue; }
    who = ALIAS[norm(name)] || people.find(p => norm(p.name) === norm(name))?.name || name.replace(/:$/, "");
    if (!doc.has(who)) doc.set(who, []);
    continue;
  }
  const line = raw.replace(/^[\s>*\-•]+/, "").replace(/\\([!*_#.])/g, "$1").trim();
  if (!who || line.length < 12 || norm(line) === norm(who)) continue;
  doc.get(who).push(line);
}

const onChart = new Map(people.map(p => [p.name, p]));
const known = p => new Set((p.kept || []).map(k => norm(typeof k === "string" ? k : k.k)));
const out = [`# Notes review · ${new Date().toISOString().slice(0, 10)}`, "",
  `From \`${path.basename(file)}\`. Private: this file is in .private/, which git ignores. Nothing here is on the site until you add it.`, ""];

/* 1. people in the doc, not on the chart */
const fresh = [...doc].filter(([n, ls]) => !onChart.has(n) && ls.length);
out.push(`## In your notes, not on the chart (${fresh.length})`, "",
  "Each needs a verified role line, a take, and lessons. `npm run new person \"Name\"` starts one.", "");
for (const [n, ls] of fresh.sort((a, b) => b[1].length - a[1].length)) {
  out.push(`### ${n} · ${ls.length} lines`, ...ls.slice(0, 8).map(l => `- ${l}`), ls.length > 8 ? `- … ${ls.length - 8} more` : "", "");
}

/* 2. lines under people on the chart that are not among their kept notes */
out.push("## New lines under people already on the chart", "", "Candidates for `kept`. Skip anything personal.", "");
let added = 0;
for (const [n, ls] of doc) {
  const p = onChart.get(n); if (!p) continue;
  const have = known(p), keptWords = (p.kept || []).map(k => words(typeof k === "string" ? k : k.k));
  const neu = ls.filter(l => !have.has(norm(l)) && !keptWords.some(w => jac(w, words(l)) > .6));
  if (!neu.length) continue;
  added += neu.length;
  out.push(`### ${n} · ${neu.length} not on the site`, ...neu.slice(0, 10).map(l => `- ${l}`), neu.length > 10 ? `- … ${neu.length - 10} more` : "", "");
}
if (!added) out.push("None.", "");

/* 3. the same idea under two different people, not already an echo */
const inEcho = new Set(echoes.flatMap(e => e.notes.map(x => norm(x.who) + "|" + norm(x.note))));
const lines = [...doc].flatMap(([n, ls]) => ls.map(l => ({ n, l, w: words(l) }))).filter(x => x.w.size >= 2);
const pairs = [];
for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
  const a = lines[i], b = lines[j]; if (a.n === b.n) continue;
  const s = jac(a.w, b.w); let shared = 0; for (const w of a.w) if (b.w.has(w)) shared++;
  if (s >= .4 && shared >= 2) pairs.push({ s, a, b });
}
pairs.sort((x, y) => y.s - x.s);
out.push("## Possible constellations", "", "The same idea in your notes on two people. Add the real ones to `content/atlas/echoes.json`.", "");
const seen = new Set();
for (const { s, a, b } of pairs) {
  const k = [a.n, b.n].sort().join("|") + norm(a.l).slice(0, 20);
  if (seen.has(k) || (inEcho.has(norm(a.n) + "|" + norm(a.l)) && inEcho.has(norm(b.n) + "|" + norm(b.l)))) continue;
  seen.add(k);
  out.push(`- **${a.n}**: ${a.l}  \n  **${b.n}**: ${b.l}  \n  _match ${(s * 100).toFixed(0)}%${onChart.has(a.n) && onChart.has(b.n) ? "" : " · one of them is not on the chart yet"}_`);
  if (seen.size >= 30) break;
}
if (!seen.size) out.push("None found.");

const dir = path.join(ROOT, ".private");
fs.mkdirSync(dir, { recursive: true });
const dest = path.join(dir, "notes-review.md");
fs.writeFileSync(dest, out.join("\n") + "\n");
console.log(`\n  ${doc.size} people in the notes · ${fresh.length} not on the chart · ${added} new lines under people who are · ${seen.size} possible constellations`);
console.log(`  review written to ${path.relative(ROOT, dest)} (private, git-ignored)\n`);

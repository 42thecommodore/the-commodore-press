/* Commodore Press release gate — the last thing between a draft and a reader.
   Run: npm run proofread            everything
        npm run proofread -- <path>  one file
        npm run proofread -- --strict  treat every warning as an error

   `npm run check` proves the shape of an entry: fields the schemas know, figures with
   sources, links that are well-formed. `npm run links` proves those links open. Neither
   reads the prose. This does.

   It reports only what a machine can be sure about: placeholder text that would print,
   a repeated word, a space before a comma. Everything that needs a reader's judgment —
   whether a name is right, whether a number is true, whether a sentence means what it
   says — belongs to /press-proofread, which runs this first and then reads. See §3 for
   a check that was tried here and removed, and why it must not come back. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJSON } from "./json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);
const ARGS = process.argv.slice(2);
const STRICT = ARGS.includes("--strict");
const ONLY = ARGS.filter(a => !a.startsWith("--"))[0];

const errors = [], warns = [];
const err = (w, m) => errors.push(`${w}: ${m}`);
const warn = (w, m) => warns.push(`${w}: ${m}`);

/* ---------- the prose the site actually prints ---------- */
const DIRS = ["content/books", "content/adjacent", "content/lives"];
const FILES = [
  "content/atlas/principles.json", "content/atlas/people.json",
  "content/atlas/sources.json", "content/corrections.json",
];
const docs = [];
for (const d of DIRS) {
  const full = p(d);
  if (!fs.existsSync(full)) continue;
  for (const f of fs.readdirSync(full).filter(x => x.endsWith(".json")).sort())
    docs.push({ file: `${d}/${f}`, data: readJSON(path.join(full, f)) });
}
for (const f of FILES) { try { docs.push({ file: f, data: readJSON(p(f)) }); } catch {} }

/* fields that are prose a reader sees; ids, colours and urls are not */
const SKIP = new Set(["id", "u", "url", "href", "cover", "spineC", "ink", "accent", "motif",
                      "livery", "y", "n0", "slug", "plate", "domain"]);
const strings = [];                                   // { file, at, text }
const collect = (node, file, at = "") => {
  if (node == null) return;
  if (typeof node === "string") { strings.push({ file, at, text: node }); return; }
  if (Array.isArray(node)) return node.forEach((v, i) => collect(v, file, `${at}[${i}]`));
  if (typeof node === "object")
    Object.entries(node).forEach(([k, v]) => { if (!SKIP.has(k)) collect(v, file, `${at}.${k}`); });
};
docs.filter(d => !ONLY || d.file.includes(ONLY)).forEach(({ file, data }) => collect(data, file));

/* ---------- 1. scaffolding: notes to self that never came out ---------- */
const MARKERS = /\((?:source|cite|citation|analysis|ref|check|todo)\)|\?\?\?|\[(?:NEED|TODO|TK|CITE)[^\]]*\]|\bTK\b|\blorem ipsum\b|\bxxx+\b|\bTODO\b|\bFIXME\b|\bPLACEHOLDER\b|\bcheck this\b/i;
for (const { file, at, text } of strings) {
  const m = text.match(MARKERS);
  if (m) err(file, `${at} still carries a note to self: ${JSON.stringify(m[0])} — it would print`);
}

/* ---------- 2. doubled words ---------- */
const DOUBLE = /\b([A-Za-z][\w'’-]{2,})\s+\1\b/gi;
const OKDOUBLE = new Set(["had had", "that that"]);
for (const { file, at, text } of strings) {
  for (const m of text.matchAll(DOUBLE))
    if (!OKDOUBLE.has(m[0].toLowerCase()))
      warn(file, `${at} repeats a word: "${m[0]}" — deliberate sometimes ("what makes law law"), so read it before changing it`);
}

/* ---------- 3. what a machine must NOT try to catch ----------
   A near-miss name check lived here and was removed on 2026-09-20. Across this corpus
   it fired 76 times and was wrong every time, and its failure mode is not noise — it is
   damage. It wanted "Vasili" changed to "Vasily" inside a verbatim quotation from Thomas
   Blanton, which would have falsified a quote. It wanted Claire Ernhart, a real person,
   renamed to Clair Patterson. It called the subtitle "What makes law law" a doubled word.

   Real distinct names sit one letter apart constantly in a house about world history:
   Bowen and Cowen, Caird and Cairo, Francis and Frances, Michel and Michael. There is no
   threshold that separates those from a genuine slip. Spelling a name is judgment, so it
   belongs to /press-proofread and to a reader, not to a grep. Do not re-add it. */

/* ---------- 4. sentence-level slips ---------- */
for (const { file, at, text } of strings) {
  if (/[a-z]\.\s+[a-z]{2,}/.test(text) && !/\b(?:e\.g|i\.e|etc|vs|Mr|Mrs|Dr|St|No|cf|ca|al|p|pp|vol|ed|Jr|Sr|Co|Inc|Ltd|fig|ch|trans)\.\s/i.test(text))
    warn(file, `${at} has a full stop followed by a lower-case word — a sentence may have broken in half`);
  if (/\s[,;:.]/.test(text)) warn(file, `${at} has a space before punctuation`);
  if (/\s{2,}/.test(text)) warn(file, `${at} has a double space`);
  if (/[a-z]{2,}"[a-z]/i.test(text)) warn(file, `${at} has a straight quote inside a word`);
}

/* ---------- 5. an em dash the house would have set differently ---------- */
for (const { file, at, text } of strings)
  if (/\s--\s|\s-\s/.test(text)) warn(file, `${at} uses a hyphen where the house sets an em dash (—)`);

/* ---------- report ---------- */
const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", d: "\x1b[2m", x: "\x1b[0m" };
if (warns.length) { console.log(`\n${c.y}${warns.length} to look at${c.x}`); warns.forEach(w => console.log(`  ${c.y}·${c.x} ${w}`)); }
if (errors.length) { console.log(`\n${c.r}${errors.length} that must not ship${c.x}`); errors.forEach(e => console.log(`  ${c.r}✗${c.x} ${e}`)); }
const fatal = errors.length + (STRICT ? warns.length : 0);
if (!fatal) console.log(`\n${c.g}✓ nothing in the prose that a machine can catch${c.x} ` +
  `${c.d}— ${strings.length} strings across ${docs.length} files${warns.length ? `, ${warns.length} to look at` : ""}${c.x}`);
console.log(`${c.d}  Judgment is still yours: run /press-proofread for what grep cannot see.${c.x}`);
process.exit(fatal ? 1 : 0);

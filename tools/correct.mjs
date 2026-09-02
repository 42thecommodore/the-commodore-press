/* Commodore Press corrections — append-only, by design.
   Usage: node tools/correct.mjs "Harrison's prize." "What I got wrong, and what the evidence says."
   The site promises corrections are appended and never silently patched. This tool
   is the only sanctioned way to touch content/corrections.json; it refuses to remove
   or rewrite anything already printed. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "content/corrections.json");
const [title, body] = process.argv.slice(2);
if (!title || !body) {
  console.error('usage: node tools/correct.mjs "Short title." "What was wrong and what is true now."');
  console.error('  Say what the earlier draft claimed, then what the evidence actually shows.');
  process.exit(1);
}
const prior = JSON.parse(fs.readFileSync(FILE, "utf8"));
const d = new Date().toLocaleString("en-GB", { month: "short", year: "numeric" });
const next = [...prior, { d, t: title, b: body }];
fs.writeFileSync(FILE, JSON.stringify(next, null, 2) + "\n");
console.log(`  correction ${next.length} appended (${d}) — ${title}`);
console.log(`  the ${prior.length} before it are untouched, as promised in the colophon.`);

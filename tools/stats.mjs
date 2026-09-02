/* Commodore Press inventory — what is on the shelves, and what still needs work. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);
const load = d => fs.existsSync(p(d)) ? fs.readdirSync(p(d)).filter(f => f.endsWith(".json")).sort()
  .map(f => ({ file: f, data: JSON.parse(fs.readFileSync(p(d, f), "utf8")) })) : [];
const one = f => fs.existsSync(p(f)) ? JSON.parse(fs.readFileSync(p(f), "utf8")) : null;

const books = load("content/books"), adjacent = load("content/adjacent");
const lives = load("content/lives"), manuals = load("content/manuals");
const people = one("content/atlas/people.json") || [], principles = one("content/atlas/principles.json") || [];
const sources = one("content/atlas/sources.json") || [], corrections = one("content/corrections.json") || [];
const slipway = one("content/slipway/slipway.json") || {};
const plates = fs.existsSync(p("assets/plates")) ? fs.readdirSync(p("assets/plates")).filter(f => !f.startsWith(".")) : [];

const b = "\x1b[1m", d = "\x1b[2m", y = "\x1b[33m", g = "\x1b[32m", x = "\x1b[0m";
const words = s => JSON.stringify(s).split(/\s+/).length;
const totalWords = [...books, ...adjacent, ...lives, ...manuals].reduce((n, e) => n + words(e.data), 0);

console.log(`\n${b}THE COMMODORE PRESS${x} ${d}— house inventory${x}\n`);
const row = (label, n, extra = "") => console.log(`  ${String(n).padStart(4)}  ${label.padEnd(22)} ${d}${extra}${x}`);
row("titles, Wing I", books.length);
row("adjacent", adjacent.length);
row("lives, Wing II", lives.length, `${plates.length} with plates`);
row("people, Wing III", people.length, `across ${principles.length} principles`);
row("field manuals, IV", manuals.length, `${manuals.reduce((n, m) => n + (m.data.entries || []).length, 0)} entries`);
row("trade lessons, V", (slipway.book || []).length);
row("named sources", sources.length);
row("corrections", corrections.length, "append-only");
console.log(`\n  ${d}roughly ${totalWords.toLocaleString()} words of prose across the wings${x}`);

/* what still needs a hand */
const gaps = [];
const plateIds = plates.map(f => path.basename(f, path.extname(f)));
lives.forEach(({ data }) => { if (!plateIds.includes(data.id)) gaps.push(`${data.n} has no plate`); });
books.forEach(({ data }) => { if (!data.contested) gaps.push(`${data.title} names nothing contested`); });
[...books, ...lives].forEach(({ data }) => { if (!(data.across || []).length) gaps.push(`${data.title || data.n} links to no other wing`); });
if (gaps.length) { console.log(`\n${y}  ${gaps.length} thing(s) to pick up${x}`); gaps.slice(0, 12).forEach(t => console.log(`    ${y}·${x} ${t}`)); if (gaps.length > 12) console.log(`    ${d}… and ${gaps.length - 12} more${x}`); }
else console.log(`\n${g}  nothing outstanding${x}`);

if (fs.existsSync(p("dist/index.html"))) {
  const kb = fs.statSync(p("dist/index.html")).size / 1024;
  const age = (Date.now() - fs.statSync(p("dist/index.html")).mtimeMs) / 36e5;
  console.log(`\n  ${d}dist/index.html — ${kb.toFixed(0)} KB, built ${age < 1 ? "just now" : age.toFixed(0) + "h ago"}${x}\n`);
} else console.log(`\n  ${y}not built yet — npm run build${x}\n`);

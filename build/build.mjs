/* Commodore Press build — assembles content/ + theme/ + assets/ into dist/index.html.
   No dependencies. Run: npm run build */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);
const read = f => fs.readFileSync(p(f), "utf8");

/* ---------- load content ---------- */
// Numeric filename prefixes fix shelf order; entries sort by filename.
const dir = d => {
  const full = p(d);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter(f => f.endsWith(".json")).sort()
    .map(f => { try { return JSON.parse(fs.readFileSync(path.join(full, f), "utf8")); }
                catch (e) { throw new Error(`${d}/${f}: ${e.message}`); } });
};
const one = f => JSON.parse(read(f));

const BOOKS      = dir("content/books");
const ADJACENT   = dir("content/adjacent");
const LIVES      = dir("content/lives");
const MANUALS    = dir("content/manuals");
const DOMAINS    = one("content/atlas/domains.json");
const DCOLOR     = one("content/atlas/domain-colors.json");
const PRINCIPLES = one("content/atlas/principles.json");
const PEOPLE     = one("content/atlas/people.json");
const SOURCES    = one("content/atlas/sources.json");
const SLIPWAY    = one("content/slipway/slipway.json");
const CORRECTIONS= one("content/corrections.json");

/* ---------- plates: image files -> base64 data-URIs, keyed by life id ---------- */
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
const PLATES = {};
const platesDir = p("assets/plates");
if (fs.existsSync(platesDir)) {
  for (const f of fs.readdirSync(platesDir).sort()) {
    const ext = path.extname(f).toLowerCase();
    const id = path.basename(f, ext);
    if (MIME[ext]) PLATES[id] = `data:${MIME[ext]};base64,${fs.readFileSync(path.join(platesDir, f)).toString("base64")}`;
    else if (ext === ".txt") PLATES[id] = fs.readFileSync(path.join(platesDir, f), "utf8").trim();
  }
}

/* ---------- emit ---------- */
// </script> inside a string literal would close the tag early; escape it.
const safe = s => s.replace(/<\/script/gi, "<\\/script");
const K = (name, val) => `const ${name} = ${JSON.stringify(val)};`;

const DATA = safe([
  "/* GENERATED — do not edit here. Sources live in content/ and assets/plates/. */",
  K("PLATES", PLATES),
  K("BOOKS", BOOKS),
  K("ADJACENT", ADJACENT),
  "const ALL = BOOKS.concat(ADJACENT);",
  K("LIVES", LIVES),
  K("DOMAINS", DOMAINS),
  K("DCOLOR", DCOLOR),
  K("PRINCIPLES", PRINCIPLES),
  K("PEOPLE", PEOPLE),
  K("SOURCES", SOURCES),
  K("MANUALS", MANUALS),
  K("SLIPWAY", SLIPWAY),
  K("CORRECTIONS", CORRECTIONS),
].join("\n"));

const words = n => n < 20 ? ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"][n]
  : n % 10 === 0 ? ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"][n / 10] : words(n - n % 10) + "-" + words(n % 10);
const cap = s => s[0].toUpperCase() + s.slice(1);
const fill = s => s
  .replace(/{{N_BOOKS}}/g, words(BOOKS.length)).replace(/{{W_BOOKS_CAP}}/g, cap(words(BOOKS.length)))
  .replace(/{{W_LIVES_CAP}}/g, cap(words(LIVES.length))).replace(/{{W_PEOPLE_CAP}}/g, cap(words(PEOPLE.length)))
  .replace(/{{N_LIVES}}/g, words(LIVES.length)).replace(/{{N_PEOPLE}}/g, words(PEOPLE.length))
  .replace(/{{N_MANUALS}}/g, words(MANUALS.length)).replace(/{{N_LESSONS}}/g, words((SLIPWAY.book || []).length));
const out = fill(read("templates/shell.html"))
  .replace("<!--CSS-->", () => read("theme/press.css"))
  .replace("<!--DATA-->", () => DATA)
  .replace("<!--ENGINE-->", () => safe(fill(read("theme/press.js"))));

fs.mkdirSync(p("dist"), { recursive: true });
fs.writeFileSync(p("dist/index.html"), out);

// A 404 that is just the site: any deep link lands on the front door.
fs.writeFileSync(p("dist/404.html"), out);
fs.writeFileSync(p("dist/.nojekyll"), "");
fs.writeFileSync(p("dist/robots.txt"), "User-agent: *\nAllow: /\n");

const kb = n => (n / 1024).toFixed(0) + " KB";
console.log(`built dist/index.html — ${kb(Buffer.byteLength(out))}`);
console.log(`  ${BOOKS.length} books · ${ADJACENT.length} adjacent · ${LIVES.length} lives · ${MANUALS.length} manuals`);
console.log(`  ${PEOPLE.length} people · ${PRINCIPLES.length} principles · ${SOURCES.length} sources · ${Object.keys(PLATES).length} plates · ${CORRECTIONS.length} corrections`);

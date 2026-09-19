/* Commodore Press build — assembles content/ + theme/ + assets/ into dist/index.html.
   No dependencies. Run: npm run build */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJSON } from "../tools/json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);
const read = f => fs.readFileSync(p(f), "utf8");

/* A broken entry should read as a sentence about the entry, not a Node stack trace —
   the preview prints this straight into the browser. */
process.on("uncaughtException", e => { console.error(e.message); process.exit(1); });

/* ---------- load content ---------- */
// Numeric filename prefixes fix shelf order; entries sort by filename.
const dir = d => {
  const full = p(d);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter(f => f.endsWith(".json")).sort()
    .map(f => { try { return readJSON(path.join(full, f)); }
                catch (e) { throw new Error(`${d}/${f}: ${e.message}`); } });
};
const one = f => { try { return readJSON(p(f)); } catch (e) { throw new Error(`${f}: ${e.message}`); } };

const BOOKS      = dir("content/books");
const ADJACENT   = dir("content/adjacent");
const LIVES      = dir("content/lives");
const DOMAINS    = one("content/atlas/domains.json");
const DCOLOR     = one("content/atlas/domain-colors.json");
const PRINCIPLES = one("content/atlas/principles.json");
const PEOPLE     = one("content/atlas/people.json");
const SOURCES    = one("content/atlas/sources.json");
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
  K("CORRECTIONS", CORRECTIONS),
].join("\n"));

const words = n => n < 20 ? ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"][n]
  : n % 10 === 0 ? ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"][n / 10] : words(n - n % 10) + "-" + words(n % 10);
const cap = s => s[0].toUpperCase() + s.slice(1);

/* Where the site actually lives. Social cards and canonical links need an absolute URL,
   and a relative one silently produces a link with no preview. Override for a custom
   domain: SITE_URL=https://commodorepress.org npm run build */
const SITE = (process.env.SITE_URL || "https://42thecommodore.github.io/the-commodore-press").replace(/\/+$/, "");

const fill = s => s
  .replace(/{{SITE}}/g, SITE)
  .replace(/{{N_BOOKS}}/g, words(BOOKS.length)).replace(/{{W_BOOKS_CAP}}/g, cap(words(BOOKS.length)))
  .replace(/{{W_LIVES_CAP}}/g, cap(words(LIVES.length))).replace(/{{W_PEOPLE_CAP}}/g, cap(words(PEOPLE.length)))
  .replace(/{{N_LIVES}}/g, words(LIVES.length)).replace(/{{N_PEOPLE}}/g, words(PEOPLE.length))
  // the famous/obscure split is counted, not typed: a typed "twenty-one famous" went stale the day two lives shipped
  .replace(/{{W_FAMOUS_CAP}}/g, cap(words(LIVES.filter(l => l.group === "famous").length)))
  .replace(/{{N_OBSCURE}}/g, words(LIVES.filter(l => l.group === "obscure").length))
  .replace(/{{N_PRINCIPLES}}/g, words(PRINCIPLES.length));
const out = fill(read("templates/shell.html"))
  .replace("<!--CSS-->", () => read("theme/press.css"))
  .replace("<!--DATA-->", () => DATA)
  .replace("<!--ENGINE-->", () => safe(fill(read("theme/press.js"))));

fs.mkdirSync(p("dist"), { recursive: true });
fs.writeFileSync(p("dist/index.html"), out);

// A 404 that is just the site: any deep link lands on the front door.
fs.writeFileSync(p("dist/404.html"), out);
fs.writeFileSync(p("dist/.nojekyll"), "");
fs.writeFileSync(p("dist/robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

/* The card people see when the link is pasted somewhere. Rendered by `npm run card`
   and committed, so CI never needs a browser. The page itself stays self-contained;
   this sits beside it the way robots.txt does. */
const CARD = p("assets/og.png");
if (fs.existsSync(CARD)) fs.copyFileSync(CARD, p("dist/og.png"));
else console.log("  no assets/og.png — run `npm run card` (shared links will show no image)");

/* Routing is hash-based, so there is exactly one indexable URL. Saying so plainly
   beats letting a crawler guess. */
fs.writeFileSync(p("dist/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `  <url><loc>${SITE}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`);

const kb = n => (n / 1024).toFixed(0) + " KB";
console.log(`built dist/index.html — ${kb(Buffer.byteLength(out))}`);
console.log(`  ${BOOKS.length} books · ${ADJACENT.length} adjacent · ${LIVES.length} lives`);
console.log(`  ${PEOPLE.length} people · ${PRINCIPLES.length} principles · ${SOURCES.length} sources · ${Object.keys(PLATES).length} plates · ${CORRECTIONS.length} corrections`);

/* The house decision is that this stays one file. The cost of that decision is that the
   plates are inlined as base64 and every reader downloads all of them to see a front door
   that shows none — so the decision needs a trigger, not a memory. At 1 MB, revisit it:
   keep the text inline and move the plates out as real files with loading="lazy".
   Recorded in dashboard/commissions.md, 2026-09-15. */
const PAGE = Buffer.byteLength(out);
const PLATE_BYTES = Object.values(PLATES).reduce((n, v) => n + Buffer.byteLength(v), 0);
const REVISIT_AT = 1024 * 1024;
console.log(`  plates are ${Math.round(PLATE_BYTES / PAGE * 100)}% of the page (${kb(PLATE_BYTES)} of ${kb(PAGE)})`);
if (PAGE > REVISIT_AT) {
  console.log(`\n  the page has passed 1 MB — the one-file decision is due for review.`);
  console.log(`  Every reader now downloads ${kb(PLATE_BYTES)} of portraits to reach a front door that shows none.`);
  console.log(`  See dashboard/commissions.md for what was decided and on what trigger.`);
}

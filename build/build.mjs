/* Commodore Press build — assembles content/ + theme/ + assets/ into dist/index.html.
   No dependencies. Run: npm run build */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJSON } from "../tools/json.mjs";
import { fillMark } from "./mark.mjs";
import { writeEntryPages, writeAbout, writeLog, writeContents, EDITOR } from "./pages.mjs";
import { publishedLog } from "./log.mjs";

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
const ECHOES     = one("content/atlas/echoes.json") || [];
const CORRECTIONS= one("content/corrections.json");
const PLATELIC   = one("content/plate-licences.json");
const NEWS       = one("content/newsletter.json");
const CAPTAINS   = fs.existsSync(p("content/captains.json")) ? one("content/captains.json").crew || [] : [];
const LOG        = publishedLog(ROOT);   // the editor's column, published pieces only, newest first

/* The wings, named once. A typed "five wings" outlived the wings themselves in four
   places — the meta description, the front-door standfirst, package.json and the social
   card — because nothing counted them. */
const WINGS = ["The Press", "Lives", "The Atlas"];
const licenced = (re) => Object.keys(PLATELIC)
  .filter(k => k[0] !== "_" && (!re || re.test(PLATELIC[k].licence)));

/* ---------- plates: keyed by life id, served as files from dist/plates/ ---------- */
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
const PLATES = {};
const platesDir = p("assets/plates");
if (fs.existsSync(platesDir)) {
  for (const f of fs.readdirSync(platesDir).sort()) {
    const ext = path.extname(f).toLowerCase();
    const id = path.basename(f, ext);
    if (MIME[ext]) PLATES[id] = `plates/${f}`;
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
  K("ECHOES", ECHOES),
  K("CORRECTIONS", CORRECTIONS),
  K("CAPTAINS", CAPTAINS),
  K("LOG", LOG.map(x => ({ slug: x.slug, title: x.meta.title, date: x.meta.date, dek: x.meta.dek }))),
].join("\n"));

const words = n => n < 20 ? ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"][n]
  : n % 10 === 0 ? ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"][n / 10] : words(n - n % 10) + "-" + words(n % 10);
const cap = s => s[0].toUpperCase() + s.slice(1);

/* Where the site actually lives. Social cards and canonical links need an absolute URL,
   and a relative one silently produces a link with no preview. Override for a custom
   domain: SITE_URL=https://commodorepress.org npm run build */
const SITE = (process.env.SITE_URL || "https://42thecommodore.github.io/the-commodore-press").replace(/\/+$/, "");

/* The Atlas's source is written to be read (its comments explain why each mark means what it
   does); the page it ships in has a 500 KB budget. Block comments and indentation go at build
   time, from the Atlas files only. */
const lean = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]+/gm, "").replace(/\n{2,}/g, "\n");
const fill = s => fillMark(s)
  .replace(/{{SITE}}/g, SITE)
  .replace(/{{EDITOR}}/g, EDITOR)
  .replace(/{{N_BOOKS}}/g, words(BOOKS.length)).replace(/{{W_BOOKS_CAP}}/g, cap(words(BOOKS.length)))
  .replace(/{{W_LIVES_CAP}}/g, cap(words(LIVES.length))).replace(/{{W_PEOPLE_CAP}}/g, cap(words(PEOPLE.length)))
  .replace(/{{N_LIVES}}/g, words(LIVES.length)).replace(/{{N_PEOPLE}}/g, words(PEOPLE.length))
  // the famous/obscure split is counted, not typed: a typed "twenty-one famous" went stale the day two lives shipped
  .replace(/{{W_FAMOUS_CAP}}/g, cap(words(LIVES.filter(l => l.group === "famous").length)))
  .replace(/{{N_OBSCURE}}/g, words(LIVES.filter(l => l.group === "obscure").length))
  .replace(/{{N_PRINCIPLES}}/g, words(PRINCIPLES.length))
  // The plate counts are counted, not typed, for the same reason the famous/obscure split
  // is: the disclosure said "one CC BY credit" long after the colophon body had grown to
  // three, and nobody noticed because a sentence does not fail a build.
  .replace(/{{W_PLATELESS_CAP}}/g, cap(words(LIVES.filter(l => !PLATES[l.id]).length)))
  // Two different counts, and conflating them is how the disclosure got it wrong twice.
  // W_CCPLATES_CAP is the CC-licensed plates the body credits one by one. N_LICENSED is
  // every plate that is not plain public domain, which is those plus the Library of
  // Congress photograph — "no known copyright restrictions" is a narrower claim than
  // public domain and does not belong on either side of that sentence by accident.
  .replace(/{{W_CCPLATES_CAP}}/g, cap(words(licenced(/^CC /).length)))
  // The third group: held under a narrower claim than public domain and narrower than a
  // CC licence — the "no known restrictions" holdings. This was typed as "Three" until a
  // fourth arrived on 2026-09-20, which is the same failure the two comments above
  // describe, one sentence further along.
  .replace(/{{W_NARROW_CAP}}/g, cap(words(licenced(/^(?!CC )/).length)))
  .replace(/{{N_LICENSED}}/g, `${words(licenced().length)} plates`)
  .replace(/{{W_WINGS_CAP}}/g, cap(words(WINGS.length))).replace(/{{W_WINGS}}/g, words(WINGS.length));
fs.mkdirSync(p("dist"), { recursive: true });
const ABOUT_URL = writeAbout({ ROOT, SITE, fill, NEWS, hasLog: LOG.length > 0 });
const out = fill(read("templates/shell.html"))
  // the footer names the editor, and links the name once the About page exists
  .replace("<!--EDITOR-->", ABOUT_URL ? `<a href="about/">${EDITOR}, editor</a>` : EDITOR)
  // the Log appears in the library only once it has a published piece
  .replace("<!--LOGLINK-->", LOG.length ? `<div><a href="log/">The Log</a></div>` : "")
  .replace("<!--FEED-->", LOG.length ? `<link rel="alternate" type="application/rss+xml" title="The Commodore Press — the Log" href="{{SITE}}/feed.xml">`.replace("{{SITE}}", SITE) : "")
  // the colophon promises no cookies and no analytics; once a sign-up exists it also says who holds the addresses
  .replace("<!--NEWSCOLOPHON-->", NEWS && NEWS.action ? ` If you subscribe to the newsletter, your address is held by ${NEWS.provider}, used only to send it; every issue carries its own unsubscribe link.` : "")
  .replace("<!--LOGCOLOPHON-->", LOG.length ? ` Beside the three wings sits <a href="log/">the Log</a>, the editor's signed column: opinion, dated and under a name, held to the same rules on sources, quotation and corrections as everything else here.` : "")
  .replace("<!--CSS-->", () => read("theme/press.css") + lean(read("theme/atlas.css")) + fillMark(read("theme/reading.css")))
  .replace("<!--DATA-->", () => DATA)
  // reading.js and atlas.js first: the engine calls both (atlas.js holds only declarations), and the entry pages run reading.js too
  .replace("<!--ENGINE-->", () => safe(read("theme/reading.js")) + "\n" + safe(fill(lean(read("theme/atlas.js")))) + "\n" + safe(fill(read("theme/press.js"))));

/* A token nobody filled prints as `{{N_THING}}` on the live page, and a build that
   succeeds is the only signal anyone checks. Two of these were added and wired in the
   same change; the third would not have been. */
const unfilled = [...new Set(out.match(/{{[A-Z_]+}}/g) || [])];
if (unfilled.length) {
  console.error(`\n  Unfilled template token(s): ${unfilled.join(", ")}`);
  console.error("  Add the .replace() in fill(), or delete the token from the template.\n");
  process.exit(1);
}

/* The Slipway section was removed with a script that ate two characters of `</main>`,
   and `/main>` sat visible above the footer in four shipped builds. Cheap to check. */
for (const tag of ["main", "body", "html", "footer", "section"]) {
  const open = (out.match(new RegExp(`<${tag}[\\s>]`, "g")) || []).length;
  const close = (out.match(new RegExp(`</${tag}>`, "g")) || []).length;
  if (open !== close) {
    console.error(`\n  <${tag}> opened ${open} time(s) and closed ${close} in the built page.\n`);
    process.exit(1);
  }
}
const stray = out.match(/(?<![<\w])\/(?:main|section|footer|body|html)>/g);
if (stray) {
  console.error(`\n  A closing tag lost its bracket and will print as text: ${[...new Set(stray)].join(", ")}\n`);
  process.exit(1);
}

fs.mkdirSync(p("dist"), { recursive: true });
fs.writeFileSync(p("dist/index.html"), out);

// A 404 that is just the site: any deep link lands on the front door.
// It is served at whatever deep path was missed, so relative links (plates/, log/) need a base.
fs.writeFileSync(p("dist/404.html"), out.replace("<head>", `<head>\n<base href="${SITE}/">`));
fs.writeFileSync(p("dist/.nojekyll"), "");
/* A custom domain. GitHub Pages reads dist/CNAME; set the repository variable SITE_URL
   (Settings → Secrets and variables → Actions → Variables) and the deploy passes it here.
   Every canonical link, share card, sitemap entry and feed item moves with it. */
const HOST = new URL(SITE).host;
if (!HOST.endsWith(".github.io")) fs.writeFileSync(p("dist/CNAME"), HOST + "\n");
else fs.rmSync(p("dist/CNAME"), { force: true });
fs.writeFileSync(p("dist/robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

/* The card people see when the link is pasted somewhere. Rendered by `npm run card`
   and committed, so CI never needs a browser. The page itself stays self-contained;
   this sits beside it the way robots.txt does. */
const CARD = p("assets/og.png");
if (fs.existsSync(CARD)) fs.copyFileSync(CARD, p("dist/og.png"));
else console.log("  no assets/og.png — run `npm run card` (shared links will show no image)");

/* The library routes by hash, which a crawler reads as one page, so every title and life
   also gets a real page of its own (build/pages.mjs). The sitemap lists all of them. */
const ENTRY_URLS = writeEntryPages({ ROOT, SITE, BOOKS, ADJACENT, LIVES, hasAbout: !!ABOUT_URL, NEWS, hasLog: LOG.length > 0, CORR: CORRECTIONS });
const LOG_URLS = writeLog({ ROOT, SITE, pieces: LOG, BOOKS, ADJACENT, LIVES, PRINCIPLES, hasAbout: !!ABOUT_URL, NEWS }).urls;
const CONTENTS_URL = writeContents({ ROOT, SITE, BOOKS, ADJACENT, LIVES, LOG });
// lastmod only where it is known: entry pages carry their file's git date, the rest none
const U = x => typeof x === "string" ? { loc: x } : x;
fs.writeFileSync(p("dist/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [`${SITE}/`, CONTENTS_URL, ...(ABOUT_URL ? [ABOUT_URL] : []), ...LOG_URLS, ...ENTRY_URLS].map(U)
    .map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>\n`).join("") + `</urlset>\n`);

/* Anything in assets/root/ is copied to the top of the site as it is — the place for a
   search-console verification file (google123abc.html) or a BingSiteAuth.xml. */
const ROOTFILES = p("assets/root");
if (fs.existsSync(ROOTFILES)) for (const f of fs.readdirSync(ROOTFILES).filter(f => !f.startsWith("."))) fs.copyFileSync(path.join(ROOTFILES, f), p("dist", f));

const kb = n => (n / 1024).toFixed(0) + " KB";
console.log(`built dist/index.html — ${kb(Buffer.byteLength(out))}`);
console.log(`  ${BOOKS.length} books · ${ADJACENT.length} adjacent · ${LIVES.length} lives`);
console.log(`  ${ENTRY_URLS.length} entry pages in dist/t/ and dist/l/, a contents page, llms.txt`);
console.log(LOG.length ? `  the Log: ${LOG.length} published piece(s), feed.xml` : `  the Log: nothing published yet — held back`);
console.log(ABOUT_URL ? `  about page at dist/about/` : `  about page held back — content/about.md still says TODO`);
console.log(`  ${PEOPLE.length} people · ${PRINCIPLES.length} principles · ${SOURCES.length} sources · ${Object.keys(PLATES).length} plates · ${CORRECTIONS.length} corrections`);

/* The page budget. The plates left the page on 2026-09-21; what remains is text, the
   engine and the stylesheet. A front door that grows past this is carrying something it
   should not, and every reader pays for it before the headline appears. */
const PAGE = Buffer.byteLength(out), BUDGET = 500 * 1024;
if (PAGE > BUDGET) console.log(`\n  the front door is ${kb(PAGE)}, over its ${kb(BUDGET)} budget — find what is inlined that should be a file.`);

/* One-time migration: split the legacy single-file site into editable sources.
   Reads the original commodore-press.html; writes content/, theme/, templates/, assets/.

   Already run, and kept only to document how content/ was derived. It still extracts
   MANUALS and SLIPWAY because the original page had them — Wings IV and V were removed
   on 2026-09-19, so running this again would write two directories the build no longer
   reads. Read it; do not run it. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) { console.error("usage: node tools/extract-once.mjs <commodore-press.html>"); process.exit(1); }
const html = fs.readFileSync(SRC, "utf8");
const lines = html.split("\n");

const at = (needle, from = 0) => { const i = lines.findIndex((l, n) => n >= from && l.includes(needle)); if (i < 0) throw new Error("not found: " + needle); return i; };

const styleA = at("<style>"), styleB = at("</style>", styleA);
const scriptA = at("<script>", styleB), scriptB = at("</script>", scriptA);
const dataA = scriptA + 1;
const dataB = at("/* ===================== ENGINE ===================== */", dataA);

const css = lines.slice(styleA + 1, styleB).join("\n");
const dataSrc = lines.slice(dataA, dataB).join("\n");
const engine = lines.slice(dataB, scriptB).join("\n");
const headTop = lines.slice(0, styleA).join("\n");     // doctype..<style>
const midHtml = lines.slice(styleB + 1, scriptA).join("\n"); // </style>..<script>
const tail = lines.slice(scriptB).join("\n");           // </script>..</html>

// evaluate the data block in a sandbox to get real objects
const ctx = vm.createContext({});
vm.runInContext(dataSrc + "\n;globalThis.__D = {PLATES,BOOKS,ADJACENT,LIVES,DOMAINS,PRINCIPLES,PEOPLE,MANUALS,SLIPWAY,CORRECTIONS,DCOLOR,SOURCES};", ctx);
const D = ctx.__D;

const W = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const J = (p, o) => W(p, JSON.stringify(o, null, 2) + "\n");
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---- one file per entry, numbered so shelf order survives ----
const pad = n => String(n + 1).padStart(2, "0");
D.BOOKS.forEach((b, i) => J(`content/books/${pad(i)}-${b.id || slug(b.title)}.json`, b));
D.ADJACENT.forEach((b, i) => J(`content/adjacent/${pad(i)}-${b.id || slug(b.title)}.json`, b));
D.LIVES.forEach((l, i) => J(`content/lives/${pad(i)}-${l.id || slug(l.n)}.json`, l));
D.MANUALS.forEach((m, i) => J(`content/manuals/${pad(i)}-${slug(m.t || m.title || "vol" + i)}.json`, m));

J("content/atlas/domains.json", D.DOMAINS);
J("content/atlas/principles.json", D.PRINCIPLES);
J("content/atlas/people.json", D.PEOPLE);
J("content/slipway/slipway.json", D.SLIPWAY);
J("content/corrections.json", D.CORRECTIONS);
J("content/atlas/sources.json", D.SOURCES);
J("content/atlas/domain-colors.json", D.DCOLOR);

// ---- plates: base64 data-URIs become real image files ----
let plateCount = 0;
for (const [id, uri] of Object.entries(D.PLATES || {})) {
  const m = /^data:image\/(\w+);base64,(.+)$/s.exec(String(uri));
  if (!m) { W(`assets/plates/${id}.txt`, String(uri)); continue; }
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  fs.writeFileSync(`assets/plates/${id}.${ext}`, Buffer.from(m[2], "base64"));
  plateCount++;
}

// ---- shell, css, engine ----
W("theme/press.css", css.replace(/^\n+|\n+$/g, "") + "\n");
W("theme/press.js", engine.replace(/^\n+|\n+$/g, "") + "\n");
W("templates/shell.html", [headTop, "<style>", "<!--CSS-->", "</style>", midHtml, "<script>", "<!--DATA-->", "<!--ENGINE-->", tail].join("\n"));

console.log(`books ${D.BOOKS.length} · adjacent ${D.ADJACENT.length} · lives ${D.LIVES.length} · manuals ${D.MANUALS.length} · people ${D.PEOPLE.length} · principles ${D.PRINCIPLES.length} · plates ${plateCount} · corrections ${D.CORRECTIONS.length}`);
console.log(`css ${css.length}b · engine ${engine.length}b`);

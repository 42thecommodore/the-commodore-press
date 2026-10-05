/* What a search engine and a link preview read, on every page the build writes.
 *
 *   npm test        (runs this after the browser tests; it needs only dist/)
 *
 * Every page a reader can be sent to must carry: a title, a description a search result
 * prints whole, a canonical URL that the sitemap lists, the share tags (og: and twitter:)
 * with an image that exists in dist/, JSON-LD that parses, and the icon tags — and each
 * file those tags name must be in dist/. And nothing a page loads may come from another site. Exits 1 on any failure.
 *
 * Written 2026-10-04, when an audit of the built site found the contents page — the one
 * page that links every entry — shared with no description, no card size and no X tags,
 * the front door's description cut off at 160 characters in a search result, and a
 * favicon that existed only as a data URI, which no search engine fetches. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, process.env.SEO_DIST || "dist");
if (!fs.existsSync(path.join(DIST, "index.html"))) { console.error("\n  no dist/ — run `npm run build` first\n"); process.exit(1); }

const pages = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const q = path.join(d, f);
    if (fs.statSync(q).isDirectory()) walk(q);
    else if (f.endsWith(".html") && !/^google[0-9a-f]+\.html$/.test(f)) pages.push(q);
  }
})(DIST);

const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
const SITE = (sitemap.match(/<loc>([^<]+?)\/<\/loc>/) || [])[1];
const meta = (h, k) => (h.match(new RegExp(`<meta (?:name|property)="${k}" content="([^"]*)"`)) || [])[1];
const link = (h, rel) => (h.match(new RegExp(`<link rel="${rel}" href="([^"]+)"`)) || [])[1];
// an absolute URL on this site, as a file in dist/
const file = u => u && u.startsWith(SITE + "/") ? path.join(DIST, decodeURIComponent(u.slice(SITE.length + 1)) || "index.html") : null;

const fails = [];
const need = (ok, page, what) => { if (!ok) fails.push(`${page}: ${what}`); };
const titles = new Map();

for (const f of pages) {
  const h = fs.readFileSync(f, "utf8"), rel = path.relative(DIST, f);
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = meta(h, "description"), canon = link(h, "canonical");
  need(title, rel, "no <title>");
  need(desc, rel, "no meta description");
  // Google prints about 155-160 characters; past that the house's own sentence is cut mid-word
  need(!desc || desc.length <= 160, rel, `description is ${desc && desc.length} characters — a search result cuts it at 160; shorten it`);
  need(canon, rel, "no canonical link");
  if (rel !== "404.html") {
    need(!canon || sitemap.includes(`<loc>${canon}</loc>`), rel, `canonical ${canon} is not in sitemap.xml`);
    if (title) titles.set(title, (titles.get(title) || []).concat(rel));
  }
  for (const k of ["og:type", "og:site_name", "og:title", "og:description", "og:url", "og:image", "og:image:alt", "twitter:card", "twitter:title", "twitter:description", "twitter:image"])
    need(meta(h, k), rel, `no ${k} — a shared link previews without it`);
  if (meta(h, "twitter:card") === "summary_large_image")
    need(meta(h, "og:image:width") && meta(h, "og:image:height"), rel, "a large card with no og:image:width/height — some previews wait for the image, or skip it");
  for (const k of ["og:image", "twitter:image"]) {
    const u = meta(h, k);
    need(!u || /^https:\/\//.test(u), rel, `${k} is not an absolute https URL — a relative one previews as a bare link`);
    need(!file(u) || fs.existsSync(file(u)), rel, `${k} names ${u}, which is not in dist/`);
  }
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  need(ld.length, rel, "no JSON-LD");
  for (const m of ld) { try { JSON.parse(m[1]); } catch (e) { fails.push(`${rel}: JSON-LD does not parse — ${e.message}`); } }
  // the icons, by URL: a search result, a home screen and a chat preview fetch them as files
  for (const r of ["icon", "apple-touch-icon", "manifest"]) {
    const u = link(h, r);
    need(u && !u.startsWith("data:"), rel, `no ${r} link to a real file (a data: URI is drawn in a tab and nowhere else)`);
    need(!file(u) || fs.existsSync(file(u)), rel, `${r} names ${u}, which is not in dist/`);
  }
  need(/<meta name="theme-color" content="#[0-9A-Fa-f]{6}">/.test(h), rel, "no theme-color");
  /* Nothing a page loads comes from another site. The colophon tells readers what the site
     remembers is never sent anywhere; until 2026-10-05 every page fetched its typefaces from
     Google, which received each reader's address and the page they were on. Links a reader
     follows (<a>) and URLs only a crawler reads (og:, canonical, JSON-LD) are not loads. */
  const loads = [
    ...[...h.matchAll(/<link\b[^>]*>/g)].map(m => m[0]).filter(t => /rel="(stylesheet|preload|modulepreload|preconnect|dns-prefetch|prefetch|icon|apple-touch-icon|manifest)"/.test(t)).map(t => (t.match(/href="([^"]+)"/) || [])[1]),
    ...[...h.matchAll(/<(?:script|img|iframe|source|video|audio|embed)\b[^>]*\ssrc="([^"]+)"/g)].map(m => m[1]),
    ...[...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].flatMap(m => [...m[1].matchAll(/url\(\s*["']?([^"')]+)/g)].map(u => u[1])),
    ...[...h.matchAll(/@import\s+(?:url\()?["']?([^"');]+)/g)].map(m => m[1]),
  ].filter(Boolean);
  for (const u of loads) {
    if (/^(data:|#)/.test(u)) continue;
    let abs; try { abs = new URL(u.replace(/&amp;/g, "&"), SITE + "/" + rel); } catch { continue; }
    need(abs.origin === new URL(SITE).origin, rel, `loads ${u} from another site — it learns every reader's address; serve it from this one`);
  }
}
for (const [t, ps] of titles) need(ps.length === 1, ps.join(", "), `share the title "${t}" — a search result cannot tell them apart`);

const mf = path.join(DIST, "site.webmanifest");
if (fs.existsSync(mf)) {
  try {
    for (const i of JSON.parse(fs.readFileSync(mf, "utf8")).icons || []) need(fs.existsSync(path.join(DIST, i.src)), "site.webmanifest", `names ${i.src}, which is not in dist/`);
  } catch (e) { fails.push(`site.webmanifest does not parse — ${e.message}`); }
}

const g = s => `\x1b[32m${s}\x1b[0m`, r = s => `\x1b[31m${s}\x1b[0m`;
if (fails.length) {
  console.error(`\n${r("✗")} ${fails.length} problem(s) a search engine or a link preview would meet:\n  ${fails.slice(0, 40).join("\n  ")}${fails.length > 40 ? `\n  … and ${fails.length - 40} more` : ""}\n`);
  process.exit(1);
}
console.log(`${g("✓")} ${pages.length} pages: title, description under 160, canonical in the sitemap, share card and tags, JSON-LD, icons — every file they name is in dist/, nothing loaded from another site`);

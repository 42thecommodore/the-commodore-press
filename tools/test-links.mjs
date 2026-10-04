/* Every link inside the site leads somewhere: the pages, the book links, the wings.
 *
 *   npm test        (after the browser tests; or on its own: node tools/test-links.mjs)
 *
 * Two halves.
 *
 * 1. The built pages, read as files. Every href and src on every page in dist/ that points
 *    inside the site must name a file there, and a #fragment must name an id on that page.
 *
 * 2. The front door, as it runs. The shelves, the faces, the readers and the Atlas are drawn
 *    by theme/press.js, so their links exist only in a browser. This opens every wing and
 *    every entry's reader in headless Chrome, gathers each link drawn, and checks the paths
 *    the same way. A #hash link is followed through the library's own router, and must land
 *    where it says: an unknown hash falls back to the front door without an error, so a
 *    mistyped #t/… link looks fine until a reader presses it.
 *
 * External links (reading lists, sources) are `npm run links`; they need the network.
 * Exits 1 on any failure. Written 2026-10-04. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CHROME } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const dist = (...a) => path.join(DIST, ...a);
if (!fs.existsSync(dist("index.html"))) { console.error("\n  no dist/ — run `npm run build` first\n"); process.exit(1); }

const SITE = fs.readFileSync(dist("sitemap.xml"), "utf8").match(/<loc>([^<]+?)\/<\/loc>/)[1];
const SITE_PATH = new URL(SITE + "/").pathname;
const fails = [];
const idCache = new Map();
const idsOf = f => {
  if (!idCache.has(f)) idCache.set(f, new Set([...fs.readFileSync(f, "utf8").matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
  return idCache.get(f);
};
const isFront = f => f === dist("index.html") || f === dist("404.html");

/* A link, resolved against the page it sits on, as a file in dist/. null if it leaves the site. */
function target(href, pageUrl) {
  if (/^(mailto:|tel:|data:|javascript:|blob:)/.test(href)) return null;
  let u; try { u = new URL(href, pageUrl); } catch { return { bad: "does not parse" }; }
  if (!u.href.startsWith(SITE + "/") && u.href !== SITE) return null;
  const rel = decodeURIComponent(u.pathname.slice(SITE_PATH.length));
  const file = !rel || rel.endsWith("/") ? dist(rel, "index.html") : dist(rel);
  return { file, hash: decodeURIComponent(u.hash.slice(1)), url: u };
}

/* fragments on the front door are routes, gathered here and followed in the browser */
const routes = new Map();                 // hash -> where it was found
function check(href, pageUrl, where) {
  const t = target(href, pageUrl);
  if (!t) return 0;
  if (t.bad) { fails.push(`${where}: ${href} ${t.bad}`); return 1; }
  if (!fs.existsSync(t.file)) { fails.push(`${where}: ${href} — no such page (${path.relative(ROOT, t.file)})`); return 1; }
  if (t.hash && !t.hash.startsWith(":~:") && t.file.endsWith(".html")) {
    if (isFront(t.file)) { if (!routes.has(t.hash)) routes.set(t.hash, where); }
    else if (!idsOf(t.file).has(t.hash)) fails.push(`${where}: ${href} — ${path.relative(DIST, t.file)} has no id="${t.hash}"`);
  }
  return 1;
}

/* ---------- 1. the built pages ---------- */
const pages = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const q = path.join(d, f);
    if (fs.statSync(q).isDirectory()) walk(q);
    else if (f.endsWith(".html") && !/^google[0-9a-f]+\.html$/.test(f)) pages.push(q);
  }
})(DIST);
let nStatic = 0;
for (const f of pages) {
  const rel = path.relative(DIST, f);
  // scripts hold templates (`href="t/${id}/"`), which the browser half checks as drawn
  const h = fs.readFileSync(f, "utf8").replace(/<script[\s\S]*?<\/script>/g, "");
  const base = (h.match(/<base href="([^"]+)"/) || [])[1];
  const pageUrl = base || SITE + "/" + rel.replace(/index\.html$/, "");
  for (const m of h.matchAll(/\s(?:href|src)="([^"]+)"/g)) nStatic += check(m[1].replace(/&amp;/g, "&"), pageUrl, rel);
}

/* ---------- 2. the front door, as it runs ---------- */
const PROBE = String.raw`<script>
addEventListener("load", () => setTimeout(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms)), out = { links: [], routes: [], err: [] };
  addEventListener("error", e => out.err.push(String(e.message)));
  const grab = where => document.querySelectorAll("a[href]").forEach(a => {
    const h = a.getAttribute("href");
    if (h && !h.startsWith("javascript:")) out.links.push([h, where]);
  });
  try {
    for (const [w] of WINGS) { go(w, false); await wait(500); grab("the " + w + " wing"); }
    await loadLibrary();
    for (const [kind, list] of [["press", ALL], ["lives", LIVES]]) for (const b of list) {
      openReader(kind, b.id, { push: false }); await wait(250);
      grab("the reader, " + (kind === "press" ? "t/" : "l/") + b.id);
      // a link inside the reader to one of its own sections must name a section that is there
      document.querySelectorAll("#reader a[href^='#']").forEach(a => {
        const id = a.getAttribute("href").slice(1);
        if (id && !/^(t|l|atlas)\//.test(id) && !document.getElementById(id) && !WINGS.some(w => w[0] === id) && id !== "corrections")
          out.err.push("the reader, " + b.id + ": " + a.getAttribute("href") + " names no section");
      });
      closeReader(false); await wait(60);
    }
    // every #route: follow it through the router and see where it lands
    const hashes = new Set(__ROUTES);
    out.links.forEach(([h]) => { const i = h.indexOf("#"); if (i >= 0 && !h.slice(0, i).replace(/^\.\//, "")) hashes.add(h.slice(i + 1)); });
    for (const h of hashes) {
      if (!h || h === "main") continue;
      if (current) closeReader(false);
      history.replaceState(null, "", "#" + h); route(false); await wait(450);
      let ok, got = "the " + wing + " wing" + (current ? ", reader " + current : "");
      if (h.startsWith("t/") || h.startsWith("l/")) ok = current === h.slice(2);
      else if (WINGS.some(w => w[0] === h)) ok = wing === h;
      else if (h === "corrections") ok = wing === "colophon" && !!document.getElementById("corrections");
      else if (h.startsWith("atlas/")) {
        const r = h.slice(6), slug = typeof window.slug === "function" ? window.slug : t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        ok = wing === "atlas" && (r.startsWith("p/") ? PEOPLE.some(p => slug(p.name) === r.slice(2))
          : r.startsWith("c/") ? (typeof echoList !== "function" || echoList().some(e => slug(e.idea) === r.slice(2)))
          : PRINCIPLES.some(p => p.id === r));
      } else ok = !!document.getElementById(h);   // a plain anchor on the front door
      out.routes.push([h, !!ok, got]);
    }
  } catch (e) { out.err.push("the probe stopped: " + e.message); }
  const o = document.createElement("script"); o.type = "application/json"; o.id = "__links";
  o.textContent = JSON.stringify(out).replace(/</g, "\\u003c"); document.body.appendChild(o);
}, 600));
</script>`;

let nLive = 0, nRoutes = 0;
if (!CHROME) {
  console.log("  No Chrome or Chromium found — the front door's drawn links were not checked. Set CHROME=/path.");
} else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cp-links-"));
  const page = fs.readFileSync(dist("index.html"), "utf8").replace("</body>", PROBE.replace("__ROUTES", JSON.stringify([...routes.keys()])) + "</body>");
  fs.writeFileSync(path.join(tmp, "index.html"), page);
  for (const f of fs.readdirSync(DIST).filter(f => /^library\.[0-9a-f]+\.js$/.test(f))) fs.copyFileSync(dist(f), path.join(tmp, f));
  let dom = "";
  try {
    dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=1280,900",
      "--virtual-time-budget=180000", "--dump-dom", `file://${path.join(tmp, "index.html")}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20, timeout: 300000 });
  } catch { /* reported below */ }
  fs.rmSync(tmp, { recursive: true, force: true });
  const m = dom.match(/<script type="application\/json" id="__links">([^]*?)<\/script>/);
  if (!m) fails.push("the front door: no results came back from Chrome — a script threw, or the page navigated away");
  else {
    const out = JSON.parse(m[1]);
    out.err.forEach(e => fails.push("the front door: " + e));
    const seen = new Set();
    for (const [h, where] of out.links) {
      if (seen.has(h)) continue; seen.add(h);
      if (h.startsWith("#")) continue;          // followed as a route below
      nLive += check(h, SITE + "/", where);
    }
    for (const [h, ok, got] of out.routes) {
      nRoutes++;
      if (!ok) fails.push(`${routes.get(h) || "the front door"}: #${h} — the library does not know this address; it opened ${got}`);
    }
  }
}

const g = s => `\x1b[32m${s}\x1b[0m`, r = s => `\x1b[31m${s}\x1b[0m`;
if (fails.length) {
  console.error(`\n${r("✗")} ${fails.length} link(s) inside the site lead nowhere:\n  ${fails.slice(0, 50).join("\n  ")}${fails.length > 50 ? `\n  … and ${fails.length - 50} more` : ""}\n`);
  process.exit(1);
}
console.log(`${g("✓")} every link inside the site leads somewhere — ${nStatic} on ${pages.length} built pages, ${nLive} distinct links drawn by the front door, ${nRoutes} #addresses followed through the router`);

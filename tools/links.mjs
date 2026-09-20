/* Commodore Press link checker — every link the house prints must still open.
   Run: npm run links        (exit 1 on any dead link)
        npm run links -- --all      ignore the cache, re-check everything
        npm run links -- --quiet    only print problems

   `npm run check` proves a URL is well-formed. Only this proves it resolves.
   A reading list that points at a 404 is a citation to a document nobody can open,
   which is the one failure the colophon cannot absorb. Two of them shipped in
   September 2026 and were found by hand; this is so the next one is found here.

   Results are cached in .cache/links.json so a re-run is fast and only new or
   previously-broken links go back over the network. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJSON } from "./json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);

const ARGS = new Set(process.argv.slice(2));
const FRESH = ARGS.has("--all");
const QUIET = ARGS.has("--quiet");

/* ---------- gather every link the site prints ---------- */
const load = d => {
  const full = p(d);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter(f => f.endsWith(".json")).sort()
    .map(f => ({ file: `${d}/${f}`, data: readJSON(path.join(full, f)) }));
};
const one = (f) => { try { return { file: f, data: readJSON(p(f)) }; } catch { return null; } };

const docs = [
  ...load("content/books"), ...load("content/adjacent"), ...load("content/lives"),
  one("content/atlas/sources.json"), one("content/atlas/people.json"),
  one("content/plate-licences.json"),
].filter(Boolean);

/* where each link lives, so a failure names the entry and the field */
const found = new Map();                       // url -> [ "file at path", ... ]
const walk = (node, file, at = "") => {
  if (node == null) return;
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, file, `${at}[${i}]`));
  if (typeof node === "object") return Object.entries(node).forEach(([k, v]) => {
    if ((k === "u" || k === "url" || k === "href") && typeof v === "string" && /^https?:/.test(v)) {
      if (!found.has(v)) found.set(v, []);
      found.get(v).push(`${file}${at}.${k}`);
    } else walk(v, file, `${at}.${k}`);
  });
};
docs.forEach(({ file, data }) => walk(data, file));

const urls = [...found.keys()].sort();
if (!urls.length) { console.log("no links to check"); process.exit(0); }

/* ---------- cache ---------- */
const CACHE = p(".cache/links.json");
let cache = {};
if (!FRESH && fs.existsSync(CACHE)) { try { cache = readJSON(CACHE); } catch { cache = {}; } }
const FRESH_FOR = 1000 * 60 * 60 * 24 * 14;    // re-check a good link fortnightly
const cached = u => {
  const c = cache[u];
  if (!c || c.state !== "ok") return null;     // never trust a cached failure
  return (Date.now() - c.at) < FRESH_FOR ? c : null;
};

/* ---------- check one link ----------
   Some hosts refuse HEAD, some refuse anything without a browser UA. A refusal is
   not the same as a dead document, so 401/403/405/429 warn rather than fail. */
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const TIMEOUT = 20000;

async function hit(url, method) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {
      method, redirect: "follow", signal: ac.signal,
      headers: { "user-agent": UA, "accept": "*/*", "accept-language": "en-US,en;q=0.9" },
    });
    return { status: r.status, final: r.url };
  } finally { clearTimeout(t); }
}

async function check(url) {
  try {
    let r = await hit(url, "HEAD");
    if (r.status >= 400) r = await hit(url, "GET");   // plenty of hosts only answer GET
    const { status, final } = r;
    if (status >= 200 && status < 400) {
      const moved = final && final.replace(/\/$/, "") !== url.replace(/\/$/, "");
      return { state: "ok", status, ...(moved ? { final } : {}) };
    }
    if ([401, 403, 405, 429].includes(status)) return { state: "blocked", status };
    return { state: "dead", status };
  } catch (e) {
    const msg = e?.name === "AbortError" ? "timed out" : (e?.cause?.code || e?.code || e?.message || "failed");
    return { state: /ENOTFOUND|EAI_AGAIN|ERR_NAME/.test(String(msg)) ? "dead" : "blocked", status: 0, note: String(msg) };
  }
}

/* ---------- run, a few at a time ---------- */
const todo = urls.filter(u => !cached(u));
if (!QUIET) {
  console.log(`\n${urls.length} link(s) across ${docs.length} file(s)` +
    (todo.length === urls.length ? "" : ` — ${urls.length - todo.length} still good from cache`));
  if (todo.length) process.stdout.write(`checking ${todo.length}: `);
}

const results = {};
urls.forEach(u => { const c = cached(u); if (c) results[u] = c; });

let done = 0;
const LANES = 8;
await Promise.all(Array.from({ length: Math.min(LANES, todo.length) }, async () => {
  while (todo.length) {
    const u = todo.shift();
    const r = await check(u);
    results[u] = { ...r, at: Date.now() };
    if (!QUIET) process.stdout.write(r.state === "ok" ? "·" : r.state === "dead" ? "✗" : "?");
    done++;
  }
}));
if (!QUIET && done) process.stdout.write("\n");

fs.mkdirSync(path.dirname(CACHE), { recursive: true });
fs.writeFileSync(CACHE, JSON.stringify(results, null, 2) + "\n");

/* ---------- report ---------- */
const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", d: "\x1b[2m", x: "\x1b[0m" };
const where = u => found.get(u).map(w => `\n      ${c.d}${w}${c.x}`).join("");

const dead = urls.filter(u => results[u].state === "dead");
const blocked = urls.filter(u => results[u].state === "blocked");
const moved = urls.filter(u => results[u].state === "ok" && results[u].final);

if (moved.length) {
  console.log(`\n${c.y}${moved.length} link(s) that redirect — the printed URL is not where the reader lands${c.x}`);
  moved.forEach(u => console.log(`  ${c.y}·${c.x} ${u}\n      ${c.d}→ ${results[u].final}${c.x}${where(u)}`));
}
if (blocked.length) {
  console.log(`\n${c.y}${blocked.length} link(s) the checker could not confirm — open by hand before trusting${c.x}`);
  blocked.forEach(u => console.log(`  ${c.y}·${c.x} ${u} ${c.d}(${results[u].note || results[u].status})${c.x}${where(u)}`));
}
if (dead.length) {
  console.log(`\n${c.r}${dead.length} dead link(s)${c.x}`);
  dead.forEach(u => console.log(`  ${c.r}✗${c.x} ${u} ${c.d}(${results[u].note || results[u].status})${c.x}${where(u)}`));
  console.log(`\n${c.d}  A dead reading link is a source no reader can open. Repoint it or remove it.${c.x}`);
}
if (!dead.length) console.log(`\n${c.g}✓ every link opens${c.x} ${c.d}— ${urls.length} checked${blocked.length ? `, ${blocked.length} unconfirmed` : ""}${c.x}`);
process.exit(dead.length ? 1 : 0);

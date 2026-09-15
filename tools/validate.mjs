/* Commodore Press validator — enforces the house rules the site promises publicly.
   Run: npm run check   (exit 1 on any error; warnings never block a build) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJSON, unknownKeys } from "./json.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);

const errors = [], warns = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warns.push(`${where}: ${msg}`);

const load = d => {
  const full = p(d);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter(f => f.endsWith(".json")).sort().map(f => {
    try { return { file: `${d}/${f}`, data: readJSON(path.join(full, f)) }; }
    catch (e) { err(`${d}/${f}`, e.message); return null; }
  }).filter(Boolean);
};
const one = f => { try { return readJSON(p(f)); } catch (e) { err(f, e.message); return null; } };

const books = load("content/books"), adjacent = load("content/adjacent");
const lives = load("content/lives"), manuals = load("content/manuals");
const domains = one("content/atlas/domains.json") || [];
const dcolor = one("content/atlas/domain-colors.json") || {};
const principles = one("content/atlas/principles.json") || [];
const people = one("content/atlas/people.json") || [];
const sources = one("content/atlas/sources.json") || [];
const slipway = one("content/slipway/slipway.json") || {};
const corrections = one("content/corrections.json") || [];
const httpOK = one("content/http-allowlist.json") || {};

/* ---------- field names match schemas/ — the same files that give the editor its hover help ----------
   A misspelt field is valid JSON, and the page silently drops it. Adding a real new field
   means describing it in schemas/ in the same change, which is how the help stays true. */
const schema = n => one(`schemas/${n}.schema.json`);
const titleS = schema("title");
if (titleS) titleS.$others = { "title.schema.json": titleS };
const lifeS = schema("life");
if (lifeS) lifeS.$others = { "title.schema.json": titleS };
const fieldsOf = (s, data, file) => s && unknownKeys(s, data).forEach(({ at, near }) =>
  err(file, `unknown field \`${at}\`${near ? ` — did you mean \`${near}\`?` : ""} The site ignores it, so it would not show.`));
[...books, ...adjacent].forEach(({ file, data }) => fieldsOf(titleS, data, file));
lives.forEach(({ file, data }) => fieldsOf(lifeS, data, file));
manuals.forEach(({ file, data }) => fieldsOf(schema("manual"), data, file));
fieldsOf(schema("people"), people, "content/atlas/people.json");
fieldsOf(schema("principles"), principles, "content/atlas/principles.json");
fieldsOf(schema("domains"), domains, "content/atlas/domains.json");
fieldsOf(schema("sources"), sources, "content/atlas/sources.json");
fieldsOf(schema("slipway"), slipway, "content/slipway/slipway.json");
fieldsOf(schema("corrections"), corrections, "content/corrections.json");

/* ---------- ids must be unique and stable: they are the site's permalinks ---------- */
const seen = new Map();
const claim = (id, file) => {
  if (!id) return err(file, "missing `id` — it is the permalink, it must exist");
  if (seen.has(id)) err(file, `duplicate id "${id}" (also in ${seen.get(id)})`);
  seen.set(id, file);
};
[...books, ...adjacent].forEach(({ file, data }) => claim(data.id, file));
lives.forEach(({ file, data }) => claim(data.id, file));
manuals.forEach(({ file, data }) => claim("manual:" + data.id, file));

/* ---------- required fields ---------- */
const need = (file, data, keys) => keys.forEach(k => {
  const v = data[k];
  const empty = v == null || v === "" || (Array.isArray(v) && v.length === 0);
  if (empty) err(file, `missing \`${k}\``);
});

for (const { file, data } of [...books, ...adjacent]) {
  need(file, data, ["id", "title", "field", "cover", "claim", "lede", "copy", "keep"]);
  if (Array.isArray(data.copy) && data.copy.length < 2) warn(file, "only one paragraph of copy — thin for a title");
}
for (const { file, data } of lives) {
  need(file, data, ["id", "n", "years", "field", "cover", "lede", "copy", "keep"]);
  if (!data.bio) warn(file, "no `bio` — the reader shows no 'find the book' link without one");
  else if (!data.bio.t || !data.bio.a) err(file, "`bio` needs both `t` (title) and `a` (author)");
}
for (const { file, data } of manuals) need(file, data, ["id", "num", "title", "entries"]);

/* ---------- house rule: `keep` is the one-line takeaway ---------- */
for (const { file, data } of [...books, ...adjacent, ...lives]) {
  const k = data.keep;
  if (typeof k !== "string" || !k) continue;
  if (k.length > 220) warn(file, `\`keep\` is ${k.length} chars — it is meant to be one line`);
  if (/\n/.test(k)) err(file, "`keep` must be a single line");
}

/* ---------- house rule: figures carry named sources; disputes go in `contested` ---------- */
for (const { file, data } of books) {
  if (!data.reading || !data.reading.length) err(file, "no `reading` — every title must name where to go next");
  if (!data.contested) warn(file, "no `contested` — say where this is still argued, or say why it isn't");
  (data.facts || []).forEach((f, i) => {
    if (!f.s) err(file, `facts[${i}] has a number with no source line`);
  });
  (data.figures || []).forEach((f, i) => { if (!f.n || !f.d) err(file, `figures[${i}] needs \`n\` and \`d\``); });
  (data.timeline || []).forEach((t, i) => { if (!t.y || !t.t) err(file, `timeline[${i}] needs \`y\` and \`t\``); });
}

/* ---------- every URL must be well-formed and https ---------- */
const walkUrls = (node, file, at = "") => {
  if (node == null) return;
  if (Array.isArray(node)) return node.forEach((v, i) => walkUrls(v, file, `${at}[${i}]`));
  if (typeof node === "object") return Object.entries(node).forEach(([k, v]) => {
    if ((k === "u" || k === "url" || k === "href") && typeof v === "string") {
      let ok = false; try { const u = new URL(v); ok = u.protocol === "https:" || u.protocol === "http:"; } catch {}
      if (!ok) err(file, `${at}.${k} is not a usable URL: ${JSON.stringify(v).slice(0, 60)}`);
      else if (v.startsWith("http://") && !httpOK[v]) warn(file, `${at}.${k} is http, not https — fix it, or record why in content/http-allowlist.json`);
    } else walkUrls(v, file, `${at}.${k}`);
  });
};
[...books, ...adjacent, ...lives, ...manuals].forEach(({ file, data }) => walkUrls(data, file));
walkUrls(sources, "content/atlas/sources.json");
walkUrls(slipway, "content/slipway/slipway.json");

/* ---------- cross-wing links must resolve ---------- */
const manualIds = new Set(manuals.map(m => m.data.id));
const pressIds = new Set([...books, ...adjacent].map(b => b.data.id));
const lifeIds = new Set(lives.map(l => l.data.id));
const prIds = new Set(principles.map(x => x.id));
for (const { file, data } of [...books, ...adjacent, ...lives]) {
  (data.across || []).forEach((a, i) => {
    if (!a.to || !a.label) return err(file, `across[${i}] needs \`to\` and \`label\``);
    const [wing, key] = String(a.to).split(":");
    const table = { manuals: manualIds, press: pressIds, lives: lifeIds, atlas: prIds }[wing];
    if (!table) err(file, `across[${i}] points at unknown wing "${wing}"`);
    else if (key && !table.has(key)) err(file, `across[${i}] points at "${a.to}", which does not exist`);
  });
}

/* ---------- atlas integrity ---------- */
const domIds = new Set(domains.map(d => d.id));
domains.forEach(d => { if (!dcolor[d.id]) err("content/atlas/domain-colors.json", `no colour for domain "${d.id}"`); });
people.forEach((x, i) => {
  const at = `content/atlas/people.json[${i}] (${x.name || "unnamed"})`;
  if (!x.name || !x.domain || !x.take) err(at, "needs `name`, `domain` and `take`");
  if (x.domain && !domIds.has(x.domain)) err(at, `unknown domain "${x.domain}"`);
  (x.p || []).forEach(pid => { if (!prIds.has(pid)) err(at, `unknown principle "${pid}"`); });
  if (!(x.p || []).length) warn(at, "belongs to no principle — will float unconnected in the Atlas");
});
principles.forEach(pr => {
  const n = people.filter(x => (x.p || []).includes(pr.id)).length;
  if (n === 0) warn("content/atlas/principles.json", `principle "${pr.id}" has no people and will not render`);
});
if (!sources.length) warn("content/atlas/sources.json", "the Atlas claims sources — none are listed");

/* ---------- plates line up with lives ---------- */
const platesDir = p("assets/plates");
if (fs.existsSync(platesDir)) {
  const plateIds = fs.readdirSync(platesDir).filter(f => !f.startsWith(".")).map(f => path.basename(f, path.extname(f)));
  plateIds.forEach(id => { if (!lifeIds.has(id)) warn("assets/plates", `${id} has no matching life — it will never be shown`); });
  const missing = [...lifeIds].filter(id => !plateIds.includes(id));
  if (missing.length) warn("assets/plates", `${missing.length} live(s) with no portrait, showing the press mark: ${missing.join(", ")}`);
  for (const f of fs.readdirSync(platesDir).filter(f => !f.startsWith("."))) {
    const kb = fs.statSync(path.join(platesDir, f)).size / 1024;
    if (kb > 60) warn(`assets/plates/${f}`, `${kb.toFixed(0)} KB — heavy for a plate; re-run the plate tool`);
  }
}

/* ---------- corrections are append-only, so they must at least be complete ---------- */
corrections.forEach((c, i) => { if (!c.d || !c.t || !c.b) err("content/corrections.json", `[${i}] needs \`d\` (date), \`t\` (title) and \`b\` (body)`); });

/* ---------- slipway ---------- */
(slipway.book || []).forEach((l, i) => { if (!l.t) err("content/slipway/slipway.json", `book[${i}] has no line`); });

/* ---------- nothing half-written may reach the shelf ---------- */
const todos = (node, file, at = "") => {
  if (typeof node === "string") { if (/^\s*TODO\b/.test(node)) err(file, `${at || "value"} is still a TODO`); return; }
  if (Array.isArray(node)) return node.forEach((v, i) => todos(v, file, `${at}[${i}]`));
  if (node && typeof node === "object") Object.entries(node).forEach(([k, v]) => todos(v, file, at ? `${at}.${k}` : k));
};
[...books, ...adjacent, ...lives, ...manuals].forEach(({ file, data }) => todos(data, file));

/* ---------- report ---------- */
const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", d: "\x1b[2m", x: "\x1b[0m" };
if (warns.length) { console.log(`\n${c.y}${warns.length} warning(s)${c.x}`); warns.forEach(w => console.log(`  ${c.y}·${c.x} ${w}`)); }
if (errors.length) { console.log(`\n${c.r}${errors.length} error(s)${c.x}`); errors.forEach(e => console.log(`  ${c.r}✗${c.x} ${e}`)); }
if (!errors.length) console.log(`\n${c.g}✓ house rules hold${c.x} ${c.d}— ${books.length} titles, ${lives.length} lives, ${people.length} people, ${corrections.length} corrections${c.x}`);
process.exit(errors.length ? 1 : 0);

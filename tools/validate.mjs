/* Commodore Press validator — enforces the house rules the site promises publicly.
   Run: npm run check   (exit 1 on any error; warnings never block a build) */
import { lifeStamp } from "./cards.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJSON, unknownKeys } from "./json.mjs";
import { loadLog, logRefs, hasSources } from "../build/log.mjs";

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
const lives = load("content/lives");
const domains = one("content/atlas/domains.json") || [];
const dcolor = one("content/atlas/domain-colors.json") || {};
const principles = one("content/atlas/principles.json") || [];
const people = one("content/atlas/people.json") || [];
const sources = one("content/atlas/sources.json") || [];
const echoes = one("content/atlas/echoes.json") || [];
const corrections = one("content/corrections.json") || [];
const httpOK = one("content/http-allowlist.json") || {};
const plateLic = one("content/plate-licences.json") || {};

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
fieldsOf(schema("people"), people, "content/atlas/people.json");
fieldsOf(schema("principles"), principles, "content/atlas/principles.json");
fieldsOf(schema("domains"), domains, "content/atlas/domains.json");
fieldsOf(schema("sources"), sources, "content/atlas/sources.json");
fieldsOf(schema("echoes"), echoes, "content/atlas/echoes.json");
/* an echo names people on the chart, at least two of them, or it connects nobody */
echoes.forEach(e => { const who = (e.notes || []).map(n => n.who); who.forEach(w => { if (!people.some(p => p.name === w)) err("content/atlas/echoes.json", `"${e.idea}" names ${w}, who is not in people.json`); }); if (new Set(who).size < 2) err("content/atlas/echoes.json", `"${e.idea}" needs notes on at least two different people`); });
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

/* ---------- house rule: `keep` is the one-line takeaway ---------- */
for (const { file, data } of [...books, ...adjacent, ...lives]) {
  const k = data.keep;
  if (typeof k !== "string" || !k) continue;
  if (k.length > 220) warn(file, `\`keep\` is ${k.length} chars — it is meant to be one line`);
  if (/\n/.test(k)) err(file, "`keep` must be a single line");
}

/* ---------- house rule: figures carry named sources, in EVERY wing ----------
   The colophon promises the reader that every figure carries a named source. Until
   2026-09-19 this rule ran on `books` alone, because only Wing I had a `facts` field —
   so the promise was enforced on the titles and merely hoped for on the lives, which
   carry the denser numbers of the two (35.3 per 1,000 words against 23.4). */
for (const { file, data } of [...books, ...adjacent, ...lives]) {
  (data.facts || []).forEach((f, i) => {
    if (!f.b) err(file, `facts[${i}] has a source with no number`);
    if (!f.s) err(file, `facts[${i}] has a number with no source line`);
  });
}

/* ---------- a source line has to name a source ----------
   The check above proves `s` is not empty. It never proved `s` names anything: on
   2026-09-21, 50-odd of the 112 lines in Wing I described their number ("Length of
   Freire's exile after the 1964 coup") and named no document at all, and two of those
   numbers turned out to be wrong (correction 10). The house shape is
   "what it counts: where it was read" — the colon is the seam, and the part after it is
   the document. WARNING FOR NOW, ERROR ONCE WING I IS BACKFILLED; row in
   dashboard/commissions.md. A line that is itself a citation (Patterson's paper, Kaplan
   et al.) passes by being rewritten into the shape, which takes a minute. */
{
  const bare = new Map();
  for (const { file, data } of [...books, ...adjacent, ...lives])
    for (const f of data.facts || []) if (f.s && !/:\s*\S/.test(f.s)) bare.set(file, [...(bare.get(file) || []), f.b]);
  if (bare.size) warn("facts", `${[...bare.values()].flat().length} source line(s) in ${bare.size} entries name no document — ` +
    `write each as "what it counts: where it was read". ${[...bare.keys()].map(f => f.replace(/^content\/\w+\/(\d+-)?/, "").replace(".json", "")).join(", ")}`);
}

/* ---------- a life that states a hard figure needs somewhere to source it ----------
   Years, ages and centuries are excluded: they are carried by `years` and by the entry's
   own chronology, and flagging them would train the reader of this output to ignore it.
   What is caught is the checkable kind — money, percentages, magnitudes, measured
   quantities. Promoted from warning to ERROR on 2026-09-21, when the last of Wing II's
   backlog was sourced or cut (corrections 9 and 11). */
const MAG = "billion|million|thousand|hundred";
const SPELLED = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|"
              + "fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|"
              + "seventy|eighty|ninety";
const HARD_FIGURE = new RegExp([
  `[$£€]\\s?[\\d.,]+(?:\\s*(?:${MAG}))?`,                     // $480 million, $27 billion
  `\\b[\\d.,]+\\s*(?:per cent|percent|%)`,                    // 78 per cent
  `\\b(?:${SPELLED})(?:[- ](?:${SPELLED}))?\\s+(?:per cent|percent)`, // ninety per cent
  `\\b(?:[\\d.,]+|an?)\\s*(?:${MAG})\\b`,                     // 4.55 billion · "a billion or more"
  `\\b[\\d.,]+\\s*(?:acres|miles|tonnes|tons|doses|extracts)\\b`,
  `\\b(?:${SPELLED})(?:[- ](?:${SPELLED}))?\\s+(?:${MAG}|acres|nautical|doses|extracts)\\b`,
].join("|"), "i");

/* An entry with no `facts` block is named for EVERY hard figure it states, not just the
   first. That was the old behaviour and it undercounted badly: Steve Jobs reported one
   figure and states six, Tu Youyou reported one and states three. The backfill needs the
   real list, not a sample.

   An entry that HAS a `facts` block is still skipped entirely, and that is a deliberate
   limit rather than an oversight. Per-figure matching against the block was written and
   tested here on 2026-09-20, and it was wrong on every entry that had done the work:
   Patterson's prose says "4.55 billion" where his block says `4.55 bn yrs`, and "a
   hundred times" where the block says `100×`; Nightingale's "36 per cent" is the block's
   `4,522 / 12,518` restated as a rate. A figure can be sourced and reworded, rounded,
   abbreviated or derived, and nothing short of reading can tell that from an unsourced
   one. Flagging those would train a reader to skip this output, which costs more than the
   case it catches. Promote this to per-figure only with a matcher that survives those
   four cases. */
for (const { file, data } of lives) {
  if (data.facts && data.facts.length) continue;
  const said = new Map();                        // lower-cased wording -> as written
  for (const para of data.copy || [])
    for (const m of para.matchAll(new RegExp(HARD_FIGURE.source, "gi")))
      said.set(m[0].trim().toLowerCase(), m[0].trim());
  if (!said.size) continue;
  const list = [...said.values()].map(x => `"${x}"`).join(", ");
  err(file, `states ${list} with no \`facts\` block — ` +
    `${said.size > 1 ? `${said.size} figures carry` : "the figure carries"} no named source`);
}

/* ---------- the Log: signed opinion, held to the same rules on evidence ----------
   Two wings came down in September 2026 for stating positions nobody stood behind. The
   Log is the answer, not a return: every piece is signed and dated. What a signature does
   not buy is a pass on evidence, so a published piece that states a hard figure needs a
   `## Sources` section, its references must resolve, and nothing marked TODO prints.
   Quotation marks cannot be checked by a machine; /press-proofread reads for those. */
const logS = schema("log");
const LOG_FIELDS = logS ? Object.keys(logS.properties) : [];
const known = { press: new Set([...books, ...adjacent].map(x => x.data.id)), lives: new Set(lives.map(x => x.data.id)),
  atlas: new Set(principles.map(x => x.id)) };
const slugs = new Map();
const today = new Date().toISOString().slice(0, 10);
for (const x of loadLog(ROOT)) {
  const f = x.file, m = x.meta;
  x.problems.forEach(pr => err(f, pr));
  if (!x.fileDate) err(f, "name the file `YYYY-MM-DD-slug.md` — the date orders the Log and the slug is the permalink");
  Object.keys(m).filter(k => !LOG_FIELDS.includes(k)).forEach(k => err(f, `unknown front-matter name \`${k}\` — the Log knows ${LOG_FIELDS.join(", ")}`));
  ["title", "date", "dek", "status"].forEach(k => { if (!m[k]) err(f, `missing \`${k}\` in the front matter`); });
  if (m.status && !["draft", "published"].includes(m.status)) err(f, `\`status\` is "${m.status}" — it must be draft or published`);
  if (m.date && !/^\d{4}-\d{2}-\d{2}$/.test(m.date)) err(f, `\`date\` "${m.date}" must be YYYY-MM-DD`);
  else if (m.date && x.fileDate && m.date !== x.fileDate) err(f, `\`date\` ${m.date} does not match the filename's ${x.fileDate} — rename the file or fix the date`);
  if (slugs.has(x.slug)) err(f, `slug "${x.slug}" is already used by ${slugs.get(x.slug)} — it is the permalink, it must be unique`);
  slugs.set(x.slug, f);
  // a draft still carrying the scaffold's TODOs is unfinished, not wrong; it is held to this once published
  if (!x.published && /\bTODO\b/.test(m.across || "")) continue;
  for (const r of logRefs(x)) {
    const [w, id] = r.split(":");
    if (!known[w]) err(f, `"${r}" — a reference starts press:, lives: or atlas:`);
    else if (!known[w].has(id)) err(f, `"${r}" points at nothing — no ${w === "atlas" ? "principle" : "entry"} has the id "${id}"`);
  }
  if (!x.published) continue;
  if (/\bTODO\b/.test(x.body + JSON.stringify(m))) err(f, "published, and still says TODO — it would print");
  if (!x.body.trim()) err(f, "published with nothing below the front matter");
  const figs = [...new Set([...x.body.split(/^##\s+Sources/im)[0].matchAll(new RegExp(HARD_FIGURE.source, "gi"))].map(q => q[0].trim()))];
  if (figs.length && !hasSources(x.body))
    err(f, `states ${figs.map(q => `"${q}"`).join(", ")} with no \`## Sources\` section — a number with no source does not ship, signed or not`);
  if (!x.across.length) warn(f, "no `across` — the Log argues with the library; name what this piece reads against");
  if (m.date > today) warn(f, `dated ${m.date}, in the future — it will publish with that date`);
}

/* ---------- an entry's corrections point at real ones ----------
   Corrections are matched to entries by hand, in the entry's `corrected` list, because
   matching by name was tried on 2026-09-21 and was wrong both ways: it tied a Field Manual
   correction to Rockefeller's life and missed Harrison's prize entirely. */
for (const { file, data } of [...books, ...adjacent, ...lives])
  (data.corrected || []).forEach(n => {
    if (!Number.isInteger(n) || n < 1 || n > corrections.length) err(file, `\`corrected\` lists ${n}, but the colophon has corrections 1–${corrections.length}`);
  });
/* a half-added person (npm run new person) cannot ship: every TODO must be answered */
people.forEach(x => { const t = JSON.stringify(x); if (/TODO/.test(t)) err(`content/atlas/people.json (${x.name})`, "still has TODOs — answer them, or remove the person until the notes are ready"); });
people.forEach(x => (x.mentions || []).forEach(m => {
  if (!m.to || !m.to.startsWith("lives:") || !known.lives.has(m.to.slice(6))) err(`content/atlas/people.json (${x.name})`, `\`mentions\` points at "${m.to}", which is not a Life on the shelf`);
}));
people.forEach(x => (x.corrected || []).forEach(n => {
  if (!Number.isInteger(n) || n < 1 || n > corrections.length) err(`content/atlas/people.json (${x.name})`, `\`corrected\` lists ${n}, but the colophon has corrections 1–${corrections.length}`);
}));

/* ---------- "Go to the source" has to go to it ----------
   On 2026-09-21, 16 books in reading lists linked to Wikipedia's article about the book —
   four to the author's page — under a heading that promises the source. A Wikipedia link is
   allowed, but only when the line says so, so a reader knows it is a summary. */
for (const { file, data } of [...books, ...adjacent])
  (data.reading || []).forEach((r, i) => {
    if (/wikipedia\.org/.test(r.u || "") && !/wikipedia|reference/i.test(r.a || ""))
      err(file, `reading[${i}] "${r.t}" links to Wikipedia but is labelled as the work itself — link the work (or a library lookup), or say "Wikipedia" in \`a\``);
  });

/* ---------- Wing I also owes a reading list and a dispute ---------- */
for (const { file, data } of books) {
  if (!data.reading || !data.reading.length) err(file, "no `reading` — every title must name where to go next");
  if (!data.contested) warn(file, "no `contested` — say where this is still argued, or say why it isn't");
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
[...books, ...adjacent, ...lives].forEach(({ file, data }) => walkUrls(data, file));
walkUrls(sources, "content/atlas/sources.json");

/* ---------- cross-wing links must resolve ---------- */
const pressIds = new Set([...books, ...adjacent].map(b => b.data.id));
const lifeIds = new Set(lives.map(l => l.data.id));
const prIds = new Set(principles.map(x => x.id));
for (const { file, data } of [...books, ...adjacent, ...lives]) {
  (data.across || []).forEach((a, i) => {
    if (!a.to || !a.label) return err(file, `across[${i}] needs \`to\` and \`label\``);
    const [wing, key] = String(a.to).split(":");
    const table = { press: pressIds, lives: lifeIds, atlas: prIds }[wing];
    if (!table) err(file, `across[${i}] points at unknown wing "${wing}"`);
    else if (key && !table.has(key)) err(file, `across[${i}] points at "${a.to}", which does not exist`);
  });
}

/* ---------- a link the other entry does not return ----------
   content/CLAUDE.md asks for the reciprocal link on the other entry, and nothing checked
   it, so a link could be added from one side and quietly stay one-way. Reported as a
   single line rather than one per pair: this file's own plate rule is that a report
   nobody can read in one glance teaches the reader to skim the warnings that matter.
   `atlas:` links are excluded — the principles carry no `across` of their own, so they
   are one-way by design and not by omission. */
{
  const entryOf = e => (e.file.includes("/lives/") ? "lives:" : "press:") + e.data.id;
  const entries = [...books, ...adjacent, ...lives];
  const out = new Map(entries.map(e => [entryOf(e), new Set((e.data.across || []).map(a => a.to))]));
  const oneWay = [];
  for (const e of entries) {
    for (const a of e.data.across || []) {
      if (!a.to || a.to.startsWith("atlas")) continue;
      const back = out.get(a.to);
      if (back && !back.has(entryOf(e))) oneWay.push(`${entryOf(e)} → ${a.to}`);
    }
  }
  if (oneWay.length)
    warn("content/", `${oneWay.length} across link(s) the other entry does not return: ${oneWay.join(", ")}`);
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

/* ---------- Wing III owes its sources too ----------
   "Lines I kept" prints words under a named, mostly living person. Until 2026-09-20 every
   one of them was a bare string with no record of where it was said, printed as if quoted.

   Two shapes now, and they print differently (keptHTML in theme/press.js):
     { k, s }  a quotation: verbatim, with the episode and timestamp. Checked here.
     "string"  a note, printed "after <name>" and labelled as not a quotation.
   A bare string is therefore honest as it stands and is not warned about. What is an
   error is the half-sourced object: a quotation missing its source, or a source with no
   line. The way to upgrade a note is to re-hear it and give it an `s` — never a guessed
   timestamp, which would print a quotation nobody checked. */
people.forEach(x => {
  (x.kept || []).forEach(k => {
    if (typeof k === "string") return;
    if (!k || !k.k || !k.s)
      err(`content/atlas/people.json (${x.name})`, "a quoted `kept` entry needs both `k` (the line) and `s` (where it was said) — or make it a plain string, which prints as a note");
  });
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
  /* A life carrying `plateless` has been decided, not forgotten — it says why in the
     field, and the entry argues it on the page. Warning about it every run would teach
     the reader of this report to skim the warnings that matter. */
  const byDecision = new Set(lives.filter(l => l.data.plateless).map(l => l.data.id));
  const missing = [...lifeIds].filter(id => !plateIds.includes(id) && !byDecision.has(id));
  if (missing.length) warn("assets/plates", `${missing.length} live(s) with no portrait, showing the press mark: ${missing.join(", ")}`);
  for (const f of fs.readdirSync(platesDir).filter(f => !f.startsWith("."))) {
    const kb = fs.statSync(path.join(platesDir, f)).size / 1024;
    if (kb > 60) warn(`assets/plates/${f}`, `${kb.toFixed(0)} KB — heavy for a plate; re-run the plate tool`);
  }

  /* ---------- a licensed plate owes its credit, and the credit must be on the page ----------
     CLAUDE.md asks for the colophon credit line "in the same change", and until now nothing
     could check it: the licences lived only in colophon prose, so the disclosure could say
     "one CC BY credit" for months after the body had grown to three. An attribution licence
     is breached by a missing credit, not merely untidied, so this is an error. */
  const shell = fs.existsSync(p("templates/shell.html")) ? fs.readFileSync(p("templates/shell.html"), "utf8") : "";
  for (const [id, lic] of Object.entries(plateLic)) {
    if (id.startsWith("_")) continue;
    const at = "content/plate-licences.json";
    if (!lic.licence || !lic.credit) { err(at, `${id} needs both \`licence\` and \`credit\``); continue; }
    if (!lifeIds.has(id)) { err(at, `${id} is not a life — a licence with nothing to license`); continue; }
    if (!plateIds.includes(id)) { warn(at, `${id} has a recorded licence but no plate on disk`); continue; }
    if (!shell.includes(lic.credit))
      err(at, `${id} is ${lic.licence} and its credit line is not in the colophon — the licence requires it`);
  }
}

/* ---------- corrections are append-only, so they must at least be complete ---------- */
corrections.forEach((c, i) => { if (!c.d || !c.t || !c.b) err("content/corrections.json", `[${i}] needs \`d\` (date), \`t\` (title) and \`b\` (body)`); });

/* ---------- nothing half-written may reach the shelf ---------- */
const todos = (node, file, at = "") => {
  if (typeof node === "string") { if (/^\s*TODO\b/.test(node)) err(file, `${at || "value"} is still a TODO`); return; }
  if (Array.isArray(node)) return node.forEach((v, i) => todos(v, file, `${at}[${i}]`));
  if (node && typeof node === "object") Object.entries(node).forEach(([k, v]) => todos(v, file, at ? `${at}.${k}` : k));
};
[...books, ...adjacent, ...lives].forEach(({ file, data }) => todos(data, file));

/* ---------- a livery must be readable, as the reader actually renders it ----------
   Liveries are hand-picked once the palette in tools/new.mjs runs out, and nothing used to
   check them: four entries shipped with prose under WCAG AA on their own covers. The check
   is not ink-on-cover at full strength, because the reader never renders it that way — the
   prose sits at the opacity `.rbody .copy` sets and the small uppercase labels at the one
   `.rbody h4` sets. Both are read out of theme/press.css, so changing the reader's opacity
   changes what this measures instead of leaving it checking a number nobody uses.
   Books, plates and readers keep their liveries in night mode, so one check covers all three
   modes. Prose is an error; the labels are a warning. */
const css = fs.existsSync(p("theme/press.css")) ? fs.readFileSync(p("theme/press.css"), "utf8") : "";
const opacityOf = (sel, fallback) => {
  const m = css.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{[^}]*?opacity:\\s*([0-9.]+)"));
  return m ? parseFloat(m[1]) : fallback;
};
const PROSE = opacityOf(".rbody .copy", 0.92), LABELS = opacityOf(".rbody h4", 0.8), AA = 4.5;
const rgb = h => [0, 2, 4].map(i => parseInt(h.slice(1 + i, 3 + i), 16));
const lum = h => rgb(h).map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const blend = (fg, bg, a) => "#" + rgb(fg).map((v, i) => Math.round(v * a + rgb(bg)[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const HEX = /^#[0-9a-fA-F]{6}$/;
[...books, ...adjacent, ...lives].forEach(({ file, data }) => {
  const { ink, cover } = data;
  if (!HEX.test(ink || "") || !HEX.test(cover || "")) return;   // a malformed colour is the schema's job
  const prose = contrast(blend(ink, cover, PROSE), cover), labels = contrast(blend(ink, cover, LABELS), cover);
  if (prose < AA) err(file, `livery prose is ${prose.toFixed(2)}:1 on its own cover (ink ${ink} at ${PROSE} on ${cover}); needs ${AA}:1 — darken \`cover\` and \`spineC\` together`);
  else if (labels < AA) warn(file, `livery labels are ${labels.toFixed(2)}:1 (ink ${ink} at ${LABELS} on ${cover}); the reader's small uppercase apparatus needs ${AA}:1`);
});

/* ---------- the newsletter: a form that posts somewhere real, and a named holder ----------
   The colophon tells readers who holds their address. A form with no named provider would
   make that sentence print with a blank in it. */
{
  const n = one("content/newsletter.json");
  if (n) {
    fieldsOf(schema("newsletter"), n, "content/newsletter.json");
    if (n.action) {
      if (!/^https:\/\/[^\s]+$/.test(n.action)) err("content/newsletter.json", "`action` must be an https:// address from your newsletter service");
      if (!n.provider) err("content/newsletter.json", "`action` is set but `provider` is empty — the colophon has to say who holds subscribers' addresses");
      if (/\/username\/|<|>/.test(n.action)) err("content/newsletter.json", "`action` still has the example's placeholder in it — put your own username in");
    }
  }
}

/* ---------- Captain of the day: a crew the editor picked, every one on the shelf ----------
   The list is chosen by hand so nobody is cast as a captain by default. A name that is not
   a life would print an empty card on the front door. */
{
  const c = fs.existsSync(p("content/captains.json")) ? one("content/captains.json") : null;
  if (c) {
    fieldsOf(schema("captains"), c, "content/captains.json");
    const ids = new Set(lives.map(l => l.data.id));
    for (const id of c.crew || []) if (!ids.has(id)) err("content/captains.json", `"${id}" is not a life on the shelf — use its id from content/lives/`);
    const dup = (c.crew || []).filter((id, i, a) => a.indexOf(id) !== i);
    if (dup.length) err("content/captains.json", `${dup.join(", ")} listed twice — each captain takes one turn`);
  }
}

/* ---------- the share card must say what the shelves say ----------
   assets/og.png prints the counts, and it is only re-rendered by hand (`npm run card`),
   because it needs Chrome. tools/og-card.mjs records what it printed in og.counts.json. */
{
  const said = fs.existsSync(p("assets/og.counts.json")) ? readJSON(p("assets/og.counts.json")) : null;
  const now = { titles: books.length, lives: lives.length, people: people.length };
  if (!said) warn("assets/og.png", "no record of what the share card says — run `npm run card` once");
  else if (["titles", "lives", "people"].some(k => said[k] !== now[k]))
    warn("assets/og.png", `the share card says ${said.titles} titles · ${said.lives} lives · ${said.people} people; the shelves hold ${now.titles} · ${now.lives} · ${now.people}. Run \`npm run card\` and look at it`);
}

/* ---------- each title's share card must still say what the title says ----------
   `npm run card` records the name, claim and cover each card printed. A renamed title or a
   rewritten claim would otherwise keep previewing its old self on every shared link. */
{
  const f = p("assets/cards/index.json");
  const said = fs.existsSync(f) ? readJSON(f) : {};
  const stale = [], missing = [];
  for (const { data: t } of [...books, ...adjacent]) {
    const now = [t.title, t.claim || t.sub || "", t.cover].join(" | ");
    if (!said[t.id]) missing.push(t.id); else if (said[t.id] !== now) stale.push(t.id);
  }
  // lives: the stamp tools/og-card.mjs writes, from the same function (tools/cards.mjs)
  const LIC = fs.existsSync(p("content/plate-licences.json")) ? readJSON(p("content/plate-licences.json")) : {};
  for (const { data: l } of lives) {
    const now = lifeStamp(ROOT, l, LIC);
    if (!said["l/" + l.id]) missing.push(l.id); else if (said["l/" + l.id] !== now) stale.push(l.id);
  }
  if (missing.length || stale.length)
    warn("assets/cards", `${[...missing.map(i => i + " (no card)"), ...stale.map(i => i + " (card is out of date)")].join(", ")} — run \`npm run card\``);
}

/* ---------- the press mark is drawn in one place ----------
   It was copied by hand into seven files under a comment asking that they change together,
   and the favicon had already drifted. build/mark.mjs is the one drawing now; a copy of the
   pennant's path anywhere else in the source is a second drawing waiting to disagree. */
{
  const { MARK_PATHS } = await import("../build/mark.mjs");
  const walk = d => fs.existsSync(p(d)) ? fs.readdirSync(p(d), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
  for (const f of ["theme", "templates", "build", "tools"].flatMap(walk)) {
    if (f === path.join("build", "mark.mjs") || !/\.(m?js|css|html)$/.test(f)) continue;
    const src = fs.readFileSync(p(f), "utf8");
    if (MARK_PATHS.some(m => src.includes(m))) err(f, "draws the press mark by hand — use {{MARK …}}, {{MARK_MASK}}, {{MARK_FAVICON}} or build/mark.mjs, so there is one drawing");
  }
}

/* ---------- report ---------- */
const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", d: "\x1b[2m", x: "\x1b[0m" };
if (warns.length) { console.log(`\n${c.y}${warns.length} warning(s)${c.x}`); warns.forEach(w => console.log(`  ${c.y}·${c.x} ${w}`)); }
if (errors.length) { console.log(`\n${c.r}${errors.length} error(s)${c.x}`); errors.forEach(e => console.log(`  ${c.r}✗${c.x} ${e}`)); }
if (!errors.length) console.log(`\n${c.g}✓ house rules hold${c.x} ${c.d}— ${books.length} titles, ${lives.length} lives, ${people.length} people, ${corrections.length} corrections, ${loadLog(ROOT).filter(x => x.published).length} Log piece(s)${c.x}`);
process.exit(errors.length ? 1 : 0);

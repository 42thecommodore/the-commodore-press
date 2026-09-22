/* Commodore Press — is it ready to put in front of people?
   Run: npm run ready

   One screen, plain language: what is done, what is not, and the single next thing to do
   for each. It changes nothing and needs no network except to ask GitHub about the domain.
   `npm run check` answers "is anything broken?"; this answers "what do I do next?". */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadLog } from "../build/log.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);
const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", d: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m" };
const run = (cmd, args) => spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8" });
const rows = [];
const row = (ok, what, next) => rows.push({ ok, what, next });

/* 1. the house rules, and the promise they guard */
const check = run(process.execPath, ["tools/validate.mjs"]);
const out = (check.stdout || "").replace(/\x1b\[[0-9;]*m/g, "");
const unsourced = out.split("\n").filter(l => /with no `facts` block|with no `## Sources`/.test(l));
row(check.status === 0, check.status === 0 ? "House rules hold" : "House rules are broken",
  check.status === 0 ? null : "npm run check — fix the first red line first");
const who = unsourced.map(l => (l.match(/content\/\S+?\/(?:\d+-)?([a-z0-9-]+)\.(?:json|md)/) || [])[1]).filter(Boolean);
row(!unsourced.length,
  unsourced.length ? `${who.join(", ")} state${who.length > 1 ? "" : "s"} a figure with no source` : "Every flagged figure carries a source",
  unsourced.length ? "the colophon promises otherwise; see dashboard/research-leads.md, or ask Claude for /press-factcheck" : null);
const bare = out.match(/(\d+) source line\(s\) in (\d+) entries name no document/);
if (bare) row(false, `${bare[1]} figures in ${bare[2]} entries have a source line that names no document`,
  "each needs the document it was read in — ask Claude to run the Wing I sourcing pass");
if (/share card says/.test(out)) row(false, "The share card shows old counts", "npm run card, then look at assets/og.png");

/* 2. a person on it */
const about = fs.existsSync(p("content/about.md")) ? fs.readFileSync(p("content/about.md"), "utf8") : "";
row(about && !/\bTODO\b/.test(about), about && !/\bTODO\b/.test(about) ? "The About page is written" : "The About page is not written — it stays off the site",
  "write the editor section in content/about.md");

/* 3. something of your own */
const log = loadLog(ROOT), pub = log.filter(x => x.published), drafts = log.filter(x => !x.published);
row(pub.length > 0, pub.length ? `The Log has ${pub.length} published piece(s)` : "The Log has nothing published",
  drafts.length ? `finish ${drafts[0].file} and set status: published` : `npm run new log "Your first title"`);
if (pub.length) {
  const days = Math.floor((Date.now() - new Date(pub.map(x => x.meta.date).sort().pop()).getTime()) / 864e5);
  if (days > 21) row(false, `The last Log piece was ${days} days ago`, "readers follow a rhythm; one piece restarts it");
}

/* 4. a way to follow */
let news = {};
try { news = JSON.parse(fs.readFileSync(p("content/newsletter.json"), "utf8")); } catch {}
row(!!news.action, news.action ? `Newsletter sign-up is on (${news.provider})` : "No newsletter sign-up yet",
  "make an account with a service, then fill in content/newsletter.json (EDITING.md §10)");

/* 5. an address of your own */
const gh = run("gh", ["variable", "get", "SITE_URL"]);
const domain = gh.status === 0 ? gh.stdout.trim() : "";
// without the GitHub CLI this laptop cannot see the setting, so it is reported, not counted
if (gh.error) row(null, "Custom domain: set on GitHub, which this laptop cannot see (install `gh` to check)", null);
else row(!!domain, domain ? `Custom domain set: ${domain}` : "No custom domain — the site lives at github.io",
  "buy one, then set SITE_URL on GitHub (EDITING.md §11)");

/* 6. what readers can see versus what is on this laptop */
const status = run("git", ["status", "--porcelain"]).stdout.trim();
const branch = run("git", ["branch", "--show-current"]).stdout.trim();
run("git", ["fetch", "-q", "origin", "main"]);
const ahead = +(run("git", ["rev-list", "--count", "origin/main..HEAD"]).stdout.trim() || 0);
const waiting = (status ? status.split("\n").length : 0);
row(!waiting && !ahead, waiting || ahead
  ? `${waiting ? `${waiting} changed file(s)` : ""}${waiting && ahead ? " and " : ""}${ahead ? `${ahead} commit(s)` : ""} not yet live`
  : "Everything here is live", branch !== "main" ? `you are on ${branch}; switch to main before shipping` : `npm run ship -- "what changed"`);

/* report */
const counted = rows.filter(r => r.ok !== null), done = counted.filter(r => r.ok).length;
console.log(`\n${c.b}THE COMMODORE PRESS${c.x} ${c.d}— ready for readers? ${done} of ${counted.length}${c.x}\n`);
for (const r of rows) {
  console.log(`  ${r.ok === null ? `${c.d}·` : r.ok ? `${c.g}✓` : `${c.y}○`}${c.x} ${r.what}`);
  if (!r.ok && r.next) console.log(`    ${c.d}→ ${r.next}${c.x}`);
}
const first = rows.find(r => !r.ok && r.next);
console.log(first ? `\n  ${c.b}Next:${c.x} ${first.next}\n` : `\n  ${c.g}Ready. Go and tell people.${c.x}\n`);

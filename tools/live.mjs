/* Is the live site the one you just shipped, and does every page on it work?
 *
 *   npm run live              wait for main to be live, then check every page
 *   npm run live -- --now     check what is live right now, without waiting
 *
 * `npm run ship` runs this after it pushes, so a release ends in an answer — "live and
 * verified" or the list of what is wrong — instead of "it takes about two minutes".
 *
 * How it knows: every build stamps the commit it came from into the front door
 * (<meta name="press-build">, build/build.mjs). This waits until the live stamp is the
 * commit on main, then visits what a reader can reach: the front door, the file that
 * carries every entry's text, the contents page, the sitemap, and each title and life —
 * served, in its own livery, with the book on the page, a share button and a share card
 * that loads. Reads only; changes nothing. Needs the network. */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = (process.env.SITE_URL || "https://42thecommodore.github.io/the-commodore-press").replace(/\/+$/, "");
const g = "\x1b[32m", y = "\x1b[33m", r = "\x1b[31m", d = "\x1b[2m", b = "\x1b[1m", x = "\x1b[0m";
const NOW = process.argv.includes("--now");
const WAIT_MIN = 10;

const git = a => { try { return execSync(`git ${a}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; } };
const bust = u => u + (u.includes("?") ? "&" : "?") + "v=" + Date.now() + Math.random().toString(36).slice(2, 6);
const get = async u => { const res = await fetch(bust(u), { cache: "no-store" }); return { status: res.status, text: await res.text() }; };
const stampOf = html => (html.match(/<meta name="press-build" content="([^"]+)"/) || [])[1] || "";

/* ---------- 1. wait for the push to be what readers are served ---------- */
const want = git("rev-parse origin/main") || git("rev-parse HEAD");
let door;
if (!NOW && want) {
  process.stdout.write(`\n${b}  Waiting for the live site${x} ${d}to serve ${want.slice(0, 7)}…${x}`);
  const until = Date.now() + WAIT_MIN * 60e3;
  for (;;) {
    try { door = await get(`${SITE}/`); } catch { door = null; }
    if (door && stampOf(door.text) === want) break;
    if (Date.now() > until) {
      const live = door ? stampOf(door.text) : "";
      console.log(`\n\n${r}  The live site did not update in ${WAIT_MIN} minutes.${x} It is serving ${live ? live.slice(0, 7) : "a build with no stamp"}, not ${want.slice(0, 7)}.`);
      console.log(`  Most likely the house rules failed on GitHub, which leaves the live site alone on purpose.`);
      console.log(`  See why: https://github.com/42thecommodore/the-commodore-press/actions\n`);
      process.exit(1);
    }
    process.stdout.write(".");
    await new Promise(res => setTimeout(res, 10e3));
  }
  console.log(` ${g}live${x}`);
} else door = await get(`${SITE}/`);

/* ---------- 2. every page a reader can reach ---------- */
const load = dir => fs.readdirSync(path.join(ROOT, "content", dir)).filter(f => f.endsWith(".json"))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, "content", dir, f), "utf8")));
const entries = [...load("books").map(e => ["t", e]), ...load("adjacent").map(e => ["t", e]), ...load("lives").map(e => ["l", e])];
const problems = [];
const lc = s => (s || "").toLowerCase();

if (door.status !== 200) problems.push(`front door: HTTP ${door.status}`);
const lib = (door.text.match(/LIBRARY_FILE = "([^"]+)"/) || [])[1];
if (!lib) problems.push("front door: names no file for the entries' text — books would not open");
else { const l = await get(`${SITE}/${lib}`); if (l.status !== 200) problems.push(`${lib}: HTTP ${l.status} — books would not open`); }
for (const p of ["contents/", "sitemap.xml", "og.png", "favicon.svg", "apple-touch-icon.png", "site.webmanifest", "fonts/eb-garamond-latin-400-normal.woff2"]) {
  const res = await fetch(bust(`${SITE}/${p}`), { method: "HEAD" }); if (res.status !== 200) problems.push(`${p}: HTTP ${res.status}`);
}

// a few at a time, to be a polite visitor
const queue = [...entries];
await Promise.all(Array.from({ length: 8 }, async () => {
  for (let item; (item = queue.shift());) {
    const [k, e] = item, where = `${k}/${e.id}`;
    try {
      const page = await get(`${SITE}/${k}/${e.id}/`), h = lc(page.text), why = [];
      if (page.status !== 200) why.push(`HTTP ${page.status}`);
      else {
        if (!h.includes('class="ecov"')) why.push("no book at the head of the page");
        if (!h.includes(`--cover:${lc(e.cover)}`) || !h.includes(`--accent:${lc(e.accent)}`)) why.push("not in its own livery (a stale deploy?)");
        if (!h.includes('data-rs="share"')) why.push("no share button");
        const card = (page.text.match(/property="og:image" content="([^"]+)"/) || [])[1];
        if (!card) why.push("no share card");
        else { const c = await fetch(card, { method: "HEAD" }); if (c.status !== 200) why.push(`share card HTTP ${c.status}`); }
      }
      if (why.length) problems.push(`${where}: ${why.join(", ")}`);
    } catch (err) { problems.push(`${where}: ${err.message}`); }
  }
}));

/* ---------- 3. the answer ---------- */
const kb = Math.round(Buffer.byteLength(door.text) / 1024);
if (problems.length) {
  console.log(`\n${r}  ${problems.length} problem(s) on the live site${x}`);
  problems.forEach(p => console.log(`  ${r}✗${x} ${p}`));
  console.log();
  process.exit(1);
}
console.log(`\n${g}✓ live and verified${x} ${d}— ${SITE}/ · front door ${kb} KB · ${entries.length} entry pages, each in its own livery with the book, a share button and a share card · the entries' text, contents, sitemap${x}\n`);

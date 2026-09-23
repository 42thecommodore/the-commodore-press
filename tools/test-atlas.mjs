/* The Atlas, tested in a real browser.
 *
 *   npm test   (runs after the reading tools)
 *
 * The chart is drawn entirely from content/, so `npm run check` can pass while the page a
 * reader meets is broken: a constellation that draws no line, a link that opens nothing, a
 * year dial that reads the wrong century. This drives headless Chrome through the built
 * Atlas and fails if what a reader would meet is wrong:
 *   - every lesson is an island, and every person is on each island they hold
 *   - every constellation lights exactly its own people, joins them, and is named
 *   - the links that can be sent (#atlas/<lesson>, #atlas/c/<idea>, #atlas/p/<person>) open
 *     what they name
 *   - a chosen island names every one of its people
 *   - notes print as notes, never as quotations
 *   - the crossing's dial reads each port's own year as the ship passes it
 *   - zoom stays inside the chart, and nothing throws
 * Runs on dist/, so build first. Needs Chrome (tools/chrome.mjs); without it, it says so. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CHROME } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const g = "\x1b[32m", r = "\x1b[31m", y = "\x1b[33m", d = "\x1b[2m", x = "\x1b[0m";
const page = path.join(ROOT, "dist", "index.html");
if (!fs.existsSync(page)) { console.error("\n  No dist/ — run `npm run build` first.\n"); process.exit(1); }
if (!CHROME) { console.log(`\n  ${y}No Chrome or Chromium found — the Atlas tests were skipped. Set CHROME=/path.${x}\n`); process.exit(0); }

const TESTS = String.raw`
<script>
window.__errors = [];
addEventListener("error", e => window.__errors.push(e.message));
window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
setTimeout(async () => {
  const R = [], t = (n, ok, det) => R.push({ n, ok: !!ok, d: det === undefined ? "" : String(det).slice(0, 200) });
  const wait = ms => new Promise(res => setTimeout(res, ms));
  try {
    go("atlas"); await wait(900); atlasShown(); await wait(400);
    const svg = document.querySelector("#chartSvgHost svg");
    t("the chart draws", !!svg);
    t("every lesson is an island", document.querySelectorAll(".isle").length === PRINCIPLES.length,
      document.querySelectorAll(".isle").length + " islands for " + PRINCIPLES.length + " lessons");
    const marks = PEOPLE.reduce((a, p) => a + p.p.length, 0);
    t("every person is on each island they hold", document.querySelectorAll(".town").length === marks,
      document.querySelectorAll(".town").length + " marks, expected " + marks);
    const unplaced = PEOPLE.filter(p => !document.querySelector('.town[data-p="' + p.id + '"]')).map(p => p.name);
    t("nobody is missing from the chart", !unplaced.length, unplaced.join(", "));

    // constellations
    const E = echoList(), bad = [];
    for (let i = 0; i < E.length; i++) {
      featIdx = i; const t0 = performance.now(); isleCard(); const ms = performance.now() - t0;
      const lit = [...document.querySelectorAll(".town.hl")].map(c => c.dataset.p);
      const want = E[i].notes.map(n => (PEOPLE.find(p => p.name === n.who) || {}).id);
      const line = document.getElementById("constLine").getAttribute("d") || "";
      const name = document.querySelector("#constLbl text").textContent;
      if (lit.length !== want.length || want.some(id => !lit.includes(id))) bad.push(E[i].idea + ": lit " + lit.length + " of " + want.length);
      else if ((line.match(/[ML]/g) || []).length !== want.length) bad.push(E[i].idea + ": line has " + (line.match(/[ML]/g) || []).length + " points");
      else if (name !== E[i].idea) bad.push(E[i].idea + ": named " + name);
      else if (ms > 250) bad.push(E[i].idea + ": took " + ms.toFixed(0) + "ms");
    }
    t("every constellation lights its own people, joins them, and is named", !bad.length, bad.join(" · "));
    const stale = E.flatMap(e => e.notes.filter(n => !PEOPLE.some(p => p.name === n.who)).map(n => n.who));
    t("every constellation names people on the chart", !stale.length, stale.join(", "));

    // links that can be sent
    featIdx = 0; atlasRoute("hard"); await wait(900);
    t("#atlas/<lesson> opens that island", isleSel === "hard", "open: " + isleSel);
    t("a chosen island names every one of its people", document.querySelectorAll(".tn.co").length === P_BY_ID.hard.members.length,
      document.querySelectorAll(".tn.co").length + " named of " + P_BY_ID.hard.members.length);
    t("the card lists who taught it", document.querySelectorAll("#isleCard .who").length === P_BY_ID.hard.members.length);
    selectIsle(null); await wait(800);
    const e2 = E[1]; atlasRoute("c/" + slug(e2.idea)); await wait(900);
    t("#atlas/c/<idea> opens that constellation", document.querySelector(".feat-i").textContent === e2.idea, document.querySelector(".feat-i").textContent);
    t("…and the address names it", location.hash === "#atlas/c/" + slug(e2.idea), location.hash);
    const who = PEOPLE[0]; atlasRoute("p/" + slug(who.name)); await wait(300);
    t("#atlas/p/<person> opens that person", document.getElementById("drawer").classList.contains("on") && document.getElementById("dName").textContent === who.name,
      document.getElementById("dName").textContent);

    // notes are notes
    const quoted = PEOPLE.filter(p => (p.kept || []).some(k => typeof k !== "string")).length;
    const body = document.getElementById("dBody").textContent;
    t("notes print as notes, labelled as not quotations", !(who.kept || []).length || /not quotations/.test(body));
    t("a note never sits under 'Lines I kept'", quoted > 0 || !document.querySelector("#dBody .keptlist:not(.notes)"));
    closeDrawer();

    // zoom stays inside the chart
    chartView = { x: 0, y: 0, k: 1 }; applyView();
    for (let i = 0; i < 8; i++) zoomAt(0, 0, 1.6);
    t("zoom stops at its limit", chartView.k <= 5.0001, "k=" + chartView.k);
    zoomAt(chartW, chartH, .01);
    t("zooming out returns to the whole chart", chartView.k === 1 && chartView.x === 0 && chartView.y === 0, JSON.stringify(chartView));

    // the crossing's dial (the site scrolls smoothly; a test has to land, not glide)
    document.documentElement.style.scrollBehavior = "auto";
    measureCrossing();
    const ports = [...document.querySelectorAll("#cxBody .cx-port")], wrong = [];
    for (const li of ports) {
      for (let k = 0; k < 2; k++) { const dot = li.querySelector(".cx-dot").getBoundingClientRect(); window.scrollTo(0, dot.top + dot.height / 2 + scrollY - innerHeight * .55); await wait(60); }
      sailCrossing();
      const want = fmtYear(+li.dataset.y), got = document.getElementById("cxYear").textContent;
      if (got !== want) wrong.push(want + " read " + got);
    }
    t("the crossing's dial reads each port's own year", ports.length > 1 && !wrong.length, wrong.join(" · ") || ports.length + " ports");
    const years = PORTS.map(p => p.year);
    t("the crossing runs in date order", years.every((v, i) => !i || years[i - 1] <= v));

    t("nothing threw", !window.__errors.length, window.__errors.join(" | "));
  } catch (e) { t("the test ran to the end", false, e && e.stack || e); }
  const out = document.createElement("script"); out.type = "application/json"; out.id = "__results";
  out.textContent = JSON.stringify(R).replace(/</g, "\\u003c"); document.body.appendChild(out);
}, 700);
</script>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cp-atlas-"));
const src = path.join(tmp, "page.html");
fs.writeFileSync(src, fs.readFileSync(page, "utf8").replace("</body>", TESTS + "</body>"));
let dom = "";
try {
  dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=1440,900",
    "--virtual-time-budget=30000", "--dump-dom", `file://${src}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20, timeout: 150000 });
} catch (e) { /* reported below */ }
fs.rmSync(tmp, { recursive: true, force: true });
const m = dom.match(/<script type="application\/json" id="__results">([^]*?)<\/script>/);
const results = m ? JSON.parse(m[1]) : [{ n: "the Atlas ran its tests", ok: false, d: "no results came back from Chrome — a script threw before the tests began" }];
let failed = 0;
console.log("\n  The Atlas");
for (const t of results) { if (!t.ok) failed++; console.log(`    ${t.ok ? g + "✓" : r + "✗"}${x} ${t.n}${!t.ok && t.d ? `${d} — ${t.d}${x}` : ""}`); }
console.log(failed ? `\n  ${r}${failed} failed.${x} The Atlas is not what a reader should meet.\n` : `\n  ${g}✓ the Atlas behaves${x}\n`);
process.exit(failed ? 1 : 0);

/* The card people see when they paste the link into Slack, iMessage, LinkedIn or X.
 *
 *   npm run card
 *
 * Renders assets/og.png at 1200x630 in the house livery, with the counts read from
 * content/ so the card cannot quietly go stale. The build copies it next to
 * dist/index.html; templates/shell.html points og:image and twitter:image at it.
 *
 * Uses headless Chrome because the card has real typography in it, and the house
 * typefaces are the point. Chrome is a local tool only — the PNG is committed, so CI
 * never needs it. Re-run this when the shelves grow or the livery changes. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!fs.existsSync(CHROME)) {
  console.error("\n  Needs Google Chrome to render the card. The committed assets/og.png still works;\n  nothing breaks until the counts change.\n");
  process.exit(1);
}

/* Counts come from the corpus, never from memory — same rule as the prose. */
const count = d => fs.existsSync(p("content", d)) ? fs.readdirSync(p("content", d)).filter(f => f.endsWith(".json")).length : 0;
const people = JSON.parse(fs.readFileSync(p("content/atlas/people.json"), "utf8")).length;
const N = { titles: count("books"), lives: count("lives"), manuals: count("manuals"), people };

/* The five wing spines, in shelf order, taken from the front door's own liveries. */
const SPINES = ["#7B3F2E", "#2F4A3C", "#1B2A4A", "#6B5636", "#4A2F45"];

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px}
  body{background:#F2EDE1;color:#1E1C18;font-family:'EB Garamond',Georgia,serif;
       display:flex;flex-direction:column;justify-content:space-between;
       padding:64px 72px;position:relative;overflow:hidden}
  .rule{position:absolute;left:0;right:0;height:1px;background:#1E1C18;opacity:.18}
  .top{top:0}
  .mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:15px;letter-spacing:.18em;
        text-transform:uppercase;opacity:.62}
  h1{font-size:104px;line-height:.98;font-weight:500;letter-spacing:-.015em;margin:26px 0 0}
  .promise{font-size:31px;line-height:1.38;max-width:19.5em;margin-top:26px;opacity:.86}
  .promise em{font-style:italic}
  .foot{display:flex;align-items:flex-end;justify-content:space-between;gap:40px}
  .counts{font-family:'IBM Plex Mono',monospace;font-size:17px;letter-spacing:.06em;opacity:.72}
  .spines{display:flex;gap:7px;align-items:flex-end}
  .spines i{display:block;width:17px;border-radius:1px}
  .mark{position:absolute;top:58px;right:72px;opacity:.5}
</style></head><body>
  <div class="rule top"></div>
  <svg class="mark" width="46" height="46" viewBox="0 0 22 22" fill="none" stroke="#1E1C18">
    <circle cx="11" cy="11" r="10" stroke-width="1.1"/>
    <path d="M11 1V21M1 11H21" stroke-width="1.1"/>
    <path d="M4 4 18 18M18 4 4 18" stroke-width=".6" opacity=".45"/>
  </svg>
  <div>
    <div class="mono">A working library in five wings</div>
    <h1>The Commodore<br>Press</h1>
    <div class="promise">Every claim carries its source &mdash; <em>and the place it is still argued.</em></div>
  </div>
  <div class="foot">
    <div class="counts">${N.titles} titles &middot; ${N.lives} lives &middot; ${N.people} people &middot; ${N.manuals} field manuals</div>
    <div class="spines">${SPINES.map((c, i) => `<i style="background:${c};height:${[86, 112, 70, 98, 124][i]}px"></i>`).join("")}</div>
  </div>
</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));
const src = path.join(tmp, "card.html");
fs.writeFileSync(src, html);
fs.mkdirSync(p("assets"), { recursive: true });
const out = p("assets/og.png");

execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--window-size=1200,630",
  "--virtual-time-budget=6000",          // let the webfonts actually arrive
  `--screenshot=${out}`,
  `file://${src}`,
], { stdio: ["ignore", "ignore", "pipe"] });

fs.rmSync(tmp, { recursive: true, force: true });
if (!fs.existsSync(out)) { console.error("  Chrome wrote nothing."); process.exit(1); }
const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`\n  assets/og.png — 1200x630, ${kb} KB`);
console.log(`  ${N.titles} titles · ${N.lives} lives · ${N.people} people · ${N.manuals} field manuals`);
console.log(`  npm run build copies it to dist/og.png\n`);

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
 * never needs it. Re-run this when the shelves grow or the livery changes.
 *
 * LOOK AT THE CARD IT WRITES. `--screenshot` is a one-shot mode with no completion
 * signal, and it fails by omission rather than by erroring: on one Chromium build it
 * wrote a card that was correct in every respect except that the counts line simply was
 * not painted — laid out at y=544 in a 630px page, present in the DOM, and absent from
 * the PNG. The spines beside it painted, because a background is not text. A card that
 * is quietly missing a line still looks like a card.
 *
 * OG_KEEP=1 keeps the generated HTML so it can be opened in a real browser when the
 * output looks wrong. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);
/* Any Chromium will do. The path was macOS-only, which was fine while the card was only
   ever regenerated on one laptop — and not fine the day the counts changed somewhere else
   and the card kept advertising wings the site no longer had. CHROME=/path overrides. */
const CHROME = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/opt/pw-browsers/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].find(c => c && fs.existsSync(c));
if (!CHROME) {
  console.error("\n  Needs Chrome or Chromium to render the card, and found neither. Set CHROME=/path\n  to one. The committed assets/og.png still works; nothing breaks until the counts change.\n");
  process.exit(1);
}

/* Counts come from the corpus, never from memory — same rule as the prose. */
const count = d => fs.existsSync(p("content", d)) ? fs.readdirSync(p("content", d)).filter(f => f.endsWith(".json")).length : 0;
const people = JSON.parse(fs.readFileSync(p("content/atlas/people.json"), "utf8")).length;
const N = { titles: count("books"), lives: count("lives"), people };

/* One spine per wing, in shelf order, taken from the front door's own liveries.
   The card said "five wings" for the length of a whole PR after the wings came down,
   because this string was typed and the counts beside it were not. Both are derived now. */
const WINGS = ["The Press", "Lives", "The Atlas"];
const SPINES = ["#7B3F2E", "#2F4A3C", "#1B2A4A"];
const word = n => ["zero","one","two","three","four","five","six","seven"][n] || String(n);

/* The house typefaces are the point of this card, and a browser that cannot reach Google
   Fonts does not say so — it quietly renders the wordmark in Georgia and the card still
   looks plausible. So the fonts are fetched here, where a failure is visible, and inlined
   as data URIs; the render then needs no network at all. If the fetch fails we say so and
   keep the committed card rather than shipping one in the wrong face. */
const FONTS_CSS = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap";
let fontFace = "";
try {
  // the UA decides whether Google serves woff2; without one it serves a truetype fallback
  const css = await (await fetch(FONTS_CSS, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } })).text();
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]))];
  const bytes = Object.fromEntries(await Promise.all(urls.map(async u =>
    [u, Buffer.from(await (await fetch(u)).arrayBuffer()).toString("base64")])));
  fontFace = css.replace(/url\((https:[^)]+)\)/g, (_, u) => `url(data:font/woff2;base64,${bytes[u]})`);
  const kb = (Object.values(bytes).reduce((n, b) => n + b.length, 0) / 1365).toFixed(0);
  console.log(`\n  fonts: ${urls.length} file(s) inlined, ~${kb} KB`);
} catch (e) {
  console.error(`\n  Could not fetch the house typefaces (${e.message}).`);
  console.error("  Refusing to render the card in a substitute face — the committed assets/og.png stands.\n");
  process.exit(1);
}

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
${fontFace}</style>
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
    <div class="mono">A working library in ${word(WINGS.length)} wings</div>
    <h1>The Commodore<br>Press</h1>
    <div class="promise">Every claim carries its source &mdash; <em>and the place it is still argued.</em></div>
  </div>
  <div class="foot">
    <div class="counts">${N.titles} titles &middot; ${N.lives} lives &middot; ${N.people} people</div>
    <div class="spines">${SPINES.map((c, i) => `<i style="background:${c};height:${[86, 112, 70][i]}px"></i>`).join("")}</div>
  </div>
</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));
const render = (page, out) => {
const src = path.join(tmp, path.basename(out, ".png") + ".html");
fs.writeFileSync(src, page);
fs.mkdirSync(path.dirname(out), { recursive: true });

execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
  "--window-size=1200,630",
  /* --virtual-time-budget was here to let the webfonts arrive over the network. The fonts
     are inlined now, so it has nothing to wait for — and it was cutting the render short:
     the counts line was laid out at y=544 in a 630px page and still missing from the PNG,
     in every card generated while the flag was set. */
  `--screenshot=${out}`,
  `file://${src}`,
], { stdio: ["ignore", "ignore", "pipe"] });
if (!fs.existsSync(out)) { console.error(`  Chrome wrote nothing for ${out}.`); process.exit(1); }
};
const out = p("assets/og.png");
render(html, out);

/* One card per title, in its own livery, so a shared title previews as itself rather than
   as the front door. The text the card prints is recorded in assets/cards/index.json;
   `npm run check` warns when a title's name, claim or cover has changed since. */
const TITLES = [...fs.readdirSync(p("content/books")).sort().map(f => JSON.parse(fs.readFileSync(p("content/books", f), "utf8"))),
                ...fs.readdirSync(p("content/adjacent")).sort().map(f => JSON.parse(fs.readFileSync(p("content/adjacent", f), "utf8")))];
const stamp = {};
for (const t of TITLES) {
  const card = `<!doctype html><html><head><meta charset="utf-8"><style>${fontFace}</style><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px}
  body{background:${t.cover};color:${t.ink};font-family:'EB Garamond',Georgia,serif;display:flex;flex-direction:column;
       justify-content:space-between;padding:64px 72px;overflow:hidden;position:relative}
  body:after{content:"";position:absolute;right:0;top:0;bottom:0;width:34px;background:${t.spineC}}
  .mono{font-family:'IBM Plex Mono',monospace;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:${t.accent}}
  h1{font-size:${t.title.length > 26 ? 78 : 96}px;line-height:1;font-weight:500;letter-spacing:-.015em;margin-top:24px;max-width:15em}
  .claim{font-size:31px;line-height:1.36;max-width:22em;margin-top:26px;opacity:.9;font-style:italic}
  .foot{font-family:'IBM Plex Mono',monospace;font-size:16px;letter-spacing:.08em;opacity:.75}
</style></head><body><div><div class="mono">The Commodore Press · ${t.field}</div><h1>${t.title}</h1>
<div class="claim">${t.claim || t.sub || ""}</div></div>
<div class="foot">Every claim carries its source — and the place it is still argued.</div></body></html>`;
  render(card, p("assets/cards", `${t.id}.png`));
  stamp[t.id] = [t.title, t.claim || t.sub || "", t.cover].join(" | ");
}
fs.writeFileSync(p("assets/cards/index.json"), JSON.stringify(stamp, null, 2) + "\n");
console.log(`  assets/cards/ — ${TITLES.length} title cards`);

if (process.env.OG_KEEP) console.log(`  OG_KEEP — source html kept at ${src}`);
else fs.rmSync(tmp, { recursive: true, force: true });
const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`\n  assets/og.png — 1200x630, ${kb} KB`);
console.log(`  ${N.titles} titles · ${N.lives} lives · ${N.people} people`);
/* What the card says, recorded beside it, so `npm run check` can tell when the shelves
   have moved and the card has not. It said 21 titles and 32 lives for a week after the
   shelves reached 22 and 43, on every link anyone shared. */
fs.writeFileSync(p("assets/og.counts.json"), JSON.stringify(N) + "\n");
console.log("  Open it before committing — this writer fails by leaving things out, not by erroring.");
console.log(`  npm run build copies it to dist/og.png\n`);

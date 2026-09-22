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
import { plateOf, creditOf, lifeStamp } from "./cards.mjs";
import { markInner } from "../build/mark.mjs";
import { CHROME } from "./chrome.mjs";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...a) => path.join(ROOT, ...a);
/* Chrome is found by tools/chrome.mjs (any Chromium; CHROME=/path overrides). The path was
   once macOS-only, and the card kept advertising wings the site no longer had the day the
   counts changed on another machine. */
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

/* The press mark comes from build/mark.mjs, the one drawing of it. */
const markSvg = (size, sw = 1.05, cls = "") => `<svg${cls ? ` class="${cls}"` : ""} width="${size}" height="${size}" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-linecap="round">${markInner(sw)}</svg>`;
/* A swallow-tailed pennant flying from the spine band, so the spine reads as a mast. */
const pennant = (color, w = 80) => `<svg class="pennant" width="${w}" height="${w * .6}" viewBox="0 0 66 40"><path d="M66 0 0 7 22 20 0 33 66 40Z" fill="${color}"/></svg>`;
/* The sea along the foot of every card: a few long swells, each fainter than the one
   above it and a sixth of a period behind it, so they read as water rather than as a
   rule. In step they read as ruled lines; half a period out they cross and read as rope. */
const sea = (w, { period = 92, amp = 6, lines = 3, gap = 15, sw = 1.8 } = {}) => {
  const h = amp * 2 + gap * (lines - 1) + sw * 2;
  const row = (i) => {
    const y = amp + sw + i * gap, x0 = -i * period / 6;
    let d = `M${x0} ${y}q${period / 4} ${-amp * 2} ${period / 2} 0`;
    for (let x = x0 + period / 2; x < w; x += period / 2) d += `t${period / 2} 0`;
    return `<path d="${d}" stroke-width="${sw}" opacity="${(1 - i * 0.3).toFixed(2)}"/>`;
  };
  return `<svg class="sea" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-linecap="round">${Array.from({ length: lines }, (_, i) => row(i)).join("")}</svg>`;
};

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
${fontFace}</style>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px}
  body{background:#F2EDE1;color:#1E1C18;font-family:'EB Garamond',Georgia,serif;
       display:flex;flex-direction:column;justify-content:space-between;
       padding:64px 72px 112px;position:relative;overflow:hidden}
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
  .mark{position:absolute;top:56px;right:72px;opacity:.85}
  .sea{position:absolute;left:0;bottom:-6px;color:#1B2A4A;opacity:.5}
</style></head><body>
  <div class="rule top"></div>
  ${markSvg(64, 1.05, "mark")}
  <div>
    <div class="mono">A working library in ${word(WINGS.length)} wings</div>
    <h1>The Commodore<br>Press</h1>
    <div class="promise">Every claim carries its source &mdash; <em>and the place it is still argued.</em></div>
  </div>
  <div class="foot">
    <div class="counts">${N.titles} titles &middot; ${N.lives} lives &middot; ${N.people} people</div>
    <div class="spines">${SPINES.map((c, i) => `<i style="background:${c};height:${[86, 112, 70][i]}px"></i>`).join("")}</div>
  </div>
  ${sea(1200)}
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

/* Does the card's text fit? A screenshot cannot say: text that runs into the footer or into
   the sea still makes a PNG. So each card is also loaded once to measure itself. Every
   [data-fit] block must end above the element its value names — `.foot` for text, `.sea`
   for the plate — and past the spine. (Not the page's scroll size: the sea is set 6px below
   the edge on purpose, and body overflow propagates to the viewport, so every card would
   "overflow" by the sea.) The fonts are awaited first, because
   the fallback face is narrower and would pass a card the real face overflows. A card that
   does not fit is still written, so it can be looked at, and the run exits non-zero with
   the list. */
const FIT = `<script>document.fonts.ready.then(function(){var bad=[];
document.querySelectorAll("[data-fit]").forEach(function(e){var f=document.querySelector(e.getAttribute("data-fit")),lim=f?f.getBoundingClientRect().top:630,r=e.getBoundingClientRect();
if(r.bottom>lim-10||r.right>1166)bad.push((e.className||e.tagName.toLowerCase())+" "+Math.round(r.bottom)+">"+Math.round(lim-10))});
document.body.setAttribute("data-overflow",bad.join(", ")||"none")})</script>`;
const unfit = [];
const measure = (page, name) => {
  const src = path.join(tmp, name.replace(/\//g, "-") + ".fit.html");
  fs.writeFileSync(src, page.replace("</body>", FIT + "</body>"));
  let dom = "";
  try {
    dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=1200,630",
      "--virtual-time-budget=4000", "--dump-dom", `file://${src}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 });
    // the dump carries the inlined fonts (~2 MB); at Node's default 1 MB buffer every card
    // came back "could not measure"
  } catch { /* reported below as unmeasured */ }
  const m = dom.match(/data-overflow="([^"]*)"/);
  if (!m) unfit.push(`${name} (could not measure)`); else if (m[1] !== "none") unfit.push(`${name}: ${m[1]}`);
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
       justify-content:space-between;padding:64px 72px 104px;overflow:hidden;position:relative}
  body:after{content:"";position:absolute;right:0;top:0;bottom:0;width:34px;background:${t.spineC}}
  .mono{font-family:'IBM Plex Mono',monospace;font-size:15px;letter-spacing:.18em;text-transform:uppercase;color:${t.accent}}
  h1{font-size:${t.title.length > 26 ? 78 : 96}px;line-height:1;font-weight:500;letter-spacing:-.015em;margin-top:24px;max-width:15em}
  .claim{font-size:31px;line-height:1.36;max-width:22em;margin-top:26px;opacity:.9;font-style:italic}
  .foot{font-family:'IBM Plex Mono',monospace;font-size:16px;letter-spacing:.08em;opacity:.75;display:flex;align-items:center;gap:14px;position:relative;z-index:1}
  .sea{position:absolute;left:0;bottom:-6px;color:${t.accent};opacity:.55}
  .pennant{position:absolute;right:34px;top:60px}
</style></head><body><div><div class="mono">The Commodore Press · ${t.field}</div><h1>${t.title}</h1>
<div class="claim" data-fit=".foot">${t.claim || t.sub || ""}</div></div>
<div class="foot">${markSvg(30, 1.2)}Every claim carries its source — and the place it is still argued.</div>${sea(1166)}${pennant(t.accent)}</body></html>`;
  render(card, p("assets/cards", `${t.id}.png`));
  measure(card, t.id);
  stamp[t.id] = [t.title, t.claim || t.sub || "", t.cover].join(" | ");
}
console.log(`  assets/cards/ — ${TITLES.length} title cards`);

/* One card per life, in its own livery, with its plate. A life used to preview as the bare
   portrait in the small square card, with no name on it; now it previews as itself.

   Two rules this card must not break:
   - The lede is the Press's description, set in roman, never in italics or quotation marks
     under the person's name — that layout reads as their own words, and the house does not
     invent quotations, by layout or otherwise.
   - A plate that is not plain public domain carries its credit on the card. The colophon
     credits it on the site, but a shared card travels without the colophon, and an
     attribution licence is breached by a missing credit. The credit, and the stamp the check
     compares, come from tools/cards.mjs, which tools/validate.mjs reads too.

   A life with no plate is a text card: the empty frame with a small mark in it read as an
   image that failed to load, on eight cards in forty-three. */
const LIVES = fs.readdirSync(p("content/lives")).sort().map(f => JSON.parse(fs.readFileSync(p("content/lives", f), "utf8")));
const LIC = JSON.parse(fs.readFileSync(p("content/plate-licences.json"), "utf8"));
for (const l of LIVES) {
  // Type steps down for a long name or a long lede. These are rules of thumb; the measure
  // below is what actually decides whether a card fits (Wu Chien-Shiung's name wrapped at
  // the larger size and pushed the lede into the footer — caught by it, not by eye).
  const plate = plateOf(ROOT, l), credit = creditOf(l, plate, LIC), long = l.n.length >= 14;
  const ledeLen = l.lede.replace(/<[^>]*>/g, "").length;
  const card = `<!doctype html><html><head><meta charset="utf-8"><style>${fontFace}</style><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px}
  body{background:${l.cover};color:${l.ink};font-family:'EB Garamond',Georgia,serif;display:flex;gap:56px;
       padding:64px 106px 104px 72px;overflow:hidden;position:relative}
  body:after{content:"";position:absolute;right:0;top:0;bottom:0;width:34px;background:${l.spineC}}
  .txt{flex:1;min-width:0;${plate ? "" : "max-width:920px"}}
  .mono{font-family:'IBM Plex Mono',monospace;font-size:16px;letter-spacing:.18em;text-transform:uppercase;color:${l.accent}}
  h1{font-size:${plate ? (long ? 80 : 98) : (long ? 92 : 108)}px;line-height:1;font-weight:500;letter-spacing:-.015em;margin-top:22px;text-wrap:balance}
  .sub{font-size:30px;font-style:italic;opacity:.88;margin-top:12px}
  .lede{font-size:${plate ? (ledeLen > 150 ? 30 : 33) : 37}px;line-height:1.3;margin-top:22px}
  .foot{position:absolute;left:72px;bottom:92px;font-family:'IBM Plex Mono',monospace;font-size:15px;letter-spacing:.08em;opacity:.75;display:flex;align-items:center;gap:14px;z-index:1}
  .sea{position:absolute;left:0;bottom:-6px;color:${l.accent};opacity:.55}
  .pennant{position:absolute;right:34px;top:60px}
  figure{flex:none;width:300px;display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:6px}
  figure .frame{width:300px;height:375px;display:grid;place-items:center;border:1px solid color-mix(in srgb,currentColor 35%,transparent);padding:8px}
  figure img{width:100%;height:100%;object-fit:cover;display:block;border-radius:1px}
  figcaption{font-family:'IBM Plex Mono',monospace;font-size:12.5px;line-height:1.4;letter-spacing:.03em;opacity:.8;text-align:center;max-width:300px;text-wrap:balance}
</style></head><body><div class="txt"><div><div class="mono">The Commodore Press · Lives · ${l.years}</div><h1 data-fit=".foot">${l.n}</h1>
<div class="sub" data-fit=".foot">${l.field} · ${l.place}</div><div class="lede" data-fit=".foot">${l.lede}</div></div>
<div class="foot">${markSvg(28, 1.2)}Every claim carries its source — and the place it is still argued.</div></div>
${sea(1166)}${pennant(l.accent, 60)}${plate ? `<figure data-fit=".sea"><div class="frame"><img src="data:image/jpeg;base64,${fs.readFileSync(plate).toString("base64")}" alt=""></div>${credit ? `<figcaption>${credit}</figcaption>` : ""}</figure>` : ""}</body></html>`;
  render(card, p("assets/cards/l", `${l.id}.png`));
  measure(card, "l/" + l.id);
  stamp["l/" + l.id] = lifeStamp(ROOT, l, LIC);
}
fs.writeFileSync(p("assets/cards/index.json"), JSON.stringify(stamp, null, 2) + "\n");
console.log(`  assets/cards/l/ — ${LIVES.length} life cards`);

if (process.env.OG_KEEP) console.log(`  OG_KEEP — source html kept in ${tmp}`);
else fs.rmSync(tmp, { recursive: true, force: true });
const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`\n  assets/og.png — 1200x630, ${kb} KB`);
console.log(`  ${N.titles} titles · ${N.lives} lives · ${N.people} people`);
/* What the card says, recorded beside it, so `npm run check` can tell when the shelves
   have moved and the card has not. It said 21 titles and 32 lives for a week after the
   shelves reached 22 and 43, on every link anyone shared. */
fs.writeFileSync(p("assets/og.counts.json"), JSON.stringify(N) + "\n");
console.log("  Open it before committing — this writer fails by leaving things out, not by erroring.");
if (unfit.length) {
  console.error(`\n  ${unfit.length} card(s) do not fit — text runs into the footer, or the plate into the sea:\n    ${unfit.join("\n    ")}`);
  console.error("  Shorten the line on the card (a title's claim, a life's lede) or the type in tools/og-card.mjs, and look again.\n");
  process.exitCode = 1;
} else console.log(`  every card fits: ${TITLES.length + LIVES.length} measured`);
console.log(`  npm run build copies it to dist/og.png\n`);

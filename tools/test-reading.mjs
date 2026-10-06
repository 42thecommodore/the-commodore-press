/* The reading tools, tested in a real browser.
 *
 *   npm test
 *
 * Every bug in the share sheet, the progress line and the quote tools so far was caught by
 * someone clicking through by hand, and `npm run check` cannot see any of them: it reads
 * content, not behaviour. This drives headless Chrome through the built site — an entry
 * page and the library's reader — and fails if what a reader would meet is wrong.
 *
 * What it holds the pages to:
 *   - sharing links the entry's own page (never the #hash), and the X text fits
 *   - a shared quote is credited "The Commodore Press, on <entry>" and never set under the
 *     subject's name — the house does not invent quotations, by layout or otherwise
 *   - a selected passage is quoted verbatim, in whole words, with a link to the passage
 *   - the progress line reaches "Finished", and the browser remembers it
 *   - the library and the entry page agree on the minutes and on what to read next
 *   - the front door's arrow keys leave a focused control alone
 *   - Esc closes only what is open — the share sheet, then the reader, and a selected
 *     passage is let go before anything closes — and never takes the reader off the page
 *   - the front door's first screen holds the shelf, at 1440×900 and at 375×812, and its one
 *     count is the corrections, opening the record it counts
 *   - every book and face is a link to its own page; a plain click opens the reader in place,
 *     a Cmd-click is left to the browser
 *   - the keep line on the Captain card is credited to the Press, never set beside the face alone
 *   - the reader's "№ … of N" counts the shelf a title stands on; a life prints its own permanent №
 * and, without a browser, that every entry page's share link, end block and read-next link
 * are present and resolve.
 *
 * Runs on dist/, so build first (`npm run ship` does). Needs Chrome, found by
 * tools/chrome.mjs; without it the browser half is skipped and says so. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CHROME } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = (...a) => path.join(ROOT, "dist", ...a);
const g = "\x1b[32m", r = "\x1b[31m", y = "\x1b[33m", d = "\x1b[2m", x = "\x1b[0m";
let failed = 0;
const report = (group, results) => {
  console.log(`\n  ${group}`);
  for (const t of results) {
    if (!t.ok) failed++;
    console.log(`    ${t.ok ? g + "✓" : r + "✗"}${x} ${t.n}${!t.ok && t.d ? `${d} — ${t.d}${x}` : ""}`);
  }
};

if (!fs.existsSync(dist("index.html"))) { console.error("\n  No dist/ — run `npm run build` first.\n"); process.exit(1); }

/* ---------- every entry page, without a browser ---------- */
{
  const res = [];
  const pages = ["t", "l"].flatMap(k => fs.readdirSync(dist(k)).map(id => [k, id]));
  const bad = { conf: [], end: [], next: [], share: [] };
  for (const [k, id] of pages) {
    const html = fs.readFileSync(dist(k, id, "index.html"), "utf8");
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    const conf = JSON.parse((html.match(/Reading\.page\((\{.*?\})\)<\/script>/s) || [, "{}"])[1]);
    if (!canon || conf.url !== canon || conf.key !== `${k}/${id}`) bad.conf.push(id);
    if ((html.match(/id="rend"/g) || []).length !== 1) bad.end.push(id);
    if (!/<nav class="top entry"[^]*?data-rs="share"/.test(html)) bad.share.push(id);
    const next = (html.match(/<a class="rs-next" href="([^"]+)"/) || [])[1];
    if (!next || !fs.existsSync(path.join(dist(k, id), next, "index.html"))) bad.next.push(`${id} → ${next}`);
  }
  const t = (n, list) => res.push({ n: `${n} (${pages.length} pages)`, ok: !list.length, d: list.slice(0, 5).join(", ") });
  t("share links name the page's own canonical URL", bad.conf);
  t("a Share button in every top bar", bad.share);
  t("exactly one end-of-entry block", bad.end);
  t("every Read next link opens a page that exists", bad.next);
  report("Entry pages", res);
}

/* ---------- typographic quotes, on everything a reader can open ----------
   The build sets them (build/typeset.mjs). A straight quote here means prose reached a page
   by a road that skips it — a new field, a new template, a new page. */
{
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const seen = [];
  const visible = html => html.replace(/<(script|style)\b[^]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&(quot|#34|#x22);/gi, '"').replace(/&(apos|#39|#x27);/gi, "'");
  const around = (txt, i) => txt.slice(Math.max(0, i - 30), i + 30).replace(/\s+/g, " ").trim();
  for (const f of walk(dist()).filter(f => f.endsWith(".html"))) {
    const txt = visible(fs.readFileSync(f, "utf8")), i = txt.search(/['"]/);
    if (i >= 0) seen.push(`${path.relative(dist(), f)}: …${around(txt, i)}…`);
  }
  // the entries' bodies, as the library's reader prints them
  const { NOT_PROSE } = await import("../build/typeset.mjs");
  for (const f of fs.readdirSync(dist()).filter(f => /^library\.[0-9a-f]+\.js$/.test(f))) {
    const data = JSON.parse(fs.readFileSync(dist(f), "utf8").replace(/^[^(]*\(/, "").replace(/\);?\s*$/, ""));
    const check = (n, k, at) => {
      if (typeof n === "string") { const txt = visible(n), i = txt.search(/['"]/); if (i >= 0 && !NOT_PROSE.has(k)) seen.push(`${f} ${at}: …${around(txt, i)}…`); }
      else if (Array.isArray(n)) n.forEach((v, j) => check(v, k, at));
      else if (n && typeof n === "object") for (const [kk, v] of Object.entries(n)) check(v, kk, at ? at : kk);
    };
    for (const kind of ["press", "lives"]) for (const [id, b] of Object.entries(data[kind] || {})) check(b, "", `${kind}/${id}`);
  }
  report("Typography", [{ n: "no straight quote reaches a page a reader can open", ok: !seen.length, d: `${seen.length} — ${seen.slice(0, 3).join(" · ")}` }]);
}

/* ---------- no page lets the device choose dusk ---------- */
{
  const files = [dist("index.html"), ...["t", "l"].flatMap(k => fs.readdirSync(dist(k)).map(id => dist(k, id, "index.html")))];
  const follow = files.filter(f => /prefers-color-scheme\s*:\s*dark/.test(fs.readFileSync(f, "utf8"))).map(f => path.relative(dist(), f));
  report("Paper by default", [{ n: `no page follows the device's dark setting (${files.length} pages)`, ok: !follow.length, d: follow.slice(0, 5).join(", ") }]);
}

/* ---------- in the browser ---------- */
const HARNESS = String.raw`
<script>
window.__run = async function (tests) {
  const R = [], t = (n, ok, det) => R.push({ n, ok: !!ok, d: det === undefined ? "" : String(det).slice(0, 180) });
  const wait = ms => new Promise(res => setTimeout(res, ms));
  window.prompt = (m, v) => { window.__copied = v; };
  // Chrome's --dump-dom mode never paints, so requestAnimationFrame never fires and the
  // progress line (which updates on frames) would sit at "N min read" forever. A timer
  // stands in for the frame; the page's own logic is unchanged.
  window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
  try { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: v => { window.__copied = v; return Promise.resolve(); } } }); } catch (e) {}
  const esc = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  // what a reader presses is at least 24px each way at a desk and 44px tall on a phone. Exempt: a
  // link set inside a running sentence (WCAG's inline exception), the spines (a book is as wide as
  // a book), and the skip link, which only appears on focus. Returns what falls short.
  window.__targets = root => {
    const minH = innerWidth < 600 ? 44 : 24;
    return [...root.querySelectorAll("a, button, summary, input, select, [role=button]")].filter(e => {
      if (!e.offsetParent || e.closest(".rk, .skip, .reader:not(.on)")) return false;
      if (innerWidth < 600 && e.closest(".foot .keys")) return false;   // keyboard hints: a real phone hides them (hover:none); this frame cannot say it is one
      const inSentence = /^inline/.test(getComputedStyle(e).display) && [...e.parentElement.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
      const b = e.getBoundingClientRect(); return b.width > 0 && !inSentence && (b.height < minH || b.width < 24);
    }).map(e => { const b = e.getBoundingClientRect(); return (e.getAttribute("aria-label") || e.textContent).trim().replace(/\s+/g, " ").slice(0, 24) + " " + Math.round(b.width) + "×" + Math.round(b.height); });
  };
  try { await tests(t, wait, esc); } catch (e) { t("the test ran to the end", false, e && e.stack || e); }
  const out = document.createElement("script"); out.type = "application/json"; out.id = "__results";
  out.textContent = JSON.stringify(R).replace(/</g, "\\u003c"); document.body.appendChild(out);
  if (parent !== window) parent.postMessage({ __results: R }, "*");   // run in a frame of a set size: see drive()
};
</script>`;

/* Select text inside a paragraph and return the pill's quote, the way a reader would. */
const QUOTE = String.raw`
// Esc must never take a reader off the page. A page that navigates away ends this script,
// so a left page also shows up as "no results came back"; this names it when it can.
async function staysPut(t, wait, name, href) {
  await wait(3000);
  t(name, location.href === href, "address is now " + location.href);
}
async function escSelection(t, wait, esc, p, stillOpen) {
  const tn = [...p.childNodes].find(n => n.nodeType === 3 && n.data.length > 40);
  const rg = document.createRange(); rg.setStart(tn, 0); rg.setEnd(tn, 30);
  getSelection().removeAllRanges(); getSelection().addRange(rg);
  document.dispatchEvent(new Event("selectionchange")); await wait(700);
  const href = location.href;
  esc(); await wait(150);
  t("Esc with a passage selected lets go of the selection", getSelection().isCollapsed || !getSelection().rangeCount);
  t("…and closes nothing else", !document.querySelector("dialog[open]") && !document.querySelector(".rs-pill") && stillOpen(), "something else closed");
  await staysPut(t, wait, "…and keeps the reader on the page", href);
}
async function quotePassage(t, wait, p, credit) {
  const tn = [...p.childNodes].find(n => n.nodeType === 3 && n.data.length > 70);
  if (!tn) return t("a paragraph long enough to quote", false);
  const rg = document.createRange(); rg.setStart(tn, 3); rg.setEnd(tn, 60);
  getSelection().removeAllRanges(); getSelection().addRange(rg);
  document.dispatchEvent(new Event("selectionchange")); await wait(700);
  const pill = document.querySelector(".rs-pill");
  t("selecting a passage offers Share quote", pill);
  if (!pill) return;
  pill.querySelector("[data-a=share]").click(); await wait(150);
  const dl = document.querySelector("dialog[open]"), q = dl.querySelector(".rs-q").textContent.replace(/^“|”$/g, "");
  const text = p.textContent.replace(/\s+/g, " "), i = text.indexOf(q);
  t("the quote is verbatim from the page", i >= 0, q);
  t("the quote starts and ends on whole words", i >= 0 && (i === 0 || !/[\w’']/.test(text[i - 1])) && !/[\w’']/.test(text[i + q.length] || " "), q);
  t("the passage link points into the entry's own page", /\/#:~:text=/.test(dl.querySelector("input").value), dl.querySelector("input").value);
  t("the quote is credited to the Press, on the entry", dl.querySelector(".rs-by").textContent === "— " + credit, dl.querySelector(".rs-by").textContent);
  // Bluesky refuses a post over 300 characters and counts the link whole
  const bs = dl.querySelector('a[href^="https://bsky.app/intent/compose"]');
  const post = bs ? new URL(bs.href).searchParams.get("text") : "";
  t("the Bluesky post fits in 300 characters, with the link and the credit", bs && [...post].length <= 300 && /https?:\/\/\S+$/.test(post) && post.includes(credit), post.length + ": " + post);
}`;

const ENTRY = (credit) => String.raw`
<script>${QUOTE}
addEventListener("load", () => setTimeout(() => __run(async (t, wait, esc) => {
  const canon = document.querySelector("link[rel=canonical]").href;
  t("the reading tools load", typeof Reading === "object");
  // the reader chose dusk in the library (seeded before load): the shared page opens at dusk, and says so
  t("an entry page opens in the reader's stored choice", document.documentElement.dataset.theme === "dark" && getComputedStyle(document.body).backgroundColor === "rgb(28, 26, 22)", document.documentElement.dataset.theme + " / " + getComputedStyle(document.body).backgroundColor);
  const esw = document.querySelector(".dusk-sw");
  t("…and carries the same Dusk switch, pressed", esw && esw.getAttribute("aria-pressed") === "true");
  // left part-read (seeded before the page loaded): the offer is a line in the flow, never over the text
  const rs = document.querySelector(".rs-resume");
  t("a part-read entry offers to continue", rs);
  if (rs) {
    t("…in the text's flow, not floating over it", getComputedStyle(rs).position === "static" && document.querySelector("main").contains(rs), getComputedStyle(rs).position);
    // --dump-dom never animates a smooth scroll, so the target is taken from the call and jumped to
    const jump = window.scrollTo; let asked = null;
    window.scrollTo = o => { asked = o; jump.call(window, { top: o.top, behavior: "auto" }); };
    rs.querySelector("[data-a=go]").click(); await wait(300); window.scrollTo = jump;
    t("…and Continue takes the reader back to their place", asked && asked.top > 200 && scrollY > 200 && !document.querySelector(".rs-resume"), "asked for " + (asked && Math.round(asked.top)) + ", at " + scrollY);
    scrollTo(0, 0); await wait(200);
  }
  t("the scripts-off links are hidden when scripts run", [...document.querySelectorAll(".rs-nojs")].every(e => getComputedStyle(e).display === "none"));
  const top = document.querySelector(".top [data-rs=share]");
  t("Share is visible in the top bar", top && getComputedStyle(top).display !== "none");
  top.click(); await wait(150);
  let dl = document.querySelector("dialog[open]");
  t("Share opens the sheet", dl);
  t("the sheet links the entry's own page", dl.querySelector("input").value === canon, dl.querySelector("input").value);
  const xl = [...dl.querySelectorAll("a")].find(a => a.textContent === "X"), xt = new URL(xl.href).searchParams.get("text");
  t("the X text leaves room for the link", xt.length <= 256, xt.length + " characters");
  dl.querySelector("[data-a=link]").click(); await wait(80);
  t("Copy link copies the page's address", window.__copied === canon, window.__copied);
  const href = location.href;
  esc(); await wait(80);
  t("Escape closes the sheet", !document.querySelector("dialog[open]"));
  await staysPut(t, wait, "…and keeps the reader on the page", href);
  const line = document.querySelector("[data-rs=line]");
  if (line) {
    line.click(); await wait(150); dl = document.querySelector("dialog[open]");
    t("the keep line is credited to the Press, on the entry", dl.querySelector(".rs-by").textContent === "— " + ${JSON.stringify(credit)}, dl.querySelector(".rs-by").textContent);
    t("no name is set under a quote", !dl.querySelector(".rs-t"));
    esc(); await wait(80);
  }
  await quotePassage(t, wait, document.querySelector(".essay p"), ${JSON.stringify(credit)});
  esc(); await wait(80);
  await escSelection(t, wait, esc, document.querySelector(".essay p"), () => true);
  scrollTo(0, document.documentElement.scrollHeight); dispatchEvent(new Event("scroll")); await wait(400);
  t("reading to the end says Finished", document.getElementById("rleft").textContent === "Finished ✓", document.getElementById("rleft").textContent + " at scrollY " + scrollY + " of " + document.documentElement.scrollHeight + ", dialog open: " + !!document.querySelector("dialog[open]"));
  t("…and says it in Garamond: a word is not data", !getComputedStyle(document.getElementById("rleft")).fontFamily.includes("Plex"), getComputedStyle(document.getElementById("rleft")).fontFamily);
  // the end of an entry once offered five ways to pass it on; Copy link lives in the share sheet
  { const b = [...document.querySelectorAll(".rs-end .rs-row button")].filter(e => e.offsetParent);
    t("the end of an entry has one share button", b.length === 1 && /Share this entry/.test(b[0].textContent), b.map(e => e.textContent).join(", ")); }
  const mem = JSON.parse(localStorage.getItem("cp-read") || "{}");
  t("the browser remembers the entry was finished", Object.values(mem).some(v => v.d === 1), JSON.stringify(mem));
  // nothing open, nothing selected: Esc has nothing to do, and must not leave the site
  getSelection().removeAllRanges(); const here = location.href;
  esc(); await wait(150);
  await staysPut(t, wait, "Esc with nothing open keeps the reader on the page", here);
}), 300));
</script>`;

/* An entry page is the link other people receive, often on a phone: its targets are measured
   at a desk and at 375px, the same rule as the library's. */
const TARGETS = where => String.raw`
<script>
addEventListener("load", () => setTimeout(() => __run(async (t, wait) => {
  await wait(300);
  const s = __targets(document.body);
  t("every target on ${where} is " + (innerWidth < 600 ? 44 : 24) + "px tall (" + innerWidth + "×" + innerHeight + ")", !s.length, s.slice(0, 6).join(" · "));
}), 600));
</script>`;

const LIBRARY = (kind, id, credit, want) => String.raw`
<script>${QUOTE}
addEventListener("load", () => setTimeout(() => __run(async (t, wait, esc) => {
  openReader(${JSON.stringify(kind)}, ${JSON.stringify(id)}); await wait(900);
  const sheet = document.getElementById("sheet"), reader = document.getElementById("reader");
  t("the reader opens the entry", current === ${JSON.stringify(id)});
  const rq = sheet.innerText.search(/['"]/);
  t("no straight quote in the reader", rq < 0, rq < 0 ? "" : "…" + sheet.innerText.slice(Math.max(0, rq - 30), rq + 30) + "…");
  const shelfN = [...sheet.querySelectorAll(".rmeta div")].map(d => d.textContent).find(x => /№/.test(x)) || "";
  const shelfOf = ${JSON.stringify(kind)} === "press" ? (BOOKS.some(b => b.id === ${JSON.stringify(id)}) ? BOOKS : ADJACENT) : LIVES;
  // a title is counted on its shelf; a life carries its own permanent number instead (content/lives/*.json \`no\`)
  if (${JSON.stringify(kind)} === "press") t("the reader counts the shelf the entry stands on", shelfN.endsWith("of " + shelfOf.length), shelfN + " — the shelf holds " + shelfOf.length);
  else { const no = LIVES.find(b => b.id === ${JSON.stringify(id)}).no; t("the reader prints the life's own number", shelfN.endsWith("№ " + no), shelfN + " — the life is № " + no); }
  t("the reader and the entry page print the same minutes", +document.getElementById("rleft").dataset.mins === ${want.mins}, document.getElementById("rleft").dataset.mins + " vs ${want.mins}");
  t("the reader and the entry page recommend the same next read", sheet.querySelector(".rs-next .rs-nt").textContent.trim() === ${JSON.stringify(want.next)}, sheet.querySelector(".rs-next .rs-nt").textContent);
  sheet.querySelector(".rbar .rs-go").click(); await wait(150);
  let dl = document.querySelector("dialog[open]");
  t("Share in the reader links the entry's own page, not the #hash", dl && dl.querySelector("input").value === ${JSON.stringify(want.url)}, dl && dl.querySelector("input").value);
  const href = location.href;
  esc(); await wait(80);
  t("Escape closes the sheet and leaves the reader open", !document.querySelector("dialog[open]") && current === ${JSON.stringify(id)});
  await staysPut(t, wait, "…and keeps the reader on the page", href);
  const line = sheet.querySelector(".rs-lineshare");
  if (line) {
    line.click(); await wait(150); dl = document.querySelector("dialog[open]");
    t("the keep line is credited to the Press, on the entry", dl.querySelector(".rs-by").textContent === "— " + ${JSON.stringify(credit)}, dl.querySelector(".rs-by").textContent);
    esc(); await wait(80);
  }
  await quotePassage(t, wait, sheet.querySelector(".rbody .copy p"), ${JSON.stringify(credit)});
  esc(); await wait(80);
  await escSelection(t, wait, esc, sheet.querySelector(".rbody .copy p"), () => current === ${JSON.stringify(id)});
  reader.scrollTop = reader.scrollHeight; reader.dispatchEvent(new Event("scroll")); await wait(400);
  t("reading to the end says Finished", document.getElementById("rleft").textContent === "Finished ✓", document.getElementById("rleft").textContent + " at scrollTop " + reader.scrollTop + " of " + reader.scrollHeight + ", dialog open: " + !!document.querySelector("dialog[open]"));
  t("…and says it in Garamond: a word is not data", !getComputedStyle(document.getElementById("rleft")).fontFamily.includes("Plex"), getComputedStyle(document.getElementById("rleft")).fontFamily);
  // the end of an entry once offered five ways to pass it on; Copy link lives in the share sheet
  { const b = [...document.querySelectorAll(".rs-end .rs-row button")].filter(e => e.offsetParent);
    t("the end of an entry has one share button", b.length === 1 && /Share this entry/.test(b[0].textContent), b.map(e => e.textContent).join(", ")); }
  const onSite = location.origin + location.pathname;
  esc(); await wait(1000);
  t("Esc in the reader closes the reader", current === null, "still reading " + current);
  await wait(3000);
  t("…and keeps the reader on the site", location.origin + location.pathname === onSite, "address is now " + location.href);
  const slot = document.querySelector((${JSON.stringify(kind)} === "press" ? "#shelf" : "#livesShelf") + " .slot[data-id=" + ${JSON.stringify(JSON.stringify(id))} + "]");
  t("a finished entry is marked Read on its shelf", slot && slot.classList.contains("read"));
  go("home"); await wait(500);
  t("the front door keeps the bare address, the one a reader shares", location.hash === "", "address ends " + location.hash);
  const nb = document.querySelector("#nav .navbtn"); nb.focus();
  nb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); await wait(500);
  t("on the front door, arrows leave a focused button alone", wing === "home", "went to " + wing);
  nb.blur(); document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); await wait(600);
  t("on the front door, arrows with nothing focused open the Press shelf", wing === "press", "went to " + wing);
}), 600));
</script>`;

/* The front door, at a desk and on a phone. */
const FRONT = String.raw`
<script>
addEventListener("load", () => setTimeout(() => __run(async (t, wait) => {
  scrollTo(0, 0); await wait(200);
  const size = innerWidth + "×" + innerHeight;
  // the phone run starts from a stored dusk: the switch is drawn after the theme is applied, and
  // it once came up "off" in a house that was already dark
  if (localStorage.getItem("cp-theme") === "dark")
    t("a stored dusk opens at dusk, with the switch pressed", document.body.classList.contains("dusk") && document.getElementById("themeBtn").getAttribute("aria-pressed") === "true",
      "dusk: " + document.body.classList.contains("dusk") + ", pressed: " + document.getElementById("themeBtn").getAttribute("aria-pressed"));
  // everyone opens on paper: the colophon says the reading wings are set on paper, and a dark device once overruled it
  if (localStorage.getItem("cp-theme") === null)
    t("a dark-mode device with no stored choice opens on paper", !document.body.classList.contains("dusk") && document.getElementById("themeBtn").getAttribute("aria-pressed") === "false", "dusk: " + document.body.classList.contains("dusk"));
  const rack = document.querySelector(".front .rack"), r = rack && rack.getBoundingClientRect();
  // 200px of spines is a shelf you can see; less is the top of something below the fold
  t("the first screen holds the shelf (" + size + ")", r && innerHeight - r.top >= 200, r ? "the spines start at " + Math.round(r.top) + "px of " + innerHeight : "no shelf on the front door");
  t("no sideways scroll (" + size + ")", document.documentElement.scrollWidth <= innerWidth, document.documentElement.scrollWidth + "px wide");
  // the footer's links were 20px and the phone nav 40px, and nothing measured them
  const minH = innerWidth < 600 ? 44 : 24, small = [document.querySelector("header"), document.querySelector(".wing.on"), document.querySelector("footer")].flatMap(__targets);
  t("every target on the front door is " + minH + "px tall (" + size + ")", !small.length, small.slice(0, 6).join(" · "));
  // Dusk is a switch, not a room: underlined when on, it read as a second place the reader was "in"
  const tb = document.getElementById("themeBtn"), lit = document.body.classList.contains("dusk");
  if (!lit) toggleTheme(); await wait(100);
  t("the Dusk switch, when on, is lit, not underlined like the current wing", getComputedStyle(tb).textDecorationLine === "none" && getComputedStyle(tb, "::before").backgroundColor !== "rgba(0, 0, 0, 0)",
    "underline: " + getComputedStyle(tb).textDecorationLine + ", lamp: " + getComputedStyle(tb, "::before").backgroundColor);
  if (!lit) toggleTheme(); await wait(100);
  t("the top of the first screen has no buttons: the shelf is the one thing to do", !document.querySelector(".front-top button, .front-top a"),
    [...document.querySelectorAll(".front-top button, .front-top a")].map(e => e.textContent.trim()).join(", "));
  // spine titles, as rendered, in the light the page opens in: a CSS rule once outranked the
  // livery's ink and printed every title in page-black on a dark spine, and a check run in dark
  // mode (where page-black is light) passed it
  applyTheme(false); await wait(300);
  const lum = c => c.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
  const dim = [...document.querySelectorAll(".front .rk")].map(a => [a.getAttribute("aria-label"), ratio(getComputedStyle(a.querySelector(".rk-sp > span")).color, getComputedStyle(a.querySelector(".rk-sp")).backgroundColor)]).filter(x => x[1] < 7);
  t("every spine title reads at 7:1 or better on its spine", !dim.length, dim.slice(0, 4).map(x => x[0] + " " + x[1].toFixed(2) + ":1").join(" · "));
  const cut = [...document.querySelectorAll(".front .rk-sp > span")].filter(e => e.scrollHeight > e.clientHeight + 1).map(e => e.textContent);
  t("no spine title is cut off", !cut.length, cut.join(" · "));
  // dusk, measured: the books keep a lit edge on the wall, portraits sit in a dim mount, the
  // Atlas stays a different room, and the switch says what it is
  applyTheme(true); await wait(300);
  const wall = getComputedStyle(document.body).backgroundColor;
  const lab = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    const f = x => x > .008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116, X = f((r * .4124 + g * .3576 + b * .1805) / .95047), Y = f(r * .2126 + g * .7152 + b * .0722), Z = f((r * .0193 + g * .1192 + b * .9505) / 1.08883);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)]; };
  const dE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
  const sunk = [...document.querySelectorAll(".front .rk-sp")].filter(sp => { const c = getComputedStyle(sp); return parseFloat(c.outlineWidth) < 1 || c.outlineStyle === "none" || ratio(c.outlineColor, wall) < 3; });
  t("at dusk every book has a lit edge at 3:1 on the wall", !sunk.length, sunk.length + " spines sink into the wall");
  const mounts = [...document.querySelectorAll(".wall .fp-img")].map(m => ratio(getComputedStyle(m).backgroundColor, wall)), glare = mounts.filter(v => v > 2);
  t("at dusk the portraits sit in a dim mount, not glaring paper", mounts.length && !glare.length, glare.length + " mounts over 2:1, brightest " + Math.max(...mounts).toFixed(2));
  const sea = dE(getComputedStyle(document.querySelector(".band.night")).backgroundColor, wall);
  t("at dusk the Atlas is still its own room", sea >= 10, "ΔE " + sea.toFixed(1) + " from the wall");
  const sw = document.getElementById("themeBtn");
  t("the switch is named Dusk and says whether it is on", sw.textContent.trim() === "Dusk" && sw.getAttribute("aria-pressed") === "true", sw.textContent + " / " + sw.getAttribute("aria-pressed"));
  applyTheme(false); await wait(300);
  t("…and off by day", sw.getAttribute("aria-pressed") === "false");
  // search, typed as a reader types: a straight apostrophe must find a curled one
  await loadLibrary(); SIX = null;
  const src = ALL.concat(LIVES).find(e => /\w’\w/.test(e.lede || "")), word = src && src.lede.match(/[A-Za-z]+’[A-Za-z]+/)[0];
  openSearch(); await wait(200); runSearch(word.replace("’", "'"));
  const found = [...document.querySelectorAll("#sresults .sres b")].map(x => x.textContent);
  closeSearch();
  t("search finds “" + word + "” typed with a straight apostrophe", found.includes(src.title || src.n), found.slice(0, 4).join(", ") || "nothing");
  const tally = document.getElementById("tally"), nums = (tally.textContent.match(/\d+/g) || []);
  t("the front door's one count is the corrections, and it opens them", nums.length === 1 && +nums[0] === CORRECTIONS.length && tally.querySelector("a[href='#corrections']"), tally.textContent.trim());
  const books = [...document.querySelectorAll(".front .rack a.rk")], faces = [...document.querySelectorAll(".wall a.wface")];
  t("every book on the front door links its own page", books.length === BOOKS.length && books.every((a, i) => a.getAttribute("href") === "t/" + BOOKS[i].id + "/"), books.length + " links for " + BOOKS.length + " books");
  t("every face on the front door links its own page", faces.length === LIVES.length && faces.every((a, i) => a.getAttribute("href") === "l/" + LIVES[i].id + "/"), faces.length + " links for " + LIVES.length + " lives");
  t("nothing on the page opens an entry from a button", !document.querySelector('button[onclick*="openReader"],button[onclick*="openLife"]'));
  let left = null; addEventListener("click", e => { left = !e.defaultPrevented; e.preventDefault(); }, { once: true });
  books[1].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true })); await wait(200);
  t("a Cmd-click on a book is left to the browser", left === true && current === null, "prevented: " + !left + ", reader: " + current);
  const here = location.pathname;
  await loadLibrary();
  // without a mouse the first tap opens the cover in place, the second opens the book
  if (matchMedia("(hover:none),(max-width:760px)").matches) {
    books[1].click(); await wait(400);
    t("a first tap opens the book's cover on the shelf (" + size + ")", books[1].classList.contains("open") && current === null && getComputedStyle(books[1].querySelector(".rk-cv")).visibility === "visible", "open: " + books[1].classList.contains("open") + ", reader: " + current);
  }
  books[1].click(); await wait(60);
  t("opening a book from the front-door shelf flies it to the reader (" + size + ")", !!document.querySelector("#flip .ghostwrap"));
  await wait(1200);
  t("a plain click on a book opens the reader in place", current === BOOKS[1].id && location.pathname === here, "reader: " + current + ", at " + location.href);
  // reading comes first: the entry's opening lines start on the first screen, at a desk and on a phone
  const lede = document.querySelector("#sheet .rbody .lede"), lt = lede && Math.round(lede.getBoundingClientRect().top);
  t("the reader's first lines are on the first screen (" + size + ")", lede && lt < innerHeight * .6, "the lede starts at " + lt + "px of " + innerHeight);
  const rd = document.getElementById("reader"), pw = [...document.querySelectorAll("#sheet .rbody .copy p")].map(p => p.getBoundingClientRect().width);
  t("the reader never scrolls sideways, and its prose runs the full width (" + size + ")", (rd.scrollWidth <= rd.clientWidth || getComputedStyle(rd).overflowX === "hidden") && Math.min(...pw) >= Math.min(rd.clientWidth - 60, 480),
    "scrolls " + rd.scrollWidth + " in " + rd.clientWidth + ", narrowest paragraph " + Math.round(Math.min(...pw)) + "px");
  // the reader on a phone had a 19px "Share this line" and a 30px way back
  const rSmall = __targets(document.getElementById("reader"));
  t("every target in a title's reader is " + minH + "px tall (" + size + ")", !rSmall.length, rSmall.slice(0, 6).join(" · "));
  closeReader(); await wait(900);
  document.querySelectorAll("#flip .ghostwrap").forEach(g => g.remove());
  const keep = document.querySelector(".cap-keep");
  if (keep) {
    const name = document.getElementById("capN").textContent.trim(), by = keep.querySelector(".cap-by");
    t("the Captain's keep line is credited to the Press, on the life", by && by.textContent === "— The Commodore Press, on " + name, by ? by.textContent : "no credit under it");
    t("…and set in roman, not as a quotation beside the face", getComputedStyle(keep.querySelector("p")).fontStyle !== "italic");
  }
  const lives = [...document.querySelectorAll(".fd-lesson .fl-life")];
  t("the Atlas lesson on the front door stands beside a Life from the shelf", lives.length > 0 && lives.every(a => /^l\/[^/]+\/$/.test(a.getAttribute("href"))), lives.length + " Lives");
  t("…and the Life's line is set in roman", lives.every(a => getComputedStyle(a.querySelector(".fl-txt")).fontStyle !== "italic"));
  // the engine writes prose too (press.js, atlas.js): read every wing as a reader sees it
  const straight = [];
  for (const w of ["home", "press", "lives", "atlas", "colophon"]) {
    go(w, false); await wait(500);
    const txt = document.querySelector(".wing.on").innerText, i = txt.search(/['"]/);
    if (i >= 0) straight.push(w + ": …" + txt.slice(Math.max(0, i - 30), i + 30).replace(/\s+/g, " ") + "…");
  }
  // one name per room: the nav said "The Atlas" and the room "What They Taught Me", "Lives" and "Lives That Withstood Time"
  const misnamed = [];
  for (const b of document.querySelectorAll("#nav .navbtn[data-w]")) {
    go(b.dataset.w, false); await wait(300);
    const h = document.querySelector(".wing.on .wing-head h2");
    if (!h || h.textContent.trim() !== b.textContent.trim()) misnamed.push(b.textContent.trim() + " → " + (h ? h.textContent.trim() : "no heading"));
  }
  t("every room is headed with its name in the nav", !misnamed.length, misnamed.join(" · "));
  go("home", false); await wait(300);
  t("no straight quote on any wing, as rendered", !straight.length, straight.join(" · "));
  // mono is for data: a year, a date, a count — or a source line. Words set in it (a label, a
  // button, a field name) broke the type rule for weeks, because the check only read capitals
  await loadLibrary();
  const worded = new Set(), scan = (root, where) => root && root.querySelectorAll("*").forEach(e => {
    if (!e.offsetParent || e.closest("svg, .facts")) return;
    const tx = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join("").trim();
    if (tx.length < 2 || !getComputedStyle(e).fontFamily.includes("Plex")) return;
    // a digit made a line count as data, so "4 people said this, in my notes" passed in mono: three
    // words or more is a sentence whatever else it holds (source lines live in .facts, skipped above)
    if (!/\d/.test(tx) || (tx.match(/[A-Za-z’']{2,}/g) || []).length >= 3 || (/[A-Z]{4,}/.test(tx) && tx === tx.toUpperCase())) worded.add(where + ": " + tx.slice(0, 32));
  });
  for (const w of ["home", "press", "lives", "atlas", "colophon"]) { go(w, false); await wait(500); scan(document.querySelector(".wing.on"), w); }
  // the Atlas on a phone: zoom and constellation arrows at 30–34px, its text links at 27
  go("atlas", false); await wait(900);
  const aSmall = __targets(document.querySelector(".wing.on"));
  t("every target on the Atlas is " + minH + "px tall (" + size + ")", !aSmall.length, aSmall.slice(0, 6).join(" · "));
  go("colophon", false); await wait(700);
  const cSmall = __targets(document.querySelector(".wing.on"));
  t("every target in the colophon is " + minH + "px tall (" + size + ")", !cSmall.length, cSmall.slice(0, 6).join(" · "));
  atlasRoute("hard"); await wait(900); scan(document.getElementById("isleCard"), "island card");
  go("home", false); await wait(300);
  openReader("lives", LIVES.find(l => l.bio).id); await wait(1000); scan(document.getElementById("sheet"), "reader");
  // the head once said the place twice: "The famous · United States", then "Politics & Leadership · United States"
  { const L = LIVES.find(l => l.bio), sh = document.getElementById("sheet"), lede = sh.querySelector(".rbody .lede");
    const head = lede ? sh.innerText.split(lede.innerText)[0] : sh.innerText, n = head.split(L.place).length - 1;
    t("a life's reader names its place once, above the lede", n === 1, n + "× \"" + L.place + "\"");
  }
  const lSmall = __targets(document.getElementById("reader"));
  t("every target in a life's reader is " + minH + "px tall (" + size + ")", !lSmall.length, lSmall.slice(0, 6).join(" · "));
  closeReader(false); await wait(700);
  t("mono carries data only: no words, no capitals", !worded.size, [...worded].slice(0, 5).join(" · "));
}), 600));
</script>`;

/* `frame` is [width, height]: the page runs in an iframe of exactly that size. Headless Chrome
   will not make a window narrower than 500px, and its window size is not its viewport, so a
   phone is measured the way a phone sees it only from inside a frame. */
function drive(page, script, frame, head = "") {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cp-test-"));
  let src = path.join(tmp, "page.html");
  fs.writeFileSync(src, page.replace("<head>", "<head>" + head).replace("</body>", HARNESS + script + "</body>"));
  if (frame) {
    const outer = path.join(tmp, "frame.html");
    fs.writeFileSync(outer, `<!doctype html><body style="margin:0"><iframe src="page.html" width="${frame[0]}" height="${frame[1]}" style="border:0;display:block"></iframe>
<script>addEventListener("message", e => { if (!e.data || !e.data.__results) return; const o = document.createElement("script");
o.type = "application/json"; o.id = "__results"; o.textContent = JSON.stringify(e.data.__results).replace(/</g, "\\u003c"); document.body.appendChild(o); });</script></body>`);
    src = outer;
  }
  // the entries' bodies ship beside the page (build/build.mjs); the reader fetches them from there
  for (const f of fs.readdirSync(dist()).filter(f => /^library\.[0-9a-f]+\.js$/.test(f))) fs.copyFileSync(dist(f), path.join(tmp, f));
  // and the typefaces, which the page now asks for from fonts/ beside it: without them every
  // measurement here (spine titles, the first screen, targets) would be taken in a fallback face
  if (fs.existsSync(dist("fonts"))) fs.cpSync(dist("fonts"), path.join(tmp, "fonts"), { recursive: true });
  let dom = "";
  try {
    dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", `--window-size=${frame ? `${frame[0] + 40},${frame[1] + 160}` : "1280,900"}`,
      "--virtual-time-budget=20000", "--dump-dom", `file://${src}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20, timeout: 120000 });
  } catch (e) { /* reported below */ }
  fs.rmSync(tmp, { recursive: true, force: true });
  const m = dom.match(/<script type="application\/json" id="__results">([^]*?)<\/script>/);
  return m ? JSON.parse(m[1]) : [{ n: "the page ran its tests", ok: false,
    d: "no results came back from Chrome — usually the page navigated away mid-test (an Esc that leaves the site does exactly this), or a script threw before the tests began" }];
}

/* What the entry page says, so the library can be held to it. */
function entryFacts(k, id) {
  const html = fs.readFileSync(dist(k, id, "index.html"), "utf8");
  const conf = JSON.parse(html.match(/Reading\.page\((\{.*?\})\)<\/script>/s)[1]);
  const next = html.match(/<span class="rs-nt">([^<]*)<\/span>/)[1];
  const strip = s => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
  return { url: conf.url, mins: conf.mins, next: strip(next), credit: `The Commodore Press, on ${conf.title}` };
}

if (!CHROME) {
  console.log(`\n  ${y}No Chrome or Chromium found — the browser tests were skipped. Set CHROME=/path.${x}`);
} else {
  // the front door, at a desk and on a phone: the two first screens a new reader meets
  for (const size of [[1440, 900], [375, 812]])
    report(`Front door · ${size.join("×")}`, drive(fs.readFileSync(dist("index.html"), "utf8"), FRONT, size,
      size[0] < 600 ? `<script>try{localStorage.setItem("cp-theme","dark")}catch(e){}</script>`
        // the desk run is a dark-mode device with no stored choice: it must still open on paper
        : `<script>try{localStorage.removeItem("cp-theme")}catch(e){}var __mm=matchMedia.bind(window);window.matchMedia=function(q){return /prefers-color-scheme: ?dark/.test(q)?{matches:true,media:q,addEventListener:function(){},removeEventListener:function(){},addListener:function(){},removeListener:function(){}}:__mm(q)}</script>`));
  // a life with a plate and a keep line, and a title: the two shapes an entry comes in
  for (const [k, kind, id] of [["l", "lives", "charles-darwin"], ["t", "press", "compounding-machines"]]) {
    const f = entryFacts(k, id);
    const seed = `<script>try{localStorage.setItem("cp-read",JSON.stringify({"${k}/${id}":{p:.4,d:0,t:1}}));localStorage.setItem("cp-theme","dark")}catch(e){}</script>`;
    report(`Entry page · ${k}/${id}`, drive(fs.readFileSync(dist(k, id, "index.html"), "utf8"), ENTRY(f.credit), null, seed));
    report(`Library reader · ${k}/${id}`, drive(fs.readFileSync(dist("index.html"), "utf8"), LIBRARY(kind, id, f.credit, f)));
    for (const size of [[1280, 900], [375, 812]])
      report(`Entry page targets · ${k}/${id} · ${size.join("×")}`, drive(fs.readFileSync(dist(k, id, "index.html"), "utf8"), TARGETS("the entry page"), size[0] < 600 ? size : null));
  }
}

console.log(failed ? `\n  ${r}${failed} failed.${x} The reading tools are not what a reader should meet.\n` : `\n  ${g}✓ the reading tools behave${x}\n`);
process.exit(failed ? 1 : 0);

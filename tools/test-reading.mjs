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
  try { await tests(t, wait, esc); } catch (e) { t("the test ran to the end", false, e && e.stack || e); }
  const out = document.createElement("script"); out.type = "application/json"; out.id = "__results";
  out.textContent = JSON.stringify(R).replace(/</g, "\\u003c"); document.body.appendChild(out);
};
</script>`;

/* Select text inside a paragraph and return the pill's quote, the way a reader would. */
const QUOTE = String.raw`
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
}`;

const ENTRY = (credit) => String.raw`
<script>${QUOTE}
addEventListener("load", () => setTimeout(() => __run(async (t, wait, esc) => {
  const canon = document.querySelector("link[rel=canonical]").href;
  t("the reading tools load", typeof Reading === "object");
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
  esc(); await wait(80);
  t("Escape closes the sheet", !document.querySelector("dialog[open]"));
  const line = document.querySelector("[data-rs=line]");
  if (line) {
    line.click(); await wait(150); dl = document.querySelector("dialog[open]");
    t("the keep line is credited to the Press, on the entry", dl.querySelector(".rs-by").textContent === "— " + ${JSON.stringify(credit)}, dl.querySelector(".rs-by").textContent);
    t("no name is set under a quote", !dl.querySelector(".rs-t"));
    esc(); await wait(80);
  }
  await quotePassage(t, wait, document.querySelector(".essay p"), ${JSON.stringify(credit)});
  esc(); await wait(80);
  scrollTo(0, document.documentElement.scrollHeight); dispatchEvent(new Event("scroll")); await wait(400);
  t("reading to the end says Finished", document.getElementById("rleft").textContent === "Finished ✓", document.getElementById("rleft").textContent + " at scrollY " + scrollY + " of " + document.documentElement.scrollHeight + ", dialog open: " + !!document.querySelector("dialog[open]"));
  const mem = JSON.parse(localStorage.getItem("cp-read") || "{}");
  t("the browser remembers the entry was finished", Object.values(mem).some(v => v.d === 1), JSON.stringify(mem));
}), 300));
</script>`;

const LIBRARY = (kind, id, credit, want) => String.raw`
<script>${QUOTE}
addEventListener("load", () => setTimeout(() => __run(async (t, wait, esc) => {
  openReader(${JSON.stringify(kind)}, ${JSON.stringify(id)}); await wait(900);
  const sheet = document.getElementById("sheet"), reader = document.getElementById("reader");
  t("the reader opens the entry", current === ${JSON.stringify(id)});
  t("the reader and the entry page print the same minutes", +document.getElementById("rleft").dataset.mins === ${want.mins}, document.getElementById("rleft").dataset.mins + " vs ${want.mins}");
  t("the reader and the entry page recommend the same next read", sheet.querySelector(".rs-next .rs-nt").textContent.trim() === ${JSON.stringify(want.next)}, sheet.querySelector(".rs-next .rs-nt").textContent);
  sheet.querySelector(".rbar .rs-go").click(); await wait(150);
  let dl = document.querySelector("dialog[open]");
  t("Share in the reader links the entry's own page, not the #hash", dl && dl.querySelector("input").value === ${JSON.stringify(want.url)}, dl && dl.querySelector("input").value);
  esc(); await wait(80);
  t("Escape closes the sheet and leaves the reader open", !document.querySelector("dialog[open]") && current === ${JSON.stringify(id)});
  const line = sheet.querySelector(".rs-lineshare");
  if (line) {
    line.click(); await wait(150); dl = document.querySelector("dialog[open]");
    t("the keep line is credited to the Press, on the entry", dl.querySelector(".rs-by").textContent === "— " + ${JSON.stringify(credit)}, dl.querySelector(".rs-by").textContent);
    esc(); await wait(80);
  }
  await quotePassage(t, wait, sheet.querySelector(".rbody .copy p"), ${JSON.stringify(credit)});
  esc(); await wait(80);
  reader.scrollTop = reader.scrollHeight; reader.dispatchEvent(new Event("scroll")); await wait(400);
  t("reading to the end says Finished", document.getElementById("rleft").textContent === "Finished ✓", document.getElementById("rleft").textContent + " at scrollTop " + reader.scrollTop + " of " + reader.scrollHeight + ", dialog open: " + !!document.querySelector("dialog[open]"));
  closeReader(); await wait(1000);
  const slot = document.querySelector((${JSON.stringify(kind)} === "press" ? "#shelf" : "#livesShelf") + " .slot[data-id=" + ${JSON.stringify(JSON.stringify(id))} + "]");
  t("a finished entry is marked Read on its shelf", slot && slot.classList.contains("read"));
  go("home"); await wait(500);
  const nb = document.querySelector("#nav .navbtn"); nb.focus();
  nb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); await wait(500);
  t("on the front door, arrows leave a focused button alone", wing === "home", "went to " + wing);
  nb.blur(); document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); await wait(600);
  t("on the front door, arrows with nothing focused open the Press shelf", wing === "press", "went to " + wing);
}), 600));
</script>`;

function drive(page, script) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cp-test-"));
  const src = path.join(tmp, "page.html");
  fs.writeFileSync(src, page.replace("</body>", HARNESS + script + "</body>"));
  let dom = "";
  try {
    dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=1280,900",
      "--virtual-time-budget=20000", "--dump-dom", `file://${src}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20, timeout: 120000 });
  } catch (e) { /* reported below */ }
  fs.rmSync(tmp, { recursive: true, force: true });
  const m = dom.match(/<script type="application\/json" id="__results">([^]*?)<\/script>/);
  return m ? JSON.parse(m[1]) : [{ n: "the page ran its tests", ok: false, d: "no results came back from Chrome" }];
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
  // a life with a plate and a keep line, and a title: the two shapes an entry comes in
  for (const [k, kind, id] of [["l", "lives", "charles-darwin"], ["t", "press", "compounding-machines"]]) {
    const f = entryFacts(k, id);
    report(`Entry page · ${k}/${id}`, drive(fs.readFileSync(dist(k, id, "index.html"), "utf8"), ENTRY(f.credit)));
    report(`Library reader · ${k}/${id}`, drive(fs.readFileSync(dist("index.html"), "utf8"), LIBRARY(kind, id, f.credit, f)));
  }
}

console.log(failed ? `\n  ${r}${failed} failed.${x} The reading tools are not what a reader should meet.\n` : `\n  ${g}✓ the reading tools behave${x}\n`);
process.exit(failed ? 1 : 0);

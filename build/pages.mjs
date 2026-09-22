/* Entry pages — one real, crawlable page per title and life, beside the library.

   The library is one page with hash routes (#t/forty-two), and a search engine or a link
   preview treats every hash as the front door. So nothing on the shelves could be found by
   searching for it, and a shared title previewed as the generic card. These pages fix that:
   each carries the entry's own title, description, canonical URL and share card, and the
   full text, so a reader who arrives from a search can read it without the engine.

   They are a second printing of the same content/, not a second source. Nothing here is
   written by hand; section names match the reader in theme/press.js so the two agree. */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { favicon, fillMark } from "./mark.mjs";

/* The date an entry's file last changed, from git. The sitemap and each page's JSON-LD say
   when a page was modified; stamping every page with the build date taught crawlers to
   ignore the field. Null when git has no history (a shallow checkout): better no date than
   a wrong one. The deploy workflow fetches full history for this reason. */
export function entryDates(ROOT) {
  const out = {};
  for (const d of ["content/books", "content/adjacent", "content/lives"]) {
    const dir = path.join(ROOT, d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json"))) {
      const id = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).id;
      try { out[id] = execFileSync("git", ["log", "-1", "--format=%cs", "--", `${d}/${f}`], { cwd: ROOT, encoding: "utf8" }).trim() || null; }
      catch { out[id] = null; }
    }
  }
  return out;
}

/* The byline, set once and used everywhere a page names its editor: bylines, footers, the
   Log, structured data. Full name by the editor's decision, 2026-09-21. The template's own
   two mentions (the front-door label and the colophon disclosure) are filled from this too. */
export const EDITOR = "Luca Falvo";

const strip = s => String(s || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const attr = s => strip(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const clip = (s, n) => { s = strip(s); return s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)) + "…"; };

/* The sign-up box. With no `action` in content/newsletter.json there is no form, and the
   box points at the feed — the one way to follow the Press that needs no service. */
export function signupHTML(NEWS, root, heading = "Follow the Press", hasFeed = true) {
  const feed = `<a href="${root}feed.xml">RSS feed</a>`;
  if (!NEWS || !NEWS.action) return `<div class="sub-box"><b>${heading}</b>New Log pieces arrive in the ${feed}, in full.</div>`;
  return `<form class="sub-box" action="${attr(NEWS.action)}" method="post" target="_blank">
<b>${heading}</b><p>${inline(NEWS.pitch || "New pieces by email.")}</p>
<div class="sub-row"><input type="email" name="${attr(NEWS.field || "email")}" required placeholder="you@example.com" aria-label="Email address"><button type="submit">Subscribe</button></div>
<small>Addresses are held by ${attr(NEWS.provider)}, and used for nothing else.${hasFeed ? ` Or follow the ${feed}.` : ""}</small></form>`;
}

// press:<id> and lives:<id> resolve to their pages; atlas: links open the library.
const hrefFor = (to, known) => {
  const [w, id] = to.split(":");
  if (w === "press" && known.press.has(id)) return `../../t/${id}/`;
  if (w === "lives" && known.lives.has(id)) return `../../l/${id}/`;
  return `../../#${w === "press" ? "t/" + id : w === "lives" ? "l/" + id : w}`;
};

const CSS = `
:root{--paper:#F2EDE1;--rule:#D3C9B2;--ink:#1E1C18;--ink-soft:#5C5647;--oxblood:#8A2B25;
  --serif:"EB Garamond","Iowan Old Style",Palatino,Georgia,serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){:root{--paper:#12151F;--rule:#2B3247;--ink:#EAE3D1;--ink-soft:#98917E;--oxblood:#CE7B6E}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:20px/1.62 var(--serif);-webkit-font-smoothing:antialiased}
a{color:inherit}
.top{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:14px 20px;font:12px/1 var(--mono);
  letter-spacing:.14em;text-transform:uppercase;border-bottom:1px solid var(--rule)}
.top a{text-decoration:none}
.band{background:var(--cover);color:var(--cink);padding:56px 20px 48px}
.band .in,.body{max-width:680px;margin:0 auto}
.kick{font:12px/1.4 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
h1{font-weight:500;font-size:clamp(38px,7vw,58px);line-height:1.05;margin:14px 0 10px;letter-spacing:-.01em}
.sub{font-style:italic;font-size:22px;opacity:.9;margin:0}
.claim{font-size:23px;line-height:1.4;margin:26px 0 0;padding-left:16px;border-left:2px solid var(--accent)}
.plate{float:right;width:150px;margin:0 0 12px 24px}
.plate img{width:100%;display:block;border-radius:2px}
.body{padding:36px 20px 64px}
.lede{font-size:23px;line-height:1.45}
h2{font:12px/1.4 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);
  margin:44px 0 14px;padding-top:14px;border-top:1px solid var(--rule)}
.row{margin:0 0 14px}.row b{display:block;font-weight:600}
.row span,.why{color:var(--ink-soft);font-size:18px}
.fact b{font:600 26px/1.2 var(--mono);color:var(--oxblood)}
.keep{font-size:25px;line-height:1.35;font-style:italic}
ol.tl{padding-left:0;list-style:none}ol.tl li{margin:0 0 10px}ol.tl .y{font:14px var(--mono);color:var(--oxblood);margin-right:10px}
.cta{display:inline-block;margin-top:48px;padding:12px 18px;border:1px solid var(--ink);font:13px/1 var(--mono);
  letter-spacing:.1em;text-transform:uppercase;text-decoration:none}
.cta:hover{background:var(--ink);color:var(--paper)}
.sub-box{display:block;margin-top:48px;padding:20px;border:1px solid var(--rule);font-size:18px}
.sub-box b{font:12px var(--mono);letter-spacing:.12em;text-transform:uppercase;display:block;margin-bottom:6px}
.sub-box p{margin:0 0 12px}.sub-box small{display:block;margin-top:10px;font:12px/1.5 var(--mono);color:var(--ink-soft)}
.sub-row{display:flex;gap:8px;flex-wrap:wrap}.sub-row input{flex:1 1 200px;min-width:0;padding:10px 12px;font:16px var(--serif);
  background:transparent;color:var(--ink);border:1px solid var(--ink-soft);border-radius:0}
.sub-row button{padding:10px 16px;font:12px var(--mono);letter-spacing:.1em;text-transform:uppercase;background:var(--ink);color:var(--paper);border:0;cursor:pointer}
.pn{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:40px;padding-top:18px;border-top:1px solid var(--rule)}
.pn a{text-decoration:none;font-size:19px;line-height:1.3}.pn a:last-child{text-align:right}
.pn span{display:block;font:11px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:4px}
footer{border-top:1px solid var(--rule);padding:20px;font:12px/1.6 var(--mono);color:var(--ink-soft);text-align:center}
@media (max-width:560px){body{font-size:18px}.plate{float:none;width:130px;margin:0 0 20px}}
`;

/* The page body, in sections with a clear order of weight: the essay, then the evidence
   (numbers, the people, the timeline), then the house's apparatus in callouts — disputes and
   corrections are what this press sells, so they are set apart rather than buried among
   same-weight headings. Returns the html and the section list for the side rail. */
const ENTRY_CSS = `
.crumbs{display:flex;gap:8px;align-items:center;min-width:0;overflow:hidden;white-space:nowrap}
.crumbs i{font-style:normal;opacity:.4}.crumbs span{opacity:.6;overflow:hidden;text-overflow:ellipsis}
.glance{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:26px;padding-top:16px;border-top:1px solid color-mix(in srgb,var(--cink) 25%,transparent);
  font:12px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase}
.glance a{text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--cink) 40%,transparent)}.glance .warn{color:var(--accent);border-color:var(--accent)}
.layout{display:block}
.rail{display:none}
@media (min-width:1100px){
  .layout{display:grid;grid-template-columns:200px minmax(0,680px);gap:56px;justify-content:center;padding:0 20px}
  .layout .body{margin:0;padding-left:0;padding-right:0}
  .rail{display:flex;flex-direction:column;gap:9px;position:sticky;top:76px;align-self:start;margin-top:44px;font:12px/1.4 var(--mono);letter-spacing:.04em}
  .rail a{text-decoration:none;color:var(--ink-soft)}.rail a:hover{color:var(--ink)}
}
.lbl{display:block;font:11px/1.4 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:10px}
.keepq{margin:30px 0 36px;padding:24px 26px;background:color-mix(in srgb,var(--cover) 9%,var(--paper));border-left:4px solid var(--cover)}
.keepq p{font-size:27px;line-height:1.3;font-style:italic;margin:0 0 14px}
.essay p:first-child::first-letter{float:left;font-size:3.4em;line-height:.85;padding:6px 8px 0 0;font-weight:500}
.s{margin-top:52px}
.s h2{display:flex;align-items:baseline;gap:12px;font:500 28px/1.2 var(--serif);letter-spacing:-.005em;text-transform:none;color:var(--ink);
  border-top:1px solid var(--rule);padding-top:18px;margin:0 0 18px}
.s h2 .n{font:12px var(--mono);letter-spacing:.12em;color:var(--oxblood)}
.facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
.fact{border:1px solid var(--rule);padding:16px 16px 14px;display:flex;flex-direction:column;gap:8px}
.fact b{font:600 26px/1.15 var(--mono);color:var(--oxblood)}.fact span{font-size:15px;line-height:1.45;color:var(--ink-soft)}
.callout{padding:6px 24px 22px;background:color-mix(in srgb,var(--accent) 14%,var(--paper));border-left:4px solid var(--accent)}
.callout h2{border-top:0}
.callout.corr{background:color-mix(in srgb,var(--oxblood) 8%,var(--paper));border-left-color:var(--oxblood)}
.note p{font-style:italic;font-size:21px}
html{scroll-padding-top:64px}
body{--rs-bg:var(--paper);--rs-ink:var(--ink)}
.top.entry{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--paper) 90%,transparent);
  backdrop-filter:saturate(1.4) blur(14px);-webkit-backdrop-filter:saturate(1.4) blur(14px)}
.top.entry .tr{display:flex;align-items:center;gap:16px;flex:none}
.top.entry .crumbs a:first-child{overflow:hidden;text-overflow:ellipsis;min-width:0}
.top.entry .rs-go{padding:7px 12px}
.rs-bar{position:absolute;left:0;right:0;bottom:-1px;height:3px;background:var(--cover);transform:scaleX(0);transform-origin:left;transition:transform .12s linear}
.keepq .rs-lineshare{margin-top:0}
.corrd{border-top:1px solid color-mix(in srgb,var(--oxblood) 30%,transparent);padding:12px 0}
.corrd summary{cursor:pointer;font-size:18px;line-height:1.4}.corrd p{font-size:17px;line-height:1.6;margin:10px 0 0}
@media (max-width:560px){.top.entry .wl{display:none}.top.entry .tr{gap:12px}.crumbs span,.crumbs i:last-of-type{display:none}.top{font-size:11px;letter-spacing:.1em}.keepq p{font-size:23px}.s h2{font-size:24px}}
@media (prefers-color-scheme:dark){.keepq{background:color-mix(in srgb,var(--cover) 30%,var(--paper))}}
`;

function body(kind, b, known, plateFile, CORR = [], share = "") {
  const S = [], toc = [];
  let n = 0;
  const sec = (id, h, inner, cls = "") => { n++; toc.push([id, h]); S.push(`<section class="s ${cls}" id="${id}"><h2><span class="n">${String(n).padStart(2, "0")}</span>${h}</h2>${inner}</section>`); };
  if (b.lede) S.push(`<p class="lede">${b.lede}</p>`);
  if (b.keep) S.push(`<aside class="keepq" aria-label="If you keep one line"><span class="lbl">If you keep one line</span><p>${b.keep}</p>${share}</aside>`);
  S.push(`<div class="essay">${b.copy.map(p => `<p>${p}</p>`).join("")}</div>`);
  if (b.facts && b.facts.length) sec("s-numbers", "By the numbers", `<div class="facts">${b.facts.map(f => `<div class="fact"><b>${f.b}</b><span>${f.s}</span></div>`).join("")}</div>`);
  if (b.timeline) sec("s-timeline", "How it happened", `<ol class="tl">${b.timeline.map(t => `<li><span class="y">${t.y}</span>${t.t}</li>`).join("")}</ol>`);
  if (b.figures) sec("s-figures", "Who did the work", b.figures.map(f => `<div class="row"><b>${f.n}</b><span>${f.d}</span></div>`).join(""));
  if (b.contested) sec("s-contested", "Where it is contested", `<p>${b.contested}</p>`, "callout");
  if (b.corrected && b.corrected.length) sec("s-corrected", "Corrected", `<p class="why">Corrections are appended, never patched. What was wrong, and what is true now:</p>` + b.corrected.map(k => [k, CORR[k - 1]]).filter(x => x[1]).map(([k, c]) => `<details class="corrd"><summary><b>№ ${k}</b> · ${c.d} · ${c.t}</summary><p>${c.b}</p></details>`).join(""), "callout corr");
  if (b.changed) sec("s-changed", "What I changed my mind about", `<p>${b.changed}</p>`, "note");
  if (b.bio) sec("s-bio", b.bio.u ? "Where to start" : "The definitive biography", `<div class="row"><b><a href="${b.bio.u || `https://search.worldcat.org/search?q=${encodeURIComponent(strip(b.bio.t) + " " + b.bio.a)}`}" rel="noopener">${b.bio.t}</a></b><span>${b.bio.a} · ${b.bio.y}</span></div><p class="why">${b.bio.why}</p>`);
  if (b.reading) sec("s-reading", "Go to the source", b.reading.map(r => `<div class="row"><b><a href="${r.u}" rel="noopener">${r.t}</a></b><span>${r.a}</span>${r.why ? `<div class="why">${r.why}</div>` : ""}</div>`).join(""));
  if (b.across && b.across.length) sec("s-across", "Reads across to", b.across.map(a => `<p><a href="${hrefFor(a.to, known)}">${a.label}</a> ${a.txt}</p>`).join(""));
  return { html: S.join("\n"), toc };
}

/* Share, reading progress and passage quoting come from theme/reading.js — the same file
   the library's reader runs, so an entry behaves the same wherever it is opened. The links
   under .rs-nojs are for a reader with scripts off; with them on, the sheet carries them.
   No third-party script and no tracking — the colophon promises none. */
const enc = encodeURIComponent;
const THEME = ["reading.css", "reading.js"].map(f => new URL(`../theme/${f}`, import.meta.url));
const [READING_CSS, READING_JS] = THEME.map(u => fillMark(fs.readFileSync(u, "utf8")));
/* The way out (theme/forward.js): Esc with nothing open sails to relentless.com. Every page
   written here carries it — its style in the head, its script last in the body. */
const [FWD_CSS, FWD_JS] = ["forward.css", "forward.js"].map(f => fillMark(fs.readFileSync(new URL(`../theme/${f}`, import.meta.url), "utf8")));
const FORWARD = `<script>${FWD_JS.replace(/<\/script/gi, "<\\/script")}\nForward.escape()</script>`;
const SHARE_ICON = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1v7M3 4l3-3 3 3M2 7v4h8V7" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>`;
const END_LINE = "The link opens its own page: the whole entry, with its sources, its disputes and any corrections.";
/* Reading time, counted over the same fields as words() in theme/press.js, so the reader
   and the page always print the same minutes. */
function wordsOf(b) {
  return strip([...(b.copy || []), b.lede, b.contested, b.changed, ...(b.timeline || []).map(t => t.t),
    ...(b.figures || []).map(f => f.d), ...(b.reading || []).map(r => r.why), b.bio && b.bio.why].filter(Boolean).join(" ")).split(/\s+/).length;
}
const minsOf = b => Math.max(2, Math.round(wordsOf(b) / 210));
/* Read next: the first entry this one reads across to, else the next on the shelf — the
   same choice as readNextHTML() in theme/press.js. */
function readNext(b, next, kind, byRef, known) {
  let n = null;
  for (const a of b.across || []) { const t = byRef[a.to]; if (t) { n = { kind: a.to.split(":")[0], b: t, why: a.txt, href: hrefFor(a.to, known) }; break; } }
  if (!n) n = { kind, b: next, why: "", href: `../${next.id}/` };
  const name = n.kind === "press" ? n.b.title : n.b.n;
  return `<a class="rs-next" href="${n.href}"><span class="rs-nk">${n.why ? "Read next" : "Next on the shelf"}</span><span class="rs-nt">${name}</span>${n.why ? `<span class="rs-nd">${n.why.replace(/^\s*[—–-]\s*/, "")}</span>` : ""}<span class="rs-nm"><span>${n.kind === "press" ? "The Press" : "Lives"} · ${minsOf(n.b)} min</span><b>Read →</b></span></a>`;
}
function endBlock(url, name, title, text, nextCard) {
  return `<section class="rs-end" id="rend" aria-label="Share this entry">
<div class="rs-fin">End of entry</div>
<h3>${name}</h3>
<p>${END_LINE}</p>
<div class="rs-row"><button class="rs-b rs-main rs-js-only" type="button" data-rs="share">Share this entry</button><button class="rs-b rs-js-only" type="button" data-rs="copy">Copy link</button><a class="rs-b rs-nojs" href="mailto:?subject=${enc(strip(title))}&amp;body=${enc(strip(text) + "\n\n" + url)}">Email</a><a class="rs-b rs-nojs" href="https://twitter.com/intent/tweet?text=${enc(clip(text, 200))}&amp;url=${enc(url)}" rel="noopener" target="_blank">X</a><a class="rs-b rs-nojs" href="https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}" rel="noopener" target="_blank">LinkedIn</a></div>
${nextCard}
</section>`;
}

function page(kind, b, ctx) {
  const { SITE, known, plateFile, wing, hasAbout, prev, next, NEWS, hasLog } = ctx;
  const isPress = kind === "press";
  const slug = (isPress ? "t/" : "l/") + b.id;
  const url = `${SITE}/${slug}/`;
  const name = isPress ? b.title : b.n;
  const sub = isPress ? b.sub : `${b.field} · ${b.place} · ${b.years}`;
  // A short lede makes a thin search snippet; top it up with the opening of the copy.
  const lead = isPress ? (b.claim || b.lede) : b.lede;
  const desc = clip(strip(lead).length < 110 ? `${strip(lead)} ${strip(b.copy[0])}` : lead, 158);
  // The entry's own card first (titles and lives both have one, from `npm run card`); a
  // life with no card yet falls back to its bare plate, in the small square preview.
  const image = ctx.card ? `${SITE}/${ctx.card}` : plateFile ? `${SITE}/plates/${plateFile}` : `${SITE}/og.png`;
  const small = !ctx.card && !!plateFile;
  const words = wordsOf(b), mins = minsOf(b);
  const wingName = isPress ? "The Press" : "Lives", wingUrl = `${SITE}/contents/`;
  const ld = [{
    "@context": "https://schema.org", "@type": "Article",
    headline: strip(name), description: desc, url, mainEntityOfPage: url, image, inLanguage: "en", wordCount: words,
    ...(ctx.modified ? { dateModified: ctx.modified } : {}),
    about: isPress ? strip(b.field) : { "@type": "Person", name: strip(b.n), description: `${strip(b.field)}, ${strip(b.years)}` },
    author: { "@type": "Person", name: EDITOR, jobTitle: "Editor", ...(hasAbout ? { url: `${SITE}/about/` } : {}) },
    publisher: { "@type": "Organization", name: "The Commodore Press", url: SITE + "/" },
    isPartOf: { "@type": "WebSite", name: "The Commodore Press", url: SITE + "/" },
    ...(b.reading ? { citation: b.reading.map(r => ({ "@type": "CreativeWork", name: strip(r.t), url: r.u })) } : {}),
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [["The Commodore Press", SITE + "/"], [wingName, wingUrl], [strip(name), url]]
      .map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: u })),
  }];
  const shareText = strip(isPress ? (b.claim || b.lede) : b.lede);
  const { html: main, toc } = body(kind, b, known, plateFile, ctx.CORR,
    `<button class="rs-lineshare rs-js-only" type="button" data-rs="line">Share this line ↗</button>`);
  const conf = { url, title: strip(name), sub: strip(isPress ? b.sub : `${b.field} · ${b.years}`), text: shareText,
    keep: strip(b.keep), mins, key: (isPress ? "t/" : "l/") + b.id, theme: { bg: b.cover, ink: b.ink, accent: b.accent } };
  const nFacts = (b.facts || []).length, nCorr = (b.corrected || []).length;
  const glance = [
    `${mins} min read`,
    nFacts ? `<a href="#s-numbers">${nFacts} figure${nFacts > 1 ? "s" : ""}, each sourced</a>` : "",
    b.contested ? `<a href="#s-contested">Where it is contested</a>` : "",
    nCorr ? `<a href="#s-corrected" class="warn">Corrected ${nCorr === 1 ? "once" : nCorr + " times"}</a>` : "",
    ctx.modified ? `Updated ${longDateF(ctx.modified)}` : "",
  ].filter(Boolean).map(x => `<span>${x}</span>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(name)} — The Commodore Press</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Commodore Press">
<meta property="og:title" content="${attr(name)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${attr(ctx.card ? name + " — The Commodore Press" : small ? (b.plateOf || "Portrait of " + b.n) : "The Commodore Press")}">
<meta name="twitter:card" content="${small ? "summary" : "summary_large_image"}">
${!small ? `<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">` : ""}
<meta name="twitter:title" content="${attr(name)}">
<meta name="twitter:description" content="${attr(desc)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
${FONTS}
<style>${CSS}${ENTRY_CSS}${READING_CSS}${FWD_CSS}</style>
<script>document.documentElement.classList.add("rs-js")</script>
</head>
<body style="--cover:${b.cover};--cink:${b.ink};--accent:${b.accent}">
<nav class="top entry" aria-label="Breadcrumb"><span class="crumbs"><a href="../../">The Commodore Press</a><i>/</i><a href="../../contents/">${wingName}</a><i>/</i><span>${name}</span></span><span class="tr"><span class="rs-left rs-js-only" id="rleft">${mins} min read</span><button class="rs-go rs-js-only" type="button" data-rs="share">${SHARE_ICON}Share</button><a class="wl" href="../../#${isPress ? "press" : "lives"}">${wing} →</a></span><span class="rs-bar" id="rbar"></span></nav>
<header class="band"><div class="in">
  ${plateFile ? `<figure class="plate"><img src="../../plates/${plateFile}" alt="${attr(b.plateOf || "Portrait of " + b.n)}" width="260" height="325">${b.plateOf ? `<figcaption>${b.plateOf}</figcaption>` : ""}</figure>` : ""}
  <div class="kick">${isPress ? `The Press · ${b.field}` : `Lives · ${b.years}`}</div>
  <h1>${name}</h1>
  <p class="sub">${sub}</p>
  ${isPress && b.claim ? `<p class="claim">${b.claim}</p>` : ""}
  <div class="glance">${glance}</div>
</div></header>
<div class="layout">
<aside class="rail" aria-label="On this page"><span class="lbl">On this page</span>${toc.map(([id, h]) => `<a href="#${id}">${h}</a>`).join("")}</aside>
<main class="body">
${main}
${endBlock(url, name, `${strip(name)} — The Commodore Press`, shareText, readNext(b, next, kind, ctx.byRef, known))}
<a class="cta" href="../../#${slug}">Open in the library →</a>
<nav class="pn">${[[prev, "←"], [next, "→"]].map(([e, arrow]) => `<a href="../${e.id}/"><span>${arrow === "←" ? "← Previous" : "Next →"}</span>${isPress ? e.title : e.n}</a>`).join("")}</nav>
${NEWS && NEWS.action || hasLog ? signupHTML(NEWS, "../../", "Follow the Press", hasLog) : ""}
</main>
</div>
<script>${READING_JS.replace(/<\/script/gi, "<\\/script")}
Reading.page(${JSON.stringify(conf).replace(/</g, "\\u003c")})</script>
<footer>The Commodore Press · edited by ${hasAbout ? `<a href="../../about/">${EDITOR}</a>` : EDITOR} · <a href="../../contents/">contents</a> · every figure carries its source · <a href="../../#colophon">colophon &amp; corrections</a></footer>
${FORWARD}
</body>
</html>
`;
}

/* Writes dist/t/<id>/, dist/l/<id>/ and dist/plates/, returns the URLs for the sitemap. */
export function writeEntryPages({ ROOT, SITE, BOOKS, ADJACENT, LIVES, hasAbout, NEWS, hasLog, CORR }) {
  const DATES = entryDates(ROOT);
  const dist = path.join(ROOT, "dist");
  const known = { press: new Set(BOOKS.concat(ADJACENT).map(b => b.id)), lives: new Set(LIVES.map(l => l.id)) };

  // Plates as real files, so a life's share card can be its portrait. Stale ones are cleared.
  const src = path.join(ROOT, "assets/plates"), out = path.join(dist, "plates");
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const plates = {};
  if (fs.existsSync(src)) for (const f of fs.readdirSync(src)) {
    const ext = path.extname(f).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;
    fs.copyFileSync(path.join(src, f), path.join(out, f));
    plates[path.basename(f, ext)] = f;
  }

  // Title share cards, rendered by `npm run card` into assets/cards/ and committed.
  const cardsSrc = path.join(ROOT, "assets/cards"), cardsOut = path.join(dist, "cards");
  fs.rmSync(cardsOut, { recursive: true, force: true });
  const cards = new Set();
  if (fs.existsSync(cardsSrc)) {
    fs.mkdirSync(cardsOut, { recursive: true });
    for (const f of fs.readdirSync(cardsSrc).filter(f => f.endsWith(".png"))) { fs.copyFileSync(path.join(cardsSrc, f), path.join(cardsOut, f)); cards.add(f.slice(0, -4)); }
    // lives' cards live in cards/l/, so a life can never share a file name with a title
    const lsrc = path.join(cardsSrc, "l");
    if (fs.existsSync(lsrc)) {
      fs.mkdirSync(path.join(cardsOut, "l"), { recursive: true });
      for (const f of fs.readdirSync(lsrc).filter(f => f.endsWith(".png"))) { fs.copyFileSync(path.join(lsrc, f), path.join(cardsOut, "l", f)); cards.add("l/" + f.slice(0, -4)); }
    }
  }

  const byRef = {};
  BOOKS.concat(ADJACENT).forEach(b => { byRef["press:" + b.id] = b; });
  LIVES.forEach(l => { byRef["lives:" + l.id] = l; });
  const urls = [];
  for (const [kind, list, dir, wing] of [["press", BOOKS.concat(ADJACENT), "t", "All titles"], ["lives", LIVES, "l", "All lives"]]) {
    fs.rmSync(path.join(dist, dir), { recursive: true, force: true });
    list.forEach((b, i) => {
      const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
      const plateFile = kind === "lives" && !b.plateless ? plates[b.id] : null;
      const d = path.join(dist, dir, b.id);
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, "index.html"), page(kind, b, { SITE, known, plateFile, wing, hasAbout, prev, next, NEWS, hasLog, card: kind === "press" ? (cards.has(b.id) ? `cards/${b.id}.png` : null) : (cards.has("l/" + b.id) ? `cards/l/${b.id}.png` : null), CORR, byRef, modified: DATES[b.id] }));
      urls.push({ loc: `${SITE}/${dir}/${b.id}/`, lastmod: DATES[b.id] });
    });
  }
  return urls;
}

/* ---------- About ----------
   content/about.md is plain Markdown so the editor can write it without touching JSON:
   # title, ## headings, paragraphs, "- " lists, *italic*, **bold**, [links](url).
   Nothing more is supported, on purpose; a page this short does not need it. */
const inline = (s, link = u => u) => s
  .replace(/&(?![a-z#0-9]+;)/gi, "&amp;").replace(/</g, "&lt;")
  .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>")
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${link(u).replace(/"/g, "&quot;")}">${t}</a>`)
  // a bare URL in running text (a Sources line, usually) becomes a link too
  .replace(/(^|\s)(https?:\/\/[^\s<)]+?)([.,;:]?(?=\s|$))/g, (_, pre, u, tail) => `${pre}<a href="${u.replace(/"/g, "&quot;")}">${u.replace(/^https?:\/\/(www\.)?/, "")}</a>${tail}`);
/* `link` rewrites an href — the Log passes one that turns press:/lives:/atlas: into pages. */
export function markdown(src, link) {
  let title = "", html = [];
  const listOf = (b, re) => b.split(new RegExp(`\\n(?=${re.source.replace(/^\^/, "")})`)).map(l => `<li>${inline(l.replace(re, "").replace(/\n\s+/g, " "), link)}</li>`).join("");
  for (const block of src.trim().split(/\n\s*\n/)) {
    const b = block.trim();
    const lines = b.split("\n");
    if (b.startsWith("# ")) title = b.slice(2).trim();
    else if (b.startsWith("## ")) html.push(`<h2>${inline(b.slice(3).trim(), link)}</h2>`);
    else if (lines.every(l => l.startsWith(">")))
      html.push(`<blockquote><p>${inline(lines.map(l => l.replace(/^>\s?/, "")).join(" "), link)}</p></blockquote>`);
    else if (/^- /.test(b) && lines.every(l => /^- |^\s/.test(l))) html.push(`<ul>${listOf(b, /^- /)}</ul>`);
    else if (/^\d+\. /.test(b) && lines.every(l => /^\d+\. |^\s/.test(l))) html.push(`<ol>${listOf(b, /^\d+\. /)}</ol>`);
    else html.push(`<p>${inline(b.replace(/\n/g, " "), link)}</p>`);
  }
  return { title, html: html.join("\n") };
}

/* The page is built only once the editor has written the editor's section: a placeholder
   would print, and an About page that says TODO is worse than none. Returns its URL, or
   null when it was held back. */
export function writeAbout({ ROOT, SITE, fill, NEWS, hasLog }) {
  const src = path.join(ROOT, "content/about.md"), out = path.join(ROOT, "dist/about");
  fs.rmSync(out, { recursive: true, force: true });
  if (!fs.existsSync(src)) return null;
  const text = fill(fs.readFileSync(src, "utf8"));
  if (/\bTODO\b/.test(text)) return null;
  const { title, html } = markdown(text);
  const url = `${SITE}/about/`;
  const desc = clip(html.match(/<p>(.*?)<\/p>/)?.[1] || "", 158);
  const ld = { "@context": "https://schema.org", "@type": "AboutPage", name: title, url,
    mainEntity: { "@type": "Organization", name: "The Commodore Press", url: SITE + "/",
      founder: { "@type": "Person", name: EDITOR, jobTitle: "Editor" } } };
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "index.html"), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(title)} — The Commodore Press</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Commodore Press">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
${FONTS}
<style>${CSS}.body ul{padding-left:1.1em}.body li{margin:0 0 8px}${FWD_CSS}</style>
</head>
<body style="--cover:#1E1C18;--cink:#F2EDE1;--accent:#D8A657">
<nav class="top"><a href="../">The Commodore Press</a><a href="../#home">The library →</a></nav>
<header class="band"><div class="in">
  <div class="kick">The house · edited by ${EDITOR}</div>
  <h1>${inline(title)}</h1>
</div></header>
<main class="body">
${html}
<a class="cta" href="../">Enter the library →</a>
${NEWS && NEWS.action || hasLog ? signupHTML(NEWS, "../", "Follow the Press", hasLog) : ""}
</main>
<footer>The Commodore Press · edited by ${EDITOR} · <a href="../#colophon">colophon &amp; corrections</a></footer>
${FORWARD}
</body>
</html>
`);
  return url;
}

/* ---------- The Log ----------
   The editor's signed column: dist/log/<slug>/, the list at dist/log/, and dist/feed.xml.
   The feed carries each piece in full, so a newsletter service can send it as an issue
   without anyone copying text between tools. */
function longDateF(d) { const M = ["January","February","March","April","May","June","July","August","September","October","November","December"]; const [y, m, day] = d.split("-").map(Number); return `${day} ${M[m - 1]} ${y}`; }
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const longDate = d => { const [y, m, day] = d.split("-").map(Number); return `${day} ${MONTHS[m - 1]} ${y}`; };
const LOG_LIVERY = { cover: "#2A2F45", ink: "#F0EFEA", accent: "#D8A657" };
const FEED_LINK = root => `<link rel="alternate" type="application/rss+xml" title="The Commodore Press — the Log" href="${root}feed.xml">`;
const FONTS = `<link rel="icon" href="${favicon()}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">`;
const LOG_CSS = `.body blockquote{margin:24px 0;padding-left:18px;border-left:2px solid var(--rule);font-style:italic}
.body ul,.body ol{padding-left:1.2em}.body li{margin:0 0 8px}
.byline{font:12px/1.5 var(--mono);letter-spacing:.1em;text-transform:uppercase;margin-top:22px;opacity:.85}
.body .list{list-style:none;padding:0;margin:0}.list li{padding:22px 0;border-bottom:1px solid var(--rule)}
.list a{text-decoration:none}.list .d{font:12px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
.list .t{display:block;font-size:28px;line-height:1.2;margin:6px 0}.list .k{color:var(--ink-soft);font-size:18px}
`;

export function writeLog({ ROOT, SITE, pieces, BOOKS, ADJACENT, LIVES, PRINCIPLES, hasAbout, NEWS }) {
  const out = path.join(ROOT, "dist/log");
  fs.rmSync(out, { recursive: true, force: true });
  fs.rmSync(path.join(ROOT, "dist/feed.xml"), { force: true });
  if (!pieces.length) return { urls: [] };

  const press = new Map(BOOKS.concat(ADJACENT).map(b => [b.id, strip(b.title)]));
  const lives = new Map(LIVES.map(l => [l.id, strip(l.n)]));
  const stars = new Map(PRINCIPLES.map(p => [p.id, strip(p.name)]));
  const target = (ref, root) => {
    const [w, id] = ref.split(":");
    if (w === "press") return { href: `${root}t/${id}/`, label: press.get(id) || id, wing: "The Press" };
    if (w === "lives") return { href: `${root}l/${id}/`, label: lives.get(id) || id, wing: "Lives" };
    if (w === "atlas") return { href: `${root}#atlas`, label: stars.get(id) || id, wing: "The Atlas" };
    return { href: ref, label: ref, wing: "" };
  };
  const linker = root => u => /^(press|lives|atlas):/.test(u) ? target(u, root).href : u;
  const editor = root => hasAbout ? `<a href="${root}about/">${EDITOR}</a>` : EDITOR;
  const subscribe = root => signupHTML(NEWS, root, "Follow the Log");

  const urls = [];
  for (const x of pieces) {
    const root = "../../", url = `${SITE}/log/${x.slug}/`;
    const { html } = markdown(x.body, linker(root));
    const across = x.across.map(r => target(r, root));
    const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: strip(inline(x.meta.title)),
      description: strip(inline(x.meta.dek)), datePublished: x.meta.date, url, image: `${SITE}/og.png`,
      author: { "@type": "Person", name: EDITOR, jobTitle: "Editor" },
      publisher: { "@type": "Organization", name: "The Commodore Press", url: SITE + "/" } };
    const d = path.join(out, x.slug);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, "index.html"), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(inline(x.meta.title))} — The Commodore Press</title>
<meta name="description" content="${attr(inline(x.meta.dek))}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Commodore Press">
<meta property="og:title" content="${attr(inline(x.meta.title))}">
<meta property="og:description" content="${attr(inline(x.meta.dek))}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og.png">
<meta property="article:published_time" content="${x.meta.date}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
${FEED_LINK(root)}
${FONTS}
<style>${CSS}${LOG_CSS}${FWD_CSS}</style>
</head>
<body style="--cover:${LOG_LIVERY.cover};--cink:${LOG_LIVERY.ink};--accent:${LOG_LIVERY.accent}">
<nav class="top"><a href="${root}">The Commodore Press</a><a href="../">The Log →</a></nav>
<header class="band"><div class="in">
  <div class="kick">The Log · ${longDate(x.meta.date)}</div>
  <h1>${inline(x.meta.title)}</h1>
  <p class="sub">${inline(x.meta.dek)}</p>
  <div class="byline">Signed · ${editor(root)}, editor</div>
</div></header>
<main class="body">
${html}
${across.length ? `<h2>Reads across to</h2>${across.map(a => `<p><a href="${a.href}">${a.label}</a> <span class="why">· ${a.wing}</span></p>`).join("")}` : ""}
${subscribe(root)}
</main>
<footer>The Log is the editor's signed column. Figures carry their sources here too, and corrections are appended in the <a href="${root}#colophon">colophon</a>.</footer>
${FORWARD}
</body>
</html>
`);
    urls.push(url);
  }

  // the list
  fs.writeFileSync(path.join(out, "index.html"), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Log — The Commodore Press</title>
<meta name="description" content="The editor's signed column at the Commodore Press: arguments with the library and the people in it, sourced like everything else.">
<link rel="canonical" href="${SITE}/log/">
<meta property="og:title" content="The Log — The Commodore Press">
<meta property="og:url" content="${SITE}/log/">
<meta property="og:image" content="${SITE}/og.png">
${FEED_LINK("../")}
${FONTS}
<style>${CSS}${LOG_CSS}${FWD_CSS}</style>
</head>
<body style="--cover:${LOG_LIVERY.cover};--cink:${LOG_LIVERY.ink};--accent:${LOG_LIVERY.accent}">
<nav class="top"><a href="../">The Commodore Press</a><a href="../#home">The library →</a></nav>
<header class="band"><div class="in">
  <div class="kick">The editor's column · signed</div>
  <h1>The Log</h1>
  <p class="sub">Arguments with the library and the people in it, by ${editor("../")}. Sourced like everything else.</p>
</div></header>
<main class="body">
<ul class="list">${pieces.map(x => `<li><a href="${x.slug}/"><span class="d">${longDate(x.meta.date)}</span><span class="t">${inline(x.meta.title)}</span><span class="k">${inline(x.meta.dek)}</span></a></li>`).join("")}</ul>
${subscribe("../")}
</main>
<footer>The Commodore Press · <a href="../#colophon">colophon &amp; corrections</a></footer>
${FORWARD}
</body>
</html>
`);
  urls.unshift(`${SITE}/log/`);

  // the feed: RSS 2.0, full text, absolute links
  const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cdata = s => `<![CDATA[${String(s).replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
  const rfc = d => new Date(d + "T12:00:00Z").toUTCString();
  fs.writeFileSync(path.join(ROOT, "dist/feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>The Commodore Press — the Log</title>
<link>${SITE}/log/</link>
<atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
<description>The editor's signed column. Every figure carries its source.</description>
<language>en</language>
<lastBuildDate>${rfc(pieces[0].meta.date)}</lastBuildDate>
${pieces.map(p => {
  const u = `${SITE}/log/${p.slug}/`;
  const { html } = markdown(p.body, linker(SITE + "/"));
  return `<item>
<title>${x(strip(inline(p.meta.title)))}</title>
<link>${u}</link>
<guid isPermaLink="true">${u}</guid>
<pubDate>${rfc(p.meta.date)}</pubDate>
<dc:creator>${x(EDITOR)}</dc:creator>
<description>${x(strip(inline(p.meta.dek)))}</description>
<content:encoded>${cdata(`<p><i>${inline(p.meta.dek)}</i></p>` + html + `<p><a href="${u}">Read it on the Press</a></p>`)}</content:encoded>
</item>`;
}).join("\n")}
</channel>
</rss>
`);
  return { urls };
}

/* ---------- Contents ----------
   One plain page linking every entry page. The library is JavaScript and links nothing a
   crawler can follow, so until this page existed the only way a search engine found an
   entry was the sitemap. Linked from the library's footer and every entry page. */
export function writeContents({ ROOT, SITE, BOOKS, ADJACENT, LIVES, LOG }) {
  const out = path.join(ROOT, "dist/contents");
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const item = (href, t, s) => `<li><a href="${href}"><span class="t">${t}</span><span class="k">${s}</span></a></li>`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contents — The Commodore Press</title>
<meta name="description" content="Every title and life in the Commodore Press: ${BOOKS.length} ideas and ${LIVES.length} people, each with its sources and the place it is still argued.">
<link rel="canonical" href="${SITE}/contents/">
<meta property="og:title" content="Contents — The Commodore Press">
<meta property="og:url" content="${SITE}/contents/">
<meta property="og:image" content="${SITE}/og.png">
${FONTS}
<style>${CSS}${LOG_CSS}.body .list .t{font-size:24px}${FWD_CSS}</style>
</head>
<body style="--cover:#1E1C18;--cink:#F2EDE1;--accent:#D8A657">
<nav class="top"><a href="../">The Commodore Press</a><a href="../#home">The library →</a></nav>
<header class="band"><div class="in"><div class="kick">Contents</div><h1>Everything on the shelves</h1>
<p class="sub">${BOOKS.length + ADJACENT.length} titles and ${LIVES.length} lives. Every figure carries its source.</p></div></header>
<main class="body">
<h2>The Press · ideas</h2><ul class="list">${BOOKS.concat(ADJACENT).map(b => item(`../t/${b.id}/`, b.title, inline(strip(b.claim || b.sub || "")))).join("")}</ul>
<h2>Lives · people</h2><ul class="list">${LIVES.map(l => item(`../l/${l.id}/`, l.n, `${l.field} · ${l.years}`)).join("")}</ul>
${LOG.length ? `<h2>The Log · the editor's column</h2><ul class="list">${LOG.map(x => item(`../log/${x.slug}/`, inline(x.meta.title), inline(x.meta.dek))).join("")}</ul>` : ""}
</main>
<footer>The Commodore Press · <a href="../#colophon">colophon &amp; corrections</a></footer>
${FORWARD}
</body>
</html>
`;
  fs.writeFileSync(path.join(out, "index.html"), html);

  /* llms.txt — a plain-text map for the language-model search tools that now read sites on
     people's behalf. The proposal is informal; the cost is one small file. */
  fs.writeFileSync(path.join(ROOT, "dist/llms.txt"), `# The Commodore Press

> A working library in three wings — ideas, lives, and the people the editor listens to now. Every figure carries a named source; disputes are printed, not hidden; corrections are appended, never patched.

- [Contents](${SITE}/contents/): every title and life, one link each
- [Colophon and corrections](${SITE}/#colophon): the house's promises and its numbered corrections
${LOG.length ? `- [The Log](${SITE}/log/): the editor's signed column ([feed](${SITE}/feed.xml))
` : ""}
## The Press
${BOOKS.concat(ADJACENT).map(b => `- [${strip(b.title)}](${SITE}/t/${b.id}/): ${strip(b.claim || b.sub || "")}`).join("\n")}

## Lives
${LIVES.map(l => `- [${strip(l.n)}](${SITE}/l/${l.id}/): ${strip(l.lede)}`).join("\n")}
`);
  return `${SITE}/contents/`;
}

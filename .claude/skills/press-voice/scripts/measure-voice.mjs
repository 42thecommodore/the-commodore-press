#!/usr/bin/env node
// Measures the house voice off content/. Every number in the press-voice reference
// files came from this script. If the shelves grow substantially, re-run it and update
// the tables from its output — never by estimating.
//
//   node .claude/skills/press-voice/scripts/measure-voice.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../../..', 'content');
if (!fs.existsSync(ROOT)) {
  console.error(`No content/ at ${ROOT} — run this from the repository.`);
  process.exit(1);
}

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const wing = d => fs.readdirSync(path.join(ROOT, d))
  .filter(f => f.endsWith('.json'))
  .sort()
  .map(f => read(path.join(ROOT, d, f)));

const books = wing('books');
const lives = wing('lives');
const manuals = wing('manuals');

const words = t => t.trim().split(/\s+/).filter(Boolean).length;
const sentences = t => t.replace(/\s+/g, ' ')
  .split(/(?<=[.!?])\s+(?=[A-Z“"'(])/)
  .map(s => s.trim())
  .filter(s => s.length > 1);
const median = a => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const per1k = (n, w) => (1000 * n / w).toFixed(1);

function profile(name, texts) {
  texts = texts.filter(Boolean);
  if (!texts.length) return;
  const joined = texts.join(' ');
  const w = words(joined);
  const lens = texts.flatMap(sentences).map(words);
  const count = re => (joined.match(re) || []).length;
  console.log(
    `${name.padEnd(20)} ` +
    `n=${String(texts.length).padStart(3)}  w=${String(w).padStart(5)}  ` +
    `med=${String(median(lens)).padStart(4)}  ` +
    `mean=${(lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(1).padStart(5)}  ` +
    `<=10w=${String(Math.round(100 * lens.filter(l => l <= 10).length / lens.length)).padStart(3)}%  ` +
    `| per 1k  I=${per1k(count(/\b(I|I'm|I've|I'd|I'll|me|my|myself|mine)\b/g), w).padStart(5)}` +
    `  em=${per1k(count(/—/g), w).padStart(5)}` +
    `  colon=${per1k(count(/[a-z0-9)"']:\s/g), w).padStart(5)}` +
    `  paren=${per1k(count(/\(/g), w).padStart(5)}` +
    `  semi=${per1k(count(/;/g), w).padStart(5)}`
  );
}

console.log(`\ncorpus: ${books.length} titles · ${lives.length} lives · ${manuals.length} manuals\n`);

profile('titles.copy',    books.flatMap(b => b.copy || []));
profile('titles.claim',   books.map(b => b.claim));
profile('titles.lede',    books.map(b => b.lede));
profile('titles.contested', books.map(b => b.contested));
profile('titles.changed', books.map(b => b.changed));
profile('titles.keep',    books.map(b => b.keep));
console.log('');
profile('lives.copy',     lives.flatMap(l => l.copy || []));
profile('lives.contested', lives.map(l => l.contested));
profile('lives.keep',     lives.map(l => l.keep));
console.log('');
profile('manuals.p',      manuals.flatMap(m => (m.entries || []).flatMap(e => e.p || [])));
profile('manuals.h',      manuals.flatMap(m => (m.entries || []).map(e => e.h)));

/* The static copy — the front-door standfirst, the five wing deks, the colophon and the
   five wing cards. It is on the live site and it had never been measured, because this
   script only ever opened content/. That blind spot is how the Lives dek went on saying
   "twenty-one famous, five forgotten" for eight lives past the point it was true, and
   how three filler adverbs sat on the front door. Held to the manuals' profile rather
   than to copy's: it is written in the first person, and it measures that way. */
const REPO = path.resolve(ROOT, '..');
const strip = t => t
  .replace(/<[^>]*>/g, '')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&ldquo;|&rdquo;/g, '"')
  .replace(/\{\{[^}]+\}\}/g, 'Twenty')   // build-time counters stand in as one word
  .replace(/\s+/g, ' ').trim();
const slurp = f => fs.existsSync(path.join(REPO, f)) ? fs.readFileSync(path.join(REPO, f), 'utf8') : '';
const shell = slurp('templates/shell.html');
const pick = re => [...shell.matchAll(re)].map(m => strip(m[1])).filter(t => t.length > 30);

const chrome = {
  stand: pick(/<p class="stand"[^>]*>([\s\S]*?)<\/p>/g),
  deks:  pick(/<p class="wing-dek"[^>]*>([\s\S]*?)<\/p>/g),
  colophon: [...shell.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => strip(m[1])).filter(t => t.length > 80),
  cards: [...slurp('theme/press.js').matchAll(/p:[`"]([^`"]{60,})[`"]/g)].map(m => strip(m[1])),
};
if (chrome.deks.length) {
  console.log('');
  profile('chrome.stand',   chrome.stand);
  profile('chrome.deks',    chrome.deks);
  profile('chrome.colophon', chrome.colophon);
  profile('chrome.cards',   chrome.cards);
  profile('chrome.ALL',     Object.values(chrome).flat());
}

// Shape counts the profile line does not carry.
const bp = books.flatMap(b => b.copy || []);
const lp = lives.flatMap(l => l.copy || []);
const keeps = [...books, ...lives].map(x => x.keep).filter(Boolean).map(words);
const figs = [...books, ...lives].flatMap(x => (x.figures || []).map(f => f.d)).filter(Boolean);
console.log(`
titles: ${(bp.length / books.length).toFixed(1)} paragraphs/entry, median ${median(bp.map(words))} words each
lives:  ${(lp.length / lives.length).toFixed(1)} paragraphs/entry, median ${median(lp.map(words))} words each
keep:   median ${median(keeps)} words (min ${Math.min(...keeps)}, max ${Math.max(...keeps)}, n=${keeps.length})
figures[].d: median ${median(figs.map(words))} words (n=${figs.length})`);

// The tics the gate exists to keep out.
const all = [
  ...bp, ...lp,
  ...books.flatMap(b => [b.claim, b.lede, b.contested, b.changed, b.keep]),
  ...lives.flatMap(l => [l.contested, l.keep]),
  ...manuals.flatMap(m => (m.entries || []).flatMap(e => e.p || [])),
].filter(Boolean).join(' ');
const tics = {
  '"as well"': /\bas well\b/gi,
  '"able to"': /\bable to\b/gi,
  '"I think"': /\bI think\b/gi,
  '"one of the things"': /\bone of the things\b/gi,
  '"not just … but"': /\bnot just\b/gi,
  'soft intensifiers': /\b(very|significant(ly)?|substantial(ly)?|incredibly|truly|remarkable)\b/gi,
};
console.log('\ntics across all prose:');
for (const [label, re] of Object.entries(tics)) {
  console.log(`  ${label.padEnd(22)} ${(all.match(re) || []).length}`);
}

/* Counted apart from content/, deliberately. The reference tables quote the corpus
   figure, and folding the static copy in would make those numbers stop matching. */
const chromeText = Object.values(chrome).flat().join(' ');
if (chromeText) {
  console.log('\ntics in the static copy:');
  for (const [label, re] of Object.entries(tics)) {
    const hits = chromeText.match(re) || [];
    console.log(`  ${label.padEnd(22)} ${hits.length}${hits.length ? '   ' + [...new Set(hits)].join(', ') : ''}`);
  }
}
console.log('');

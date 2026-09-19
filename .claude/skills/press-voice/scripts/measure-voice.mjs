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
const people = read(path.join(ROOT, 'atlas/people.json'));
const principles = read(path.join(ROOT, 'atlas/principles.json'));

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

console.log(`\ncorpus: ${books.length} titles · ${lives.length} lives · ${people.length} atlas people\n`);

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
profile('atlas.take',     people.map(p => p.take));
profile('atlas.kept',     people.flatMap(p => p.kept || []));
profile('atlas.role',     people.map(p => p.role));
profile('atlas.gloss',    principles.map(p => p.gloss));

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

// ---- The calibration test ----------------------------------------------------
// Register 0 is the author's application reflex, not a machine style: generic
// scholarship prose he writes himself when he thinks a committee is reading. The
// rate below is the fastest drift detector the study produced. Reference points,
// from the study and not from this corpus: his submitted scholarship essay ran
// 23.0 generic phrases per 1,000 words and one course description ran 53.4, against
// 0.8–2.9 in everything he edits. A surface above ~3 has drifted. See
// references/voice.md, "Register 0".
const GENERIC = [
  /all walks of life/, /vibrant tapestry/, /rich tapestry/, /relentless pursuit/,
  /fostering/, /diverse communit/, /unwavering/, /a (pivotal|crucial|vital|key) role/,
  /valuable insights?/, /countless/, /a gateway to/, /deepened my appreciation/,
  /broaden (my|our) perspective/, /instrumental/, /in an era of/, /in today's world/,
  /more than just an?/, /interdisciplinary/, /broader societal/, /social inclusion/,
  /compelling examination/, /meticulous research/, /profound question/,
  /it is important to note/, /plays? an? important role/, /testament to/,
  /serves? as a reminder/, /delve/, /nuanced understanding/, /underscore/,
  /at the end of the day/, /navigate the complex/,
  // the antithesis spine, which is his application reflex too
  /\bnot (just|only|merely|simply)\b[^.;]{0,90}\bbut\b/,
];
const surfaces = {
  'titles.copy':     books.flatMap(b => b.copy || []),
  'titles.apparatus':books.flatMap(b => [b.claim, b.lede, ...(b.figures || []).map(f => f.d)]),
  'titles.contested':books.map(b => b.contested),
  'titles.changed':  books.map(b => b.changed),
  'titles.keep':     books.map(b => b.keep),
  'lives.copy':      lives.flatMap(l => l.copy || []),
  'lives.contested': lives.map(l => l.contested),
  'lives.keep':      lives.map(l => l.keep),
  'lives.bio.why':   lives.map(l => l.bio && l.bio.why),
  'atlas.take':      people.map(p => p.take),
  'atlas.kept':      people.flatMap(p => p.kept || []),
};
console.log('\ncalibration — generic phrases per 1k (committee 23.0–53.4 · edited 0.8–2.9):');
for (const [label, texts] of Object.entries(surfaces)) {
  const joined = texts.filter(t => typeof t === 'string' && t.trim()).join(' ');
  if (!joined) continue;
  const w = words(joined);
  const hits = GENERIC.flatMap(re => joined.match(new RegExp(re.source, 'gi')) || []);
  const rate = per1k(hits.length, w);
  console.log(
    `  ${label.padEnd(18)} ${String(rate).padStart(5)}` +
    `${hits.length ? '   ' + [...new Set(hits.map(h => h.toLowerCase()))].join(' · ') : ''}`
  );
}
console.log('');

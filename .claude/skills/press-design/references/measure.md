# Measuring, in the browser

Run with the preview open (`npm start`, port 4321) through the browser tool's JavaScript
runner, on the page the journey lands on. Each returns numbers; paste the numbers into the
finding.

## The page's type, in one call

Counts every visible piece of text on the current wing (or the whole page if no wing is
open): distinct text styles, how many are mono, capitals, italic; pills; small targets.

```js
(() => {
  const root = document.querySelector('.wing.on') || document.body;
  const scope = [...root.querySelectorAll('*'), ...document.querySelectorAll('header *, footer *')];
  const text = scope.filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden'
    && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
  const cs = e => getComputedStyle(e), styles = {};
  text.forEach(e => { const c = cs(e);
    const k = `${Math.round(parseFloat(c.fontSize))} ${c.fontWeight}${c.fontStyle === 'italic' ? ' i' : ''}${c.textTransform === 'uppercase' ? ' CAPS' : ''}${c.fontFamily.includes('Plex') ? ' MONO' : ''}`;
    (styles[k] = styles[k] || []).push(e.textContent.trim().slice(0, 24)); });
  const hits = [...document.querySelectorAll('a,button,[role=button]')].filter(e => e.offsetParent);
  return {
    textElements: text.length,
    distinctStyles: Object.keys(styles).length,
    mono: text.filter(e => cs(e).fontFamily.includes('Plex')).length,
    monoCaps: text.filter(e => cs(e).fontFamily.includes('Plex') && cs(e).textTransform === 'uppercase').length,
    italic: text.filter(e => cs(e).fontStyle === 'italic').length,
    pills: [...document.querySelectorAll('*')].filter(e => e.offsetParent && parseFloat(cs(e).borderRadius) >= 12).length,
    targetsUnder44: innerWidth < 600 ? hits.filter(e => e.getBoundingClientRect().height < 40).map(e => e.textContent.trim().slice(0, 18)) : 'measure at 375px',
    sideways: document.documentElement.scrollWidth > innerWidth,
    styles: Object.fromEntries(Object.entries(styles).map(([k, v]) => [k, `${v.length} × e.g. ${v.slice(0, 2).join(' | ')}`])),
  };
})()
```

What the Press looked like on 2026-09-26, for comparison — before the pass: 78 mono, 10
pills, 42 italic, 21 styles; after: 0 mono labels, 0 pills, italic kept for subtitles, the
editor's own lines and the hero's argued phrase, a 9-step size scale.

## Contrast of any pair

```js
((fg, bg, alpha = 1) => {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = rgb(fg).map((v, i) => v * alpha + rgb(bg)[i] * (1 - alpha));
  const L = c => c.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const [a, b] = [L(mix), L(rgb(bg))].sort((x, y) => y - x);
  return +((a + .05) / (b + .05)).toFixed(2);   // 4.5 for text, 3 for large text and marks
})('#5C5647', '#F2EDE1')
```

For every livery at once, `npm run check` already does it the way the reader renders it.

## Weight

`npm run build` prints the front door's size and the entries' text file; the budget is
500 KB. `npm run live -- --now` prints what readers are actually served.

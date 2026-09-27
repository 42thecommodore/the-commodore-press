/* The pattern pressed into the cover (schemas: "motif"), drawn the way a blind stamp sits in
   cloth — a dark line with a faint highlight beside it, in the cover's own colour, never in a
   printed accent — and kept to the lower part of the board, clear of the title. The five
   names are the liveries' own; what they draw is the house's sea: waves, ripples, a chart's
   graticule, a row of pennants, a low sun on the horizon.
   Drawn once, here: the library (theme/press.js, filled in at build as {{MOTIF_FN}}) and
   every entry page (build/pages.mjs) print the same board. A second copy would drift, the
   way the press mark did before build/mark.mjs. Self-contained on purpose — the build
   inlines its source, so it may not reach for anything outside itself. */
export function motifSVG(kind,a,wide){
  const press=(d,fill)=>fill
    ?`<g fill="rgba(0,0,0,.30)" transform="translate(0 .6)">${d}</g><g fill="rgba(255,255,255,.10)">${d}</g>`
    :`<g fill="none" stroke="rgba(0,0,0,.34)" stroke-width=".7" transform="translate(0 .6)">${d}</g><g fill="none" stroke="rgba(255,255,255,.11)" stroke-width=".6">${d}</g>`;
  // a book's board has the drawing's own proportions; a wide card crops it from the foot instead of stretching it
  const svg=inner=>`<svg class="motif" viewBox="0 0 100 150" preserveAspectRatio="${wide?"xMidYMax slice":"none"}" aria-hidden="true">${inner}</svg>`;
  if(kind==="lines")return svg(press(Array.from({length:9},(_,r)=>`<path d="M-10 ${86+r*8} q5 -2.6 10 0${" t10 0".repeat(11)}"/>`).join("")));
  if(kind==="rings")return svg(press(Array.from({length:7},(_,r)=>`<circle cx="50" cy="150" r="${14+r*11}"/>`).join("")));
  if(kind==="grid")return svg(press([12.5,37.5,62.5,87.5].map(x=>`<line x1="${x}" y1="80" x2="${x}" y2="150"/>`).join("")
    +[92,117,142].map(y=>`<line x1="0" y1="${y}" x2="100" y2="${y}"/>`).join("")
    +Array.from({length:8},(_,k)=>{const t=k*Math.PI/8;return `<line x1="${(50-60*Math.cos(t)).toFixed(1)}" y1="${(122-60*Math.sin(t)).toFixed(1)}" x2="${(50+60*Math.cos(t)).toFixed(1)}" y2="${(122+60*Math.sin(t)).toFixed(1)}"/>`}).join("")));
  if(kind==="dots")return svg(press(Array.from({length:24},(_,k)=>{const x=10+(k%6)*16+(Math.floor(k/6)%2)*8,y=94+Math.floor(k/6)*14;return `<path d="M${x} ${y}l7 2.6l-7 2.6z"/>`}).join(""),true));
  return svg(press(`<circle cx="50" cy="128" r="26"/><line x1="0" y1="128" x2="100" y2="128"/>`+[134,139,143].map((y,k)=>`<line x1="${22+k*8}" y1="${y}" x2="${78-k*8}" y2="${y}"/>`).join("")));
}

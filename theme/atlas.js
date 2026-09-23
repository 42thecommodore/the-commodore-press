/* ===================== THE ATLAS — a sea chart =====================
   Wing III, drawn as a chart of islands. Everything on it is read from content/, and every
   mark means one thing:

     an island     a principle (content/atlas/principles.json), sized by who holds it
     a town        a person on it, coloured by their region of the sky (domains.json)
     a lane        two principles held by the same people; thicker when more of them do.
                   Islands that share people are pulled together, so nearness means overlap
     an old port   a Life on the shelf whose own `across` links to the principle. Written by
                   the house, entry by entry — nothing here guesses at a resemblance
     a route       one person's voyage through the islands they hold

   The crossing below the chart sails those old ports in date order, down to now.

   Loaded before theme/press.js in the same script, so nothing at the top level may touch
   press.js's constants (P_BY_ID, DOM_BY_ID…): only `let`s with literal values and function
   declarations here. Everything runs from renderAtlas(), which press.js calls at boot. */

let isleNodes = [], isleSel = null, routeOf = null, chartMode = "", crossRaf = 0, crossGeom = null;
let chartView = { x: 0, y: 0, k: 1 }, chartW = 1200, chartH = 760, flyRaf = 0, chartDragged = false, hoverPerson = null;
let PORTS = [];

/* ---------- small helpers ---------- */
function lifeYear(y) {
  const m = String(y).match(/\d{1,4}/); if (!m) return 0;
  return /BCE/.test(y) ? -(+m[0]) : +m[0];
}
function fmtYear(n) { return n < 0 ? `${-n} BCE` : n < 1000 ? `AD ${n}` : String(n); }
function seedOf(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return ((h >>> 0) % 997) / 997 * Math.PI * 2; }
const f1 = v => v.toFixed(1);
/* a closed Catmull-Rom loop through pts, as cubic Béziers */
function loopPath(pts) {
  const n = pts.length; let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (!i) d += `M${f1(p1[0])} ${f1(p1[1])}`;
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + "Z";
}
/* the same, open, for a route */
function linePath(pts) {
  if (pts.length < 2) return "";
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
}
/* A coastline: a circle roughened by fixed harmonics, so each island keeps its shape from
   visit to visit. The low ones give it bays and headlands, the high ones a pen's wobble.
   `jit` offsets the fine wobble only, so a second pass of the pen lands beside the first. */
function shoreR(a, seed, jit = 0) {
  return 1 + .13 * Math.sin(a * 2 + seed) + .1 * Math.sin(a * 3 + seed * 1.9) + .06 * Math.sin(a * 5 + seed * 2.7)
    + .035 * Math.sin(a * 9 + seed * 3.1 + jit) + .018 * Math.sin(a * 17 + seed * 5.3 + jit * 2) + .01 * Math.sin(a * 29 + jit * 3);
}
function coastPts(cx, cy, r, seed, k = 1, jit = 0, n = 64) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r * k * shoreR(a, seed, jit); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return pts;
}
function coast(cx, cy, r, seed, k = 1, jit = 0) { return loopPath(coastPts(cx, cy, r, seed, k, jit)); }
/* the engraver's island: water-lining out to sea, stippled sand, a doubled pen line, and
   hachures on the side away from the light (the light comes from the upper left, as on
   most printed charts) */
function engrave(n) {
  const { x, y, r, seed } = n;
  let rings = "";
  [1.13, 1.27, 1.43, 1.62].forEach((k, i) => { rings += `<path class="wl" style="--w:${(.62 - i * .13).toFixed(2)}" d="${coast(x, y, r, seed, k, i * .7)}"/>`; });
  let hach = "";
  const N = Math.round(r * 1.9);
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, shade = (Math.cos(a - Math.PI / 4) + 1) / 2;
    if (shade < .3 || (shade < .55 && i % 2)) continue;
    const rr = r * shoreR(a, seed) * .97, L = r * (.07 + .17 * shade) * (.8 + .4 * Math.abs(Math.sin(i * 12.9898)));
    const x0 = x + Math.cos(a) * rr, y0 = y + Math.sin(a) * rr, x1 = x + Math.cos(a) * (rr - L), y1 = y + Math.sin(a) * (rr - L);
    hach += `M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}`;
  }
  /* a hill: a ring of short ticks, the old way of drawing high ground */
  let hill = "";
  const hr = r * .5, M = 22;
  for (let i = 0; i < M; i++) {
    const a = i / M * Math.PI * 2, rr = hr * shoreR(a, seed + 1.3), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    hill += `M${f1(px)} ${f1(py)}L${f1(px + Math.cos(a) * 3.2)} ${f1(py + Math.sin(a) * 3.2)}`;
  }
  return `${rings}
      <path class="sand" d="${coast(x, y, r, seed, 1.05, .4)}"/>
      <path class="land" d="${coast(x, y, r, seed)}"/>
      <path class="hach" d="${hach}"/>
      <path class="hill" d="${hill}"/>
      <path class="shore2" d="${coast(x, y, r, seed, .985, 1.7)}"/>
      <path class="shore" d="${coast(x, y, r, seed)}"/>`;
}
const shared = (a, b) => a.members.filter(m => b.members.includes(m));
const holdersNow = pr => pr.members;

/* ---------- derive: ports, and each principle's place ---------- */
function atlasDerive() {
  PORTS = [];
  for (const l of LIVES) for (const a of (l.across || [])) {
    if (!a.to.startsWith("atlas:")) continue;
    const pr = P_BY_ID[a.to.slice(6)]; if (!pr) continue;
    PORTS.push({ life: l, pr, txt: a.txt.replace(/^—\s*/, ""), year: lifeYear(l.years) });
  }
  PORTS.sort((a, b) => a.year - b.year);
  PRINCIPLES.forEach(pr => pr.ports = PORTS.filter(p => p.pr === pr));
}

/* A deterministic spring layout: principles that share people pull together, every island
   keeps clear of the rest. No randomness, so the chart is the same on every visit. */
function layoutIsles(W, H, k = 1, fs = 22, wrap = 99, fsm = 12.5) {
  const n = PRINCIPLES.length, cx = W / 2, cy = H / 2;
  const nodes = PRINCIPLES.map((pr, i) => {
    const a = i / n * Math.PI * 2 - Math.PI / 2;
    return { pr, x: cx + Math.cos(a) * W * .3, y: cy + Math.sin(a) * H * .3,
             r: (27 + 9 * Math.sqrt(pr.members.length + pr.ports.length * 1.5)) * k };
  });
  const S = nodes.map(a => nodes.map(b => a === b ? 0 : shared(a.pr, b.pr).length));
  for (let it = 0; it < 420; it++) {
    const cool = 1 - it / 420;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const A = nodes[i], B = nodes[j];
      let dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || .01;
      const rest = A.r + B.r + (60 + 250 / (1 + S[i][j])) * k;
      const f = (d - rest) * .012 * cool;
      dx /= d; dy /= d;
      A.x += dx * f; A.y += dy * f * .8; B.x -= dx * f; B.y -= dy * f * .8;
    }
    nodes.forEach(p => { p.x += (cx - p.x) * .004; p.y += (cy - p.y) * .004; });
  }
  /* clear overlaps, labels included */
  for (let pass = 0; pass < 60; pass++) for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const A = nodes[i], B = nodes[j], min = A.r + B.r + 92 * k;
    let dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || .01;
    if (d < min) { const push = (min - d) / 2; dx /= d; dy /= d; A.x -= dx * push; A.y -= dy * push; B.x += dx * push; B.y += dy * push; }
  }
  /* fit into the frame */
  const pad = 88, xs = nodes.map(p => p.x), ys = nodes.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  nodes.forEach(p => {
    p.x = pad + (x1 === x0 ? .5 : (p.x - x0) / (x1 - x0)) * (W - pad * 2);
    p.y = pad * .9 + (y1 === y0 ? .5 : (p.y - y0) / (y1 - y0)) * (H - pad * .9 - 150); /* room below for the lowest label */
    p.seed = seedOf(p.pr.id);
  });
  /* every label is a box under its island; settle until no box meets another box or coast */
  nodes.forEach(p => { p.lines = wrapName(p.pr.name, wrap); p.lw = Math.max(...p.lines.map(l => l.length)) * fs * .68 * .84; p.lh = p.lines.length * fs * .68 * 1.3 + 8; });
  const box = p => ({ x0: p.x - p.lw / 2 - 8, x1: p.x + p.lw / 2 + 8, y0: p.y + p.r * 1.12, y1: p.y + p.r * 1.3 + p.lh + 6 });
  const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const disc = p => ({ x0: p.x - p.r * 1.15, x1: p.x + p.r * 1.15, y0: p.y - p.r * 1.15, y1: p.y + p.r * 1.12 });
  for (let it = 0; it < 160; it++) {
    let moved = false;
    for (const A of nodes) for (const B of nodes) {
      if (A === B) continue;
      const pairs = [[box(A), box(B)], [box(A), disc(B)], [disc(A), disc(B)]];
      for (const [a, b] of pairs) if (hit(a, b)) {
        const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (ox < oy) { const d = (A.x < B.x ? -1 : 1) * (ox / 2 + 1); A.x += d; B.x -= d; }
        else { const d = (A.y < B.y ? -1 : 1) * (oy / 2 + 1); A.y += d; B.y -= d; }
        moved = true; break;
      }
    }
    nodes.forEach(p => {
      const half = Math.max(p.r * 1.2, p.lw / 2 + 10);
      p.x = Math.max(half + 14, Math.min(W - half - 14, p.x));
      p.y = Math.max(p.r * 1.25 + 18, Math.min(H - p.r * 1.3 - p.lh - 18, p.y));
      /* keep clear of the cartouche in the lower right */
      const cw = 330, ch = 112, cx0 = W - 35 - cw, cy0 = H - 35 - ch;
      if (W >= 700 && p.x + Math.max(p.r, p.lw / 2) > cx0 - 10 && p.y + p.r * 1.3 + p.lh > cy0 - 10) { p.y = Math.min(p.y, cy0 - 10 - p.r * 1.3 - p.lh); moved = true; }
    });
    if (!moved) break;
  }
  nodes.forEach(p => { p.nx = p.x / W; p.ny = p.y / H; });
  return nodes;
}
const countLine = pr => `${pr.members.length} ${pr.members.length === 1 ? "person" : "people"}${pr.ports.length ? ` · ${pr.ports.length} ${pr.ports.length === 1 ? "Life" : "Lives"}` : ""}`;
/* long names break onto two lines on a narrow chart, at the space nearest the middle */
function wrapName(name, max) {
  if (name.length <= max) return [name];
  const mid = name.length / 2; let at = -1;
  for (let i = 0; i < name.length; i++) if (name[i] === " " && (at < 0 || Math.abs(i - mid) < Math.abs(at - mid))) at = i;
  return at < 0 ? [name] : [name.slice(0, at), name.slice(at + 1)];
}
const nodeOf = id => isleNodes.find(n => n.pr.id === id);

/* the order a person's voyage calls at their islands: west to east, then nearest next */
function voyage(p) {
  const left = p.p.map(nodeOf).filter(Boolean), out = [];
  if (!left.length) return out;
  left.sort((a, b) => a.x - b.x);
  out.push(left.shift());
  while (left.length) {
    const last = out[out.length - 1];
    left.sort((a, b) => Math.hypot(a.x - last.x, a.y - last.y) - Math.hypot(b.x - last.x, b.y - last.y));
    out.push(left.shift());
  }
  return out;
}
/* who sails closest: overlap of islands over their union, ties to the bigger overlap */
function closest(p, k = 3) {
  return PEOPLE.filter(q => q !== p).map(q => {
    const both = p.p.filter(x => q.p.includes(x)), union = new Set([...p.p, ...q.p]).size;
    return { q, both, j: both.length / union };
  }).filter(x => x.both.length).sort((a, b) => b.j - a.j || b.both.length - a.both.length).slice(0, k);
}

/* ---------- the chart ---------- */
function lanePath(A, B) {
  const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
  const ux = dx / d, uy = dy / d, bend = (seedOf(A.pr.id + B.pr.id) > Math.PI ? 1 : -1) * d * .14;
  const sx = A.x + ux * (A.r + 6), sy = A.y + uy * (A.r + 6), ex = B.x - ux * (B.r + 6), ey = B.y - uy * (B.r + 6);
  const mx = (sx + ex) / 2 - uy * bend, my = (sy + ey) / 2 + ux * bend;
  return `M${f1(sx)} ${f1(sy)}Q${f1(mx)} ${f1(my)} ${f1(ex)} ${f1(ey)}`;
}
function roseSVG(x, y, s) {
  let rays = "", star = "";
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    rays += `<path d="M${f1(x)} ${f1(y)}L${f1(x + Math.cos(a) * 2400)} ${f1(y + Math.sin(a) * 2400)}"/>`;
  }
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 - Math.PI / 2, L = i % 2 ? s * .55 : s, w = s * .12;
    const tip = [x + Math.cos(a) * L, y + Math.sin(a) * L], l = [x + Math.cos(a - 1.57) * w, y + Math.sin(a - 1.57) * w], r = [x + Math.cos(a + 1.57) * w, y + Math.sin(a + 1.57) * w];
    star += `<path d="M${f1(l[0])} ${f1(l[1])}L${f1(tip[0])} ${f1(tip[1])}L${f1(r[0])} ${f1(r[1])}Z" class="${i % 2 ? "rs2" : "rs1"}"/>`;
  }
  return { rays, star: star + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s * .16)}" class="rs0"/>` };
}
function renderChart() {
  const host = document.getElementById("chartSvgHost"); if (!host) return;
  /* drawn before its wing is shown, the chart has no width yet: judge by the screen, or a
     phone gets the desktop layout squeezed into it until the first resize */
  const narrow = (host.clientWidth || (host.parentElement && host.parentElement.clientWidth) || innerWidth) < 700;
  const mode = narrow ? "tall" : "wide";
  const W = narrow ? 600 : 1200, H = narrow ? 980 : 760;
  const relaid = !!chartMode && chartMode !== mode;
  if (relaid) { cancelAnimationFrame(flyRaf); chartView = { x: 0, y: 0, k: 1 }; }  /* a new layout starts at full view; a flight to the old one is void */
  chartMode = mode;
  isleNodes = layoutIsles(W, H, narrow ? .74 : 1, narrow ? 32 : 26, narrow ? 14 : 99, narrow ? 21 : 17);
  const fs = narrow ? 32 : 26, fsm = narrow ? 21 : 17;
  const tnames = [];

  /* lanes, lightest first so the heavy ones sit on top */
  const lanes = [];
  for (let i = 0; i < isleNodes.length; i++) for (let j = i + 1; j < isleNodes.length; j++) {
    const s = shared(isleNodes[i].pr, isleNodes[j].pr);
    if (s.length) lanes.push({ a: isleNodes[i], b: isleNodes[j], s });
  }
  lanes.sort((x, y) => x.s.length - y.s.length);
  const maxS = Math.max(1, ...lanes.map(l => l.s.length));
  const heavy = lanes[lanes.length - 1];

  const r1 = roseSVG(W * .085, H * .12, narrow ? 40 : 34);
  /* the border a printed chart carries: a band graduated in alternate filled and open bars */
  const B0 = 6, B1 = 13, step = 40; let bars = "";
  for (let x = B1, i = 0; x < W - B1; x += step, i++) if (i % 2 === 0) bars += `<rect x="${x}" y="${B0}" width="${Math.min(step, W - B1 - x)}" height="${B1 - B0}"/><rect x="${x}" y="${H - B1}" width="${Math.min(step, W - B1 - x)}" height="${B1 - B0}"/>`;
  for (let y = B1, i = 0; y < H - B1; y += step, i++) if (i % 2 === 0) bars += `<rect x="${B0}" y="${y}" width="${B1 - B0}" height="${Math.min(step, H - B1 - y)}"/><rect x="${W - B1}" y="${y}" width="${B1 - B0}" height="${Math.min(step, H - B1 - y)}"/>`;
  /* the cartouche: what this chart is, and whose */
  const cw = 330, ch = 112, cx0 = W - B1 - 22 - cw, cy0 = H - B1 - 22 - ch;
  const cart = narrow ? "" : `<g class="cart"><rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch}"/><rect class="c2" x="${cx0 + 4}" y="${cy0 + 4}" width="${cw - 8}" height="${ch - 8}"/>
    <text class="c-t" x="${cx0 + cw / 2}" y="${cy0 + ch * .36}" font-size="19">A CHART OF LESSONS</text>
    <text class="c-s" x="${cx0 + cw / 2}" y="${cy0 + ch * .6}" font-size="17">from the listening notes of {{EDITOR}}</text>
    <text class="c-m" x="${cx0 + cw / 2}" y="${cy0 + ch * .83}" font-size="13">${PEOPLE.length} PEOPLE · ${PRINCIPLES.length} LESSONS · MMXXVI</text></g>`;

  const isles = isleNodes.map(n => {
    const pr = n.pr, towns = holdersNow(pr).map((p, k, arr) => {
      const a = k * 2.39996 + n.seed, rad = n.r * .6 * Math.sqrt((k + .5) / arr.length);
      const tx = n.x + Math.cos(a) * rad, ty = n.y + Math.sin(a) * rad;
      tnames.push(`<g class="tn" data-i="${pr.id}" data-p="${p.id}" data-x="${f1(tx)}" data-y="${f1(ty)}"><text x="6.5" y="5" font-size="${narrow ? 23 : 18}">${p.name}</text></g>`);
      return `<circle class="town" data-p="${p.id}" cx="${f1(tx)}" cy="${f1(ty)}" r="${narrow ? 4.2 : 4}" fill="${p.color}" style="--tw:-${((k * .61 + n.seed) % 3.6).toFixed(2)}s"/>`;
    }).join("");
    const ports = pr.ports.map((pt, k) => {
      const a = -Math.PI / 2 - .5 + k * .62, x = n.x + Math.cos(a) * n.r * 1.02, y = n.y + Math.sin(a) * n.r * 1.02;
      return `<g class="oldport" data-l="${pt.life.id}" transform="translate(${f1(x)} ${f1(y)})"><circle r="${narrow ? 7 : 6.5}"/><path d="M0 -2.6V2.8M-2.4 1.2Q0 3.6 2.4 1.2M-1.6 -1H1.6"/></g>`;
    }).join("");
    return `<g class="isle" data-i="${pr.id}" tabindex="0" role="button" aria-label="${pr.name}: ${pr.members.length} people${pr.ports.length ? `; from the Lives shelf, ${pr.ports.map(p => p.life.n).join(", ")}` : ""}">
      ${engrave(n)}
      ${towns}${ports}
    </g>`;
  }).join("");

  /* Labels sit above every island, and are held at one size on screen whatever the zoom
     (applyView counter-scales them), so going in gives the names room instead of just
     making them bigger. The meaning of each lesson appears at the first zoom step. */
  const labels = isleNodes.map(n => {
    const pr = n.pr, nf = fs * .68, lh = nf * 1.3, yc = (n.lines.length - 1) * lh;
    const gl = wrapName(pr.gloss, 30);
    return `<g class="lbl-i" data-i="${pr.id}" data-x="${f1(n.x)}" data-y="${f1(n.y + n.r * 1.3)}"><text class="nm" x="0" y="${f1(nf + 4)}" font-size="${f1(nf)}">${n.lines.map((l, i) => `<tspan x="0" dy="${i ? f1(lh) : 0}">${l}</tspan>`).join("")}</text>
      <text class="gl" x="0" y="${f1(nf + 4 + yc + fsm + 4)}" font-size="${fsm}">${gl.map((l, i) => `<tspan x="0" dy="${i ? f1(fsm * 1.2) : 0}">${l}</tspan>`).join("")}</text></g>`;
  }).join("");

  const ship = false && heavy && !reduce ? `<g class="chartship"><g transform="translate(-13 -19)">{{MARK size=26 sw=1.1 pn aria}}</g>
      <animateMotion dur="38s" repeatCount="indefinite" rotate="0" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" path="${lanePath(heavy.a, heavy.b)}"/></g>` : "";

  chartW = W; chartH = H;
  host.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="A chart of the lessons as islands. Drag to move, pinch or command-scroll to zoom.">
    <g id="chartWorld">
      <g class="rhumb">${r1.rays}</g>
      <g class="lanes">${lanes.map(l => `<path class="lane${l.s.length < 2 ? " minor" : ""}" data-a="${l.a.pr.id}" data-b="${l.b.pr.id}" d="${lanePath(l.a, l.b)}" stroke-width="${f1(.7 + l.s.length / maxS * 3.2)}" style="--o:${(.12 + .5 * l.s.length / maxS).toFixed(2)}"/>`).join("")}</g>
      <path class="route" id="chartRoute" d=""/>
      <g class="isles">${isles}</g>
      <g class="labels" aria-hidden="true">${labels}</g>
      <path class="const-line" id="constLine" d=""/>
      <g class="const-lbl" id="constLbl" data-x="0" data-y="0" style="display:none"><text x="0" y="-2" font-size="${narrow ? 24 : 20}"></text></g>
      <path class="leader" id="chartLeaders" d=""/>
      <g class="tnames" aria-hidden="true">${tnames.join("")}</g>
    </g>
    <g class="rose">${r1.star}</g>
    ${cart}
    <rect class="neat" x="${B0}" y="${B0}" width="${W - 2 * B0}" height="${H - 2 * B0}"/><rect class="neat2" x="${B1}" y="${B1}" width="${W - 2 * B1}" height="${H - 2 * B1}"/>
    <g class="bars">${bars}</g>
  </svg>
  <div class="chart-tools"><button type="button" onclick="chartZoomBtn(1.6)" aria-label="Zoom in">+</button><button type="button" onclick="chartZoomBtn(1/1.6)" aria-label="Zoom out">−</button><button type="button" onclick="chartReset()" aria-label="Show the whole chart">⊙</button><span id="chartZoom" aria-hidden="true"></span></div>
  <div class="chart-hint" id="chartHint">${narrow ? "pinch to zoom · tap anyone" : "drag to move · pinch or ⌘-scroll to zoom · point at anyone"}</div>
  <div class="chart-tip" id="chartTip" role="status" hidden></div>
  <svg class="wake" id="chartWake" aria-hidden="true"><path d=""/></svg>
  <div class="boat" id="chartBoat" aria-hidden="true"><div class="boat-i">{{MARK size=30 sw=1.1 pn aria}}</div></div>`;

  const svg = host.querySelector("svg");
  host.querySelectorAll(".isle").forEach(g => {
    g.addEventListener("click", () => { if (!chartDragged) selectIsle(g.dataset.i); });
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectIsle(g.dataset.i); } });
    g.addEventListener("pointerenter", () => { if (!isleSel) litLanes(g.dataset.i); });
    g.addEventListener("pointerleave", () => { if (!isleSel) litLanes(null); });
  });
  host.querySelectorAll(".town").forEach(t => t.addEventListener("click", e => { e.stopPropagation(); if (!chartDragged) openDrawerById(t.dataset.p); }));
  host.querySelectorAll(".oldport").forEach(t => t.addEventListener("click", e => { e.stopPropagation(); if (!chartDragged) openLife(t.dataset.l); }));
  wireChart(svg);
  clampView(chartView); applyView();
  if (isleSel) selectIsle(isleSel, false, !relaid);   /* after a relayout, sail to the island where it now is */
  if (routeOf) showRoute(routeOf);
  if (!isleSel) { const E = echoList(); drawConst(E.length ? E[featIdx % E.length] : null); }
  fitCard();
}

/* ---------- moving about the chart ----------
   Drag to pan; pinch (trackpad or phone) or ⌘/ctrl-scroll to zoom, so a plain scroll still
   scrolls the page past it. On a phone one finger scrolls the page until you have zoomed in;
   then it moves the chart. The view never leaves the chart's frame. */
function applyView() {
  const svg = document.querySelector("#chartSvgHost svg"); if (!svg) return;
  const v = chartView, inv = (1 / v.k).toFixed(4);
  svg.querySelector("#chartWorld").setAttribute("transform", `translate(${f1(v.x)} ${f1(v.y)}) scale(${v.k.toFixed(4)})`);
  svg.querySelectorAll("[data-x]").forEach(g => g.setAttribute("transform", `translate(${g.dataset.x} ${g.dataset.y})${g.dataset.r ? ` rotate(${g.dataset.r})` : ""} scale(${inv})`));
  svg.classList.toggle("z2", v.k >= 1.6); svg.classList.toggle("z3", v.k >= 2.6);
  svg.style.touchAction = v.k > 1.01 ? "none" : "pan-y";
  const z = document.getElementById("chartZoom"); if (z) z.textContent = v.k > 1.01 ? `×${v.k.toFixed(1)}` : "";
  callouts(svg);
}
/* The chosen island's people, named: fanned out to either side as callouts, each tied to
   its dot by a thin line, and spaced on screen rather than in the world, so twelve names
   never pile into one small island. */
function callouts(svg) {
  const lead = svg.querySelector("#chartLeaders"); if (!lead) return;
  const n = isleSel && chartView.k >= 1.6 ? nodeOf(isleSel) : null, k = chartView.k;
  svg.querySelectorAll(".tn.co").forEach(t => { t.classList.remove("co"); const tx = t.querySelector("text"); tx.setAttribute("x", "6.5"); tx.removeAttribute("text-anchor"); });
  svg.classList.toggle("co-on", !!n);
  if (!n) { lead.setAttribute("d", ""); return; }
  const sc = (svg.clientWidth || chartW) / chartW, gap = 21 / (k * sc), items = [...svg.querySelectorAll(`.tn[data-i="${n.pr.id}"]`)].map(t => ({ t, x: +t.dataset.x, y: +t.dataset.y }));
  let d = "";
  /* a column that would run off the visible chart joins the other side */
  const vx0 = -chartView.x / k, vx1 = (chartW - chartView.x) / k, fsz = chartMode === "tall" ? 23 : 18;
  const wOf = o => (o.t.textContent.length * fsz * .5 + 10) / k, reach = n.r * 1.25 + 16 / (k * sc);
  const leftFits = items.every(o => o.x >= n.x || n.x - reach - wOf(o) > vx0), rightFits = items.every(o => o.x < n.x || n.x + reach + wOf(o) < vx1);
  const sideOf = o => !leftFits && rightFits ? 1 : leftFits && !rightFits ? -1 : (o.x >= n.x ? 1 : -1);
  for (const side of [-1, 1]) {
    const col = items.filter(o => sideOf(o) === side).sort((a, b) => a.y - b.y);
    if (!col.length) continue;
    const ys = col.map(o => o.y);
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + gap);
    const shift = (col.reduce((a, o) => a + o.y, 0) - ys.reduce((a, y) => a + y, 0)) / col.length;
    const ax = n.x + side * (n.r * 1.25 + 16 / (k * sc));
    col.forEach((o, i) => {
      const y = ys[i] + shift, tx = o.t.querySelector("text");
      o.t.classList.add("co");
      o.t.setAttribute("transform", `translate(${f1(ax)} ${f1(y)}) scale(${(1 / k).toFixed(4)})`);
      tx.setAttribute("x", side > 0 ? "5" : "-5"); tx.setAttribute("text-anchor", side > 0 ? "start" : "end");
      d += `M${f1(o.x)} ${f1(o.y)}L${f1(ax - side * 4 / (k * sc))} ${f1(y)}`;
    });
  }
  lead.setAttribute("d", d);
}
function clampView(v) {
  v.k = Math.max(1, Math.min(5, v.k));
  v.x = Math.min(0, Math.max(chartW * (1 - v.k), v.x)); v.y = Math.min(0, Math.max(chartH * (1 - v.k), v.y));
  return v;
}
function zoomAt(px, py, f) {
  const v = chartView, k = Math.max(1, Math.min(5, v.k * f));
  v.x = px - (px - v.x) * k / v.k; v.y = py - (py - v.y) * k / v.k; v.k = k;
  clampView(v); applyView();
}
/* sail the view so world point (tx, ty) sits mid-chart at zoom tk */
function flyTo(tx, ty, tk, ms = 700) {
  cancelAnimationFrame(flyRaf);
  const from = { ...chartView }, to = clampView({ k: tk, x: chartW / 2 - tx * tk, y: chartH / 2 - ty * tk });
  if (reduce) { chartView = to; applyView(); return; }
  const t0 = performance.now();
  const step = t => {
    const p = Math.min(1, (t - t0) / ms), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    chartView = { k: from.k + (to.k - from.k) * e, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
    applyView(); if (p < 1) flyRaf = requestAnimationFrame(step);
  };
  flyRaf = requestAnimationFrame(step);
}
function chartZoomBtn(f) { const v = chartView; flyTo((chartW / 2 - v.x) / v.k, (chartH / 2 - v.y) / v.k, v.k * f, 420); }
function chartReset() { flyTo(chartW / 2, chartH / 2, 1); }
function svgPt(svg, cx, cy) { const m = svg.getScreenCTM().inverse(); return { x: m.a * cx + m.c * cy + m.e, y: m.b * cx + m.d * cy + m.f }; }
function wireChart(svg) {
  const ptrs = new Map(); let start = null, moved = false, pinch = null;
  svg.addEventListener("pointerdown", e => {
    if (e.button > 0) return;
    const p = svgPt(svg, e.clientX, e.clientY); ptrs.set(e.pointerId, p);
    moved = false; start = { ...chartView, p };
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v: { ...chartView } }; }
  });
  svg.addEventListener("pointermove", e => {
    if (e.pointerType === "mouse" && !reduce) { cancelAnimationFrame(boat.sail); boat.sail = 0; const hb = svg.parentElement.getBoundingClientRect(); boatTo(e.clientX - hb.left, e.clientY - hb.top); document.getElementById("chartBoat").classList.toggle("port", !!(e.target.closest && e.target.closest(".town,.isle,.oldport,.lane"))); }
    if (!ptrs.has(e.pointerId)) { if (e.pointerType !== "touch") chartTip(e); return; }
    const p = svgPt(svg, e.clientX, e.clientY); ptrs.set(e.pointerId, p);
    if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const k = Math.max(1, Math.min(5, pinch.v.k * d / pinch.d)), wx = (pinch.m.x - pinch.v.x) / pinch.v.k, wy = (pinch.m.y - pinch.v.y) / pinch.v.k;
      chartView = clampView({ k, x: m.x - wx * k, y: m.y - wy * k }); moved = true; applyView(); return;
    }
    if (ptrs.size === 1 && start) {
      const dx = p.x - start.p.x, dy = p.y - start.p.y;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (start.k <= 1.01) return;                       /* nothing to pan at full view */
      if (!moved) { try { svg.setPointerCapture(e.pointerId); } catch (_) {} }
      moved = true; svg.classList.add("grabbing"); hideTip();
      chartView = clampView({ k: start.k, x: start.x + dx, y: start.y + dy }); applyView();
    }
  });
  const end = e => {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (!ptrs.size) {
      start = null; svg.classList.remove("grabbing");
      if (moved) { chartDragged = true; setTimeout(() => chartDragged = false, 0); }
      /* on a phone there is no pointer to follow, so a tap on open water sails the boat there */
      else if (e.pointerType === "touch" && !reduce && !(e.target.closest && e.target.closest(".town,.isle,.oldport"))) {
        const hb = svg.parentElement.getBoundingClientRect();
        if (!boat.on) { boat.x = hb.width / 2; boat.y = hb.height - 40; }
        boatTo(e.clientX - hb.left, e.clientY - hb.top, true);
        clearTimeout(boat.fade); boat.fade = setTimeout(boatOff, 1800);
      }
    }
  };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  /* how to move shows once, on first arrival, then gets out of the chart's way */
  svg.addEventListener("pointerenter", () => { const h = document.getElementById("chartHint"); if (h && !h.dataset.shown) { h.dataset.shown = "1"; h.classList.add("flash"); clearTimeout(h.t); h.t = setTimeout(() => h.classList.remove("flash"), 3500); } }, { once: true });
  svg.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") boatOff(); if (e.pointerType !== "touch") { hideTip(); if (routeOf && !selectedPerson && hoverPerson) { hoverPerson = null; showRoute(null); } } });
  svg.addEventListener("wheel", e => {
    if (!(e.ctrlKey || e.metaKey)) { const h = document.getElementById("chartHint"); if (h) { h.classList.add("flash"); clearTimeout(h.t); h.t = setTimeout(() => h.classList.remove("flash"), 1300); } return; }
    e.preventDefault(); hideTip();
    const p = svgPt(svg, e.clientX, e.clientY); zoomAt(p.x, p.y, Math.exp(-Math.max(-30, Math.min(30, e.deltaY)) * .012));
  }, { passive: false });
  svg.addEventListener("dblclick", e => { const p = svgPt(svg, e.clientX, e.clientY), v = chartView; flyTo((p.x - v.x) / v.k, (p.y - v.y) / v.k, v.k * 1.8, 450); });
}

/* ---------- the boat ----------
   Over the chart the pointer becomes the press mark, a pennant on a mast over water. It
   follows with a little lag, leans into its turns, faces the way it sails and leaves a wake.
   Point at a person anywhere on the page and it sails their route, island to island. Mouse
   only, and never with reduced motion: those readers keep the ordinary cursor. */
const boat = { x: 0, y: 0, tx: 0, ty: 0, on: false, raf: 0, flip: 1, tilt: 0, trail: [], sail: 0 };
function boatEls() { return { host: document.getElementById("chartSvgHost"), el: document.getElementById("chartBoat"), wake: document.querySelector("#chartWake path") }; }
function boatTo(x, y, keep) {
  const { host, el } = boatEls(); if (!el) return;
  boat.tx = x; boat.ty = y;
  if (!boat.on) { boat.on = true; if (!keep) { boat.x = x; boat.y = y; } boat.trail = []; el.classList.add("on"); if (!keep) host.classList.add("boating"); }
  if (!boat.raf) boat.raf = requestAnimationFrame(boatTick);
}
function boatOff() {
  const { host, el } = boatEls(); boat.on = false; cancelAnimationFrame(boat.sail); boat.sail = 0;
  if (el) el.classList.remove("on"); if (host) host.classList.remove("boating");
  if (!boat.raf) boat.raf = requestAnimationFrame(boatTick);   /* let the wake die away */
}
function boatTick() {
  boat.raf = 0;
  const { el, wake } = boatEls(); if (!el) return;
  const dx = boat.tx - boat.x, dy = boat.ty - boat.y, sp = Math.hypot(dx, dy);
  boat.x += dx * .14; boat.y += dy * .14;
  if (Math.abs(dx) > 1.2) boat.flip = dx < 0 ? -1 : 1;
  boat.tilt += (Math.max(-16, Math.min(16, dy * .5)) * boat.flip - boat.tilt) * .12;
  el.style.transform = `translate(${f1(boat.x)}px, ${f1(boat.y)}px)`;
  el.firstElementChild.style.transform = `scaleX(${boat.flip}) rotate(${f1(boat.tilt)}deg)`;
  /* the wake: the last few positions, shortening when the boat slows or leaves */
  if (boat.on && sp > .6) boat.trail.push([boat.x, boat.y + 8]);
  else if (boat.trail.length) boat.trail.shift();
  if (boat.trail.length > 26) boat.trail.shift();
  if (wake) wake.setAttribute("d", boat.trail.length > 1 ? boat.trail.map((p, i) => `${i ? "L" : "M"}${f1(p[0])} ${f1(p[1])}`).join("") : "");
  if ((boat.on && sp > .3) || boat.trail.length) boat.raf = requestAnimationFrame(boatTick);
}
/* sail a person's route: follow the drawn route path from start to end */
function sailRoute() {
  if (reduce || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  const { host } = boatEls(), path = document.getElementById("chartRoute");
  if (!host || !path || !path.getAttribute("d") || host.matches(":hover")) return;
  const L = path.getTotalLength(); if (L < 5) return;
  cancelAnimationFrame(boat.sail);
  const t0 = performance.now(), dur = Math.min(3200, 900 + L * 2.2);
  const step = t => {
    if (!path.isConnected || !path.getAttribute("d")) { boat.sail = 0; return; }   /* the route was cleared mid-voyage */
    const p = Math.min(1, (t - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const pt = path.getPointAtLength(e * L).matrixTransform(path.getScreenCTM()), hb = host.getBoundingClientRect();
    boatTo(pt.x - hb.left, pt.y - hb.top);
    if (p < 1) boat.sail = requestAnimationFrame(step); else { boat.sail = 0; setTimeout(() => { if (!boat.sail && !host.matches(":hover")) boatOff(); }, 900); }
  };
  boat.sail = requestAnimationFrame(step);
}

/* ---------- the hover card: who, what, and why they are here ---------- */
function hideTip() { const t = document.getElementById("chartTip"); if (t) t.hidden = true; }
function chartTip(e) {
  const tip = document.getElementById("chartTip"), host = document.getElementById("chartSvgHost"); if (!tip) return;
  const el = e.target.closest && e.target.closest(".town,.oldport,.lane,.isle");
  if (!el) { hideTip(); if (hoverPerson) { hoverPerson = null; if (!selectedPerson) showRoute(null); } return; }
  let html = "";
  if (el.classList.contains("town")) {
    const p = PEOPLE.find(x => x.id === el.dataset.p);
    if (hoverPerson !== p) { hoverPerson = p; showRoute(p); }
    const echoes = (typeof ECHOES === "undefined" ? [] : ECHOES).filter(x => x.notes.some(n => n.who === p.name)).length;
    html = `<span class="tt-k" style="color:${p.color}">${DOM_BY_ID[p.domain].label}</span><b>${p.name}</b>${p.role ? `<small>${p.role}</small>` : ""}
      <span class="tt-m">${p.p.length} ${p.p.length === 1 ? "lesson" : "lessons"} · ${notesOf(p)} ${notesOf(p) === 1 ? "note" : "notes"}${echoes ? ` · ${echoes} shared ${echoes === 1 ? "idea" : "ideas"}` : ""}</span>
      <i>${p.take}</i><em>The dashed line runs through their lessons. Click for their notes.</em>`;
  } else {
    if (hoverPerson) { hoverPerson = null; if (!selectedPerson) showRoute(null); }
    if (el.classList.contains("oldport")) {
      const pt = PORTS.find(x => x.life.id === el.dataset.l);
      html = `<span class="tt-k">From the Lives shelf</span><b>${pt.life.n}</b><small>${pt.life.years}</small><i>${pt.txt}</i><em>Click to open their Life.</em>`;
    } else if (el.classList.contains("lane")) {
      const a = P_BY_ID[el.dataset.a], b = P_BY_ID[el.dataset.b], s = shared(a, b);
      html = `<span class="tt-k">A lane</span><b>${a.name} <span class="tt-x">and</span> ${b.name}</b><span class="tt-m">${s.length} ${s.length === 1 ? "person taught" : "people taught"} me both</span><i>${s.map(p => p.name).join(", ")}</i>`;
    } else {
      const pr = P_BY_ID[el.dataset.i], ln = PRINCIPLES.filter(o => o !== pr && shared(pr, o).length).length;
      html = `<span class="tt-k">A lesson</span><b>${pr.name}</b><i>${pr.gloss}</i><span class="tt-m">${pr.members.length} people · lanes to ${ln} other ${ln === 1 ? "island" : "islands"}${pr.ports.length ? ` · ${pr.ports.length} from the Lives shelf` : ""}</span><em>Click to see who taught it.</em>`;
    }
  }
  tip.innerHTML = html; tip.hidden = false;
  const hb = host.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = e.clientX - hb.left + 16, y = e.clientY - hb.top + 16;
  if (x + tw > hb.width - 8) x = e.clientX - hb.left - tw - 16;
  if (y + th > hb.height - 8) y = e.clientY - hb.top - th - 16;
  tip.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
}

/* the card scrolls inside the chart's height rather than stretching the sea below it */
function fitCard() {
  const host = document.getElementById("chartSvgHost"), card = document.getElementById("isleCard");
  if (host && card) card.style.maxHeight = chartMode === "wide" && host.offsetHeight ? host.offsetHeight + "px" : "";
}
function litLanes(id) {
  const svg = document.querySelector("#chartSvgHost svg"); if (!svg) return;
  svg.classList.toggle("focus", !!id);
  svg.querySelectorAll(".lane").forEach(l => l.classList.toggle("on", !!id && (l.dataset.a === id || l.dataset.b === id)));
  svg.querySelectorAll(".isle,.lbl-i").forEach(g => {
    const near = id && (g.dataset.i === id || shared(P_BY_ID[id], P_BY_ID[g.dataset.i]).length);
    g.classList.toggle("sel", g.dataset.i === id); g.classList.toggle("dim", !!id && !near);
  });
  svg.querySelectorAll(".tn").forEach(t => t.classList.toggle("on", !!id && t.dataset.i === id));
  callouts(svg);
}
/* draw one person's voyage over the chart */
function showRoute(p) {
  routeOf = p || null;
  const path = document.getElementById("chartRoute"); if (!path) return;
  document.querySelectorAll("#chartSvgHost .town").forEach(t => t.classList.toggle("me", !!p && t.dataset.p === (p && p.id)));
  if (!p) { path.setAttribute("d", ""); cancelAnimationFrame(boat.sail); boat.sail = 0; return; }
  const v = voyage(p);
  path.setAttribute("d", v.length > 1 ? linePath(v.map(n => [n.x, n.y])) : "");
  if (v.length > 1) requestAnimationFrame(sailRoute);
  if (!reduce && v.length > 1) { const L = path.getTotalLength(); path.style.strokeDasharray = `${L}`; path.style.strokeDashoffset = `${L}`; path.getBoundingClientRect(); path.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.62,.02,.2,1)"; path.style.strokeDashoffset = "0"; setTimeout(() => { path.style.strokeDasharray = ""; path.style.transition = ""; }, 1150); }
}

/* ---------- the island card ---------- */
function portRow(pt, withIsle) {
  return `<button class="portrow" onclick="openLife('${pt.life.id}')">
    ${plateOrMark(pt.life, "pr-img")}
    <span class="pr-t"><b>${pt.life.n}</b><small>${pt.life.years}${withIsle ? ` · ${pt.pr.name}` : ""}</small><i>${pt.txt}</i></span></button>`;
}
function personPill(p) {
  return `<button class="star-pill" onclick="openDrawerById('${p.id}')" onmouseenter="showRoute(PEOPLE.find(x=>x.id==='${p.id}'))" onmouseleave="showRoute(null)" onfocus="showRoute(PEOPLE.find(x=>x.id==='${p.id}'))" onblur="showRoute(null)"><span class="s" style="background:${p.color}"></span>${p.name}</button>`;
}
/* ranked by how much of them is in my notes: the only ranking this page can stand behind */
const notesOf = p => (p.kept || []).length;
const byNotes = list => list.slice().sort((a, b) => notesOf(b) - notesOf(a) || a.name.localeCompare(b.name));
function whoRow(p) {
  return `<button class="who" onclick="openDrawerById('${p.id}')" onmouseenter="showRoute(PEOPLE.find(x=>x.id==='${p.id}'))" onmouseleave="showRoute(null)" onfocus="showRoute(PEOPLE.find(x=>x.id==='${p.id}'))" onblur="showRoute(null)">
    <span class="s" style="background:${p.color}"></span><span class="who-t"><b>${p.name}</b>${p.role ? `<small>${p.role}</small>` : ""}</span><span class="who-n">${notesOf(p) ? `${notesOf(p)} ${notesOf(p) === 1 ? "note" : "notes"}` : ""}</span></button>`;
}
/* ---------- constellations: one idea, heard from several people, joined on the map ---------- */
let featIdx = 0;
const echoList = () => (typeof ECHOES === "undefined" ? [] : ECHOES).slice().sort((a, b) => b.notes.length - a.notes.length);
let constFly = false;
const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/* the address says what is showing, so it can be sent: #atlas/c/<idea>, #atlas/<lesson> */
function atlasHash() {
  if (wing !== "atlas") return;
  const E = echoList(), h = isleSel ? `#atlas/${isleSel}` : featTouched && E.length ? `#atlas/c/${slug(E[featIdx % E.length].idea)}` : "#atlas";
  if (location.hash !== h) history.replaceState(history.state, "", h);
}
let featTouched = false;
function atlasRoute(rest) {
  if (rest.startsWith("c/")) { const i = echoList().findIndex(e => slug(e.idea) === rest.slice(2)); if (i >= 0) { featTouched = true; showEcho(i); } return; }
  if (rest.startsWith("p/")) { const p = PEOPLE.find(q => slug(q.name) === rest.slice(2)); if (p) openDrawer(p); return; }
  if (P_BY_ID[rest]) selectIsle(rest, true);
}
function copyAtlasLink(btn) {
  atlasHash();
  const url = location.href, done = () => { const t = btn.textContent; btn.textContent = "Link copied"; setTimeout(() => btn.textContent = t, 1600); };
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => prompt("Copy this link", url)); else prompt("Copy this link", url);
}
function stepEcho(d) { const n = echoList().length; if (!n) return; featIdx = (featIdx + d + n) % n; featTouched = true; constFly = true; isleCard(); atlasHash(); }
function showEcho(i) { featIdx = i; featTouched = true; constFly = true; if (isleSel) selectIsle(null); else isleCard(); atlasHash(); document.getElementById("chart").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
/* join the named people's dots, nearest-next, like the stars of a constellation; each person
   is met at the dot nearest the line so far, so the shape stays compact and readable */
function drawConst(e) {
  const svg = document.querySelector("#chartSvgHost svg"); if (!svg) return;
  const path = svg.querySelector("#constLine"), lbl = svg.querySelector("#constLbl");
  svg.querySelectorAll(".town.hl").forEach(t => t.classList.remove("hl"));
  svg.classList.toggle("feat-on", !!e);
  if (!e) { path.setAttribute("d", ""); lbl.style.display = "none"; return; }
  const ids = e.notes.map(n => (PEOPLE.find(q => q.name === n.who) || {}).id).filter(Boolean);
  const dots = id => [...svg.querySelectorAll(`.town[data-p="${id}"]`)].map(c => ({ c, x: +c.getAttribute("cx"), y: +c.getAttribute("cy") }));
  /* Each person has a dot on every island they hold, so which dots to join is a choice. Make
     it the same choice every time, and the honest one for a picture: the most compact shape.
     Every combination and order is tried; four people on five islands is a few thousand. */
  const opts = ids.map(dots).filter(d => d.length);
  const perms = a => a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(r => [x, ...r]));
  let best = null, bestL = Infinity;
  const pathLen = ord => { let L = 0; for (let k = 1; k < ord.length; k++) L += Math.hypot(ord[k].x - ord[k - 1].x, ord[k].y - ord[k - 1].y); return L; };
  let fact = 1; for (let k = 2; k <= opts.length; k++) fact *= k;
  const work = opts.reduce((a, o) => a * o.length, 1) * fact;
  if (work > 40000) {
    /* too many people for every order (seven people on five islands each is ~400 million):
       start from each dot in turn, always step to the nearest dot of someone not yet joined */
    for (const start of opts.flat()) {
      const ord = [start], left = opts.filter(o => !o.includes(start));
      while (left.length) {
        const last = ord[ord.length - 1]; let bi = 0, bd = null, bD = Infinity;
        left.forEach((o, i) => o.forEach(d => { const D = Math.hypot(d.x - last.x, d.y - last.y); if (D < bD) { bD = D; bd = d; bi = i; } }));
        ord.push(bd); left.splice(bi, 1);
      }
      const L = pathLen(ord); if (L < bestL) { bestL = L; best = ord; }
    }
  } else (function pick(i, cur) {
    if (i === opts.length) {
      for (const ord of perms(cur)) { const L = pathLen(ord); if (L < bestL) { bestL = L; best = ord; } }
      return;
    }
    for (const d of opts[i]) pick(i + 1, [...cur, d]);
  })(0, []);
  const pts = best || [];
  pts.forEach(p => p.c.classList.add("hl"));
  path.setAttribute("d", pts.map((p, i) => `${i ? "L" : "M"}${f1(p.x)} ${f1(p.y)}`).join(""));
  /* The name is set level (slanted lettering reads slower) in whichever of six places
     around the constellation touches no island and no island's name. */
  if (pts.length) {
    const fsz = chartMode === "tall" ? 24 : 20, w = e.idea.length * fsz * .46, h = fsz * 1.1;
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    let leg = 1, lx = 0; for (let k = 1; k < pts.length; k++) { const L = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y); if (L > lx) { lx = L; leg = k; } }
    const mx = pts.length > 1 ? (pts[leg - 1].x + pts[leg].x) / 2 : pts[0].x, my = pts.length > 1 ? (pts[leg - 1].y + pts[leg].y) / 2 : pts[0].y;
    const cands = [[(x0 + x1) / 2, y0 - 18], [(x0 + x1) / 2, y1 + h + 10], [mx, my - 14], [mx, my + h + 8], [x0 - w / 2 - 14, (y0 + y1) / 2 + h / 3], [x1 + w / 2 + 14, (y0 + y1) / 2 + h / 3]];
    const boxes = isleNodes.flatMap(n => [[n.x - n.r * 1.15, n.y - n.r * 1.15, n.x + n.r * 1.15, n.y + n.r * 1.15],
      [n.x - n.lw / 2 - 6, n.y + n.r * 1.2, n.x + n.lw / 2 + 6, n.y + n.r * 1.3 + n.lh]]);
    const cost = ([cx, cy]) => { const a = [cx - w / 2, cy - h, cx + w / 2, cy + 4]; let o = 0;
      for (const b of boxes) o += Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
      if (a[0] < 20 || a[2] > chartW - 20 || a[1] < 20 || a[3] > chartH - 20) o += 1e6; return o; };
    const [bx, by] = cands.reduce((m, c) => cost(c) < cost(m) ? c : m, cands[0]);
    lbl.dataset.x = f1(bx); lbl.dataset.y = f1(by); lbl.dataset.r = "0";
  }
  lbl.style.display = pts.length ? "" : "none";
  lbl.querySelector("text").textContent = e.idea;
  if (constFly && pts.length > 1) {
    constFly = false;
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y), bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const k = Math.max(1, Math.min(2.2, .6 * chartW / Math.max(bw, 1), .6 * chartH / Math.max(bh, 1)));
    flyTo((Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2, k);
  }
  if (!reduce && pts.length > 1) { const L = path.getTotalLength(); path.style.transition = "none"; path.style.strokeDasharray = `${L}`; path.style.strokeDashoffset = `${L}`; path.getBoundingClientRect(); path.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.62,.02,.2,1)"; path.style.strokeDashoffset = "0"; }
  applyView();
}
function isleCard() {
  const el = document.getElementById("isleCard"); if (!el) return;
  if (!isleSel) {
    const first = PORTS[0];
    const E = echoList(), e = E[featIdx % Math.max(1, E.length)];
    el.innerHTML = `<div class="lbl q">Start here</div>
      <p class="ic-dek">Each island is one lesson they taught me. Each small mark on it is a person. Some ideas turn up in my notes on several of them:</p>
      ${e ? `<div class="feat" aria-live="polite">
        <div class="feat-h"><span class="lbl q">A constellation · ${featIdx % E.length + 1} of ${E.length}</span>
          <span class="feat-nav"><button type="button" onclick="stepEcho(-1)" aria-label="Previous constellation">←</button><button type="button" onclick="stepEcho(1)" aria-label="Next constellation">→</button></span></div>
        <p class="feat-i">${e.idea}</p>
        <p class="feat-s">${e.notes.length} people said this, in my notes. The line on the map joins them.</p>
        ${e.notes.map(n => { const p = PEOPLE.find(q => q.name === n.who); return p ? `<button class="feat-p" onclick="openDrawerById('${p.id}')" onmouseenter="showRoute(PEOPLE.find(x=>x.id==='${p.id}'))" onmouseleave="showRoute(null)"><span class="s" style="background:${p.color}"></span><span class="feat-t"><b>${p.name}</b>${p.role ? `<small>${p.role}</small>` : ""}<i>${n.note}</i></span></button>` : ""; }).join("")}
        <button class="feat-link" type="button" onclick="copyAtlasLink(this)">Copy a link to this constellation</button>
      </div>` : ""}
      <ul class="key">
        <li><svg width="30" height="10" aria-hidden="true"><circle cx="15" cy="5" r="3.2" fill="#6F93B0"/></svg>a person, coloured by the field they work in</li>
        <li><svg width="30" height="10" aria-hidden="true"><path d="M1 5H29" class="k-lane"/></svg>the same people taught both lessons</li>
        <li><svg width="30" height="14" aria-hidden="true"><g class="oldport" transform="translate(15 7)"><circle r="5"/><path d="M0 -2.6V2.8M-2.4 1.2Q0 3.6 2.4 1.2M-1.6 -1H1.6"/></g></svg>someone from the Lives shelf who lived by it</li>
      </ul>
      <button class="ic-go" onclick="document.getElementById('links').scrollIntoView({behavior:reduce?'auto':'smooth'})">All ${E.length} constellations ↓</button>`;
    drawConst(e);
    return;
  }
  const pr = P_BY_ID[isleSel];
  const near = PRINCIPLES.filter(o => o !== pr).map(o => ({ o, s: shared(pr, o) })).filter(x => x.s.length).sort((a, b) => b.s.length - a.s.length).slice(0, 3);
  el.innerHTML = `<div class="lbl q">A lesson · taught to me by ${pr.members.length} ${pr.members.length === 1 ? "person" : "people"}</div>
    <h3>${pr.name}</h3><p class="ic-gl">${pr.gloss}</p>
    <div class="ic-sec"><div class="lbl q">Who taught it to me</div>${byNotes(pr.members).map(whoRow).join("")}</div>
    <div class="ic-sec"><div class="lbl q">From the Lives shelf</div>
      ${pr.ports.length ? pr.ports.map(pt => portRow(pt)).join("") : `<p class="ic-none">I have not linked anyone on the Lives shelf to this lesson yet.</p>`}</div>
    ${near.length ? `<div class="ic-sec"><div class="lbl q">Often taught alongside</div>${near.map(x => `<button class="clink" onclick="selectIsle('${x.o.id}')"><span class="g">≈</span><span><b>${x.o.name}</b><span>${x.s.length} in common: ${x.s.slice(0, 3).map(p => p.name).join(", ")}${x.s.length > 3 ? "…" : ""}</span></span></button>`).join("")}</div>` : ""}
    <span class="ic-row"><button class="ic-x" onclick="selectIsle(null)">Show the whole chart</button><button class="ic-x" type="button" onclick="copyAtlasLink(this)">Copy link</button></span>`;
}
function selectIsle(id, scroll, quiet) {
  isleSel = id && P_BY_ID[id] ? id : null;
  if (isleSel) drawConst(null);
  litLanes(isleSel);
  if (!quiet) { const n = isleSel && nodeOf(isleSel); if (n) flyTo(n.x, n.y + n.r * .35, Math.max(chartView.k, chartMode === "tall" ? 2.2 : 2)); else chartReset(); atlasHash(); }
  document.querySelectorAll(".isle-strip button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.i === isleSel)));
  isleCard();
  if (scroll && !quiet) document.getElementById("chart").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
/* kept for the search index and the front door, which open a principle by id */
function lightConst(id) { selectIsle(id, true); }
function openPrinciple(id) { go("atlas"); setTimeout(() => selectIsle(id, true), 340); }

/* ---------- the crossing: old ports in date order, sailed by scroll ---------- */
function renderCrossing() {
  const el = document.getElementById("crossing"); if (!el) return;
  const now = new Date().getFullYear();
  const bare = PRINCIPLES.filter(pr => !pr.ports.length && pr.members.length);
  const items = [];
  PORTS.forEach((pt, i) => {
    const prev = PORTS[i - 1];
    if (prev && pt.year - prev.year >= 60) items.push(`<li class="cx-gap"><span>${(pt.year - prev.year).toLocaleString("en-US")} years of open water</span></li>`);
    const now_ = pt.pr.members;
    items.push(`<li class="cx-port" data-y="${pt.year}" style="--k:${i % 2}">
      <span class="cx-dot" aria-hidden="true"></span>
      <div class="cx-card">
        <div class="cx-top"><button class="cx-isle" onclick="selectIsle('${pt.pr.id}',true)">${pt.pr.name}</button><span class="cx-yr">${fmtYear(pt.year)}</span></div>
        <button class="cx-life" onclick="openLife('${pt.life.id}')">${plateOrMark(pt.life, "cx-img")}<span><b>${pt.life.n}</b><small>${pt.life.years}</small></span></button>
        <p class="cx-txt">${pt.txt}</p>
        <div class="cx-now"><span class="lbl q">Who taught it to me now</span><div class="const-stars">${now_.slice(0, 5).map(personPill).join("")}${now_.length > 5 ? `<button class="star-pill more" onclick="selectIsle('${pt.pr.id}',true)">+${now_.length - 5} more</button>` : ""}</div></div>
      </div></li>`);
  });
  if (PORTS.length) items.push(`<li class="cx-gap"><span>${(now - PORTS[PORTS.length - 1].year).toLocaleString("en-US")} years to now</span></li>`);
  items.push(`<li class="cx-port cx-harbour" data-y="${now}" style="--k:0">
      <span class="cx-dot" aria-hidden="true"></span>
      <div class="cx-card"><div class="cx-top"><span class="cx-isle">The harbour</span><span class="cx-yr">${now}</span></div>
        <p class="cx-txt">The people on the chart hold these lessons now: ${PEOPLE.length} people, ${PRINCIPLES.length} lessons.${bare.length ? ` ${bare.length === 1 ? "One lesson has" : `${bare.length} lessons have`} no Life on the shelf yet: ${bare.map(pr => `<button class="cx-inline" onclick="selectIsle('${pr.id}',true)">${pr.name}</button>`).join(", ")}. I add a Life only when its entry makes the case.` : ""}</p></div></li>`);

  el.innerHTML = `<div class="sec-head"><h3>The crossing</h3><span>Lives on the shelf who worked by these lessons long before, in date order. Scroll and the ship sails from ${PORTS.length ? fmtYear(PORTS[0].year) : "then"} to now.</span></div>
    <div class="cx-body" id="cxBody">
      <div class="cx-dial" aria-hidden="true"><span id="cxYear">${PORTS.length ? fmtYear(PORTS[0].year) : now}</span></div>
      <svg class="cx-track" id="cxTrack" aria-hidden="true"><path class="cx-wake" id="cxWake"/><path class="cx-ink" id="cxInk"/><g id="cxShip" class="cx-ship"><g transform="translate(-15 -22)">{{MARK size=30 sw=1.1 pn aria}}</g></g></svg>
      <ol class="cx-list">${items.join("")}</ol>
    </div>`;
}
/* measure the ports and lay a winding track through them */
function measureCrossing() {
  const body = document.getElementById("cxBody"), svg = document.getElementById("cxTrack");
  if (!body || !svg || !body.offsetParent) { crossGeom = null; return; }
  const bb = body.getBoundingClientRect();
  const dots = [...body.querySelectorAll(".cx-port")].map(li => {
    const d = li.querySelector(".cx-dot").getBoundingClientRect();
    return { x: d.left + d.width / 2 - bb.left, y: d.top + d.height / 2 - bb.top, year: +li.dataset.y };
  });
  svg.setAttribute("width", bb.width); svg.setAttribute("height", bb.height);
  svg.setAttribute("viewBox", `0 0 ${f1(bb.width)} ${f1(bb.height)}`);
  if (dots.length < 2) { crossGeom = null; return; }
  /* a gentle meander between ports, so the track reads as a course and not a ruled line */
  const pts = [];
  dots.forEach((d, i) => {
    pts.push([d.x, d.y]);
    const n = dots[i + 1]; if (!n) return;
    const sway = Math.min(46, bb.width * .06) * (i % 2 ? 1 : -1);
    pts.push([(d.x + n.x) / 2 + sway, (d.y + n.y) / 2]);
  });
  const d = linePath(pts);
  const wake = document.getElementById("cxWake"), ink = document.getElementById("cxInk");
  wake.setAttribute("d", d); ink.setAttribute("d", d);
  const L = ink.getTotalLength();
  /* where along the path each port sits, so the dial can read the year between them */
  /* the track only ever runs downward, so each port's distance along it is a binary search
     on height: ~15 probes a port, where a scan every 6px took a third of a second */
  const stops = dots.map(dt => { let lo = 0, hi = L; for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (ink.getPointAtLength(mid).y < dt.y) lo = mid; else hi = mid; } return { s: (lo + hi) / 2, year: dt.year }; });
  crossGeom = { L, stops, top: bb.top + scrollY, h: bb.height };
  ink.style.strokeDasharray = `${L}`;
  sailCrossing();
}
function sailCrossing() {
  crossRaf = 0;
  if (!crossGeom || wing !== "atlas") return;
  const { L, stops, top, h } = crossGeom, ink = document.getElementById("cxInk"), ship = document.getElementById("cxShip");
  const probe = scrollY + innerHeight * .55;
  /* the ship sits where the track crosses the reading line (55% down the screen), found by
     height, so a port and its year line up exactly as it passes; a share of the track's
     length drifted on the bends, and the dial read 265 BCE at Confucius */
  const want = probe - top;
  let s = L;
  if (!reduce) { let lo = 0, hi = L; for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (ink.getPointAtLength(mid).y < want) lo = mid; else hi = mid; } s = Math.max(0, Math.min(L, (lo + hi) / 2)); }
  ink.style.strokeDashoffset = `${L - s}`;
  const p = ink.getPointAtLength(Math.max(.1, s)), q = ink.getPointAtLength(Math.min(L, s + 4));
  const tilt = Math.max(-14, Math.min(14, (q.x - p.x) * 4));
  ship.setAttribute("transform", `translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(tilt)})`);
  ship.style.opacity = reduce ? "0" : "1";
  let year = stops[0].year;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (s >= a.s && s <= b.s) { year = Math.round(a.year + (b.year - a.year) * ((s - a.s) / Math.max(1, b.s - a.s))); break; }
    if (s > b.s) year = b.year;
  }
  const at = stops.find(st => Math.abs(st.s - s) < 10); if (at) year = at.year;   /* at a port, its own year exactly */
  document.getElementById("cxYear").textContent = fmtYear(year);
  document.querySelectorAll("#cxBody .cx-port").forEach((li, i) => li.classList.toggle("reached", stops[i] && s >= stops[i].s - 2));
}
addEventListener("scroll", () => { if (wing === "atlas" && crossGeom && !crossRaf) crossRaf = requestAnimationFrame(sailCrossing); }, { passive: true });

/* ---------- the harbour: everyone, by region ---------- */
/* A constellation's own shape, small, for its card: the same people, placed where the
   chart places them (the wide layout, so it never changes with the screen), joined by the
   most compact path, exactly as the chart draws it. */
function constShape(e, W = 116, H = 56) {
  if (!miniNodes) miniNodes = layoutIsles(1200, 760, 1, 22, 99, 12.5);
  const town = (n, p) => { const arr = n.pr.members, k = arr.indexOf(p), a = k * 2.39996 + n.seed, rad = n.r * .6 * Math.sqrt((k + .5) / arr.length); return { x: n.x + Math.cos(a) * rad, y: n.y + Math.sin(a) * rad }; };
  const opts = e.notes.map(x => PEOPLE.find(p => p.name === x.who)).filter(Boolean).map(p => miniNodes.filter(n => p.p.includes(n.pr.id)).map(n => town(n, p))).filter(o => o.length);
  if (opts.length < 2) return "";
  const len = o => o.reduce((a, q, i) => i ? a + Math.hypot(q.x - o[i - 1].x, q.y - o[i - 1].y) : 0, 0);
  let best = null, bl = Infinity;
  for (const start of opts.flat()) {
    const ord = [start], left = opts.filter(o => !o.includes(start));
    while (left.length) { const l = ord[ord.length - 1]; let bi = 0, bd = null, bD = Infinity; left.forEach((o, i) => o.forEach(q => { const D = Math.hypot(q.x - l.x, q.y - l.y); if (D < bD) { bD = D; bd = q; bi = i; } })); ord.push(bd); left.splice(bi, 1); }
    const L = len(ord); if (L < bl) { bl = L; best = ord; }
  }
  const xs = best.map(q => q.x), ys = best.map(q => q.y), x0 = Math.min(...xs), y0 = Math.min(...ys), sw = Math.max(...xs) - x0 || 1, sh = Math.max(...ys) - y0 || 1;
  const sc = Math.min((W - 12) / sw, (H - 12) / sh, 1.4), ox = (W - sw * sc) / 2, oy = (H - sh * sc) / 2;
  const pts = best.map(q => [ox + (q.x - x0) * sc, oy + (q.y - y0) * sc]);
  return `<svg class="shape" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${pts.map((p, i) => `${i ? "L" : "M"}${f1(p[0])} ${f1(p[1])}`).join("")}"/>${pts.map(p => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="2.6"/>`).join("")}</svg>`;
}
function renderLinks() {
  const el = document.getElementById("links"); if (!el) return;
  const who = p => `<button class="lk-p" onclick="openDrawerById('${p.id}')"><b>${p.name}</b>${p.role ? `<small>${p.role}</small>` : ""}</button>`;
  const lessons = ids => ids.map(id => `<button class="cx-isle" onclick="selectIsle('${id}',true)">${P_BY_ID[id].name}</button>`).join(", ");
  const cites = PEOPLE.flatMap(p => (p.mentions || []).map(m => ({ p, m, life: LIVES.find(l => l.id === m.to.slice(6)) }))).filter(x => x.life);
  const byName = n => PEOPLE.find(p => p.name === n);
  const echoes = echoList();
  el.innerHTML = `<div class="sec-head"><h3>Constellations</h3><span>How these people connect: the same idea, in my notes on different people. I copied each line from those notes.</span></div>
    <div class="echoes">${echoes.map(e => `<article class="echo"><div class="echo-h"><div><h4>${e.idea}</h4><button class="echo-map" type="button" onclick="showEcho(${echoes.indexOf(e)})">Show on the map ↑</button></div>${constShape(e)}</div><ul>${e.notes.map(n => { const p = byName(n.who); return p ? `<li><button class="lk-p" onclick="openDrawerById('${p.id}')"><b><span class="s" style="background:${p.color}"></span>${p.name}</b>${p.role ? `<small>${p.role}</small>` : ""}</button><p>${n.note}</p></li>` : ""; }).join("")}</ul></article>`).join("")}</div>
    <p class="notecap" style="margin-top:12px">These are my notes from listening, with the spelling fixed. They are not quotations.</p>
    ${cites.length >= 3 ? `<div class="sec-head" style="padding-top:34px"><h3>Where the shelves meet</h3><span>Where my notes on someone name a person on the Lives shelf.</span></div>
    <ol class="lk-list">${cites.map(x => `<li>${who(x.p)}<span class="lk-and">on</span><button class="lk-p" onclick="openLife('${x.life.id}')"><b>${x.life.n}</b><small>${x.life.years} · Lives</small></button><p>${x.m.note}</p></li>`).join("")}</ol>` : ""}`;
}
function renderHarbour() {
  const el = document.getElementById("harbour"); if (!el) return;
  el.innerHTML = `<div class="sec-head"><h3>Who they are</h3><span>Everyone on the chart, grouped by field. The people I took most notes on come first.</span></div>
    <div class="hb-grid">${DOMAINS.map(d => { const ps = byNotes(PEOPLE.filter(p => p.domain === d.id)); return ps.length ? `<div class="hb-reg"><div class="lbl q"><span class="dot" style="background:${DCOLOR[d.id]}"></span>${d.label} · ${ps.length}</div>${ps.map(whoRow).join("")}</div>` : ""; }).join("")}</div>
    <div class="sec-head" style="padding-top:46px"><h3>The listening</h3><span>The shows where I heard them. I keep the notes in a private Google Doc, begun in November 2025, and copy them here with the spelling fixed.</span></div>
    <div class="const-stars" style="margin-top:14px;padding-bottom:10px">${SOURCES.map(s => `<a class="star-pill" href="${s.u}" target="_blank" rel="noopener"><span class="s" style="background:var(--nbrass)"></span>${s.t} ↗</a>`).join("")}</div>`;
}

/* ---------- the drawer: one person, and their map ---------- */
/* The drawer's small chart. Always drawn from the wide layout at its own proportions, so it
   never squashes, in the chart's one ink: the person's islands inked and named in capitals,
   the rest only outlined, their route dashed, and the boat sailing it once. */
let miniNodes = null;
function miniMap(p) {
  if (!miniNodes) miniNodes = layoutIsles(1200, 760, 1, 22, 99, 12.5);
  const W = 380, H = Math.round(W * 760 / 1200), sc = W / 1200, mine = new Set(p.p);
  const at = n => [n.x * sc, n.y * sc];
  const left = miniNodes.filter(n => mine.has(n.pr.id)).sort((a, b) => a.x - b.x), v = left.length ? [left.shift()] : [];
  while (left.length) { const l = v[v.length - 1]; left.sort((a, b) => Math.hypot(a.x - l.x, a.y - l.y) - Math.hypot(b.x - l.x, b.y - l.y)); v.push(left.shift()); }
  const route = v.length > 1 ? linePath(v.map(at)) : "";
  miniMap.order = v.map(n => n.pr.id);
  return `<svg class="minimap" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <rect class="mm-frame" x="3" y="3" width="${W - 6}" height="${H - 6}"/>
    ${miniNodes.map(n => { const [x, y] = at(n), r = n.r * sc; const on = mine.has(n.pr.id);
      return `${on ? `<path class="mm-wl" d="${coast(x, y, r, n.seed, 1.3)}"/>` : ""}<path class="${on ? "mm-on" : "mm-off"}" d="${coast(x, y, r, n.seed)}"/>`; }).join("")}
    ${route ? `<path class="mm-route" d="${route}"/>` : ""}
    ${v.map((n, i) => { const [x, y] = at(n); return `<g class="mm-stop"><circle cx="${f1(x)}" cy="${f1(y)}" r="7"/><text x="${f1(x)}" y="${f1(y + 3)}">${i + 1}</text></g>`; }).join("")}
    ${route && !reduce ? `<g class="mm-boat"><g transform="translate(-9 -15)">{{MARK size=18 sw=1.3 pn aria}}</g><animateMotion dur="${(1.4 + v.length * .55).toFixed(1)}s" begin="0s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".45 0 .55 1" path="${route}"/></g>` : ""}
  </svg>`;
}
function keptHTML(p) {
  const src = k => /^https?:/.test(k.s) ? `<a href="${k.s}" target="_blank" rel="noopener">${k.s.replace(/^https?:\/\/(www\.)?/, "").slice(0, 44)} ↗</a>` : k.s;
  const quoted = (p.kept || []).filter(k => typeof k !== "string"), notes = (p.kept || []).filter(k => typeof k === "string");
  const lbl = t => `<div class="lbl q">${t}</div>`;
  /* Kept lines come in two kinds and must not look alike. A line with a source (`{k, s}`) is a
     quotation: the words are theirs and the reader can go and check them. A bare string is a
     note taken while listening, with no episode recorded, so it prints "after" the person —
     which the colophon defines as compressed notes, not their words. */
  return (quoted.length ? `<div>${lbl("Lines I kept")}<ul class="keptlist">${quoted.map(k => `<li>${k.k}<span class="ks">${src(k)}</span></li>`).join("")}</ul></div>` : "") +
    (notes.length ? `<div>${lbl("Notes I kept · after " + p.name)}<ul class="keptlist notes">${notes.map(k => `<li>${k}</li>`).join("")}</ul><p class="notecap">I copied these from my listening notes. I did not record the episode, so I give them as notes, not quotations.</p></div>` : "");
}
function openDrawerById(id) { openDrawer(PEOPLE.find(p => p.id === id)); }
function openDrawer(p) {
  if (!p) return;
  selectedPerson = p;
  const reg = document.getElementById("dRegion");
  reg.textContent = DOM_BY_ID[p.domain].label; reg.style.color = p.color;
  document.getElementById("drawer").style.setProperty("--dcol", p.color);
  document.getElementById("dName").textContent = p.name;
  document.getElementById("dRole").textContent = (p.role ? p.role + " · " : "") + `${p.p.length} ${p.p.length === 1 ? "lesson" : "lessons"}`;
  const near = closest(p), earlier = PORTS.filter(pt => p.p.includes(pt.pr.id));
  const lbl = t => `<div class="lbl q">${t}</div>`;
  document.getElementById("dBody").innerHTML =
    `<div>${lbl("My take")}<p class="pull">${p.take}</p></div>
     <div>${lbl("Their lessons, as a route")}${miniMap(p)}<ol class="mm-isles">${(miniMap.order || p.p).map(id => `<li><button class="cx-isle" onclick="closeDrawer();selectIsle('${id}',true)">${P_BY_ID[id].name}</button></li>`).join("")}</ol></div>
     ${(() => { const mine = (typeof ECHOES === "undefined" ? [] : ECHOES).filter(e => e.notes.some(n => n.who === p.name)); return mine.length ? `<div>${lbl("Heard the same from")}${mine.map(e => { const others = e.notes.filter(n => n.who !== p.name).map(n => PEOPLE.find(q => q.name === n.who)).filter(Boolean); return `<div class="echo-d"><b>${e.idea}</b><span>also ${others.map(q => `<button class="cx-inline" onclick="openDrawer(PEOPLE.find(z=>z.id==='${q.id}'))">${q.name}</button>`).join(", ")}</span></div>`; }).join("")}</div>` : ""; })()}
     ${(p.mentions || []).length ? `<div>${lbl("Names someone on the Lives shelf")}${p.mentions.map(m => { const l = LIVES.find(x => x.id === m.to.slice(6)); return l ? `<button class="portrow" onclick="openLife('${l.id}')">${plateOrMark(l, "pr-img")}<span class="pr-t"><b>${l.n}</b><small>${l.years}</small><i>${m.note}</i></span></button>` : ""; }).join("")}</div>` : ""}
     ${earlier.length ? `<div>${lbl("From the Lives shelf, on the same lessons")}${earlier.map(pt => portRow(pt, true)).join("")}</div>` : ""}
     ${near.length ? `<div>${lbl("Most alike in what they taught me")}<div style="display:flex;flex-direction:column;gap:7px">${near.map(x => `<button class="clink" onclick="openDrawer(PEOPLE.find(z=>z.id==='${x.q.id}'))"><span class="g" style="color:${x.q.color}">●</span><span><b>${x.q.name}</b><span>${x.both.length} lessons in common: ${x.both.map(id => P_BY_ID[id].name).join(", ")}</span></span></button>`).join("")}</div></div>` : ""}
     ${keptHTML(p)}
     ${p.corrected && p.corrected.length ? `<div>${lbl("Corrected")}<div class="corrbox">${p.corrected.map(n => { const c = CORRECTIONS[n - 1]; return c ? `<div><b>№ ${n} · ${c.d} · ${c.t}</b><span>${c.b}</span></div>` : ""; }).join("")}</div></div>` : ""}
     <div class="caveat">I chart people as sources and pass no verdict on them. The islands are my own sorting of what they taught. When several people land on one island, the lesson is my claim, and the people are where I heard it.</div>`;
  document.getElementById("scrim").classList.add("on");
  document.getElementById("drawer").classList.add("on");
  document.getElementById("drawer").setAttribute("aria-hidden", "false");
  showRoute(p);
}
function closeDrawer() {
  document.getElementById("scrim").classList.remove("on");
  document.getElementById("drawer").classList.remove("on");
  document.getElementById("drawer").setAttribute("aria-hidden", "true");
  selectedPerson = null;
  if (typeof showRoute === "function") showRoute(null);
}

/* ---------- boot, show, resize ---------- */
function renderAtlas() {
  atlasDerive();
  const first = PORTS[0];
  document.getElementById("atlasSide").innerHTML = `${PEOPLE.length} people · ${PRINCIPLES.length} lessons<br>${PORTS.length} Lives from the shelf${first ? `, the earliest ${fmtYear(first.year)}` : ""}`;
  document.getElementById("isleStrip").innerHTML = `<div class="ix-h">Index of lessons</div>` + PRINCIPLES.slice().sort((a, b) => b.members.length - a.members.length)
    .map(pr => `<button data-i="${pr.id}" aria-pressed="false" onclick="selectIsle('${pr.id}')">${pr.name}<span>${countLine(pr)}</span></button>`).join("");
  renderChart(); isleCard(); renderLinks(); renderCrossing(); renderHarbour();
  /* the chart is first drawn while its wing is hidden, at no width; redraw and re-measure
     whenever its real size is known or changes (first show, rotation, window resize) */
  /* the opening constellation draws itself when the chart first comes into view, not while
     the reader is still up in the title where they would miss it */
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting) && !isleSel) { io.disconnect(); const E = echoList(); if (E.length) drawConst(E[featIdx % E.length]); } }, { threshold: .45 }); io.observe(document.getElementById("chartSvgHost")); }
  if ("ResizeObserver" in window) new ResizeObserver(() => { if (wing === "atlas") atlasResize(); }).observe(document.getElementById("chartSvgHost"));
  /* the crossing measures its own ports; when anything above or inside it reflows (the web
     fonts arriving late, a card growing) those measurements go stale and the dial reads the
     wrong year, so it measures again whenever its height changes */
  const cx = document.getElementById("cxBody");
  if (cx && "ResizeObserver" in window) new ResizeObserver(() => { if (wing === "atlas") measureCrossing(); }).observe(cx);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (wing === "atlas") measureCrossing(); });
}
function atlasShown() {
  const host = document.getElementById("chartSvgHost");
  if (host && (host.clientWidth < 700 ? "tall" : "wide") !== chartMode) renderChart();
  fitCard();
  measureCrossing();
}
function atlasResize() { clearTimeout(atlasResize.t); atlasResize.t = setTimeout(atlasShown, 160); }

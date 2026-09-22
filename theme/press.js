/* ===================== ENGINE ===================== */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE="cubic-bezier(.19,.9,.22,1)", EASE_IO="cubic-bezier(.62,.02,.2,1)";
const WINGS=[["home","Home"],["press","The Press"],["lives","Lives"],["atlas","The Atlas"],["colophon","Colophon"]];
let wing="home", searchFocus=null, readerFocus=null, current=null, currentKind=null, activeConst=null, activeRegion=null, selectedPerson=null;

/* ---------- derive ---------- */
PEOPLE.forEach((p,i)=>{p.id="p"+i;p.color=DCOLOR[p.domain];p.degree=0});
for(let i=0;i<PEOPLE.length;i++)for(let j=i+1;j<PEOPLE.length;j++)
  if(PEOPLE[i].p.some(x=>PEOPLE[j].p.includes(x))){PEOPLE[i].degree++;PEOPLE[j].degree++}
PRINCIPLES.forEach(pr=>pr.members=PEOPLE.filter(p=>p.p.includes(pr.id)));
const ACTIVE_PR=PRINCIPLES.filter(p=>p.members.length>=2);
const P_BY_ID=Object.fromEntries(PRINCIPLES.map(p=>[p.id,p]));
const DOM_BY_ID=Object.fromEntries(DOMAINS.map(d=>[d.id,d]));

function midnight(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}

/* ---------- cover art ---------- */
function motifSVG(kind,a){
  if(kind==="rings")return `<svg class="motif" viewBox="0 0 100 150" preserveAspectRatio="none"><g fill="none" stroke="${a}" stroke-width=".5" opacity=".55"><circle cx="50" cy="75" r="18"/><circle cx="50" cy="75" r="30"/><circle cx="50" cy="75" r="42"/><circle cx="50" cy="75" r="54"/></g></svg>`;
  if(kind==="grid")return `<svg class="motif" viewBox="0 0 100 150" preserveAspectRatio="none"><g stroke="${a}" stroke-width=".4" opacity=".4">${Array.from({length:11},(_,i)=>`<line x1="${i*10}" y1="0" x2="${i*10}" y2="150"/>`).join("")}${Array.from({length:16},(_,i)=>`<line x1="0" y1="${i*10}" x2="100" y2="${i*10}"/>`).join("")}</g></svg>`;
  if(kind==="lines")return `<svg class="motif" viewBox="0 0 100 150" preserveAspectRatio="none"><g stroke="${a}" stroke-width=".6" opacity=".45">${Array.from({length:14},(_,i)=>`<line x1="-10" y1="${i*13}" x2="110" y2="${i*13-26}"/>`).join("")}</g></svg>`;
  if(kind==="dots")return `<svg class="motif" viewBox="0 0 100 150" preserveAspectRatio="none"><g fill="${a}" opacity=".38">${Array.from({length:120},(_,i)=>{const x=(i%10)*10+5,y=Math.floor(i/10)*12+6;return `<circle cx="${x}" cy="${y}" r="${(1.6-Math.abs(x-50)/90).toFixed(2)}"/>`}).join("")}</g></svg>`;
  return `<svg class="motif" viewBox="0 0 100 150" preserveAspectRatio="none"><circle cx="50" cy="60" r="60" fill="${a}" opacity=".13"/><circle cx="50" cy="60" r="34" fill="${a}" opacity=".10"/></svg>`;
}
function bookHTML(b,titleText,subText,spineText){
  return `<div class="book">
    <div class="drop"></div><div class="topedge"></div><div class="pages"></div>
    <div class="spine" style="background:${b.spineC};color:${b.ink}"><span>${spineText}</span></div>
    <div class="face cover" style="background:${b.cover};color:${b.ink}">
      ${motifSVG(b.motif,b.accent)}<div class="gloss"></div>
      <div class="ct"><h4 class="ctitle">${titleText}</h4>
        <div class="cdiv" style="background:${b.accent}"></div>
        <div class="csub" style="color:${b.accent}">${subText}</div></div>
      <div class="cfoot">Commodore Press</div>
    </div></div>`;
}
const pressBook=b=>bookHTML(b,b.title,b.sub,b.spineTitle);
function lifeBook(b){
  const plate=PLATES[b.id]?`<img class="cplate" src="${PLATES[b.id]}" alt="" loading="lazy">`:"";
  return `<div class="book">
    <div class="drop"></div><div class="topedge"></div><div class="pages"></div>
    <div class="spine" style="background:${b.spineC};color:${b.ink}"><span>${b.n}</span></div>
    <div class="face cover" style="background:${b.cover};color:${b.ink}">
      ${motifSVG(b.motif,b.accent)}<div class="gloss"></div>
      <div class="ct">${plate}<h4 class="ctitle">${b.n}</h4>
        <div class="cdiv" style="background:${b.accent}"></div>
        <div class="csub" style="color:${b.accent}">${b.field}</div></div>
      <div class="cfoot">Commodore Press</div>
    </div></div>`;
}

/* ---------- reveal / tilt ---------- */
const revealIO=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");revealIO.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.08});
function observeReveals(r){(r||document).querySelectorAll("[data-reveal]:not(.in)").forEach(el=>revealIO.observe(el))}
function bindTilt(root){
  if(reduce)return;
  (root||document).querySelectorAll(".slot,.rbook").forEach(host=>{
    if(host.dataset.tilt)return; host.dataset.tilt="1";
    const book=host.querySelector(".book"),gloss=host.querySelector(".gloss");
    if(!book)return;
    const isRail=host.classList.contains("rbook");
    let raf=0,px=.5,py=.5;
    host.addEventListener("pointermove",e=>{
      if(!isRail&&document.body.classList.contains("spines"))return;
      const r=host.getBoundingClientRect();px=(e.clientX-r.left)/r.width;py=(e.clientY-r.top)/r.height;
      if(raf)return;
      raf=requestAnimationFrame(()=>{raf=0;const base=isRail?15:10;
        book.classList.add("track");
        book.style.setProperty("--ry",(base+(.5-px)*26).toFixed(2)+"deg");
        book.style.setProperty("--rx",(1.5+(.5-py)*10).toFixed(2)+"deg");
        if(!isRail){book.style.setProperty("--ty","-14px");book.style.setProperty("--sc","1.04")}
        if(gloss){gloss.style.setProperty("--gx",(px*100).toFixed(1)+"%");gloss.style.setProperty("--gy",(py*100).toFixed(1)+"%");gloss.style.opacity="1"}});
    });
    host.addEventListener("pointerleave",()=>{
      book.classList.remove("track");
      ["--ry","--rx","--ty","--sc"].forEach(p=>book.style.removeProperty(p));
      if(gloss)gloss.style.opacity="";
      if(isRail)railScroll();
    });
  });
}

/* ---------- nav / router ---------- */
function renderNav(){
  document.getElementById("nav").innerHTML =
    WINGS.filter(w=>w[0]!=="home"&&w[0]!=="colophon").map(w=>`<button class="navbtn" data-w="${w[0]}" onclick="go('${w[0]}')">${w[1]}</button>`).join("")
    + (LOG.length?`<a class="navbtn solid" href="log/">The Log</a>`:"")
    + `<button class="navbtn" onclick="openSearch()" aria-label="Search the library" title="Search ( / )">Search</button>`
    // "Surprise me" was the one solid button on the site, so a novelty outranked the wings. It
    // stays, as a quiet one; the solid slot goes to the Log once there is something in it.
    + `<button class="navbtn" onclick="surprise()" title="Open a random entry ( R )">Surprise me</button>`
    + `<button class="navbtn" id="themeBtn" onclick="toggleTheme()" aria-label="Toggle night reading" title="Night reading">◐</button>`;
}
function applyTheme(dark){
  document.body.classList.toggle("dusk",dark);
  const b=document.getElementById("themeBtn"); if(b)b.textContent=dark?"○":"◐";
}
function initTheme(){
  let pref=null; try{pref=localStorage.getItem("cp-theme")}catch(e){}
  const rt=document.documentElement.dataset?document.documentElement.dataset.theme:null;
  let dark; if(pref==="dark")dark=true; else if(pref==="light")dark=false;
  else if(rt==="dark")dark=true; else if(rt==="light")dark=false;
  else dark=matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(dark);
}
function toggleTheme(){
  const dark=!document.body.classList.contains("dusk");
  applyTheme(dark);
  try{localStorage.setItem("cp-theme",dark?"dark":"light")}catch(e){}
}
function go(w,push){
  if(current)closeReader(false);
  closeDrawer();
  wing=w;
  document.querySelectorAll(".wing").forEach(s=>s.classList.toggle("on",s.dataset.wing===w));
  document.querySelectorAll("#nav .navbtn[data-w]").forEach(b=>b.setAttribute("aria-current",String(b.dataset.w===w)));
  document.body.classList.toggle("night",w==="atlas");
  if(push!==false&&location.hash!=="#"+w)history.pushState({w},"","#"+w);
  document.title = (w==="home"?"The Commodore Press":(WINGS.find(x=>x[0]===w)[1]+" — The Commodore Press"));
  scrollTo({top:0,behavior:reduce?"auto":"smooth"});
  if(w==="atlas")requestAnimationFrame(()=>{skyResize();skyBoot()});
  observeReveals(document);
}
function goTo(ref){
  const [w,id]=ref.split(":");
  if(w==="press"){go("press");setTimeout(()=>openReader("press",id),320)}
  else if(w==="lives"){go("lives");setTimeout(()=>openReader("lives",id),320)}
  else go(w);
}

/* ---------- front door ---------- */
function renderFront(){
  document.getElementById("tally").innerHTML =
    `<span><b>${BOOKS.length}</b>titles</span><span><b>${LIVES.length}</b>lives</span>`+
    `<span><b>${PEOPLE.length}</b>people</span><span><b>${PRINCIPLES.length}</b>principles</span>`;

  // The daily pick comes from the lives nobody has heard of when there are any with plates:
  // they are the reason to visit, and the famous ones are a click away on the shelf.
  const plated=LIVES.filter(b=>PLATES[b.id]), obscure=plated.filter(b=>b.group==="obscure");
  const withPlates=obscure.length?obscure:plated;
  const dayN=Math.floor(midnight(new Date()).getTime()/86400000);
  const pick=withPlates[dayN%withPlates.length];
  document.getElementById("todayCard").innerHTML=
    `<div class="lbl">From the shelves · changes daily</div>
     <div class="fp">
       <div class="plate"><img src="${PLATES[pick.id]}" alt="Portrait of ${pick.n}"></div>
       <div style="display:flex;flex-direction:column;gap:8px;padding-top:2px">
         <h4>${pick.n}</h4>
         <div class="yrs">${pick.years} · ${pick.field}</div>
         <div class="ld">${pick.lede}</div>
       </div>
     </div>
     <button class="go" onclick="go('lives');setTimeout(()=>openReader('lives','${pick.id}'),340)">Read the life →</button>`;

  const spines=(cols)=>cols.map((c,i)=>`<div class="sp" style="width:30px;height:${58+((i*13)%18)}px;background:${c}"></div>`).join("");
  document.getElementById("wings3").innerHTML=[
    {w:"press",n:"Wing I",t:"The Press",ac:"var(--oxblood)",p:"{{W_BOOKS_CAP}} ideas I keep circling back to, each with its timeline, its numbers and its objections.",
     v:spines(["#0F4C46","#6B1E2A","#8C6A0F","#232E78"])},
    {w:"lives",n:"Wing II",t:"Lives",ac:"#5A3A21",p:"{{W_LIVES_CAP}} people and the one book on each worth your time. {{W_FAMOUS_CAP}} famous, {{N_OBSCURE}} you have never heard of.",
     v:spines(["#4A3520","#2F4A3C","#5B2C3E","#26262B"])},
    {w:"atlas",n:"Wing III · at night",t:"The Atlas",ac:"var(--navy)",p:"{{W_PEOPLE_CAP}} people as stars; the lines between them are the principles more than one of them handed me.",night:1,
     v:`<div style="width:100%;height:74px;background:#0A0E1B;border-radius:2px"><svg width="100%" height="74" viewBox="0 0 210 74"><g stroke="#D8A657" stroke-width=".6" opacity=".5" fill="none"><path d="M28 50 82 26 140 44 182 20"/></g><g fill="#F6E9C8"><circle cx="28" cy="50" r="2.6"/><circle cx="82" cy="26" r="3.4"/><circle cx="140" cy="44" r="2.2"/><circle cx="182" cy="20" r="2.9"/></g></svg></div>`},
  ].map((c,i)=>`<button class="wcard ${c.night?"night":""}" data-reveal style="--d:${i*70}ms;border-top-color:${c.ac}" onclick="go('${c.w}')">
      <span class="n">${c.n}</span><h3>${c.t}</h3><p>${c.p}</p><div class="viz">${c.v}</div></button>`).join("");

  document.getElementById("corrections").innerHTML=
    `<div class="lbl q" style="margin-bottom:10px">Corrections — kept visible</div>`+
    CORRECTIONS.map(c=>`<div style="margin-bottom:12px"><b>${c.t}</b> ${c.b} <span style="font-family:var(--mono);font-size:11.5px;opacity:.6">${c.d}</span></div>`).join("");
  document.getElementById("stat").textContent=`${BOOKS.length} titles · ${LIVES.length} lives · ${PEOPLE.length} people · ${PRINCIPLES.length} principles`;
  renderDoors(withPlates,dayN);
}

/* ---------- front door: ways in ----------
   A first-time reader meets a mission statement and five wing names. These three blocks give
   them something to hold: the method shown on a real entry, what is new, and every face.
   Nothing here is written for the page; it is all read from content/, so it cannot go stale. */
const readMins=b=>Math.max(2,Math.round(words(b)/210));
function openLife(id){go('lives');setTimeout(()=>openReader('lives',id),340)}
const plateOrMark=(b,cls)=>PLATES[b.id]
  ? `<img class="${cls}" src="${PLATES[b.id]}" alt="" loading="lazy">`
  : `<span class="${cls} nomark" aria-hidden="true"><svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M11 1V21M1 11H21" stroke="currentColor" stroke-width=".9"/></svg></span>`;
/* Every Press → Lives → Atlas path the content actually contains. Built from `across`
   rather than written down, so the panel below cannot outlive the links it describes:
   pull a link and the thread it was showing stops being offered. */
function wingThreads(){
  const out=[];
  for(const b of BOOKS) for(const a of (b.across||[])){
    if(!a.to.startsWith("lives:"))continue;
    const life=LIVES.find(l=>l.id===a.to.slice(6)); if(!life)continue;
    for(const c of (life.across||[])){
      if(!c.to.startsWith("atlas:"))continue;
      const pr=P_BY_ID[c.to.slice(6)]; if(!pr)continue;
      out.push({b,life,pr});
    }
  }
  return out;
}
/* the Atlas has no reader of its own — open the wing and light the constellation */
function openPrinciple(id){go("atlas");setTimeout(()=>lightConst(id),340)}

function renderDoors(withPlates,dayN){
  const el=document.getElementById("doors"); if(!el)return;
  // a different life from the "From the shelves" card, so the two never show the same face
  const today=withPlates[dayN%withPlates.length];
  const pool=withPlates.filter(b=>b.bio&&b.contested&&b.keep&&b.id!==today.id);
  const spec=pool[(dayN+7)%pool.length];
  const firstSentence=s=>(s.match(/^.*?[.!?](?=\s+[A-Z"'‘“]|$)/)||[s])[0];
  const steps=[
    ["The essay","What happened, with the names and numbers.",spec.lede],
    ["The one book","The book worth your time, and why that one rather than the famous one.",`<i>${spec.bio.t}</i> — ${spec.bio.a}, ${spec.bio.y}`],
    ["Where it is contested","The strongest case against, from someone who knows. Every entry has one.",firstSentence(spec.contested)],
    ["The line to keep","One sentence to leave with.",spec.keep]
  ];
  const newest=LIVES.slice(-4).reverse();
  const threads=wingThreads();
  const th=threads.length?threads[dayN%threads.length]:null;
  const cells=th?[
    ["Wing I","The Press","an idea",     th.b.title,  th.b.claim,  `openReader('press','${th.b.id}')`,  "var(--oxblood)"],
    ["Wing II","Lives",   "a person",    th.life.n,   th.life.keep,`openLife('${th.life.id}')`,         "var(--ink)"],
    ["Wing III","The Atlas","a principle",th.pr.name, th.pr.gloss, `openPrinciple('${th.pr.id}')`,      "var(--navy)"],
  ]:[];

  el.innerHTML=
   (th?`<section class="door thread" data-reveal aria-labelledby="thrH">
      <div class="door-h"><div class="lbl">What the three wings are</div>
        <h2 id="thrH">One thread, three wings</h2></div>
      <p class="thr-sub">The Press keeps an <b>idea</b>, with its timeline, its numbers and its objections.
        Lives keeps a <b>person</b>, and the one book on them worth your time. The Atlas keeps a
        <b>principle</b> someone is working by now. The same thread usually runs through all three —
        here is one of them, end to end.</p>
      <ol class="thr-row">${cells.map((c,i)=>`<li data-reveal style="--d:${i*110}ms">
          <button onclick="${c[5]}" style="--ac:${c[6]}">
            <span class="thr-w">${c[0]} · ${c[1]}</span>
            <span class="thr-k">${c[2]}</span>
            <b class="thr-t">${c[3]}</b>
            <span class="thr-q">${c[4]}</span>
            <span class="thr-go">Open →</span>
          </button></li>`).join("")}</ol>
    </section>`:"")+
   `<section class="door spec" data-reveal aria-labelledby="specH">
      <div class="door-h"><div class="lbl">How every entry works</div>
        <h2 id="specH">Four parts, shown here on ${spec.n}</h2></div>
      <ol class="steps">${steps.map((s,i)=>`<li data-reveal style="--d:${i*80}ms">
          <span class="sn">${i+1}</span><b>${s[0]}</b><span class="sw">${s[1]}</span>
          <span class="sx">${s[2]}</span></li>`).join("")}</ol>
      <button class="door-go" onclick="openLife('${spec.id}')">Read the whole of ${spec.n} · ${readMins(spec)} min →</button>
    </section>
    <section class="door" data-reveal aria-labelledby="newH">
      <div class="door-h"><div class="lbl">New on the shelf</div><h2 id="newH">Just added</h2></div>
      <div class="newgrid">${newest.map((b,i)=>`<button class="newcard" data-reveal style="--d:${i*70}ms" onclick="openLife('${b.id}')">
          ${PLATES[b.id]?plateOrMark(b,"np"):`<span class="np nomark typeplate" aria-hidden="true"><i>${b.n.split(/\s+/).filter(w=>/^[A-Z]/.test(w)).map(w=>w[0]).slice(0,3).join("")}</i><small>no portrait cleared</small></span>`}
          <span class="nm">${b.n}</span><span class="ny">${b.years} · ${b.field}</span>
          <span class="nl">${b.lede}</span><span class="nt">${readMins(b)} min read</span></button>`).join("")}</div>
    </section>
    <section class="door" data-reveal aria-labelledby="wallH">
      <div class="door-h"><div class="lbl">Everyone on the shelf</div>
        <h2 id="wallH">${LIVES.length} people. Pick a face.</h2></div>
      <div class="wall">${LIVES.map(b=>`<button class="wface" onclick="openLife('${b.id}')" aria-label="${b.n}, ${b.years}" title="${b.n} · ${b.years}">
          ${plateOrMark(b,"fp-img")}<span class="fn">${b.n}</span></button>`).join("")}</div>
    </section>`;
  observeReveals(el);
}

/* ---------- press shelf ---------- */
let pressFilter="all";
function renderPressControls(){
  const fs=[["all","All titles"],["Technology","Technology"],["History","History & philosophy"],["Economics","Economics & finance"]];
  document.getElementById("pressControls").innerHTML=
    fs.map(f=>`<button class="chip" data-f="${f[0]}" aria-pressed="${f[0]===pressFilter}" onclick="filterPress('${f[0]}')">${f[1]}</button>`).join("")
    +`<span class="spacer"></span>`+spineChip()
    +`<span class="count" id="pressCount"></span>`;
  document.getElementById("pressSide").innerHTML=`${BOOKS.length} titles · ${ADJACENT.length} adjacent<br>each with sources and objections`;
}
function filterPress(f){pressFilter=f;renderPressControls();renderShelf(true)}
function renderShelf(anim){
  const shelf=document.getElementById("shelf"),prev=new Map();
  if(anim&&!reduce)shelf.querySelectorAll(".slot").forEach(s=>prev.set(s.dataset.id,s.getBoundingClientRect()));
  const list=BOOKS.filter(b=>pressFilter==="all"||b.field===pressFilter);
  shelf.innerHTML=list.map((b,i)=>`<button class="slot" data-id="${b.id}" data-reveal style="--i:${i};--d:${Math.min(i*45,520)}ms" onclick="openReader('press','${b.id}',{src:this})" aria-label="Open ${b.title.replace(/&amp;/g,"and")}">
      ${pressBook(b)}<div class="meta"><h3>${b.title}</h3><p>${b.field==="History"?"History &amp; philosophy":b.field==="Economics"?"Economics &amp; finance":b.field} · ${b.years}</p></div></button>`).join("");
  const slots=[...shelf.querySelectorAll(".slot")];
  slots.forEach(s=>{if(prev.has(s.dataset.id)){s.classList.add("in");s.style.setProperty("--d","0ms")}});
  if(prev.size)slots.forEach(s=>{const o=prev.get(s.dataset.id);if(!o)return;const n=s.getBoundingClientRect();
    const dx=o.left-n.left,dy=o.top-n.top;if(Math.abs(dx)<1&&Math.abs(dy)<1)return;
    s.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"none"}],{duration:560,easing:EASE})});
  document.getElementById("pressCount").textContent=list.length+(list.length===1?" title":" titles");
  observeReveals(shelf);bindTilt(shelf);markRead();
}
function renderWide(){
  const w=document.getElementById("wide");
  w.innerHTML=ADJACENT.map((a,i)=>`<button class="card" data-reveal style="--d:${i*90}ms;background:${a.cover};color:${a.ink}" onclick="openReader('press','${a.id}')">
      ${motifSVG(a.motif,a.accent)}<div class="lbl">${a.years}</div><h4>${a.title}</h4><p>${a.sub}</p></button>`).join("");
  observeReveals(w);
}

/* ---------- lives shelf ---------- */
let livesFilter="all";
function renderLivesControls(){
  const fs=[["all","All lives"],["famous","The famous"],["obscure","The obscure but pivotal"]];
  document.getElementById("livesControls").innerHTML=
    fs.map(f=>`<button class="chip ${f[0]==="obscure"?"warn":""}" aria-pressed="${f[0]===livesFilter}" onclick="filterLives('${f[0]}')">${f[1]}</button>`).join("")
    +`<span class="spacer"></span>`+spineChip()
    +`<span class="count" id="livesCount"></span>`;
  document.getElementById("livesSide").innerHTML=`${LIVES.length} lives · one book each<br>${LIVES.filter(b=>b.group==="famous").length} famous · ${LIVES.filter(b=>b.group==="obscure").length} you have never heard of`;
}
function filterLives(f){livesFilter=f;renderLivesControls();renderLivesShelf(true)}
function renderLivesShelf(anim){
  const shelf=document.getElementById("livesShelf"),prev=new Map();
  if(anim&&!reduce)shelf.querySelectorAll(".slot").forEach(s=>prev.set(s.dataset.id,s.getBoundingClientRect()));
  const list=LIVES.filter(b=>livesFilter==="all"||b.group===livesFilter);
  shelf.innerHTML=list.map((b,i)=>`<button class="slot" data-id="${b.id}" data-reveal style="--i:${i};--d:${Math.min(i*38,560)}ms" onclick="openReader('lives','${b.id}',{src:this})" aria-label="Open ${b.n}">
      ${lifeBook(b)}<div class="meta"><h3>${b.n}</h3><p>${b.years}</p></div></button>`).join("");
  const slots=[...shelf.querySelectorAll(".slot")];
  slots.forEach(s=>{if(prev.has(s.dataset.id)){s.classList.add("in");s.style.setProperty("--d","0ms")}});
  if(prev.size)slots.forEach(s=>{const o=prev.get(s.dataset.id);if(!o)return;const n=s.getBoundingClientRect();
    const dx=o.left-n.left,dy=o.top-n.top;if(Math.abs(dx)<1&&Math.abs(dy)<1)return;
    s.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"none"}],{duration:560,easing:EASE})});
  document.getElementById("livesCount").textContent=list.length+(list.length===1?" life":" lives");
  observeReveals(shelf);bindTilt(shelf);markRead();
}

/* ---------- reader ---------- */
function words(b){
  const p=[].concat(b.copy||[],b.lede||"",b.contested||"",b.changed||"",
    (b.timeline||[]).map(t=>t.t),(b.figures||[]).map(f=>f.d),(b.reading||[]).map(r=>r.why||""),
    b.bio?[b.bio.why]:[]);
  return p.join(" ").trim().split(/\s+/).length;
}
/* Read next: the first entry this one reads across to — a link that exists because the two
   argue (PUBLISHING.md) — and the next on the shelf only when there is none. Same choice as
   readNext() in build/pages.mjs. */
function readNextHTML(kind,b,next){
  let n=null;
  for(const a of b.across||[]){const [w,id]=a.to.split(":"),u=w==="press"?ALL:w==="lives"?LIVES:null,t=u&&u.find(x=>x.id===id);
    if(t){n={kind:w,b:t,why:a.txt};break}}
  if(!n)n={kind,b:next,why:""};
  const k=n.kind==="press"?"t":"l",name=n.kind==="press"?n.b.title:n.b.n,m=Math.max(2,Math.round(words(n.b)/210));
  return `<a class="rs-next" href="#${k}/${n.b.id}" onclick="openReader('${n.kind}','${n.b.id}');return false">
    <span class="rs-nk">${n.why?"Read next":"Next on the shelf"}</span><span class="rs-nt">${name}</span>
    ${n.why?`<span class="rs-nd">${n.why.replace(/^\s*[—–-]\s*/,"")}</span>`:""}
    <span class="rs-nm"><span>${n.kind==="press"?"The Press":"Lives"} · ${m} min</span><b>Read →</b></span></a>`;
}
/* Entries this browser has finished get a mark on the shelf (Reading.memory, theme/reading.js). */
function markRead(){
  document.querySelectorAll("#shelf .slot").forEach(s=>s.classList.toggle("read",Reading.memory.done("t/"+s.dataset.id)));
  document.querySelectorAll("#livesShelf .slot").forEach(s=>s.classList.toggle("read",Reading.memory.done("l/"+s.dataset.id)));
}
function acrossHTML(b){
  if(!b.across||!b.across.length)return "";
  return `<section class="sec" id="s-across" data-reveal><h4>Reads across to</h4>`+
    b.across.map(a=>`<div class="across"><a onclick="goTo('${a.to}')">${a.label}</a> ${a.txt}</div>`).join("")+`</section>`;
}
function readerHTML(kind,b){
  const uni = kind==="press"?ALL:LIVES;
  const idx = uni.findIndex(x=>x.id===b.id);
  const prev = uni[(idx-1+uni.length)%uni.length], next = uni[(idx+1)%uni.length];
  const mins = Math.max(2,Math.round(words(b)/210));
  const isPress = kind==="press";
  const title = isPress?b.title:b.n;
  const sub   = isPress?b.sub:(b.field+" · "+b.place);
  const S=[], toc=[];
  S.push(`<section class="sec" id="s-essay" data-reveal><div class="copy">${b.copy.map(p=>`<p>${p}</p>`).join("")}</div></section>`);
  toc.push(["s-essay","Essay"]);
  if(b.timeline){S.push(`<section class="sec" id="s-timeline" data-reveal><h4>How it happened</h4><ol class="tl">${b.timeline.map((t,i)=>`<li style="--d:${i*90}ms"><span class="y">${t.y}</span><span class="t">${t.t}</span></li>`).join("")}</ol></section>`);toc.push(["s-timeline","Timeline"])}
  if(b.figures){S.push(`<section class="sec" id="s-figures" data-reveal><h4>Who did the work</h4><div class="figs">${b.figures.map(f=>`<div><b>${f.n}</b><span>${f.d}</span></div>`).join("")}</div></section>`);toc.push(["s-figures","Figures"])}
  if(b.facts){S.push(`<section class="sec" id="s-numbers" data-reveal><h4>By the numbers</h4><div class="facts">${b.facts.map(f=>`<div><b class="tick" data-raw="${f.b}">${f.b}</b><span>${f.s}</span></div>`).join("")}</div></section>`);toc.push(["s-numbers","Numbers"])}
  if(b.bio){S.push(`<section class="sec" id="s-bio" data-reveal><h4>${b.bio.u?"Where to start":"The definitive biography"}</h4><div class="biobox"><div class="t">${b.bio.t}</div><div class="a">${b.bio.a.toUpperCase()} · ${b.bio.y}</div><div class="w">${b.bio.why}</div>${b.bio.u?`<a class="bookfind" href="${b.bio.u}" target="_blank" rel="noopener">Read it ↗</a>`:`<a class="bookfind" href="https://search.worldcat.org/search?q=${encodeURIComponent(b.bio.t.replace(/<[^>]*>/g,"")+" "+b.bio.a)}" target="_blank" rel="noopener">Find the book — WorldCat ↗</a>`}</div></section>`);toc.push(["s-bio","The book"])}
  if(b.corrected&&b.corrected.length){S.push(`<section class="sec" id="s-corrected" data-reveal><h4>Corrected</h4><div class="corrbox">${b.corrected.map(n=>{const c=CORRECTIONS[n-1];return c?`<div><b>№ ${n} · ${c.d} · ${c.t}</b><span>${c.b}</span></div>`:""}).join("")}</div></section>`);toc.push(["s-corrected","Corrected"])}
  if(b.contested){S.push(`<section class="sec" id="s-contested" data-reveal><h4>Where it is contested</h4><div class="quoteblock">${b.contested}</div></section>`);toc.push(["s-contested","Contested"])}
  if(b.changed){S.push(`<section class="sec" id="s-changed" data-reveal><h4>What I changed my mind about</h4><div class="quoteblock">${b.changed}</div></section>`);toc.push(["s-changed","Second thoughts"])}
  if(b.keep){S.push(`<section class="sec" id="s-keep" data-reveal><h4>If you keep one line</h4><div class="keepbox">${b.keep}</div><button class="rs-lineshare" type="button" onclick="shareLine('${isPress?"t":"l"}','${b.id}',this)">Share this line ↗</button></section>`);toc.push(["s-keep","Take this"])}
  if(b.across){S.push(acrossHTML(b));toc.push(["s-across","Across"])}
  if(b.reading){S.push(`<section class="sec" id="s-reading" data-reveal><h4>Go to the source</h4><ul class="reading">${b.reading.map(r=>`<li><a href="${r.u}" target="_blank" rel="noopener"><div class="row"><span class="t">${r.t}</span><span class="a">${r.a} ↗</span></div>${r.why?`<div class="why">${r.why}</div>`:""}</a></li>`).join("")}</ul></section>`);toc.push(["s-reading","Sources"])}

  const plate = isPress ? "" : (PLATES[b.id]
    ? `<figure class="plate" data-reveal style="--d:150ms"><img src="${PLATES[b.id]}" alt="Portrait of ${b.n}"><figcaption>Plate · ${b.n}</figcaption></figure>`
    : `<figure class="plate mark" data-reveal style="--d:150ms"><svg width="84" height="84" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="none" stroke="currentColor" stroke-width=".8" opacity=".6"/><path d="M11 1V21M1 11H21" stroke="currentColor" stroke-width=".8" opacity=".6"/><path d="M4 4 18 18M18 4 4 18" stroke="currentColor" stroke-width=".5" opacity=".35"/></svg><figcaption>No plate — see colophon</figcaption></figure>`);
  return `<div class="wrap">
    <div class="rbar">
      <button class="back" onclick="closeReader()"><span class="arw">←</span> ${isPress?"All titles":"All lives"}</button>
      <div class="rtools"><span class="rs-left" id="rleft" data-mins="${mins}">${mins} min read</span><button class="rs-go" type="button" onclick="shareEntry('${isPress?"t":"l"}','${b.id}',this)">${SHARE_ICON}Share</button></div>
      <div class="nav"><button onclick="step(-1)" aria-label="Previous">‹</button><button onclick="step(1)" aria-label="Next">›</button></div>
    </div>
    <div class="rgrid">
      <div><div class="rail">
        <div class="rbook">${isPress?pressBook(b):lifeBook(b)}</div>
        <div class="rmeta">
          <div><b>${isPress?"Field":"Field"}</b><span>${isPress?b.field:b.field}</span></div>
          <div><b>${isPress?"Period":"Lived"}</b><span>${b.years}</span></div>
          <div><b>Shelf</b><span>№ ${String(idx+1).padStart(2,"0")} of ${uni.length}</span></div>
          <div><b>Reading</b><span>${mins} min</span></div>
        </div>
        <nav class="toc">${toc.map(t=>`<a href="#" data-sec="${t[0]}" onclick="gotoSec('${t[0]}');return false;">${t[1]}</a>`).join("")}</nav>
      </div></div>
      <div class="rbody">
        ${b.claim?`<p class="claim" data-reveal>${b.claim}</p>`:`<p class="claim" data-reveal>${b.group==="obscure"?"The obscure but pivotal":"The famous"} · ${b.place}</p>`}
        <h1 data-reveal style="--d:60ms">${title}</h1>
        <p class="sub" data-reveal style="--d:120ms">${sub}</p>
        ${plate}
        <p class="lede" data-reveal style="--d:180ms">${b.lede}</p>
        ${S.join("")}
        <section class="rs-end" id="rend" aria-label="Share this entry">
          <div class="rs-fin">End of entry</div>
          <h3>${title}</h3>
          <p>${END_LINE}</p>
          <div class="rs-row"><button class="rs-b rs-main" type="button" onclick="shareEntry('${isPress?"t":"l"}','${b.id}',this)">Share this entry</button><button class="rs-b" type="button" onclick="copyEntry('${isPress?"t":"l"}','${b.id}',this)">Copy link</button><a class="rs-b" href="${isPress?"t":"l"}/${b.id}/">Open as its own page ↗</a></div>
          ${readNextHTML(kind,b,next)}
        </section>
        <div class="endnav" data-reveal>
          <button onclick="openReader('${kind}','${prev.id}')"><small>← Previous</small><em>${isPress?prev.title:prev.n}</em></button>
          <button onclick="openReader('${kind}','${next.id}')"><small>Next →</small><em>${isPress?next.title:next.n}</em></button>
        </div>
      </div>
    </div></div>`;
}
function countUp(el){
  const raw=el.dataset.raw,m=raw.match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if(!m||reduce){el.textContent=raw;return}
  const pre=m[1],ns=m[2],post=m[3],hasC=ns.includes(","),dec=(ns.split(".")[1]||"").length;
  const target=parseFloat(ns.replace(/,/g,""));
  if(!pre&&!post&&!hasC&&!dec&&target>=1000&&target<=2100){el.textContent=raw;return}
  const t0=performance.now(),dur=950;
  (function tick(t){const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);
    let v=target*e,s=dec?v.toFixed(dec):Math.round(v).toString();
    if(hasC)s=Number(s).toLocaleString("en-US");
    el.textContent=pre+s+post; if(p<1)requestAnimationFrame(tick)})(performance.now());
}
let readerIO,tlIO,tickIO,readProg;
function wireReader(){
  const reader=document.getElementById("reader"),links=[...document.querySelectorAll(".toc a")];
  if(readerIO)readerIO.disconnect();
  readerIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle("on",a.dataset.sec===e.target.id))}),
    {root:reader,rootMargin:"-12% 0px -72% 0px",threshold:0});
  document.querySelectorAll("#sheet .sec").forEach(s=>readerIO.observe(s));
  const io2=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io2.unobserve(e.target)}}),
    {root:reader,rootMargin:"0px 0px -10% 0px",threshold:.06});
  document.querySelectorAll("#sheet [data-reveal]").forEach(el=>io2.observe(el));
  if(tlIO)tlIO.disconnect();
  tlIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");tlIO.unobserve(e.target)}}),
    {root:reader,rootMargin:"0px 0px -12% 0px",threshold:.1});
  document.querySelectorAll("#sheet .tl").forEach(el=>tlIO.observe(el));
  if(tickIO)tickIO.disconnect();
  tickIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){countUp(e.target);tickIO.unobserve(e.target)}}),{root:reader,threshold:.5});
  document.querySelectorAll("#sheet .tick").forEach(el=>{if(!reduce)el.textContent="";tickIO.observe(el)});
  if(links[0])links[0].classList.add("on");
  bindTilt(document.getElementById("sheet"));
  reader.onscroll=onReaderScroll; railScroll();
  if(readProg)readProg.destroy();
  const left=document.getElementById("rleft");
  const k=currentKind==="press"?"t":"l",meta=entryMeta(k,current);
  readProg=Reading.progress({scroller:reader,start:document.querySelector("#sheet .rbody h1"),end:document.getElementById("rend"),
    mins:+left.dataset.mins,label:left,bar:document.getElementById("rprog"),key:k+"/"+current,theme:meta&&meta.theme});
}
function onReaderScroll(){
  const r=document.getElementById("reader");
  const bar=r.querySelector(".rbar"); if(bar)bar.classList.toggle("float",r.scrollTop>24);
  railScroll();
}
let railRaf=0;
function railScroll(){
  if(reduce||railRaf)return;
  railRaf=requestAnimationFrame(()=>{railRaf=0;
    const bk=document.querySelector("#reader .rbook .book");
    if(!bk||bk.classList.contains("track"))return;
    const p=Math.min(1,document.getElementById("reader").scrollTop/900);
    bk.style.setProperty("--ry",(21-p*13).toFixed(2)+"deg");
    bk.style.setProperty("--rx",(4-p*3).toFixed(2)+"deg")});
}
function gotoSec(id){const el=document.getElementById(id);if(el)document.getElementById("reader").scrollTo({top:el.offsetTop-70,behavior:reduce?"auto":"smooth"})}
function flyIn(slot,kind){
  const target=document.querySelector("#sheet .rbook"),sBook=slot&&slot.querySelector(".book");
  if(!target||!sBook)return;
  const tBook=target.querySelector(".book"),sr=slot.getBoundingClientRect(),tr=target.getBoundingClientRect();
  const fw=slot.clientWidth,fh=sBook.offsetHeight,tw=tr.width;
  if(!fw||!tw)return;
  const cs=getComputedStyle(sBook);
  const ry0=(cs.getPropertyValue("--ry")||"26deg").trim()||"26deg", rx0=(cs.getPropertyValue("--rx")||"3deg").trim()||"3deg";
  const wrap=document.createElement("div");wrap.className="ghostwrap";
  wrap.style.cssText=`left:${sr.left}px;top:${sr.top}px;width:${fw}px;height:${fh}px`;
  const clone=sBook.cloneNode(true);clone.style.transform="none";wrap.appendChild(clone);
  document.getElementById("flip").appendChild(wrap);target.style.opacity="0";
  const s=tw/fw,opt={duration:660,easing:EASE_IO,fill:"forwards"};
  const a=wrap.animate([{transform:"translate(0,0) scale(1)"},{transform:`translate(${tr.left-sr.left}px,${tr.top-sr.top}px) scale(${s})`}],opt);
  clone.animate([{transform:`rotateY(${ry0}) rotateX(${rx0})`},{transform:"rotateY(21deg) rotateX(4deg)"}],opt);
  const done=()=>{target.style.opacity="";wrap.remove()};
  a.finished.then(done).catch(done);
}
function flyOut(kind,id,after){
  const slot=document.querySelector((kind==="press"?"#shelf":"#livesShelf")+` .slot[data-id="${id}"]`);
  const source=document.querySelector("#sheet .rbook");
  if(reduce||!slot||!source){after();return}
  const sBook=source.querySelector(".book"),tBook=slot.querySelector(".book");
  const sr=source.getBoundingClientRect(),tr=slot.getBoundingClientRect();
  if(tr.bottom<-200||tr.top>innerHeight+200){after();return}
  const fw=sr.width,fh=sBook.offsetHeight,tw=slot.clientWidth;
  if(!fw||!tw){after();return}
  const ry0=(getComputedStyle(sBook).getPropertyValue("--ry")||"21deg").trim()||"21deg";
  const wrap=document.createElement("div");wrap.className="ghostwrap";
  wrap.style.cssText=`left:${sr.left}px;top:${sr.top}px;width:${fw}px;height:${fh}px`;
  const clone=sBook.cloneNode(true);clone.style.transform="none";wrap.appendChild(clone);
  document.getElementById("flip").appendChild(wrap);tBook.style.opacity="0";after();
  const s=tw/fw,opt={duration:560,easing:EASE_IO,fill:"forwards"};
  const a=wrap.animate([{transform:"translate(0,0) scale(1)"},{transform:`translate(${tr.left-sr.left}px,${tr.top-sr.top}px) scale(${s})`}],opt);
  clone.animate([{transform:`rotateY(${ry0}) rotateX(4deg)`},{transform:"rotateY(26deg) rotateX(3deg)"}],opt);
  const done=()=>{tBook.style.opacity="";wrap.remove()};
  a.finished.then(done).catch(done);
}
function openReader(kind,id,opts){
  opts=opts||{};
  const uni=kind==="press"?ALL:LIVES, b=uni.find(x=>x.id===id);
  if(!b)return;
  const wasOpen=!!current;
  if(!wasOpen)readerFocus=document.activeElement;
  current=id;currentKind=kind;
  const r=document.getElementById("reader");
  document.getElementById("sheet").innerHTML=readerHTML(kind,b);
  r.style.background=b.cover;r.style.color=b.ink;
  r.classList.add("on");r.setAttribute("aria-hidden","false");r.scrollTop=0;
  document.getElementById("rprog").style.transform="scaleX(0)";
  r.style.setProperty("--rs-bg",b.cover);r.style.setProperty("--rs-ink",b.ink);
  if(!wasOpen){const sbw=innerWidth-document.documentElement.clientWidth;
    if(sbw>0)document.body.style.paddingRight=sbw+"px";document.body.style.overflow="hidden"}
  wireReader();
  const hash="#"+(kind==="press"?"t":"l")+"/"+id;
  if(opts.push!==false&&location.hash!==hash)history.pushState({kind:kind,id:id},"",hash);
  document.title=(kind==="press"?b.title.replace(/&amp;/g,"&"):b.n)+" — The Commodore Press";
  if(!wasOpen&&!reduce){
    const src=opts.src||document.querySelector((kind==="press"?"#shelf":"#livesShelf")+` .slot[data-id="${id}"]`);
    if(src&&src.classList.contains("slot"))requestAnimationFrame(()=>flyIn(src,kind));
  }
}
/* Shares the entry's own page, never the #hash: a hash previews as the front door, the page
   previews as the entry, with its own card. The sheet itself is theme/reading.js, shared
   with the entry pages so the two behave the same. */
const SHARE_ICON=`<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1v7M3 4l3-3 3 3M2 7v4h8V7" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>`;
const END_LINE="The link opens its own page: the whole entry, with its sources, its disputes and any corrections.";
function entryMeta(k,id){
  const b=(k==="t"?ALL:LIVES).find(x=>x.id===id);if(!b)return null;
  return {url:"{{SITE}}/"+k+"/"+id+"/",title:k==="t"?b.title:b.n,sub:k==="t"?b.sub:b.field+" · "+b.years,
    text:k==="t"?(b.claim||b.lede):b.lede,keep:b.keep,theme:{bg:b.cover,ink:b.ink,accent:b.accent}};
}
function shareEntry(k,id,btn){const m=entryMeta(k,id);if(m)Reading.share(Object.assign({kind:"entry",from:btn},m))}
function shareLine(k,id,btn){const m=entryMeta(k,id);if(m)Reading.share(Object.assign({},m,{kind:"line",quote:m.keep,from:btn}))}
function copyEntry(k,id,btn){const m=entryMeta(k,id);if(m)Reading.copied(btn,m.url)}
Reading.quotes({root:document.getElementById("reader"),scroller:document.getElementById("reader"),
  within:".rbody .lede,.rbody .copy,.rbody .quoteblock,.rbody .keepbox",
  meta:()=>current?entryMeta(currentKind==="press"?"t":"l",current):null});
function closeReader(push){
  if(!current)return;
  const kind=currentKind,id=current;
  const finish=()=>{current=null;currentKind=null;
    const r=document.getElementById("reader");
    r.classList.remove("on");r.setAttribute("aria-hidden","true");
    document.body.style.overflow="";document.body.style.paddingRight="";
    document.title=(wing==="home"?"The Commodore Press":(WINGS.find(x=>x[0]===wing)[1]+" — The Commodore Press"));
    if(readProg){readProg.destroy();readProg=null}
    markRead();
    const el=readerFocus;readerFocus=null;giveBack(el)};
  if(push!==false)history.pushState({w:wing},"","#"+wing);
  flyOut(kind,id,finish);
}
function step(d){
  const uni=currentKind==="press"?ALL:LIVES;
  const i=uni.findIndex(x=>x.id===current); if(i<0)return;
  openReader(currentKind,uni[(i+d+uni.length)%uni.length].id);
}
function surprise(){
  const pool=[["press",ALL],["lives",LIVES]][Math.random()<.6?0:1];
  const pick=pool[1][Math.floor(Math.random()*pool[1].length)];
  go(pool[0]); setTimeout(()=>openReader(pool[0],pick.id),320);
}
function onShelf(){return wing==="press"||wing==="lives"}
function applySpines(on){
  document.body.classList.toggle("spines",on);
  if(on)document.querySelectorAll(".shelf .book").forEach(b=>["--ry","--rx","--ty","--sc"].forEach(p=>b.style.removeProperty(p)));
  document.querySelectorAll(".chip.spineview").forEach(c=>c.setAttribute("aria-pressed",String(on)));
}
function toggleSpines(){
  if(!onShelf())return;
  applySpines(!document.body.classList.contains("spines"));
}
function spineChip(){
  return `<button class="chip spineview" aria-pressed="${document.body.classList.contains("spines")}" onclick="toggleSpines()" title="Spines ( S )">Spines</button>`;
}
function shelfStep(d){
  const slots=[...document.querySelectorAll((wing==="press"?"#shelf":"#livesShelf")+" .slot")];
  if(!slots.length)return;
  const i=slots.indexOf(document.activeElement);
  slots[i<0?(d>0?0:slots.length-1):(i+d+slots.length)%slots.length].focus();
}

/* ---------- atlas ---------- */
const canvas=document.getElementById("sky"),ctx=canvas.getContext("2d");
let W=0,H=0,DPR=Math.min(2,devicePixelRatio||1),view={x:0,y:0,k:1},hover=null,skyRunning=false;
const TAU=Math.PI*2;
function skyLayout(){
  const byDom={};DOMAINS.forEach(d=>byDom[d.id]=[]);
  PEOPLE.forEach(p=>byDom[p.domain].push(p));
  DOMAINS.forEach(d=>{const list=byDom[d.id],n=list.length,base=d.angle*Math.PI/180;
    list.forEach((p,i)=>{const spread=(n>1?(i/(n-1)-.5):0)*.85,ang=base+spread;
      const ring=150+((i*67)%4)*64+((i*29)%37);
      p.bx=Math.cos(ang)*ring;p.by=Math.sin(ang)*ring;p.px=p.bx;p.py=p.by;
      p.seed=(i*97+d.angle)%TAU;p.tw=Math.random()*TAU;p.r=5.2+Math.min(3.4,p.degree*.5)})});
}
function skyResize(){const r=canvas.getBoundingClientRect();W=r.width;H=r.height;canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
function w2s(x,y){return{x:x*view.k+view.x+W/2,y:y*view.k+view.y+H/2}}
function s2w(x,y){return{x:(x-view.x-W/2)/view.k,y:(y-view.y-H/2)/view.k}}
let t0=performance.now();
function skyDraw(now){
  if(!skyRunning)return;
  const t=now-t0;ctx.clearRect(0,0,W,H);
  ctx.strokeStyle="rgba(216,166,87,.05)";ctx.lineWidth=1;
  for(let ring=120;ring<=540;ring+=120){const c=w2s(0,0);ctx.beginPath();ctx.arc(c.x,c.y,ring*view.k,0,TAU);ctx.stroke()}
  for(let a=0;a<12;a++){const c=w2s(0,0),ax=Math.cos(a*Math.PI/6),ay=Math.sin(a*Math.PI/6);
    ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(c.x+ax*560*view.k,c.y+ay*560*view.k);ctx.stroke()}
  for(let i=0;i<PEOPLE.length;i++)for(let j=i+1;j<PEOPLE.length;j++){
    const A=PEOPLE[i],B=PEOPLE[j],shared=A.p.filter(x=>B.p.includes(x));
    if(!shared.length)continue;
    let show=false,strong=false;
    if(activeConst){if(shared.includes(activeConst))show=strong=true}
    else if(hover){if(A===hover||B===hover)show=strong=true}
    else if(selectedPerson){if(A===selectedPerson||B===selectedPerson)show=strong=true}
    else show=true;
    if(activeRegion&&!(A.domain===activeRegion||B.domain===activeRegion))show=false;
    if(!show)continue;
    const pa=w2s(A.px,A.py),pb=w2s(B.px,B.py);
    ctx.strokeStyle=strong?"rgba(243,207,138,.5)":"rgba(216,166,87,.06)";ctx.lineWidth=strong?1.4:1;
    ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke()}
  PEOPLE.forEach(p=>{
    p.px=p.bx+Math.sin(t*.0003+p.seed)*7;p.py=p.by+Math.cos(t*.00026+p.seed)*7;
    const s=w2s(p.px,p.py),twk=.72+.28*Math.sin(t*.002+p.tw),dim=(activeConst&&!p.p.includes(activeConst))||(activeRegion&&p.domain!==activeRegion),R=p.r*view.k;
    const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,R*4.5);
    g.addColorStop(0,`rgba(243,207,138,${(dim?.05:.30)*twk})`);g.addColorStop(1,"rgba(243,207,138,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,R*4.5,0,TAU);ctx.fill();
    ctx.strokeStyle=p.color;ctx.globalAlpha=dim?.16:.7;ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(s.x,s.y,R+3,0,TAU);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=dim?"rgba(236,227,208,.32)":"#F6E9C8";
    ctx.beginPath();ctx.arc(s.x,s.y,R*twk,0,TAU);ctx.fill();
    if(p===hover||p===selectedPerson||view.k>1.45){
      ctx.font=`${p===hover?600:500} 12px "EB Garamond",Georgia,serif`;
      ctx.fillStyle=p===hover?"#F3CF8A":"rgba(236,227,208,.85)";ctx.textAlign="center";
      ctx.fillText(p.name,s.x,s.y-R-9)}
  });
  ctx.fillStyle="rgba(216,166,87,.3)";ctx.font='600 11px "IBM Plex Mono",monospace';ctx.textAlign="center";
  ctx.fillText("N",W/2,18);ctx.fillText("S",W/2,H-8);
  requestAnimationFrame(skyDraw);
}
function skyBoot(){if(skyRunning)return;skyRunning=true;t0=performance.now();requestAnimationFrame(skyDraw)}
function skyZoom(f){view.k=Math.max(.45,Math.min(4,view.k*f))}
function skyReset(){view={x:0,y:0,k:1};activeConst=null;activeRegion=null;renderLegend()}
let drag=false,moved=false,lx=0,ly=0;
canvas.addEventListener("mousedown",e=>{drag=true;moved=false;lx=e.clientX;ly=e.clientY});
addEventListener("mouseup",()=>drag=false);
addEventListener("mousemove",e=>{
  if(wing!=="atlas")return;
  const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;
  if(drag){view.x+=e.clientX-lx;view.y+=e.clientY-ly;if(Math.abs(e.clientX-lx)>1||Math.abs(e.clientY-ly)>1)moved=true;lx=e.clientX;ly=e.clientY;return}
  if(sx<0||sy<0||sx>W||sy>H){hover=null;return}
  let best=null,bd=22;
  PEOPLE.forEach(p=>{const s=w2s(p.px,p.py),d=Math.hypot(s.x-sx,s.y-sy);if(d<bd+p.r*view.k){bd=d;best=p}});
  hover=best;canvas.style.cursor=best?"pointer":"grab";
});
canvas.addEventListener("click",()=>{if(!moved&&hover)openDrawer(hover)});
canvas.addEventListener("wheel",e=>{e.preventDefault();
  const r=canvas.getBoundingClientRect(),before=s2w(e.clientX-r.left,e.clientY-r.top);
  view.k=Math.max(.45,Math.min(4,view.k*(e.deltaY<0?1.12:.89)));
  const after=w2s(before.x,before.y);
  view.x+=(e.clientX-r.left)-after.x;view.y+=(e.clientY-r.top)-after.y},{passive:false});
function constGlyph(pr,w,h){
  const xs=pr.members.map(m=>m.bx),ys=pr.members.map(m=>m.by);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const sx=v=>6+(x1===x0?w/2-6:(v-x0)/(x1-x0)*(w-12)), sy=v=>5+(y1===y0?h/2-5:(v-y0)/(y1-y0)*(h-10));
  const pts=pr.members.map(m=>[sx(m.bx),sy(m.by),m.color]);
  const path=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${path}" fill="none" stroke="var(--nbrass)" stroke-width=".8" opacity=".45"/>${pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.1" fill="#F6E9C8"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.6" fill="none" stroke="${p[2]}" stroke-width=".7" opacity=".8"/>`).join("")}</svg>`;
}
function lightRegion(id){
  activeRegion=(activeRegion===id?null:id);
  activeConst=null;renderLegend();
}
function renderLegend(){
  document.getElementById("legend").innerHTML=
    `<div class="lbl q" style="color:var(--parchment-dim);margin-bottom:2px">Regions of the sky — click to light one</div>`+
    DOMAINS.map(d=>`<button class="lg${activeRegion===d.id?" on":""}" onclick="lightRegion('${d.id}')" aria-pressed="${activeRegion===d.id}"><span class="dot" style="background:${DCOLOR[d.id]}"></span>${d.label}<span class="c">${PEOPLE.filter(p=>p.domain===d.id).length}</span></button>`).join("");
}
function renderAtlas(){
  renderLegend();
  document.getElementById("atlasSide").innerHTML=`${PEOPLE.length} people · ${ACTIVE_PR.length} constellations<br>charted from ${SOURCES.length} shows and counting`;
  document.getElementById("constList").innerHTML=
    `<div class="sec-head" style="padding-top:40px"><h3 style="color:var(--parchment)">The constellations</h3><span style="color:var(--parchment-dim)">Click one to light it in the sky; click a star to open its drawer.</span></div>`+
    ACTIVE_PR.slice().sort((a,b)=>b.members.length-a.members.length).map((pr,i)=>
    `<div class="const${activeConst===pr.id?" on":""}" data-c="${pr.id}"><div class="const-head" onclick="lightConst('${pr.id}')">
      <span class="glyph">${constGlyph(pr,64,38)}</span>
      <span class="g">✦ ${String(i+1).padStart(2,"0")}</span><h4>${pr.name}</h4>
      <span class="gl">— ${pr.gloss}</span><span class="n">${pr.members.length} people</span></div>
      <div class="const-stars">${pr.members.map(m=>`<button class="star-pill" onclick="openDrawerById('${m.id}')"><span class="s" style="background:${m.color}"></span>${m.name}</button>`).join("")}</div></div>`).join("")
    +`<div class="sec-head" style="padding-top:46px"><h3 style="color:var(--parchment)">The listening</h3><span style="color:var(--parchment-dim)">Where these sources were heard — plus roughly a thousand hours more.</span></div>
      <div class="const-stars" style="margin-top:14px;padding-bottom:10px">${SOURCES.map(s=>`<a class="star-pill" href="${s.u}" target="_blank" rel="noopener"><span class="s" style="background:var(--nbrass)"></span>${s.t} ↗</a>`).join("")}</div>`;
}
function lightConst(id){activeConst=(activeConst===id?null:id);activeRegion=null;renderLegend();document.querySelectorAll(".const").forEach(c=>c.classList.toggle("on",c.dataset.c===activeConst));scrollTo({top:0,behavior:reduce?"auto":"smooth"})}
function openDrawerById(id){openDrawer(PEOPLE.find(p=>p.id===id))}
/* Kept lines come in two kinds and must not look alike. A line with a source (`{k, s}`)
   is a quotation: the words are theirs and the reader can go and check them. A bare string
   is a note taken while listening, and the episode was never recorded, so it prints as
   "after" the person, which the colophon defines as compressed notes, not their words.
   Printing the second kind as the first was the Atlas breaking the site's own promise. */
function keptHTML(p){
  const src=k=>/^https?:/.test(k.s)?`<a href="${k.s}" target="_blank" rel="noopener">${k.s.replace(/^https?:\/\/(www\.)?/,"").slice(0,44)} ↗</a>`:k.s;
  const quoted=(p.kept||[]).filter(k=>typeof k!=="string"), notes=(p.kept||[]).filter(k=>typeof k==="string");
  const lbl=t=>`<div class="lbl q" style="color:var(--parchment-dim);margin-bottom:8px">${t}</div>`;
  return (quoted.length?`<div>${lbl("Lines I kept")}<ul class="keptlist">${quoted.map(k=>`<li>${k.k}<span class="ks">${src(k)}</span></li>`).join("")}</ul></div>`:"")+
    (notes.length?`<div>${lbl("Notes I kept · after "+p.name)}<ul class="keptlist notes">${notes.map(k=>`<li>${k}</li>`).join("")}</ul><p class="notecap">Noted while listening. No episode was recorded for these, so they are offered as notes, not quotations.</p></div>`:"");
}
function openDrawer(p){
  if(!p)return;
  selectedPerson=p;
  const reg=document.getElementById("dRegion");
  reg.textContent=DOM_BY_ID[p.domain].label;reg.style.color=p.color;
  document.getElementById("drawer").style.setProperty("--dcol",p.color);
  document.getElementById("dName").textContent=p.name;
  document.getElementById("dRole").textContent=p.role+" · linked to "+p.degree+" fellow sources";
  const others=id=>P_BY_ID[id].members.filter(m=>m!==p);
  document.getElementById("dBody").innerHTML=
    `<div><div class="lbl q" style="color:var(--parchment-dim);margin-bottom:8px">What stuck</div><p class="pull">${p.take}</p></div>
     ${keptHTML(p)}
     <div><div class="lbl q" style="color:var(--parchment-dim);margin-bottom:8px">Constellations they sit on</div>
       <div style="display:flex;flex-direction:column;gap:7px">${p.p.map(id=>`<button class="clink" onclick="lightConst('${id}');closeDrawer()"><span class="g">✦</span><span><b>${P_BY_ID[id].name}</b><span>${others(id).length?"with "+others(id).slice(0,3).map(o=>o.name).join(", ")+(others(id).length>3?"…":""):"a private north star — only here, for now"}</span></span></button>`).join("")}</div></div>
     <div class="caveat">Charted as a source, not a verdict. These are people I listened to; the constellation — the line more than one of them arrived at independently — is the claim, not the star.</div>`;
  document.getElementById("scrim").classList.add("on");
  document.getElementById("drawer").classList.add("on");
  document.getElementById("drawer").setAttribute("aria-hidden","false");
}
function closeDrawer(){
  document.getElementById("scrim").classList.remove("on");
  document.getElementById("drawer").classList.remove("on");
  document.getElementById("drawer").setAttribute("aria-hidden","true");
  selectedPerson=null;
}


/* ---------- chrome ---------- */
let pageRaf=0;
addEventListener("scroll",()=>{if(pageRaf)return;pageRaf=requestAnimationFrame(()=>{pageRaf=0;
  document.getElementById("mast").classList.toggle("stuck",scrollY>10)})},{passive:true});
addEventListener("keydown",e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(/^(input|textarea|select)$/i.test(e.target.tagName))return;
  if(document.querySelector("dialog[open]"))return;
  if(e.key==="Escape"){const sm=document.getElementById("smodal");if(sm.classList.contains("on"))return closeSearch();if(current)return closeReader();return closeDrawer()}
  if(e.key==="/"&&!document.getElementById("smodal").classList.contains("on")){e.preventDefault();return openSearch()}
  if(current&&e.key==="ArrowRight"){e.preventDefault();return step(1)}
  if(current&&e.key==="ArrowLeft"){e.preventDefault();return step(-1)}
  if(!current&&onShelf()&&e.key==="ArrowRight"){e.preventDefault();return shelfStep(1)}
  if(!current&&onShelf()&&e.key==="ArrowLeft"){e.preventDefault();return shelfStep(-1)}
  const k=e.key.toLowerCase();
  if(k==="r"){e.preventDefault();surprise()}
  if(k==="s"&&!current){e.preventDefault();toggleSpines()}
});
addEventListener("resize",()=>{if(wing==="atlas")skyResize()});
function route(push){
  const h=location.hash.slice(1);
  if(h.startsWith("t/")){const id=h.slice(2);if(ALL.some(x=>x.id===id)){go("press",false);openReader("press",id,{push:false});return}}
  if(h.startsWith("l/")){const id=h.slice(2);if(LIVES.some(x=>x.id===id)){go("lives",false);openReader("lives",id,{push:false});return}}
  if(WINGS.some(w=>w[0]===h)){go(h,false);return}
  // corrections live on the colophon page; old and outside links use #corrections directly
  if(h==="corrections"){go("colophon",false);setTimeout(()=>document.getElementById("corrections").scrollIntoView(),60);return}
  go("home",false);
}
addEventListener("popstate",()=>{if(current)closeReader(false);route(false)});

/* ---------- search ---------- */
let SIX=null;
function buildIndex(){
  SIX=[];
  const push=(w,t,s,hay,act)=>SIX.push({w,t,s,hay:(t+" "+s+" "+hay).toLowerCase(),act});
  ALL.forEach(b=>push("The Press",b.title.replace(/&amp;/g,"&"),b.sub,[b.claim||"",b.lede||"",(b.copy||[]).join(" "),b.keep||""].join(" "),()=>{go("press");setTimeout(()=>openReader("press",b.id),320)}));
  LIVES.forEach(b=>push("Lives",b.n,b.field+" · "+b.years,[b.lede,(b.copy||[]).join(" "),b.bio?b.bio.t+" "+b.bio.a:"",b.keep||""].join(" "),()=>{go("lives");setTimeout(()=>openReader("lives",b.id),320)}));
  PEOPLE.forEach(p=>push("The Atlas",p.name,p.role,[p.take,(p.kept||[]).map(k=>typeof k==="string"?k:k.k).join(" ")].join(" "),()=>{go("atlas");setTimeout(()=>openDrawer(p),340)}));
  LOG.forEach(x=>push("The Log",x.title,x.date+" · "+x.dek,"",()=>{location.href="log/"+x.slug+"/"}));
  PRINCIPLES.forEach(pr=>push("The Atlas",pr.name,"constellation — "+pr.gloss,pr.members.map(m=>m.name).join(" "),()=>{go("atlas");setTimeout(()=>lightConst(pr.id),340)}));
}
let sHits=[];
function giveBack(el){if(el&&el.isConnected&&typeof el.focus==="function")el.focus({preventScroll:true})}
function openSearch(){
  if(!SIX)buildIndex();
  searchFocus=document.activeElement;
  const m=document.getElementById("smodal");
  m.classList.add("on");m.setAttribute("aria-hidden","false");
  const inp=document.getElementById("sinput");
  inp.value="";runSearch("");
  setTimeout(()=>inp.focus(),30);
}
function closeSearch(){
  const m=document.getElementById("smodal");
  m.classList.remove("on");m.setAttribute("aria-hidden","true");
  const el=searchFocus;searchFocus=null;giveBack(el);
}
function runSearch(q){
  q=q.trim().toLowerCase();
  const box=document.getElementById("sresults");
  if(!q){box.innerHTML=`<div class="snone">Type to search the whole library — every title, life, source, position and lesson.</div>`;sHits=[];return}
  const terms=q.split(/\s+/);
  sHits=SIX.filter(e=>terms.every(t=>e.hay.includes(t)));
  const exact=sHits.filter(e=>e.t.toLowerCase().includes(q));
  sHits=[...exact,...sHits.filter(e=>!exact.includes(e))].slice(0,24);
  box.innerHTML=sHits.length?sHits.map((e,i)=>`<button class="sres${i===0?" sel":""}" onclick="pickResult(${i})"><span class="w">${e.w}</span><b>${e.t}</b><span>${e.s}</span></button>`).join("")
    :`<div class="snone">Nothing in the library matches &ldquo;${q.replace(/[<>&]/g,"")}&rdquo;.</div>`;
}
function pickResult(i){const e=sHits[i];if(!e)return;closeSearch();e.act()}
document.getElementById("sinput").addEventListener("input",e=>runSearch(e.target.value));
document.getElementById("sinput").addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();pickResult(0)}
  if(e.key==="Escape"){e.preventDefault();closeSearch()}
});
document.getElementById("smodal").addEventListener("click",e=>{if(e.target.id==="smodal")closeSearch()});

/* ---------- boot ---------- */
initTheme();renderNav();renderFront();
renderPressControls();renderShelf(false);renderWide();
renderLivesControls();renderLivesShelf(false);
skyLayout();renderAtlas();
observeReveals(document);
requestAnimationFrame(()=>document.body.classList.add("ready"));
route(false);

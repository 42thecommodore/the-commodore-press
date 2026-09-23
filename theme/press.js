/* ===================== ENGINE ===================== */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
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

/* ---------- nav / router ---------- */
function renderNav(){
  document.getElementById("nav").innerHTML =
    WINGS.filter(w=>w[0]!=="home"&&w[0]!=="colophon").map(w=>`<button class="navbtn" data-w="${w[0]}" onclick="go('${w[0]}')">${w[1]}</button>`).join("")
    + (LOG.length?`<a class="navbtn solid" href="log/">The Log</a>`:"")
    + `<button class="navbtn" onclick="openSearch()" aria-label="Search the library" title="Search ( / )">Search</button>`
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
// The front door lives at the bare address — the one the share card, the canonical link and
// every pasted URL name. "#home" still routes there; the house just never writes it.
function wingHash(w){return w==="home"?"":"#"+w}
function wingURL(w){return w==="home"?location.pathname+location.search:"#"+w}
function go(w,push){
  if(current)closeReader(false);
  closeDrawer();
  wing=w;
  document.querySelectorAll(".wing").forEach(s=>s.classList.toggle("on",s.dataset.wing===w));
  document.querySelectorAll("#nav .navbtn[data-w]").forEach(b=>b.setAttribute("aria-current",String(b.dataset.w===w)));
  document.body.classList.toggle("night",w==="atlas");
  if(push!==false&&location.hash!==wingHash(w))history.pushState({w},"",wingURL(w));
  document.title = (w==="home"?"The Commodore Press":(WINGS.find(x=>x[0]===w)[1]+" — The Commodore Press"));
  scrollTo({top:0,behavior:reduce?"auto":"smooth"});
  if(w==="atlas")requestAnimationFrame(atlasShown); // theme/atlas.js: re-measure the crossing once the wing is visible
  
}
function goTo(ref){
  const [w,id]=ref.split(":");
  if(w==="press"){go("press");setTimeout(()=>openReader("press",id),320)}
  else if(w==="lives"){go("lives");setTimeout(()=>openReader("lives",id),320)}
  else go(w);
}

/* ---------- front door ----------
   One screen that shows the method instead of describing it, then one band per wing showing
   what is actually in it, then the record of what the house got wrong. Everything is read
   from content/, so none of it can go stale. */
function openLife(id){go('lives');setTimeout(()=>openReader('lives',id),340)}
const plateOrMark=(b,cls)=>PLATES[b.id]
  ? `<img class="${cls}" src="${PLATES[b.id]}" alt="" loading="lazy">`
  : `<span class="${cls} nomark" aria-hidden="true">{{MARK sw=0.9 pn}}</span>`;
/* The specimen: a title whose latest correction belongs to it alone, so the correction's own
   title says what was wrong on this entry. It carries a sourced figure, a printed dispute and
   the correction left in view, which is every promise the colophon makes, on one entry. It
   reads stored fields only, and prints the dispute whole, because a dispute is never cut. */
function pickSpecimen(){
  const owners={};
  for(const e of [...BOOKS,...ADJACENT,...LIVES])for(const n of (e.corrected||[]))owners[n]=(owners[n]||0)+1;
  let best=null,any=null;
  for(const b of BOOKS){
    const fact=(b.facts||[]).find(f=>/: /.test(f.s));   // the house form: "what it counts: where it was read"
    if(!(b.claim&&fact&&b.contested&&b.keep&&b.corrected&&b.corrected.length))continue;
    for(const n of b.corrected){
      if(!CORRECTIONS[n-1])continue;
      if(owners[n]===1&&(!best||n>best.n))best={b,n,fact};
      if(!any||n>any.n)any={b,n,fact};
    }
  }
  return best||any;
}
const toCorrections=`href="#corrections" onclick="go('colophon');setTimeout(()=>document.getElementById('corrections').scrollIntoView(),60);return false;"`;
function specimenHTML(){
  const s=pickSpecimen(); if(!s)return "";
  const {b,n,fact:f}=s, c=CORRECTIONS[n-1];
  const mark=(label,body)=>`<li><span class="mk"><span class="pen" aria-hidden="true"></span>${label}</span><div class="mb">${body}</div></li>`;
  return `<div class="sp-top"><span class="lbl q">Specimen · Wing I</span></div>
    <h2>${b.title}</h2><div class="sp-sub">${b.sub}</div>
    <ol class="marks">
      ${mark("The claim",`<p class="sp-claim">${b.claim}</p>`)}
      ${mark("The source",`<div class="sp-fact"><b>${f.b}</b><span>${f.s}</span></div>`)}
      ${mark("The dispute",`<p class="sp-q">${b.contested}</p>`)}
      ${mark("Corrected",`<a class="sp-c" ${toCorrections}><span>No. ${n} · ${c.d}</span> ${c.t}</a>`)}
    </ol>
    <div class="sp-foot"><p>${b.keep}</p><button class="sp-go" onclick="openReader('press','${b.id}')">Read the entry →</button></div>`;
}
/* Captain of the day: one of the crew the editor picked in content/captains.json, in turn,
   changing at the reader's midnight. The card prints the person's own entry and nothing
   else: their act, in the entry's words, not a lesson drawn from them. */
function captainOfTheDay(){
  const crew=CAPTAINS.map(id=>LIVES.find(b=>b.id===id)).filter(Boolean);
  if(!crew.length)return null;
  const d=new Date(), day=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);
  const cap=crew[day%crew.length];
  cap._next=crew[(day+1)%crew.length]; cap._crew=crew.length;
  return cap;
}
function captainHTML(b){
  return `<article class="captain" aria-labelledby="capN">
    <div class="sp-top"><span class="lbl q">Captain of the day</span><span class="sp-n">${b.years}</span></div>
    <div class="cap-row">
      <button class="cap-plate" onclick="openLife('${b.id}')" aria-label="Read the life of ${b.n}">${plateOrMark(b,"cap-img")}</button>
      <div><h2 id="capN">${b.n}</h2><div class="sp-sub">${b.field}</div></div>
    </div>
    <p class="cap-ld">${b.lede}</p>
    <div class="sp-foot"><p>${b.keep||""}</p><button class="sp-go" onclick="openLife('${b.id}')">Read the life →</button></div>
    ${b._crew>1?`<p class="watch">One of a crew of ${b._crew}, chosen by the editor. The watch changes at midnight; next, <button onclick="openLife('${b._next.id}')">${b._next.n}</button>.</p>`:""}
  </article>`;
}
const bandHead=(tag,id,h,dek,go,link)=>`<div class="band-h"><div><div class="lbl">${tag}</div><h2 id="${id}">${h}</h2>${dek?`<p>${dek}</p>`:""}</div>`+
  (link?`<button class="band-go" onclick="${go}">${link}</button>`:"")+`</div>`;
/* One constellation from the Atlas: one idea, turning up in the editor's notes on several
   people (content/atlas/echoes.json), a different one each day. Notes, not quotations. */
const fdSlug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function constellationHTML(){
  // the fuller ones first: an idea three or four people handed over reads as a connection, two as a coincidence
  const all=(typeof ECHOES==="undefined"?[]:ECHOES).filter(e=>e.notes&&e.notes.length>=2);
  const E=all.some(e=>e.notes.length>=3)?all.filter(e=>e.notes.length>=3):all; if(!E.length)return "";
  const d=new Date(), day=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);
  const e=E[day%E.length], sl=fdSlug(e.idea);
  const open=`href="#atlas/c/${sl}" onclick="go('atlas');setTimeout(()=>atlasRoute('c/${sl}'),120);return false;"`;
  return `<div class="fd-const">
      <div class="fc-idea"><div class="lbl">A constellation · in my notes on ${e.notes.length} people</div>
        <p>${e.idea}</p><a class="band-go" ${open}>Show it on the chart →</a></div>
      <ul class="fc-notes">${e.notes.slice(0,4).map(n=>{const p=PEOPLE.find(q=>q.name===n.who);
        return `<li><b>${n.who}</b>${p&&p.role?`<small>${p.role}</small>`:""}<span>~ ${n.note}</span></li>`}).join("")}</ul>
    </div>
    <p class="fc-foot">Notes, not quotations: lines I wrote down while listening.</p>`;
}
function renderFront(){
  document.getElementById("tally").innerHTML =
    `<span><b>${BOOKS.length}</b>titles</span><span><b>${LIVES.length}</b>lives</span>`+
    `<span><b>${PEOPLE.length}</b>people</span><span><b>${CORRECTIONS.length}</b>corrections</span>`;
  const cap=captainOfTheDay();
  document.getElementById("specimen").innerHTML=specimenHTML();

  const fresh=new Set(LIVES.slice(-4).map(b=>b.id));
  const last=CORRECTIONS.map((c,i)=>({c,n:i+1})).slice(-3).reverse();
  document.getElementById("bands").innerHTML=
   (LOG.length?`<section class="band logband" aria-labelledby="bLog"><div class="wrap">
      <div class="lbl">The Log · signed and dated</div>
      <a class="logpiece" href="log/${LOG[0].slug}/"><span class="dt">${LOG[0].date}</span><h2 id="bLog">${LOG[0].title}</h2><p>${LOG[0].dek}</p><span class="band-go">Read it →</span></a>
    </div></section>`:"")+
   `<section class="band" aria-labelledby="bPress"><div class="wrap">
      ${bandHead("Wing I · The Press","bPress","{{W_BOOKS_CAP}} ideas, on one shelf.",
        "Each with its timeline, its numbers and its objections.","go('press')","All titles →")}
      <div class="rack">${BOOKS.map(b=>`<button class="rk" style="background:${b.cover};color:${b.ink};--ac:${b.accent}" onclick="openReader('press','${b.id}')"><i></i><span>${b.spineTitle||b.title}</span>{{MARK size=14 sw=1.4}}</button>`).join("")}</div>
    </div></section>
    <section class="band" aria-labelledby="bLives"><div class="wrap">
      ${bandHead("Wing II · Lives","bLives",`${LIVES.length} people. Pick a face.`,
        `The one book on each worth your time. {{W_FAMOUS_CAP}} famous, {{N_OBSCURE}} you have never heard of.`,"go('lives')","All lives →")}
      <div class="${cap?"crew":""}">${cap?captainHTML(cap):""}
      <div class="wall">${LIVES.map(b=>`<button class="wface" onclick="openLife('${b.id}')" aria-label="${b.n}, ${b.years}${fresh.has(b.id)?", new on the shelf":""}" title="${b.n} · ${b.years}">
          ${plateOrMark(b,"fp-img")}<span class="fn">${b.n}${fresh.has(b.id)?`<em class="nw">new</em>`:""}</span></button>`).join("")}</div></div>
    </div></section>
    <section class="band night" aria-labelledby="bAtlas"><div class="wrap">
      ${bandHead("Wing III · The Atlas","bAtlas","{{W_PEOPLE_CAP}} people, and what they taught me.",
        "Each island on the chart is one lesson; the people on it are the ones who taught it to me.")}
      ${constellationHTML()}
    </div></section>
    <section class="band colo" aria-labelledby="bColo"><div class="wrap">
      <div class="colo-l"><figure class="seal">{{MARK size=56 sw=0.9 pn aria}}<figcaption>The press mark: a commodore's broad pennant, over water.</figcaption></figure>
        <div class="lbl">Colophon</div><h2 id="bColo">How this house works.</h2><div id="coloFront"></div>
        <a class="band-go" href="#colophon" onclick="go('colophon');return false;">The whole colophon →</a></div>
      <div class="colo-r"><div class="lbl">The log of corrections</div>
        <table class="log"><thead><tr><th scope="col">No.</th><th scope="col">Date</th><th scope="col">Entry</th></tr></thead>
        <tbody>${last.map(({c,n})=>`<tr><td class="no">${n}</td><td class="dt">${c.d}</td><td><a ${toCorrections}>${c.t}</a></td></tr>`).join("")}</tbody></table>
        <a class="band-go" ${toCorrections}>All ${CORRECTIONS.length} corrections →</a></div>
    </div></section>`;
  // The colophon's own paragraphs, copied from the colophon page at load, so the two can never disagree:
  // the method, and how the house is set and corrected.
  const colo=[...document.querySelectorAll('[data-wing="colophon"] .colophon .body > p')];
  document.getElementById("coloFront").innerHTML=[colo[0],colo[2]].filter(Boolean).map(p=>`<p>${p.innerHTML}</p>`).join("");

  document.getElementById("corrections").innerHTML=
    `<div class="lbl q" style="margin-bottom:10px">Corrections — kept visible</div>`+
    CORRECTIONS.map(c=>`<div style="margin-bottom:12px"><b>${c.t}</b> ${c.b} <span style="font-family:var(--mono);font-size:var(--fs-0);opacity:.6">${c.d}</span></div>`).join("");
  document.getElementById("stat").textContent=`${BOOKS.length} titles · ${LIVES.length} lives · ${PEOPLE.length} people · ${PRINCIPLES.length} principles`;
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
function filterPress(f){pressFilter=f;renderPressControls();renderShelf()}
function renderShelf(){
  const shelf=document.getElementById("shelf");
  const list=BOOKS.filter(b=>pressFilter==="all"||b.field===pressFilter);
  shelf.innerHTML=list.map((b,i)=>`<button class="slot" data-id="${b.id}" style="--i:${i}" onclick="openReader('press','${b.id}',{src:this})" aria-label="Open ${b.title.replace(/&amp;/g,"and")}">
      ${pressBook(b)}<div class="meta"><h3>${b.title}</h3><p>${b.field==="History"?"History &amp; philosophy":b.field==="Economics"?"Economics &amp; finance":b.field} · ${b.years}</p></div></button>`).join("");
  document.getElementById("pressCount").textContent=list.length+(list.length===1?" title":" titles");
  markRead();
}
function renderWide(){
  const w=document.getElementById("wide");
  w.innerHTML=ADJACENT.map((a,i)=>`<button class="card" style="background:${a.cover};color:${a.ink}" onclick="openReader('press','${a.id}')">
      ${motifSVG(a.motif,a.accent)}<div class="lbl">${a.years}</div><h4>${a.title}</h4><p>${a.sub}</p></button>`).join("");
  
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
function filterLives(f){livesFilter=f;renderLivesControls();renderLivesShelf()}
function renderLivesShelf(){
  const shelf=document.getElementById("livesShelf");
  const list=LIVES.filter(b=>livesFilter==="all"||b.group===livesFilter);
  shelf.innerHTML=list.map((b,i)=>`<button class="slot" data-id="${b.id}" style="--i:${i}" onclick="openReader('lives','${b.id}',{src:this})" aria-label="Open ${b.n}">
      ${lifeBook(b)}<div class="meta"><h3>${b.n}</h3><p>${b.years}</p></div></button>`).join("");
  document.getElementById("livesCount").textContent=list.length+(list.length===1?" life":" lives");
  markRead();
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
  return `<section class="sec" id="s-across"><h4>Reads across to</h4>`+
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
  S.push(`<section class="sec" id="s-essay"><div class="copy">${b.copy.map(p=>`<p>${p}</p>`).join("")}</div></section>`);
  toc.push(["s-essay","Essay"]);
  if(b.timeline){S.push(`<section class="sec" id="s-timeline"><h4>How it happened</h4><ol class="tl">${b.timeline.map((t,i)=>`<li><span class="y">${t.y}</span><span class="t">${t.t}</span></li>`).join("")}</ol></section>`);toc.push(["s-timeline","Timeline"])}
  if(b.figures){S.push(`<section class="sec" id="s-figures"><h4>Who did the work</h4><div class="figs">${b.figures.map(f=>`<div><b>${f.n}</b><span>${f.d}</span></div>`).join("")}</div></section>`);toc.push(["s-figures","Figures"])}
  if(b.facts){S.push(`<section class="sec" id="s-numbers"><h4>By the numbers</h4><div class="facts">${b.facts.map(f=>`<div><b>${f.b}</b><span>${f.s}</span></div>`).join("")}</div></section>`);toc.push(["s-numbers","Numbers"])}
  if(b.bio){S.push(`<section class="sec" id="s-bio"><h4>${b.bio.u?"Where to start":"The definitive biography"}</h4><div class="biobox"><div class="t">${b.bio.t}</div><div class="a">${b.bio.a.toUpperCase()} · ${b.bio.y}</div><div class="w">${b.bio.why}</div>${b.bio.u?`<a class="bookfind" href="${b.bio.u}" target="_blank" rel="noopener">Read it ↗</a>`:`<a class="bookfind" href="https://search.worldcat.org/search?q=${encodeURIComponent(b.bio.t.replace(/<[^>]*>/g,"")+" "+b.bio.a)}" target="_blank" rel="noopener">Find the book — WorldCat ↗</a>`}</div></section>`);toc.push(["s-bio","The book"])}
  if(b.corrected&&b.corrected.length){S.push(`<section class="sec" id="s-corrected"><h4>Corrected</h4><div class="corrbox">${b.corrected.map(n=>{const c=CORRECTIONS[n-1];return c?`<div><b>№ ${n} · ${c.d} · ${c.t}</b><span>${c.b}</span></div>`:""}).join("")}</div></section>`);toc.push(["s-corrected","Corrected"])}
  if(b.contested){S.push(`<section class="sec" id="s-contested"><h4>Where it is contested</h4><div class="quoteblock">${b.contested}</div></section>`);toc.push(["s-contested","Contested"])}
  if(b.changed){S.push(`<section class="sec" id="s-changed"><h4>What I changed my mind about</h4><div class="quoteblock">${b.changed}</div></section>`);toc.push(["s-changed","Second thoughts"])}
  if(b.keep){S.push(`<section class="sec" id="s-keep"><h4>If you keep one line</h4><div class="keepbox">${b.keep}</div><button class="rs-lineshare" type="button" onclick="shareLine('${isPress?"t":"l"}','${b.id}',this)">Share this line ↗</button></section>`);toc.push(["s-keep","Take this"])}
  if(b.across){S.push(acrossHTML(b));toc.push(["s-across","Across"])}
  if(b.reading){S.push(`<section class="sec" id="s-reading"><h4>Go to the source</h4><ul class="reading">${b.reading.map(r=>`<li><a href="${r.u}" target="_blank" rel="noopener"><div class="row"><span class="t">${r.t}</span><span class="a">${r.a} ↗</span></div>${r.why?`<div class="why">${r.why}</div>`:""}</a></li>`).join("")}</ul></section>`);toc.push(["s-reading","Sources"])}

  const plate = isPress ? "" : (PLATES[b.id]
    ? (b.plateOf
      ? `<figure class="plate"><img src="${PLATES[b.id]}" alt="${b.plateOf.replace(/"/g,"&quot;")}"><figcaption class="obj">${b.plateOf}</figcaption></figure>`
      : `<figure class="plate"><img src="${PLATES[b.id]}" alt="Portrait of ${b.n}"><figcaption>Plate · ${b.n}</figcaption></figure>`)
    : `<figure class="plate mark">{{MARK size=84 sw=0.8 pn aria opacity=0.7}}<figcaption>No plate — see colophon</figcaption></figure>`);
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
        ${b.claim?`<p class="claim">${b.claim}</p>`:`<p class="claim">${b.group==="obscure"?"The obscure but pivotal":"The famous"} · ${b.place}</p>`}
        <h1>${title}</h1>
        <p class="sub">${sub}</p>
        ${plate}
        <p class="lede">${b.lede}</p>
        ${S.join("")}
        <section class="rs-end" id="rend" aria-label="Share this entry">
          <div class="rs-fin">End of entry</div>
          <h3>${title}</h3>
          <p>${END_LINE}</p>
          <div class="rs-row"><button class="rs-b rs-main" type="button" onclick="shareEntry('${isPress?"t":"l"}','${b.id}',this)">Share this entry</button><button class="rs-b" type="button" onclick="copyEntry('${isPress?"t":"l"}','${b.id}',this)">Copy link</button><a class="rs-b" href="${isPress?"t":"l"}/${b.id}/">Open as its own page ↗</a></div>
          ${readNextHTML(kind,b,next)}
        </section>
        <div class="endnav">
          <button onclick="openReader('${kind}','${prev.id}')"><small>← Previous</small><em>${isPress?prev.title:prev.n}</em></button>
          <button onclick="openReader('${kind}','${next.id}')"><small>Next →</small><em>${isPress?next.title:next.n}</em></button>
        </div>
      </div>
    </div></div>`;
}
let readerIO,readProg;
function wireReader(){
  const reader=document.getElementById("reader"),links=[...document.querySelectorAll(".toc a")];
  if(readerIO)readerIO.disconnect();
  readerIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle("on",a.dataset.sec===e.target.id))}),
    {root:reader,rootMargin:"-12% 0px -72% 0px",threshold:0});
  document.querySelectorAll("#sheet .sec").forEach(s=>readerIO.observe(s));
  if(links[0])links[0].classList.add("on");
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
  const finish=()=>{current=null;currentKind=null;
    const r=document.getElementById("reader");
    r.classList.remove("on");r.setAttribute("aria-hidden","true");
    document.body.style.overflow="";document.body.style.paddingRight="";
    document.title=(wing==="home"?"The Commodore Press":(WINGS.find(x=>x[0]===wing)[1]+" — The Commodore Press"));
    if(readProg){readProg.destroy();readProg=null}
    markRead();
    const el=readerFocus;readerFocus=null;giveBack(el)};
  if(push!==false)history.pushState({w:wing},"",wingURL(wing));
  finish();
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
  // off the shelves (the front door, the colophon) S means "show me the spines": take the reader there
  if(!onShelf()){if(wing==="atlas")return;go("press");applySpines(true);return}
  applySpines(!document.body.classList.contains("spines"));
}
function spineChip(){
  return `<button class="chip spineview" aria-pressed="${document.body.classList.contains("spines")}" onclick="toggleSpines()" title="Spines ( S )">Spines</button>`;
}
function shelfStep(d){
  // from the front door the arrows open the Press shelf and land on its first (or last) book
  if(!onShelf()){if(wing==="atlas")return;go("press");setTimeout(()=>shelfStep(d),340);return}
  const slots=[...document.querySelectorAll((wing==="press"?"#shelf":"#livesShelf")+" .slot")];
  if(!slots.length)return;
  const i=slots.indexOf(document.activeElement);
  slots[i<0?(d>0?0:slots.length-1):(i+d+slots.length)%slots.length].focus();
}

/* ---------- atlas ----------
   The chart, the crossing and the drawer live in theme/atlas.js, loaded before this file. */

/* ---------- chrome ---------- */
let pageRaf=0;
addEventListener("scroll",()=>{if(pageRaf)return;pageRaf=requestAnimationFrame(()=>{pageRaf=0;
  document.getElementById("mast").classList.toggle("stuck",scrollY>10)})},{passive:true});
addEventListener("keydown",e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(/^(input|textarea|select)$/i.test(e.target.tagName))return;
  if(document.querySelector("dialog[open]"))return;
  if(e.key==="Escape"){const sm=document.getElementById("smodal");if(sm.classList.contains("on"))return closeSearch();if(current)return closeReader();if(document.getElementById("drawer").classList.contains("on"))return closeDrawer();}
  if(e.key==="/"&&!document.getElementById("smodal").classList.contains("on")){e.preventDefault();return openSearch()}
  if(current&&e.key==="ArrowRight"){e.preventDefault();return step(1)}
  if(current&&e.key==="ArrowLeft"){e.preventDefault();return step(-1)}
  // On a shelf the arrows browse it. Anywhere else (the front door) they open the Press shelf,
  // but only when nothing has focus: a reader tabbing through the page, or scrolling the
  // phone's sideways nav, keeps the arrows the browser gives them.
  const arrowsFree=onShelf()||document.activeElement===document.body||!document.activeElement;
  if(!current&&wing!=="atlas"&&arrowsFree&&e.key==="ArrowRight"){e.preventDefault();return shelfStep(1)}
  if(!current&&wing!=="atlas"&&arrowsFree&&e.key==="ArrowLeft"){e.preventDefault();return shelfStep(-1)}
  const k=e.key.toLowerCase();
  if(k==="r"){e.preventDefault();surprise()}
  if(k==="s"&&!current){e.preventDefault();toggleSpines()}
});
addEventListener("resize",()=>{if(wing==="atlas")atlasResize()});
function route(push){
  const h=location.hash.slice(1);
  if(h.startsWith("t/")){const id=h.slice(2);if(ALL.some(x=>x.id===id)){go("press",false);openReader("press",id,{push:false});return}}
  if(h.startsWith("l/")){const id=h.slice(2);if(LIVES.some(x=>x.id===id)){go("lives",false);openReader("lives",id,{push:false});return}}
  if(WINGS.some(w=>w[0]===h)){go(h,false);return}
  // a constellation or an island, linkable: #atlas/c/<idea> or #atlas/<lesson> (theme/atlas.js)
  if(h.startsWith("atlas/")){go("atlas",false);setTimeout(()=>atlasRoute(h.slice(6)),120);return}
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
  PEOPLE.forEach(p=>push("The Atlas",p.name,p.role||"",[p.take,(p.kept||[]).map(k=>typeof k==="string"?k:k.k).join(" ")].join(" "),()=>{go("atlas");setTimeout(()=>openDrawer(p),340)}));
  LOG.forEach(x=>push("The Log",x.title,x.date+" · "+x.dek,"",()=>{location.href="log/"+x.slug+"/"}));
  PRINCIPLES.forEach(pr=>push("The Atlas",pr.name,"lesson — "+pr.gloss,pr.members.map(m=>m.name).join(" "),()=>{go("atlas");setTimeout(()=>lightConst(pr.id),340)}));
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
renderPressControls();renderShelf();renderWide();
renderLivesControls();renderLivesShelf();
renderAtlas();

route(false);

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


/* ---------- cover art ---------- */
/* The pattern pressed into a cover: drawn once, in build/motif.mjs, shared with the entry pages. */
{{MOTIF_FN}}
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
    // a word, and the mode it names: it was a ◐ labelled "night reading", which is the reader's
    // mode (body.night), not this one. Pressed means the lamps are lit.
    + `<button class="navbtn" id="themeBtn" onclick="toggleTheme()" aria-pressed="${document.body.classList.contains("dusk")}" title="Dim the house for reading after dark">Dusk</button>`;
}
function applyTheme(dark){
  document.body.classList.toggle("dusk",dark);
  const b=document.getElementById("themeBtn"); if(b)b.setAttribute("aria-pressed",String(dark));
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
/* Every entry opens from a real link to its own page — t/<id>/ or l/<id>/, written by
   build/pages.mjs — so a reader can open it in a new tab or copy it, and a crawler can follow
   it from the front door. A plain click stays in the library and opens the reader; a modified
   click is the browser's. `how` is press or lives (open the reader where you are) or life (go
   to the Lives wing first). Until 2026-09-29 every book and face was a <button>: 144 of them,
   and not one link a reader could keep. `npm run check` now fails on an entry opened that way. */
function entryAttrs(how,id){return `href="${how==="press"?"t":"l"}/${id}/" data-open="${how}:${id}"`}
/* Without a mouse there is no hover to open a cover, so on a spine the first tap opens it in
   place and the second opens the book. A tap anywhere else shuts it again. */
const tapToOpen=matchMedia("(hover:none),(max-width:760px)");
const shutCovers=keep=>document.querySelectorAll(".rk.open").forEach(x=>{if(x!==keep)x.classList.remove("open")});
document.addEventListener("click",e=>{
  const a=e.target.closest&&e.target.closest("a[data-open]");
  if(!a||!a.classList.contains("rk"))shutCovers();
  if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  e.preventDefault();
  if(a.classList.contains("rk")&&tapToOpen.matches&&!a.classList.contains("open")){
    shutCovers(a);a.classList.add("open");
    const cv=a.querySelector(".rk-cv");if(cv)cv.scrollIntoView({block:"nearest",inline:"nearest",behavior:reduce?"auto":"smooth"});
    return;
  }
  const i=a.dataset.open.indexOf(":"),how=a.dataset.open.slice(0,i),id=a.dataset.open.slice(i+1);
  if(how==="life")openLife(id);else openReader(how,id,/\b(slot|rk)\b/.test(a.className)?{src:a}:undefined);
});
const plateOrMark=(b,cls)=>PLATES[b.id]
  ? `<img class="${cls}" src="${PLATES[b.id]}" alt="" loading="lazy">`
  : `<span class="${cls} nomark" aria-hidden="true">{{MARK sw=0.9 pn}}</span>`;
const toCorrections=`href="#corrections" onclick="go('colophon');setTimeout(()=>document.getElementById('corrections').scrollIntoView(),60);return false;"`;
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
    <a class="cap-plate" ${entryAttrs("life",b.id)} aria-label="Read the life of ${b.n}">${plateOrMark(b,"cap-img")}</a>
    <div class="cap-main"><h2 id="capN">${b.n}</h2><div class="sp-sub">${b.field}</div><p class="cap-ld">${b.lede}</p></div>
    <div class="cap-side">${b.keep?`<figure class="cap-keep"><p>${b.keep}</p><figcaption class="cap-by">— ${Reading.credit(b.n)}</figcaption></figure>`:""}<a class="sp-go" ${entryAttrs("life",b.id)}>Read the life →</a>
      ${b._crew>1?`<p class="watch">One of a crew of ${b._crew}, chosen by the editor. The watch changes at midnight; next, <a ${entryAttrs("life",b._next.id)}>${b._next.n}</a>.</p>`:""}</div>
  </article>`;
}
const bandHead=(tag,id,h,dek,go,link)=>`<div class="band-h"><div><h2 id="${id}">${h}</h2>${dek?`<p>${dek}</p>`:""}</div>`+
  (link?`<button class="band-go" onclick="${go}">${link}</button>`:"")+`</div>`;
/* One lesson from the Atlas, set beside the Life on the shelf who worked by it first — a
   different lesson each day. Until 2026-09-29 this band led with a maxim in large gold italic
   ("Follow your intuition") over four podcast notes: the one place on the front door where a
   reader met a line with no source, a scroll after being promised that every claim has one.
   The lesson is still the editor's note. What earns it the front door is the Life beside it,
   whose entry carries its sources and its dispute. Only a lesson a Life links to in its own
   `across` (atlas:<id>) can be picked, so nothing here guesses at a resemblance; and the Life's
   line is the house's, set in roman, never in italic beside a face where it would read as theirs. */
function lessonHTML(){
  const ports=[];
  for(const l of LIVES)for(const a of (l.across||[])){
    const pr=a.to.startsWith("atlas:")&&P_BY_ID[a.to.slice(6)]; if(!pr)continue;
    const t=a.txt.replace(/^—\s*/,"").replace(/^and\s+/i,"");   // written to follow a heading on the Life's page
    ports.push({l,pr,txt:t.charAt(0).toUpperCase()+t.slice(1)});
  }
  const L=PRINCIPLES.filter(pr=>ports.some(p=>p.pr===pr)); if(!L.length)return "";
  const d=new Date(), day=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);
  const pr=L[day%L.length], names=pr.members.map(m=>m.name), more=names.length-3;
  const open=`href="#atlas/${pr.id}" onclick="go('atlas');setTimeout(()=>atlasRoute('${pr.id}'),120);return false;"`;
  return `<div class="fd-lesson">
      <div class="fl-idea"><div class="lbl">A lesson · in my notes on ${names.length} ${names.length===1?"person":"people"}</div>
        <p>${pr.name}</p>
        ${names.length?`<span class="fl-who">From ${names.slice(0,3).join(", ")}${more>0?` and ${more} more`:""}.</span>`:""}
        <a class="band-go" ${open}>Show it on the chart →</a></div>
      <div class="fl-lives"><div class="lbl">From the Lives shelf</div>
        ${ports.filter(p=>p.pr===pr).map(p=>`<a class="fl-life" ${entryAttrs("life",p.l.id)}>${plateOrMark(p.l,"fl-img")}<span><b>${p.l.n}</b><small>${p.l.years}</small><span class="fl-txt">${p.txt}</span></span></a>`).join("")}</div>
    </div>
    <p class="fc-foot">The lesson is my note of what they said, not their words. The Lives are entries, with their sources and the places they are argued.</p>`;
}
function renderFront(){
  /* The first screen is the shelf. It opened on a headline, two buttons and a strip of counts
     (22 titles · 43 lives · 33 people · 17 corrections) — any publication's first screen — with
     the covers, the one thing nobody else has, 1,501px down. Of the counts only one proves
     anything, so it is the one kept, and it opens the record it counts. tools/test-reading.mjs
     holds the shelf on the first screen at 1440×900 and at 375×812. */
  document.getElementById("frontShelf").innerHTML=
    `<div class="shelf-h"><p><b>{{W_BOOKS_CAP}} titles, on one shelf.</b><span class="shelf-dek"> Each opens on its argument, its timeline, its numbers and its objections.</span></p>
      <button class="band-go" onclick="go('press')">All titles →</button></div>
    <div class="rack">${BOOKS.map((b,i)=>`<a class="rk${i>=BOOKS.length-5?" end":""}" style="--i:${i};--cv:${b.cover};--ink:${b.ink};--ac:${b.accent}" ${entryAttrs("press",b.id)} aria-label="${b.title.replace(/&amp;/g,"and")}">
        <span class="rk-sp"><i></i><span>${b.spineTitle||b.title}</span>{{MARK size=14 sw=1.4}}</span>
        <span class="rk-cv" aria-hidden="true"><b>${b.title}</b><i></i><em>${b.sub||""}</em><small>${[b.field,b.years].filter(Boolean).join(" · ")}</small>{{MARK size=18 sw=1.2}}</span></a>`).join("")}</div>`;
  const latest=CORRECTIONS[CORRECTIONS.length-1];
  document.getElementById("tally").innerHTML=latest?
    `<a ${toCorrections}><b>${CORRECTIONS.length}</b> corrections so far, each one printed, none quietly patched. The latest: ${latest.t}&nbsp;<span class="arw">→</span></a>`:"";
  const cap=captainOfTheDay();
  document.getElementById("bridge").innerHTML=cap?captainHTML(cap):"";

  const fresh=new Set(LIVES.slice(-4).map(b=>b.id));
  const last=CORRECTIONS.map((c,i)=>({c,n:i+1})).slice(-3).reverse();
  document.getElementById("bands").innerHTML=
   (LOG.length?`<section class="band logband" aria-labelledby="bLog"><div class="wrap">
      <div class="lbl">The Log · signed and dated</div>
      <a class="logpiece" href="log/${LOG[0].slug}/"><span class="dt">${LOG[0].date}</span><h2 id="bLog">${LOG[0].title}</h2><p>${LOG[0].dek}</p><span class="band-go">Read it →</span></a>
    </div></section>`:"")+
   `<section class="band" aria-labelledby="bLives"><div class="wrap">
      ${bandHead("Wing II · Lives","bLives",`${LIVES.length} people. Pick a face.`,
        `The one book on each worth your time. {{W_FAMOUS_CAP}} famous, {{N_OBSCURE}} you have never heard of.`,"go('lives')","All lives →")}
      <div class="wall">${LIVES.map(b=>`<a class="wface" ${entryAttrs("life",b.id)} aria-label="${b.n}, ${b.years}${fresh.has(b.id)?", new on the shelf":""}" title="${b.n} · ${b.years}">
          ${plateOrMark(b,"fp-img")}<span class="fn">${b.n}${fresh.has(b.id)?`<em class="nw">new</em>`:""}</span></a>`).join("")}</div>
    </div></section>
    <section class="band night" aria-labelledby="bAtlas"><div class="wrap">
      ${bandHead("Wing III · The Atlas","bAtlas","{{W_PEOPLE_CAP}} people, and what they taught me.",
        "Each island on the chart is one lesson; the people on it are the ones who taught it to me.")}
      ${lessonHTML()}
    </div></section>
    <section class="band colo" aria-labelledby="bColo"><div class="wrap">
      <div class="colo-l"><figure class="seal">{{MARK size=56 sw=0.9 pn aria}}<figcaption>The press mark: a commodore’s broad pennant, over water.</figcaption></figure>
        <h2 id="bColo">How this house works.</h2><div id="coloFront"></div>
        <a class="band-go" href="#colophon" onclick="go('colophon');return false;">The whole colophon →</a></div>
      <div class="colo-r"><h3 class="colo-h3">The log of corrections</h3>
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
    CORRECTIONS.map(c=>`<div style="margin-bottom:12px"><b>${c.t}</b> ${c.b} <span class="corr-d">${c.d}</span></div>`).join("");
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
}
function filterPress(f){pressFilter=f;renderPressControls();renderShelf(true)}
function renderShelf(anim){
  const shelf=document.getElementById("shelf"),prev=new Map();
  if(anim&&!reduce)shelf.querySelectorAll(".slot").forEach(s=>prev.set(s.dataset.id,s.getBoundingClientRect()));
  const list=BOOKS.filter(b=>pressFilter==="all"||b.field===pressFilter);
  shelf.innerHTML=list.map((b,i)=>`<a class="slot" data-id="${b.id}" style="--i:${i}" ${entryAttrs("press",b.id)} aria-label="Open ${b.title.replace(/&amp;/g,"and")}">
      ${pressBook(b)}<div class="meta"><h3>${b.title}</h3><p>${b.field==="History"?"History &amp; philosophy":b.field==="Economics"?"Economics &amp; finance":b.field} · ${b.years}</p></div></a>`).join("");
  if(prev.size)slideFrom(shelf,prev);
  document.getElementById("pressCount").textContent=list.length+(list.length===1?" title":" titles");
  markRead();
}
function renderWide(){
  const w=document.getElementById("wide");
  w.innerHTML=ADJACENT.map((a,i)=>`<a class="card" style="background:${a.cover};color:${a.ink}" ${entryAttrs("press",a.id)}>
      ${motifSVG(a.motif,a.accent,true)}<div class="lbl">${a.years}</div><h4>${a.title}</h4><p>${a.sub}</p></a>`).join("");
  
}

/* ---------- lives shelf ---------- */
let livesFilter="all";
function renderLivesControls(){
  const fs=[["all","All lives"],["famous","The famous"],["obscure","The obscure but pivotal"]];
  document.getElementById("livesControls").innerHTML=
    fs.map(f=>`<button class="chip ${f[0]==="obscure"?"warn":""}" aria-pressed="${f[0]===livesFilter}" onclick="filterLives('${f[0]}')">${f[1]}</button>`).join("")
    +`<span class="spacer"></span>`+spineChip()
    +`<span class="count" id="livesCount"></span>`;
}
function filterLives(f){livesFilter=f;renderLivesControls();renderLivesShelf(true)}
function renderLivesShelf(anim){
  const shelf=document.getElementById("livesShelf"),prev=new Map();
  if(anim&&!reduce)shelf.querySelectorAll(".slot").forEach(s=>prev.set(s.dataset.id,s.getBoundingClientRect()));
  const list=LIVES.filter(b=>livesFilter==="all"||b.group===livesFilter);
  shelf.innerHTML=list.map((b,i)=>`<a class="slot" data-id="${b.id}" style="--i:${i}" ${entryAttrs("lives",b.id)} aria-label="Open ${b.n}">
      ${lifeBook(b)}<div class="meta"><h3>${b.n}</h3><p>${b.years}</p></div></a>`).join("");
  if(prev.size)slideFrom(shelf,prev);
  document.getElementById("livesCount").textContent=list.length+(list.length===1?" life":" lives");
  markRead();
}

/* ---------- reader ---------- */
/* The shelves carry each entry's card; the body — essay, timeline, figures, numbers, dispute,
   second thoughts, book, reading list — lives in LIBRARY_FILE, written beside the page by
   build/build.mjs, and is merged in the first time a reader reaches for a book or for search.
   Reading time (b.mins) is counted at build over the whole entry, by the entry pages' own count. */
let libLoaded=false, libLoading=null;
window.__library=data=>{
  for(const b of ALL)Object.assign(b,data.press[b.id]||{});
  for(const b of LIVES)Object.assign(b,data.lives[b.id]||{});
  libLoaded=true;
};
function loadLibrary(){
  if(libLoaded)return Promise.resolve();
  return libLoading||(libLoading=new Promise((res,rej)=>{
    const s=document.createElement("script");s.src=LIBRARY_FILE;s.async=true;
    s.onload=()=>libLoaded?res():rej(new Error("library.js ran without the entries"));
    s.onerror=()=>{libLoading=null;s.remove();rej(new Error("library.js did not load"))};
    document.head.appendChild(s);
  }));
}
/* a pointer over a book, a face or a link into one is the moment to fetch, so the text is
   usually in hand before the click lands */
{const warm=e=>{if(!libLoaded&&e.target.closest&&e.target.closest(".slot,.rk,.wface,.cap-plate,.sp-go,.card,#nav,.rs-next,.watch"))loadLibrary().catch(()=>{})};
  addEventListener("pointerover",warm,{passive:true});addEventListener("focusin",warm);}
/* Read next: the first entry this one reads across to — a link that exists because the two
   argue (PUBLISHING.md) — and the next on the shelf only when there is none. Same choice as
   readNext() in build/pages.mjs. */
function readNextHTML(kind,b,next){
  let n=null;
  for(const a of b.across||[]){const [w,id]=a.to.split(":"),u=w==="press"?ALL:w==="lives"?LIVES:null,t=u&&u.find(x=>x.id===id);
    if(t){n={kind:w,b:t,why:a.txt};break}}
  if(!n)n={kind,b:next,why:""};
  const k=n.kind==="press"?"t":"l",name=n.kind==="press"?n.b.title:n.b.n,m=n.b.mins;
  return `<a class="rs-next" ${entryAttrs(n.kind,n.b.id)}>
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
  // the number counts the shelf the entry stands on: "№ 02 of 24" counted the two adjacent works
  // in with the titles, on a front door that says there are 22. tools/test-reading.mjs holds it.
  const shelf = kind!=="press" ? LIVES : BOOKS.includes(b) ? BOOKS : ADJACENT;
  const prev = uni[(idx-1+uni.length)%uni.length], next = uni[(idx+1)%uni.length];
  const mins = b.mins;
  const isPress = kind==="press";
  const title = isPress?b.title:b.n;
  const sub   = isPress?b.sub:(b.field+" · "+b.place);
  const S=[], toc=[];
  S.push(`<section class="sec" id="s-essay"><div class="copy">${b.copy.map(p=>`<p>${p}</p>`).join("")}</div></section>`);
  toc.push(["s-essay","Essay"]);
  if(b.timeline){S.push(`<section class="sec" id="s-timeline"><h4>How it happened</h4><ol class="tl">${b.timeline.map((t,i)=>`<li><span class="y">${t.y}</span><span class="t">${t.t}</span></li>`).join("")}</ol></section>`);toc.push(["s-timeline","Timeline"])}
  if(b.figures){S.push(`<section class="sec" id="s-figures"><h4>Who did the work</h4><div class="figs">${b.figures.map(f=>`<div><b>${f.n}</b><span>${f.d}</span></div>`).join("")}</div></section>`);toc.push(["s-figures","Figures"])}
  if(b.facts){S.push(`<section class="sec" id="s-numbers"><h4>By the numbers</h4><div class="facts">${b.facts.map(f=>`<div><b>${f.b}</b><span>${f.s}</span></div>`).join("")}</div></section>`);toc.push(["s-numbers","Numbers"])}
  if(b.bio){S.push(`<section class="sec" id="s-bio"><h4>${b.bio.u?"Where to start":"The definitive biography"}</h4><div class="biobox"><div class="t">${b.bio.t}</div><div class="a">${b.bio.a} · ${b.bio.y}</div><div class="w">${b.bio.why}</div>${b.bio.u?`<a class="bookfind" href="${b.bio.u}" target="_blank" rel="noopener">Read it ↗</a>`:`<a class="bookfind" href="https://search.worldcat.org/search?q=${encodeURIComponent(b.bio.t.replace(/<[^>]*>/g,"")+" "+b.bio.a)}" target="_blank" rel="noopener">Find the book — WorldCat ↗</a>`}</div></section>`);toc.push(["s-bio","The book"])}
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
          <div><b>${shelf===ADJACENT?"Adjacent":"Shelf"}</b><span>№ ${String(shelf.indexOf(b)+1).padStart(2,"0")} of ${shelf.length}</span></div>
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
          <a ${entryAttrs(kind,prev.id)}><small>← Previous</small><em>${isPress?prev.title:prev.n}</em></a>
          <a ${entryAttrs(kind,next.id)}><small>Next →</small><em>${isPress?next.title:next.n}</em></a>
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
  readProg=Reading.progress({scroller:reader,start:document.querySelector("#sheet .rbody h1"),resumeBefore:document.querySelector("#sheet .rbody .lede"),end:document.getElementById("rend"),
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
/* A filter reshuffles the shelf: books already on it slide to their new places, new ones rise in. */
function slideFrom(shelf,prev){
  shelf.querySelectorAll(".slot").forEach(s=>{const o=prev.get(s.dataset.id);if(!o)return;
    s.style.animation="none";const n=s.getBoundingClientRect(),dx=o.left-n.left,dy=o.top-n.top;
    if(Math.abs(dx)<1&&Math.abs(dy)<1)return;
    s.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"none"}],{duration:560,easing:EASE})});
}
/* The book follows the mouse: it turns toward the pointer and the gloss moves with it. */
function tiltBooks(){
  if(reduce||!matchMedia("(hover:hover)").matches)return;
  document.addEventListener("pointermove",e=>{
    const slot=e.target.closest&&e.target.closest(".shelf .slot");
    document.querySelectorAll(".shelf .book.track").forEach(bk=>{if(!slot||!slot.contains(bk)){bk.classList.remove("track");bk.style.removeProperty("--ry");bk.style.removeProperty("--rx")}});
    if(!slot||document.body.classList.contains("spines"))return;
    const bk=slot.querySelector(".book");if(!bk)return;
    const r=slot.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    bk.classList.add("track");
    bk.style.setProperty("--ry",(10+(x-.5)*-18).toFixed(1)+"deg");
    bk.style.setProperty("--rx",((y-.5)*-8).toFixed(1)+"deg");
    const g=bk.querySelector(".gloss");if(g){g.style.setProperty("--gx",(x*100).toFixed(0)+"%");g.style.setProperty("--gy",(y*100).toFixed(0)+"%")}
  },{passive:true});
}
tiltBooks();
/* Opening a title: the book lifts off the shelf and flies to its place in the reader; closing sends it back. */
function flyIn(slot,kind){
  const target=document.querySelector("#sheet .rbook"),sBook=slot&&slot.querySelector(".book");
  if(!target||!sBook)return;
  const sr=slot.getBoundingClientRect(),tr=target.getBoundingClientRect();
  const fw=slot.clientWidth,fh=sBook.offsetHeight,tw=tr.width;
  if(!fw||!tw)return;
  const cs=getComputedStyle(sBook);
  const ry0=(cs.getPropertyValue("--ry")||"26deg").trim()||"26deg", rx0=(cs.getPropertyValue("--rx")||"3deg").trim()||"3deg";
  const wrap=document.createElement("div");wrap.className="ghostwrap";
  wrap.style.cssText=`left:${sr.left}px;top:${sr.top}px;width:${fw}px;height:${fh}px`;
  const clone=sBook.cloneNode(true);clone.classList.remove("track");clone.style.transform="none";wrap.appendChild(clone);
  document.getElementById("flip").appendChild(wrap);target.style.opacity="0";
  const s=tw/fw,opt={duration:660,easing:EASE_IO,fill:"forwards"};
  const a=wrap.animate([{transform:"translate(0,0) scale(1)"},{transform:`translate(${tr.left-sr.left}px,${tr.top-sr.top}px) scale(${s})`}],opt);
  clone.animate([{transform:`rotateY(${ry0}) rotateX(${rx0})`},{transform:"rotateY(21deg) rotateX(4deg)"}],opt);
  const done=()=>{target.style.opacity="";wrap.remove()};
  a.finished.then(done).catch(done);
}
/* From the front door's shelf: the book leaves from where its cover is — opened beside the
   spine under a mouse or a first tap, or the spine itself — and lands on the reader's cover.
   The front door is where most books are opened, and until 2026-09-29 it was the one place a
   book appeared in the reader without moving at all. */
function flyFromRack(rk,b){
  const target=document.querySelector("#sheet .rbook");if(!target)return;
  const cv=rk.querySelector(".rk-cv"),open=cv&&getComputedStyle(cv).visibility==="visible";
  const from=(open?cv:rk.querySelector(".rk-sp")).getBoundingClientRect(),tr=target.getBoundingClientRect();
  if(!from.width||!tr.width)return;
  const w=open?from.width:from.height*5/7.3,h=w*7.3/5;          // a book's proportions, as .book draws them
  const left=open?from.left:from.left+from.width/2-w/2,top=from.top+from.height/2-h/2;
  const wrap=document.createElement("div");wrap.className="ghostwrap";
  wrap.style.cssText=`left:${left}px;top:${top}px;width:${w}px;height:${h}px`;
  wrap.innerHTML=pressBook(b);const clone=wrap.firstElementChild;clone.style.transform="none";
  document.getElementById("flip").appendChild(wrap);target.style.opacity="0";rk.classList.remove("open");
  const s=tr.width/w,opt={duration:660,easing:EASE_IO,fill:"forwards"};
  // from a spine the book turns its face to the reader; from an open cover it is already facing
  const a=wrap.animate([{transform:"translate(0,0) scale(1)"},{transform:`translate(${tr.left-left}px,${tr.top-top}px) scale(${s})`}],opt);
  clone.animate([{transform:open?"rotateY(0deg)":"rotateY(80deg)"},{transform:"rotateY(21deg) rotateX(4deg)"}],opt);
  const done=()=>{target.style.opacity="";wrap.remove()};
  a.finished.then(done).catch(done);
}
function flyOut(kind,id,after){
  const slot=document.querySelector((kind==="press"?"#shelf":"#livesShelf")+` .slot[data-id="${id}"]`);
  const source=document.querySelector("#sheet .rbook");
  if(reduce||!slot||!source||!slot.offsetParent){after();return}
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
  // the body is not here yet: fetch it, then open; if it cannot come, the entry's own page has it all
  if(!libLoaded){loadLibrary().then(()=>openReader(kind,id,opts),()=>{location.href=(kind==="press"?"t/":"l/")+id+"/"});return}
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
    if(src&&src.classList.contains("slot")&&src.offsetParent)requestAnimationFrame(()=>flyIn(src,kind));
    else if(src&&src.classList.contains("rk"))requestAnimationFrame(()=>flyFromRack(src,b));
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
  if(push!==false)history.pushState({w:wing},"",wingURL(wing));
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
/* Search matches letters, not typography: the build curls every quote (build/typeset.mjs) and
   readers type straight ones, so "Moore's law" found nothing while the page said Moore’s. Both
   sides are folded to straight quotes before they meet. */
const fold=s=>String(s).toLowerCase().replace(/[\u2018\u2019\u201B\u2032]/g,"'").replace(/[\u201C\u201D\u2033]/g,'"');
function buildIndex(){
  SIX=[];
  const push=(w,t,s,hay,act)=>SIX.push({w,t,s,hay:fold(t+" "+s+" "+hay),act});
  ALL.forEach(b=>push("The Press",b.title.replace(/&amp;/g,"&"),b.sub,[b.claim||"",b.lede||"",(b.copy||[]).join(" "),b.keep||""].join(" "),()=>{go("press");setTimeout(()=>openReader("press",b.id),320)}));
  LIVES.forEach(b=>push("Lives",b.n,b.field+" · "+b.years,[b.lede,(b.copy||[]).join(" "),b.bio?b.bio.t+" "+b.bio.a:"",b.keep||""].join(" "),()=>{go("lives");setTimeout(()=>openReader("lives",b.id),320)}));
  PEOPLE.forEach(p=>push("The Atlas",p.name,p.role||"",[p.take,(p.kept||[]).map(k=>typeof k==="string"?k:k.k).join(" ")].join(" "),()=>{go("atlas");setTimeout(()=>openDrawer(p),340)}));
  LOG.forEach(x=>push("The Log",x.title,x.date+" · "+x.dek,"",()=>{location.href="log/"+x.slug+"/"}));
  PRINCIPLES.forEach(pr=>push("The Atlas",pr.name,"lesson — "+pr.gloss,pr.members.map(m=>m.name).join(" "),()=>{go("atlas");setTimeout(()=>lightConst(pr.id),340)}));
}
let sHits=[];
function giveBack(el){if(el&&el.isConnected&&typeof el.focus==="function")el.focus({preventScroll:true})}
function openSearch(){
  // titles and names are searchable at once; the full text joins the index when it arrives
  if(!libLoaded)loadLibrary().then(()=>{SIX=null;buildIndex();runSearch(document.getElementById("sinput").value)}).catch(()=>{});
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
  q=fold(q.trim());
  const box=document.getElementById("sresults");
  if(!q){box.innerHTML=`<div class="snone">Type to search the whole library — every title, life, source, position and lesson.</div>`;sHits=[];return}
  const terms=q.split(/\s+/);
  sHits=SIX.filter(e=>terms.every(t=>e.hay.includes(t)));
  const exact=sHits.filter(e=>fold(e.t).includes(q));
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

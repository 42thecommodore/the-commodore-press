/* The way out — Esc with nothing left to close goes to relentless.com, by way of a voyage.
   Its own file so that every page can carry it: the library (build/build.mjs puts it ahead
   of the engine) and every page build/pages.mjs writes — entries, About, Contents, the Log.
   The library's own Escape closes search, a reader or a drawer first and then calls
   Forward.go(); every other page calls Forward.escape() once, which listens for itself. */
(function () {
  "use strict";
  var doc = document;
  /* forward(): Esc with nothing left to close is the way out, to relentless.com. A voyage:
     the night sea of the Atlas comes up over the page, the press mark sails across it, a
     line of signal pennants is run up one by one while the count goes 3 · 2 · 1, and the
     address rises letter by letter like buoys. Esc again casts off at once; "stay aboard"
     or a click on the sea calls it off. The footer's "Esc close" and any [data-forward]
     link run the same thing. */
  var FWD = "https://relentless.com/", fwd = null, fwdT = [];
  function forward() {
    if (fwd) { fwdT.forEach(clearTimeout); location.href = FWD; return; }
    var still = matchMedia("(prefers-reduced-motion:reduce)").matches, i, flags = "", word = "";
    for (i = 0; i < 12; i++) flags += '<i style="--i:' + i + '"></i>';
    "relentless.com".split("").forEach(function (ch, n) {
      word += '<span' + (n >= 10 ? ' class="tld"' : "") + ' style="--i:' + n + '">' + ch + "</span>";
    });
    fwd = doc.createElement("div");
    fwd.className = "rs-fwd"; fwd.setAttribute("role", "status");
    fwd.setAttribute("aria-label", "Forwarding you to relentless.com");
    fwd.innerHTML = '<div class="rs-fwd-in"><div class="rs-fwd-lbl">Esc · forwarding you to</div>'
      + '<div class="rs-fwd-to" aria-hidden="true">' + word + '</div>'
      + '<div class="rs-fwd-flags" aria-hidden="true">' + flags + '</div>'
      + '<div class="rs-fwd-sea" aria-hidden="true"><b class="rs-fwd-ship"></b></div>'
      + '<div class="rs-fwd-foot"><button type="button" class="rs-fwd-stay">stay aboard</button>'
      + '<span>casting off in <em class="rs-fwd-n">3</em> · Esc to go now</span></div></div>';
    doc.body.appendChild(fwd);
    fwd.addEventListener("click", function (e) { if (e.target === fwd || e.target.closest(".rs-fwd-stay")) stay(); });
    fwd.offsetWidth; fwd.classList.add("on");
    var n = fwd.querySelector(".rs-fwd-n"), beat = still ? 250 : 800;
    fwdT = [
      setTimeout(function () { n.textContent = "2"; }, beat),
      setTimeout(function () { n.textContent = "1"; }, beat * 2),
      setTimeout(function () { if (fwd) fwd.classList.add("away"); }, beat * 3),
      setTimeout(function () { location.href = FWD; }, beat * 3 + (still ? 0 : 450))
    ];
  }
  function stay() {
    if (!fwd) return;
    fwdT.forEach(clearTimeout);
    var el = fwd; fwd = null; el.classList.remove("on");
    setTimeout(function () { el.remove(); }, 400);
  }
  // Coming back with the browser's back button can restore this page mid-curtain; lift it.
  addEventListener("pageshow", function (e) { if (e.persisted) stay(); });
  doc.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-forward]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); forward();
  });
  /* The entry pages' Escape. The library (theme/press.js) has its own, which closes search,
     a reader or a drawer first and only then calls forward(). */
  function escape() {
    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      if (/^(input|textarea|select)$/i.test(e.target.tagName) || doc.querySelector("dialog[open]")) return;
      var s = getSelection(); if (s && !s.isCollapsed) { e.preventDefault(); s.removeAllRanges(); return; }   // Esc first drops a selected passage
      e.preventDefault(); forward();
    });
  }

  window.Forward = { go: forward, stay: stay, escape: escape };
})();

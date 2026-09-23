/* Reading tools — shared by the library reader (theme/press.js) and every entry page
   (build/pages.mjs). One file, so the two places a reader meets an entry behave the same.

   Four things:
   - share(): a share sheet printed in the entry's livery. Phones get their own share sheet.
   - progress(): the line and the "4 min left" that say how far through the entry you are,
     and the offer to pick up where you left off.
   - quotes(): select a passage and share it, attributed to the Press and linked to the
     entry's own page at that passage.
   - memory: which entries this browser has finished, and where it stopped in the others.
     Kept in localStorage under "cp-read", never sent anywhere. The colophon says so; if
     this ever stores anything else, that sentence changes in the same edit.

   A shared passage is the Press's own words, verbatim, and every quote is credited
   "The Commodore Press, on <entry>" — never set under the entry's name alone, where a line
   the Press wrote about Darwin would read as Darwin's. The colophon promises no invented
   quotations; a misattributed one is the same failure. One function, credit(), writes it.

   No third-party script and no tracking. The share links are plain URLs; nothing is sent
   anywhere until the reader chooses to. */
(function () {
  "use strict";
  var doc = document, enc = encodeURIComponent, PRESS = "The Commodore Press";
  doc.documentElement.classList.add("rs-js");
  var coarse = function () { return matchMedia("(pointer:coarse)").matches; };
  var clean = function (s) { return String(s || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); };
  var credit = function (title) { return PRESS + ", on " + clean(title); };
  var esc = function (s) { return clean(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };

  var KEY = "cp-read", mem = null;
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { mem = {}; }
    return mem;
  }
  function keep() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} }
  // another tab (an entry page, say) finished something: read it fresh next time
  addEventListener("storage", function (e) { if (e.key === KEY || e.key === null) mem = null; });
  var memory = {
    get: function (k) { return load()[k] || null; },
    done: function (k) { var r = load()[k]; return !!(r && r.d); },
    // position is kept to the nearest per cent; "done" latches, so rereading the top of a
    // finished entry does not un-finish it
    note: function (k, p) {
      var m = load(), r = m[k] || { p: 0, d: 0 }, q = Math.round(p * 100) / 100;
      if (Math.abs(r.p - q) < 0.02 && !(q >= 0.995 && !r.d)) return;
      r.p = q; if (q >= 0.995) r.d = 1; r.t = Date.now(); m[k] = r; keep();
    }
  };

  /* Copy with the clipboard API where the page is allowed it, the old way where not. */
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, no) {
      var host = doc.querySelector("dialog[open]") || doc.body, t = doc.createElement("textarea");
      t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      host.appendChild(t); t.select();
      try { doc.execCommand("copy") ? ok() : no(); } catch (e) { no(); }
      t.remove();
    });
  }
  function copied(btn, text) {
    var was = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", was);
    copy(text).then(function () {
      btn.textContent = "Copied ✓";
      setTimeout(function () { btn.textContent = was; }, 1600);
    }).catch(function () { prompt("Copy this:", text); });
  }

  /* A link that opens the entry's own page scrolled to the passage, in the browsers that
     support text fragments; the rest simply open the page. */
  function fragment(q) {
    var e = function (s) { return enc(s).replace(/-/g, "%2D"); }, w = q.replace(/[“”"]/g, "").split(" ");
    if (w.length <= 8) return "#:~:text=" + e(w.join(" "));
    return "#:~:text=" + e(w.slice(0, 4).join(" ")) + "," + e(w.slice(-4).join(" "));
  }
  // X counts a link as 23 characters; a long passage is shortened there, and only there,
  // with the ellipsis that marks the cut. Copy and email carry it whole.
  function clip(t, n) { t = clean(t); return t.length <= n ? t : t.slice(0, t.lastIndexOf(" ", n - 1)) + "…"; }
  function tweetable(q, title) {
    var tail = "” — " + credit(title), room = 250 - tail.length;
    if (q.length > room) q = q.slice(0, q.lastIndexOf(" ", room - 1)) + " …";
    return "“" + q + tail;
  }

  var sheet = null, back = null;
  function close() { if (sheet && sheet.open) sheet.close(); }
  // Escape closes the sheet everywhere, not only in browsers whose <dialog> does it for free
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sheet && sheet.open) { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);

  /* o: { url, title, sub, text, quote, kind: "entry"|"line"|"passage", theme: {bg, ink, accent}, from } */
  function share(o) {
    var title = clean(o.title), q = clean(o.quote), url = o.url + (q && o.kind === "passage" ? fragment(q) : "");
    var full = title + " — " + PRESS;
    var quoteText = q ? "“" + q + "”\n— " + credit(title) : "";
    var said = q ? quoteText : clean(o.text);
    if (navigator.share && coarse()) {
      navigator.share({ title: full, text: q ? quoteText : said, url: url }).catch(function () {});
      return;
    }
    if (sheet) sheet.remove();
    back = o.from || doc.activeElement;
    var t = o.theme || {}, d = doc.createElement("dialog");
    d.className = "rs-sheet";
    d.setAttribute("aria-label", q ? "Share this " + (o.kind === "line" ? "line" : "passage") : "Share this entry");
    if (t.bg) d.style.setProperty("--rs-bg", t.bg);
    if (t.ink) d.style.setProperty("--rs-ink", t.ink);
    if (t.accent) d.style.setProperty("--rs-accent", t.accent);
    var mail = "mailto:?subject=" + enc(full) + "&body=" + enc((q ? quoteText : said) + "\n\n" + url);
    var x = "https://twitter.com/intent/tweet?text=" + enc(q ? tweetable(q, title) : clip(said, 200)) + "&url=" + enc(url);
    var li = "https://www.linkedin.com/sharing/share-offsite/?url=" + enc(o.url);
    d.innerHTML = '<div class="rs-in">' +
      '<div class="rs-head"><span class="rs-lbl">' + (q ? (o.kind === "line" ? "Share this line" : "Share this passage") : "Share this entry") + '</span>' +
      '<button class="rs-x" type="button" aria-label="Close">✕</button></div>' +
      '<div class="rs-card">' + (q
        ? '<p class="rs-q">“' + esc(q) + '”</p><div class="rs-by">— ' + esc(credit(title)) + '</div></div>'
        : '<p class="rs-t">' + esc(title) + '</p>' + (o.sub ? '<p class="rs-s">' + esc(o.sub) + '</p>' : "") +
          '<div class="rs-by">' + PRESS + '</div></div>') +
      '<div class="rs-link"><input type="text" readonly aria-label="Link to this entry" value="' + esc(url) + '">' +
      '<button class="rs-b rs-main" type="button" data-a="link">Copy link</button></div>' +
      '<div class="rs-acts">' + (q ? '<button class="rs-b" type="button" data-a="quote">Copy quote</button>' : "") +
      '<a class="rs-b" href="' + esc(mail) + '">Email</a>' +
      '<a class="rs-b" href="' + esc(x) + '" target="_blank" rel="noopener">X</a>' +
      '<a class="rs-b" href="' + esc(li) + '" target="_blank" rel="noopener">LinkedIn</a>' +
      (navigator.share ? '<button class="rs-b" type="button" data-a="more">More…</button>' : "") + '</div>' +
      (o.kind === "passage" ? '<p class="rs-note">The link opens the entry’s own page at this passage, in browsers that support it.</p>' : "") +
      '</div>';
    d.addEventListener("click", function (e) {
      if (e.target === d) return close();                       // the backdrop
      var b = e.target.closest("button"); if (!b) return;
      if (b.classList.contains("rs-x")) return close();
      var a = b.getAttribute("data-a");
      if (a === "link") copied(b, url);
      if (a === "quote") copied(b, quoteText + "\n" + url);
      if (a === "more") navigator.share({ title: full, text: q ? quoteText : said, url: url }).catch(function () {});
    });
    d.querySelector("input").addEventListener("focus", function () { this.select(); });
    d.addEventListener("close", function () {
      d.remove(); if (sheet === d) sheet = null;
      if (back && back.focus && doc.contains(back)) back.focus({ preventScroll: true });
    });
    doc.body.appendChild(d); sheet = d;
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    d.querySelector("[data-a=link]").focus();
  }

  /* o: { scroller: element | window, start, end, mins, label, bar, key }
     Nothing counts until the entry's first line reaches mid-screen, and it is finished when
     the end-of-entry block comes into view. The minutes are the entry's own reading time. */
  function progress(o) {
    var win = o.scroller === window, raf = 0;
    function y(el) { return el.getBoundingClientRect().top + (win ? scrollY : o.scroller.scrollTop - o.scroller.getBoundingClientRect().top); }
    function span() {
      var vh = win ? innerHeight : o.scroller.clientHeight, a = Math.max(0, y(o.start) - vh * 0.5);
      return [a, Math.max(a + 1, y(o.end) - vh * 0.85)];
    }
    var saved = o.key ? memory.get(o.key) : null, offer = null;
    function update() {
      raf = 0;
      if (!o.start || !o.end || !doc.contains(o.end)) return;
      var st = win ? scrollY : o.scroller.scrollTop, ab = span(), a = ab[0], b = ab[1];
      var p = Math.min(1, Math.max(0, (st - a) / (b - a)));
      if (o.key && p > 0.01) memory.note(o.key, p);
      if (offer && Math.abs(st - offer.at) > 240) dismiss();
      if (o.bar) o.bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      if (o.label) {
        var left = Math.ceil(o.mins * (1 - p));
        o.label.textContent = p >= 0.995 ? "Finished ✓" : p <= 0.01 ? o.mins + " min read" : p >= 0.85 ? "Almost done" : Math.max(1, left) + " min left";
        o.label.classList.toggle("done", p >= 0.995);
      }
    }
    function on() { if (!raf) raf = requestAnimationFrame(update); }
    function dismiss() { if (offer) { offer.el.remove(); offer = null; } }
    // Came back to an entry left part-read: offer to go back, once, and get out of the way.
    if (saved && !saved.d && saved.p >= 0.08 && saved.p <= 0.95 && o.start && o.end) {
      var el = doc.createElement("div"), left = Math.max(1, Math.ceil(o.mins * (1 - saved.p)));
      el.className = "rs-resume"; el.setAttribute("role", "status");
      if (o.theme && o.theme.bg) el.style.setProperty("--rs-bg", o.theme.bg);
      if (o.theme && o.theme.ink) el.style.setProperty("--rs-ink", o.theme.ink);
      el.innerHTML = '<span>You stopped here before · ' + left + ' min left</span><button type="button" data-a="go">Continue ↓</button><button type="button" data-a="x" aria-label="Dismiss">✕</button>';
      el.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        if (b.getAttribute("data-a") === "go") {
          var ab = span(), top = ab[0] + saved.p * (ab[1] - ab[0]);
          o.scroller.scrollTo({ top: top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        }
        dismiss();
      });
      doc.body.appendChild(el);
      offer = { el: el, at: win ? scrollY : o.scroller.scrollTop };
      setTimeout(dismiss, 12000);
    }
    o.scroller.addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    update();
    return { update: on, destroy: function () { dismiss(); o.scroller.removeEventListener("scroll", on); removeEventListener("resize", on); } };
  }

  /* o: { root, within: selector of quotable prose, scroller, meta: () => share options }
     Selections are widened to whole words, so a quote never starts or ends mid-word. */
  function quotes(o) {
    var pill = null, timer = 0, down = false, sel = null;
    function hide() { if (pill) { pill.remove(); pill = null; } }
    function inside(n) { var el = n && (n.nodeType === 1 ? n : n.parentElement); return el && o.root.contains(el) && el.closest(o.within); }
    function widen(r) {
      r = r.cloneRange();
      var s = r.startContainer, e = r.endContainer, wd = /[\wÀ-ɏ’'-]/;
      if (s.nodeType === 3) { var i = r.startOffset; while (i > 0 && wd.test(s.data[i - 1])) i--; r.setStart(s, i); }
      if (e.nodeType === 3) { var j = r.endOffset; while (j < e.data.length && wd.test(e.data[j])) j++; r.setEnd(e, j); }
      return r;
    }
    function check() {
      var s = getSelection();
      if (!s.rangeCount || s.isCollapsed) return hide();
      var r = s.getRangeAt(0);
      if (!inside(r.startContainer) || !inside(r.endContainer)) return hide();
      var m = o.meta && o.meta(); if (!m) return hide();
      var q = clean(widen(r).toString()).replace(/^[\s,;:—–-]+|[\s,;:—–-]+$/g, "");
      if (q.length < 12 || q.length > 600) return hide();
      sel = q; hide();
      var rect = r.getBoundingClientRect(), x = Math.min(innerWidth - 110, Math.max(110, rect.left + rect.width / 2));
      var t = m.theme || {};
      pill = doc.createElement("div"); pill.className = "rs-pill"; pill.setAttribute("role", "toolbar"); pill.setAttribute("aria-label", "Selected passage");
      if (t.bg) pill.style.setProperty("--rs-bg", t.bg);
      if (t.ink) pill.style.setProperty("--rs-ink", t.ink);
      pill.innerHTML = '<button type="button" data-a="share">Share quote</button><button type="button" data-a="copy">Copy</button>';
      doc.body.appendChild(pill);
      // phones draw their own menu above a selection, so the pill goes beneath it there
      var above = rect.top - pill.offsetHeight - 10;
      pill.style.left = x + "px";
      pill.style.top = (coarse() || above < 70 ? Math.min(innerHeight - pill.offsetHeight - 10, rect.bottom + 12) : above) + "px";
      pill.addEventListener("mousedown", function (e) { e.preventDefault(); });   // keep the selection
      pill.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        var mm = o.meta(); if (!mm) return hide();
        if (b.getAttribute("data-a") === "copy") {
          copied(b, "“" + sel + "”\n— " + credit(mm.title) + "\n" + mm.url + fragment(sel));
        } else {
          hide();
          share({ url: mm.url, title: mm.title, sub: mm.sub, text: mm.text, theme: mm.theme, quote: sel, kind: "passage" });
        }
      });
    }
    function later() { clearTimeout(timer); if (!down) timer = setTimeout(check, coarse() ? 450 : 120); }
    doc.addEventListener("selectionchange", function () {
      var s = getSelection(); if (!s.rangeCount || s.isCollapsed) { hide(); return; }
      later();
    });
    doc.addEventListener("pointerdown", function (e) { if (!pill || !pill.contains(e.target)) down = true; });
    doc.addEventListener("pointerup", function () { if (down) { down = false; later(); } });
    // Esc with a passage selected drops the selection, and does only that: stopping it here
    // keeps the library's own Esc (theme/press.js, on window) from closing the reader under a
    // reader who only meant to let go of some text. The next Esc does what Esc normally does.
    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var s = getSelection();
      if (s && s.rangeCount && !s.isCollapsed && inside(s.getRangeAt(0).startContainer)) {
        e.stopPropagation(); s.removeAllRanges();
      }
      hide();
    });
    (o.scroller || window).addEventListener("scroll", hide, { passive: true });
    if (o.scroller && o.scroller !== window) addEventListener("scroll", hide, { passive: true });
  }

  /* An entry page wires everything from one call. `c` is written by build/pages.mjs. */
  function page(c) {
    var m = { url: c.url, title: c.title, sub: c.sub, text: c.text, theme: c.theme };
    doc.querySelectorAll("[data-rs]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-rs");
        if (a === "copy") return copied(b, c.url);
        share({ url: c.url, title: c.title, sub: c.sub, text: c.text, theme: c.theme, from: b,
          quote: a === "line" ? c.keep : "", kind: a === "line" ? "line" : "entry" });
      });
    });
    progress({ scroller: window, start: doc.querySelector("main"), end: doc.getElementById("rend"), mins: c.mins,
      label: doc.getElementById("rleft"), bar: doc.getElementById("rbar"), key: c.key, theme: c.theme });
    quotes({ root: doc.querySelector("main"), within: ".lede,.essay,.keepq p,.callout p,.note p", scroller: window, meta: function () { return m; } });
  }

  window.Reading = { share: share, copy: copy, copied: copied, progress: progress, quotes: quotes, page: page, close: close, memory: memory };
})();

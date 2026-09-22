/* The press mark — the one drawing of it. A commodore's broad pennant at the masthead, over
   water, in a seal: the old mark was a circle quartered by a cross, and the meridian became
   the mast and the horizon the sea.

   It used to be copied by hand into seven places (the masthead, the favicon twice, two spots
   in the reader, the end-of-entry ornament, the share cards), under a comment asking that
   they be changed together; the favicon had already drifted. Now every one of them is
   generated from here:

     templates/shell.html, theme/press.js   {{MARK size=22 sw=1.2 pn aria}}  (filled by the build)
     theme/reading.css                      {{MARK_MASK}}                    (build and pages.mjs)
     favicons                               favicon()                        (build and pages.mjs)
     tools/og-card.mjs                      markInner()

   `npm run check` fails if the pennant's path turns up anywhere else. */

const PENNANT = "M9 3.4 17.6 5.2 14.6 6.8 17.6 8.4 9 10.2Z";
const SWELL = "M1.83 15c1.5-1.7 3.08-1.7 4.58 0s3.08 1.7 4.58 0 3.08-1.7 4.58 0 3.08 1.7 4.58 0";
const SWELL2 = "M3.86 18c1.55-1.1 3.2-1.1 4.76 0s3.2 1.1 4.76 0 3.2-1.1 4.76 0";
export const MARK_PATHS = [PENNANT];   // what the check looks for outside this file

/* The drawing's contents. `ink` fills the pennant (a colour, or currentColor); `r` insets
   the seal for small sizes, where a full-bleed stroke would be clipped. */
export function markInner(sw = 1, { sea = true, pn = false, ink = "currentColor", r = 10 } = {}) {
  const n = v => +v.toFixed(3);
  return `<circle cx="11" cy="11" r="${r}" stroke-width="${n(sw)}"/>` +
    `<path d="M9 ${n(11 - r + .2)}V15" stroke-width="${n(sw)}"/>` +
    `<path${pn ? ' class="pn"' : ""} d="${PENNANT}" fill="${ink}" stroke="none"/>` +
    `<path d="${SWELL}" stroke-width="${n(sw)}"/>` +
    (sea ? `<path d="${SWELL2}" stroke-width="${n(sw * .8)}" opacity=".5"/>` : "");
}

/* A whole <svg>. size=0 leaves the size to CSS. */
export function markSvg({ size = 0, sw = 1, pn = false, aria = false, opacity = 0, cls = "" } = {}) {
  return `<svg${cls ? ` class="${cls}"` : ""}${size ? ` width="${size}" height="${size}"` : ""} viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-linecap="round"${aria ? ' aria-hidden="true"' : ""}>` +
    `<g${opacity ? ` opacity="${opacity}"` : ""}>${markInner(sw, { pn })}</g></svg>`;
}

const uri = svg => "data:image/svg+xml," + svg.replace(/"/g, "'").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23");

/* The favicon: paper seal, heavier stroke, one swell — it is drawn at 16px. */
export function favicon() {
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="#1E1C18" stroke-width="1.6" stroke-linecap="round">` +
    markInner(1.6, { sea: false, ink: "#1E1C18", r: 9.5 }).replace('<circle cx="11" cy="11" r="9.5" stroke-width="1.6"/>', '<circle cx="11" cy="11" r="9.5" stroke-width="1.6" fill="#F2EDE1"/>') + `</svg>`);
}

/* For a CSS mask: black on transparent; the element's own colour shows through. */
export function markMask() {
  return `url("${uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22"><g fill="none" stroke="#000" stroke-linecap="round">${markInner(1, { ink: "#000" })}</g></svg>`)}")`;
}

/* Fills {{MARK …}} and {{MARK_MASK}} tokens. Attributes: size=, sw=, opacity=, and the flags
   pn (class on the pennant, for the masthead's hover) and aria (aria-hidden). */
export function fillMark(s) {
  return s
    .replace(/{{MARK_MASK}}/g, markMask())
    .replace(/{{MARK_FAVICON}}/g, favicon())
    .replace(/{{MARK((?:\s+[\w.=]+)*)}}/g, (_, args) => {
      const o = {};
      for (const a of args.trim().split(/\s+/).filter(Boolean)) {
        const [k, v] = a.split("=");
        o[k] = v === undefined ? true : k === "cls" ? v : +v;
      }
      return markSvg(o);
    });
}

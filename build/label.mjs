/* The house label, set once: Garamond capitals at the scale's 13px, lightly spaced.

   Until 2026-10-19 this recipe was typed out by hand 21 times, under 21 names (.lbl, .rs-lbl,
   .kick, .pn span, .endnav small, .tt-k…), across press.css, atlas.css, reading.css and the
   entry pages. The copies had drifted to three weights (400, 500, and 700 where an h2 kept the
   browser's bold) and three line heights, so "the label" was a family resemblance, not a rule.

   Now an element that is a label carries class="lbl", and its context sets only where it sits:
   colour, opacity, margin, display. This file is the one place the letterforms live. It opens
   the library's CSS (build/build.mjs) and every entry page's (build/pages.mjs), ahead of any
   context rule, so a context can still say colour without restating the type.
   `npm run check` fails on capitals set anywhere else. */

export const LABEL_CSS = `.lbl{font-family:var(--serif);font-size:var(--fs-1);font-weight:500;letter-spacing:.08em;text-transform:uppercase;line-height:1.4}`;

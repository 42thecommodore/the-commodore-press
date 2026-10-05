/* The house typefaces, served from the site itself — the one list of them.

   Until 2026-10-05 every page asked fonts.googleapis.com for them, which handed each reader's
   IP address and the page they were on to Google on every visit, beside a colophon telling
   them what the site remembers is "never sent anywhere". It was slower too: since Chrome 86
   (2020) browsers keep a separate cache per site, so nobody arrived with the fonts already
   cached from somewhere else, and the page waited on two more origins first.

   The files are Fontsource's woff2 builds of the Google Fonts releases (@fontsource/eb-garamond
   and @fontsource/ibm-plex-mono 5.3.0), latin and latin-ext only — the shelves use nothing
   outside them that the faces carry. The browser downloads a subset only when a page uses a
   character in its unicode-range, so a reader fetches about 24 KB a weight. Both faces are
   SIL Open Font License 1.1; the licences sit beside the files in assets/fonts/ and are
   published with them, as the licence asks.

   Weights are the ones the pages set: Garamond 400/500/600 roman and 400/500 italic, Plex Mono
   400/500/600 roman. A weight not listed is synthesised by the browser, as it was before.
   `npm test` fails if any built page loads anything from another site. */

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

const FACES = [
  ["EB Garamond", "eb-garamond", "normal", [400, 500, 600]],
  ["EB Garamond", "eb-garamond", "italic", [400, 500]],
  ["IBM Plex Mono", "ibm-plex-mono", "normal", [400, 500, 600]],
];

const faces = [];
for (const [family, slug, style, weights] of FACES)
  for (const w of weights)
    for (const [subset, range] of [["latin-ext", LATIN_EXT], ["latin", LATIN]])
      faces.push({ family, style, w, range, file: `${slug}-${subset}-${w}-${style}.woff2` });

export const FONT_FILES = [...faces.map(f => f.file), "EB-Garamond-OFL.txt", "IBM-Plex-Mono-OFL.txt"];

/* @font-face rules, with `base` the path from the page to the site root ("" or "../../"). */
export function fontFaces(base = "") {
  return faces.map(f => `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.w};font-display:swap;` +
    `src:url(${base}fonts/${f.file}) format("woff2");unicode-range:${f.range}}`).join("\n");
}

/* The one file every page sets its prose in, asked for before the stylesheet is read. */
export function fontPreload(base = "") {
  return `<link rel="preload" href="${base}fonts/eb-garamond-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>`;
}

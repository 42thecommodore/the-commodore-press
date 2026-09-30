/* Typographic quotes, set once, at build time.
 *
 * The house is a press and printed like one, but its prose was typed on keyboards: on
 * 2026-09-29 there were 833 straight quotes and apostrophes across all 67 entries —
 * "DeepMind's", "Sutton's 'bitter lesson'" — on every page a reader was sent. Straight
 * quotes are the mark of an unedited web page. Fixing 67 files by hand would last until the
 * next entry was typed, so content/ stays as written and the build sets the quotes:
 *
 *   'word'  → ‘word’     "word" → “word”     don't → don’t     '90s → ’90s
 *
 * Only text is touched: never inside an HTML tag (an href, a class), and never a field that
 * is not prose (ids, urls, colours — the same list tools/proofread.mjs reads prose by).
 * tools/test-reading.mjs fails if a straight quote reaches any page a reader can open. */

/* fields that are not prose; kept in step with SKIP in tools/proofread.mjs */
export const NOT_PROSE = new Set(["id", "u", "url", "href", "cover", "spineC", "ink", "accent", "motif",
  "livery", "y", "n0", "slug", "plate", "domain", "to", "group", "field", "p", "icon", "color", "action", "provider"]);

const OPENS_AFTER = /[\s([{—–\/“‘-]/;   // a quote after these opens

/* Curl the quotes in a run of text. `prev` is the character before it, so a quote at the start
   of a text node that follows an inline tag (<i>'…) still reads its context. */
function curl(text, prev) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1] || "", before = i ? text[i - 1] : prev;
    const opening = !before || OPENS_AFTER.test(before);
    if (c === '"') out += opening ? "“" : "”";
    else if (c === "'") {
      if (opening && /\d/.test(next) && /\d/.test(text[i + 2] || "")) out += "’";  // ’90s: an elision, not a quote
      else out += opening ? "‘" : "’";
    } else out += c;
  }
  return out;
}

/* Curl every quote in a string of prose that may carry inline HTML, leaving tags alone. */
export function typeset(s) {
  if (typeof s !== "string" || !/["']/.test(s)) return s;
  let prev = "", out = "";
  for (const part of s.split(/(<[^>]*>)/)) {
    if (part.startsWith("<") && part.endsWith(">")) { out += part; continue; }
    out += curl(part, prev);
    if (part) prev = part[part.length - 1];
  }
  return out;
}

/* A whole entry, or any content file: every prose string curled, everything else as it was. */
export function typesetAll(node, key = "") {
  if (typeof node === "string") return NOT_PROSE.has(key) ? node : typeset(node);
  if (Array.isArray(node)) return node.map(v => typesetAll(v, key));
  if (node && typeof node === "object") return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, typesetAll(v, k)]));
  return node;
}

/* A whole HTML document, as the page frame (templates/shell.html) is: its prose curled, its
   <script> and <style> blocks — JSON-LD, the engine's seams — never touched. */
export function typesetHTML(doc) {
  return doc.split(/(<(?:script|style)\b[^]*?<\/(?:script|style)>)/i)
    .map(part => /^<(script|style)\b/i.test(part) ? part : typeset(part)).join("");
}

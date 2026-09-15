/* Reading content/ the way a person edits it.
 *
 * readJSON   — parses a file; when it is broken, says where (line, column, a caret under
 *              the spot) and what usually causes that message, instead of "position 4812".
 * unknownKeys — walks an entry against its schema in schemas/ and lists field names the
 *              site does not know. A misspelt `chnaged` is not an error to JSON, but the
 *              page silently drops it; this is what catches it.
 *
 * Shared by the validator and the build, so the terminal and the preview say the same thing. */

import fs from "node:fs";

export function readJSON(file) {
  const text = fs.readFileSync(file, "utf8");
  try { return JSON.parse(text); }
  catch (e) { throw new Error(explain(text, e.message)); }
}

function explain(text, message) {
  const m = message.match(/position (\d+)/);
  const pos = m ? +m[1] : message.includes("end of JSON") ? text.length : null;
  const reason = message.replace(/ in JSON at position \d+.*$/, "").replace(/^JSON\.parse: /, "");
  if (pos == null) return `not valid JSON — ${reason}`;

  const before = text.slice(0, pos).split("\n");
  const line = before.length, col = before.at(-1).length + 1;
  const lines = text.split("\n");

  /* Paragraph lines run to hundreds of characters; show a window around the column. */
  const W = 70, from = Math.max(0, col - 1 - W / 2);
  const cut = s => (from > 0 ? "…" : "") + s.slice(from, from + W) + (s.length > from + W ? "…" : "");
  const gutter = n => String(n).padStart(5) + " │ ";
  const shown = [];
  if (line > 1) shown.push(gutter(line - 1) + cut(lines[line - 2]));
  shown.push(gutter(line) + cut(lines[line - 1] ?? ""));
  shown.push(" ".repeat(8) + " ".repeat(col - 1 - from + (from > 0 ? 1 : 0)) + "^");

  return `not valid JSON — line ${line}, column ${col}\n${shown.join("\n")}\n        ${reason}\n        ${hint(reason, lines[line - 1] ?? "", lines[line - 2] ?? "")}`;
}

function hint(reason, here, above) {
  if (/control character/i.test(reason))
    return "A line break or tab inside quotes. Keep each paragraph on one line — the editor wraps it.";
  if (/end of JSON|Unexpected end/i.test(reason))
    return "The file stops early: a closing } or ] is missing at the end.";
  if (/property name|Unexpected token '?[}\]]/i.test(reason) && /,\s*$/.test(above))
    return "A comma after the last item. JSON allows no comma right before } or ].";
  if (/after property value|after array element|Unexpected string/i.test(reason) && /"\s*$/.test(above))
    return "A missing comma at the end of the line above.";
  if (/after property value|after array element|Unexpected token/i.test(reason) && (here.match(/"/g) || []).length > 4)
    return "A straight \" inside the text ends it early. Use the typographic “ ” the house already uses, or write \\\".";
  return "Usually a missing comma at the end of the line above, a comma too many before } or ], or a \" inside text.";
}

export function unknownKeys(schema, data) {
  const out = [];
  walk(schema, data, "", schema, out);
  return out;
}

function resolve(s, root) {
  while (s && s.$ref) {
    const [, frag = ""] = s.$ref.split("#");
    /* Cross-file refs ("title.schema.json#/…") are resolved by the caller passing that file as root. */
    const base = s.$ref.startsWith("#") ? root : (root.$others || {})[s.$ref.split("#")[0]];
    s = frag.split("/").filter(Boolean).reduce((o, k) => o && o[k], base);
  }
  return s;
}

function walk(s, v, at, root, out) {
  s = resolve(s, root);
  if (!s || v == null) return;
  if (Array.isArray(v)) { if (s.items) v.forEach((x, i) => walk(s.items, x, `${at}[${i}]`, root, out)); return; }
  if (typeof v !== "object" || !s.properties) return;
  for (const [k, x] of Object.entries(v)) {
    const where = at ? `${at}.${k}` : k;
    if (s.properties[k]) walk(s.properties[k], x, where, root, out);
    else if (s.additionalProperties === false) out.push({ at: where, near: nearest(k, s.properties) });
  }
}

/* "source" → `s`, "sorce" → `s`, "chnaged" → `changed`. */
function nearest(k, props) {
  const low = k.toLowerCase();
  for (const [name, p] of Object.entries(props)) if ((p["x-means"] || "").toLowerCase() === low) return name;
  let best = null, bestD = 3;
  for (const name of Object.keys(props)) {
    const d = distance(low, name.toLowerCase());
    if (d < bestD && d < name.length) { best = name; bestD = d; }
  }
  return best;
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return row[b.length];
}

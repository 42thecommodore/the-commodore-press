/* What a life's share card prints about its plate, and the stamp that records it — shared by
   tools/og-card.mjs (which renders the card) and tools/validate.mjs (which warns when it is
   stale). One copy, so the card and the check cannot disagree about what is on the card. */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const plateOf = (ROOT, l) => {
  const f = path.join(ROOT, "assets/plates", `${l.id}.jpg`);
  return !l.plateless && fs.existsSync(f) ? f : null;
};

/* A plate that is not plain public domain carries its credit on the card: the colophon
   credits it on the site, but a shared card travels without the colophon. CC licences also
   ask that changes be indicated, and every plate is cropped and toned — the colophon says
   so, and the card has to as well. */
export function creditOf(l, plate, LIC) {
  const lic = plate && LIC[l.id];
  if (!lic) return "";
  return /^CC /.test(lic.licence) ? `Photograph: ${lic.by}, ${lic.licence}; cropped and toned` : `Photograph: ${lic.by}`;
}

/* The plate is hashed: a replaced portrait is a stale card even when every word is the same. */
export function lifeStamp(ROOT, l, LIC) {
  const plate = plateOf(ROOT, l);
  const h = plate ? createHash("sha1").update(fs.readFileSync(plate)).digest("hex").slice(0, 10) : "no-plate";
  return [l.n, l.years, l.field, l.place, l.lede, l.cover, h, creditOf(l, plate, LIC)].join(" | ");
}

/* The press mark as the icons a browser, a phone and a search engine ask for.
 *
 *   npm run card        (renders the share cards, then these)
 *
 * Writes assets/icons/apple-touch-icon.png (180), icon-192.png and icon-512.png from
 * iconSvg() in build/mark.mjs, the one drawing of the mark. Chrome is a local tool only,
 * as for the cards: the PNGs are committed, and the build copies them to the top of dist/
 * beside favicon.svg and site.webmanifest, which it writes itself.
 *
 * The favicon was a data URI until 2026-10-04. A browser tab draws one; a search engine,
 * a home screen and most link previews do not, because they fetch the icon by URL. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { iconSvg } from "../build/mark.mjs";
import { CHROME } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (!CHROME) {
  console.error("\n  Needs Chrome or Chromium to render the icons. Set CHROME=/path to one. The committed\n  assets/icons/ still work; nothing breaks until the mark changes.\n");
  process.exit(1);
}

const out = path.join(ROOT, "assets/icons");
fs.mkdirSync(out, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cp-icons-"));
const SIZES = { "apple-touch-icon.png": 180, "icon-192.png": 192, "icon-512.png": 512 };

/* Drawn on a canvas and read back as data, not screenshotted: a headless window's viewport is
   87px shorter than the window and never narrower than 500px, so a 180px screenshot came
   out with its bottom half blank. A canvas is exactly the size it is told to be. */
const svgUri = "data:image/svg+xml;base64," + Buffer.from(iconSvg()).toString("base64");
for (const [name, n] of Object.entries(SIZES)) {
  const src = path.join(tmp, `${n}.html`);
  fs.writeFileSync(src, `<!DOCTYPE html><html><body><script>
const c = document.createElement("canvas"); c.width = c.height = ${n};
const i = new Image(); i.onload = () => { c.getContext("2d").drawImage(i, 0, 0, ${n}, ${n}); document.body.textContent = "PNG:" + c.toDataURL("image/png"); };
i.src = ${JSON.stringify(svgUri)};
</script></body></html>`);
  const dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=3000",
    "--dump-dom", `file://${src}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 });
  const m = dom.match(/PNG:data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if (!m) { console.error(`  ${name}: the canvas drew nothing`); process.exitCode = 1; continue; }
  const b = Buffer.from(m[1], "base64");
  fs.writeFileSync(path.join(out, name), b);
  // a PNG's width and height sit at bytes 16-23 of its header
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  if (w !== n || h !== n) { console.error(`  ${name} came out ${w}×${h}, not ${n}×${n}`); process.exitCode = 1; }
  else console.log(`  assets/icons/${name} — ${n}×${n}, ${(b.length / 1024).toFixed(1)} KB`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log("  Open them before committing.\n");

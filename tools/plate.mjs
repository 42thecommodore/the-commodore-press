/* Commodore Press plate-maker — turns any portrait into the house duotone.
   Usage: node tools/plate.mjs <image> <life-id> [--w 260] [--h 325] [--q 60] [--engine chrome|sips]
   The duotone is done here, in plain JS, the same on every machine. Decoding, scaling, the centred
   crop and the JPEG are done by an engine: headless Chrome or Chromium (any OS; the same browser
   `npm run card` uses, found by tools/chrome.mjs) by default, or macOS `sips` where there is no
   Chrome or when asked for with --engine sips. Until 2026-11-28 it was sips only, so it failed with
   `spawnSync sips ENOENT` on Linux and in cloud sessions.
   Only feed it public-domain or properly licensed images — see CLAUDE.md. */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CHROME } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : args[i + 1]; };
const [src, id] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!src || !id) { console.error("usage: node tools/plate.mjs <image> <life-id> [--w 260] [--h 325] [--q 60] [--engine chrome|sips]"); process.exit(1); }
if (!fs.existsSync(src)) { console.error("no such image: " + src); process.exit(1); }
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) { console.error("life-id must be lowercase-kebab, matching the life's `id`"); process.exit(1); }

const W = +flag("w", 260), H = +flag("h", 325), Q = +flag("q", 60);
const INK = [0x1e, 0x1c, 0x18], PAPER = [0xee, 0xe7, 0xd6];   // house plate range

const hasSips = (process.env.PATH || "").split(path.delimiter).some(d => d && fs.existsSync(path.join(d, "sips")));
const ENGINE = flag("engine", CHROME ? "chrome" : hasSips ? "sips" : null);
if (!ENGINE) { console.error("\n  Needs Chrome or Chromium (any OS) or macOS sips to scale and encode the plate.\n  Set CHROME=/path to a Chrome or Chromium binary.\n"); process.exit(1); }
if (ENGINE === "chrome" && !CHROME) { console.error("  --engine chrome: no Chrome or Chromium found; set CHROME=/path"); process.exit(1); }
if (ENGINE === "sips" && !hasSips) { console.error("  --engine sips: sips is macOS only and is not on this machine"); process.exit(1); }
if (ENGINE !== "chrome" && ENGINE !== "sips") { console.error("  --engine is chrome or sips"); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plate-"));
const fail = msg => { fs.rmSync(tmp, { recursive: true, force: true }); console.error("  " + msg); process.exit(1); };
const sips = (...a) => execFileSync("sips", a, { stdio: ["ignore", "ignore", "pipe"] });
const g = f => {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", f], { encoding: "utf8" });
  return { w: +/pixelWidth: *(\d+)/.exec(out)[1], h: +/pixelHeight: *(\d+)/.exec(out)[1] };
};

/* Chrome as an image tool: a page draws on a canvas and prints the result as a data URL, read back
   with --dump-dom, the way tools/icons.mjs makes the icons. The image goes in as a data URI, not a
   file:// URL, because a file:// image taints the canvas and toDataURL then refuses. */
const MIME = b => b[0] === 0xff && b[1] === 0xd8 ? "image/jpeg"
  : b.readUInt32BE(0) === 0x89504e47 ? "image/png"
  : b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" ? "image/webp"
  : b.toString("ascii", 0, 3) === "GIF" ? "image/gif"
  : b.toString("ascii", 4, 12) === "ftypavif" ? "image/avif" : null;
function chrome(imgBuf, body, tag) {
  const mime = MIME(imgBuf);
  if (!mime) fail("Chrome reads JPEG, PNG, WebP, GIF and AVIF. Convert this image first (a TIFF from an archive: export it as PNG), or use --engine sips on a Mac.");
  const page = path.join(tmp, tag + ".html");
  // the script sits in <head> and only the body is read back, so its own "OUT:"/"ERR:" never match
  fs.writeFileSync(page, `<!DOCTYPE html><html><head><script>
const W = ${W}, H = ${H}, Q = ${Q};
const i = new Image();
i.onerror = () => { document.body.textContent = "ERR:could not decode the image"; };
i.onload = () => { const c = document.createElement("canvas"), x = c.getContext("2d"); ${body} };
i.src = "data:${mime};base64,${imgBuf.toString("base64")}";
</script></head><body></body></html>`);
  const dom = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=10000",
    "--dump-dom", `file://${page}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 256 << 20 })
    .split("<body>").pop();
  const err = dom.match(/ERR:([^<]*)/); if (err) fail(err[1]);
  const m = dom.match(/OUT:data:image\/\w+;base64,([A-Za-z0-9+/=]+)/);
  if (!m) fail("Chrome drew nothing; try again, or set CHROME=/path to another Chrome or Chromium");
  return Buffer.from(m[1], "base64");
}

/* ---- 1. scale to cover the plate, crop centred, hand back 8-bit PNG ---- */
const work = path.join(tmp, "w.png");
if (ENGINE === "sips") {
  fs.copyFileSync(src, work);
  sips("-s", "format", "png", work, "--out", work);
  let d = g(work);
  const scale = Math.max(W / d.w, H / d.h);
  sips("--resampleHeightWidth", String(Math.max(H, Math.round(d.h * scale))), String(Math.max(W, Math.round(d.w * scale))), work, "--out", work);
  sips("-c", String(H), String(W), work, "--out", work);   // centred crop to exact plate size
} else {
  // the same cover-scale and centred crop: take the centred W:H window of the source, drawn at W×H.
  // A flat white canvas first, so a transparent PNG prints on white, as sips gives it.
  fs.writeFileSync(work, chrome(fs.readFileSync(src), `
    const s = Math.max(W / i.naturalWidth, H / i.naturalHeight), sw = W / s, sh = H / s;
    c.width = W; c.height = H; x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
    x.drawImage(i, (i.naturalWidth - sw) / 2, (i.naturalHeight - sh) / 2, sw, sh, 0, 0, W, H);
    document.body.textContent = "OUT:" + c.toDataURL("image/png");`, "scale"));
}

/* ---- 2. minimal PNG decode (8-bit, non-interlaced — what sips and a canvas write) ---- */
function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let o = 8, ihdr = null, idat = [], pal = null, trns = null;
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString("ascii", o + 4, o + 8), body = buf.subarray(o + 8, o + 8 + len);
    if (type === "IHDR") ihdr = { w: body.readUInt32BE(0), h: body.readUInt32BE(4), depth: body[8], color: body[9], interlace: body[12] };
    else if (type === "IDAT") idat.push(body);
    else if (type === "PLTE") pal = body;
    else if (type === "tRNS") trns = body;
    else if (type === "IEND") break;
    o += 12 + len;
  }
  if (ihdr.depth !== 8) throw new Error(`unsupported bit depth ${ihdr.depth}`);
  if (ihdr.interlace) throw new Error("interlaced PNG not supported");
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.color];
  if (!ch) throw new Error("unsupported colour type " + ihdr.color);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = ihdr.w * ch, out = Buffer.alloc(ihdr.h * stride);
  let pos = 0;
  for (let y = 0; y < ihdr.h; y++) {
    const ft = raw[pos++], line = raw.subarray(pos, pos + stride); pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride), prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, b = prev ? prev[x] : 0, c = (prev && x >= ch) ? prev[x - ch] : 0;
      let v = line[x];
      if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      cur[x] = v & 255;
    }
  }
  return { ...ihdr, ch, data: out, pal };
}

function encodePNG(w, h, rgb) {   // colour type 2, filter 0
  const stride = w * 3, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const chunk = (type, body) => {
    const b = Buffer.concat([Buffer.from(type, "ascii"), body]), len = Buffer.alloc(4), crc = Buffer.alloc(4);
    len.writeUInt32BE(body.length); crc.writeUInt32BE(crc32(b) >>> 0);
    return Buffer.concat([len, b, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
let T = null;
function crc32(b) {
  if (!T) { T = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c; } }
  let c = -1; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return c ^ -1;
}

/* ---- 3. grey, gentle plate curve, then map ink -> paper ---- */
const img = decodePNG(fs.readFileSync(work));
const px = img.w * img.h, rgb = Buffer.alloc(px * 3);
const lum = new Float32Array(px);
for (let i = 0; i < px; i++) {
  const o = i * img.ch;
  const r = img.data[o], gg = img.ch >= 3 ? img.data[o + 1] : r, b = img.ch >= 3 ? img.data[o + 2] : r;
  lum[i] = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
}
// stretch to the real range so scans that sit in the middle greys still read as a print
let lo = 1, hi = 0; for (let i = 0; i < px; i++) { if (lum[i] < lo) lo = lum[i]; if (lum[i] > hi) hi = lum[i]; }
const span = Math.max(hi - lo, 0.001);
for (let i = 0; i < px; i++) {
  let t = (lum[i] - lo) / span;
  t = t * t * (3 - 2 * t);                 // soften the extremes, keep the midtones
  t = 0.06 + t * 0.94;                     // never quite reach pure ink
  const o = i * 3;
  for (let c = 0; c < 3; c++) rgb[o + c] = Math.round(INK[c] + (PAPER[c] - INK[c]) * t);
}

/* ---- 4. write, then let the engine do the JPEG ---- */
const duo = path.join(tmp, "duo.png");
const duoPNG = encodePNG(img.w, img.h, rgb);
fs.writeFileSync(duo, duoPNG);
const dest = path.join(ROOT, "assets/plates", id + ".jpg");
fs.mkdirSync(path.dirname(dest), { recursive: true });
if (ENGINE === "sips") sips("-s", "format", "jpeg", "-s", "formatOptions", String(Q), duo, "--out", dest);
else fs.writeFileSync(dest, chrome(duoPNG, `
    c.width = i.naturalWidth; c.height = i.naturalHeight; x.drawImage(i, 0, 0);
    document.body.textContent = "OUT:" + c.toDataURL("image/jpeg", Q / 100);`, "jpeg"));
fs.rmSync(tmp, { recursive: true, force: true });

const kb = fs.statSync(dest).size / 1024;
console.log(`plate: assets/plates/${id}.jpg — ${img.w}×${img.h}, ${kb.toFixed(1)} KB (${ENGINE})`);
if (kb > 60) console.log(`  heavy — try --q ${Math.max(35, Q - 15)}`);
console.log(`  remember the credit line in the colophon if this image is not public domain.`);

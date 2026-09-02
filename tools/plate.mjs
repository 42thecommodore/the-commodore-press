/* Commodore Press plate-maker — turns any portrait into the house duotone.
   Usage: node tools/plate.mjs <image> <life-id> [--w 260] [--h 325] [--q 60]
   Uses macOS `sips` for scaling and JPEG encoding; the duotone is done here.
   Only feed it public-domain or properly licensed images — see CLAUDE.md. */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : args[i + 1]; };
const [src, id] = args.filter(a => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") !== true);
if (!src || !id) { console.error("usage: node tools/plate.mjs <image> <life-id> [--w 260] [--h 325] [--q 60]"); process.exit(1); }
if (!fs.existsSync(src)) { console.error("no such image: " + src); process.exit(1); }
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) { console.error("life-id must be lowercase-kebab, matching the life's `id`"); process.exit(1); }

const W = +flag("w", 260), H = +flag("h", 325), Q = +flag("q", 60);
const INK = [0x1e, 0x1c, 0x18], PAPER = [0xee, 0xe7, 0xd6];   // house plate range

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plate-"));
const sips = (...a) => execFileSync("sips", a, { stdio: ["ignore", "ignore", "pipe"] });
const g = f => {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", f], { encoding: "utf8" });
  return { w: +/pixelWidth: *(\d+)/.exec(out)[1], h: +/pixelHeight: *(\d+)/.exec(out)[1] };
};

/* ---- 1. scale to cover the plate, crop centred, hand back 8-bit PNG ---- */
const work = path.join(tmp, "w.png");
fs.copyFileSync(src, work);
sips("-s", "format", "png", work, "--out", work);
let d = g(work);
const scale = Math.max(W / d.w, H / d.h);
sips("--resampleHeightWidth", String(Math.max(H, Math.round(d.h * scale))), String(Math.max(W, Math.round(d.w * scale))), work, "--out", work);
sips("-c", String(H), String(W), work, "--out", work);   // centred crop to exact plate size

/* ---- 2. minimal PNG decode (8-bit, non-interlaced — what sips writes) ---- */
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

/* ---- 4. write, then let sips do the JPEG ---- */
const duo = path.join(tmp, "duo.png");
fs.writeFileSync(duo, encodePNG(img.w, img.h, rgb));
const dest = path.join(ROOT, "assets/plates", id + ".jpg");
fs.mkdirSync(path.dirname(dest), { recursive: true });
sips("-s", "format", "jpeg", "-s", "formatOptions", String(Q), duo, "--out", dest);
fs.rmSync(tmp, { recursive: true, force: true });

const kb = fs.statSync(dest).size / 1024;
console.log(`plate: assets/plates/${id}.jpg — ${img.w}×${img.h}, ${kb.toFixed(1)} KB`);
if (kb > 60) console.log(`  heavy — try --q ${Math.max(35, Q - 15)}`);
console.log(`  remember the credit line in the colophon if this image is not public domain.`);

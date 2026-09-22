/* Commodore Press preview — rebuilds when you save, reloads the page itself.
   Run: npm start   then open http://localhost:4321 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = +(process.env.PORT || 4321);
let stamp = Date.now(), building = false, failure = null;

const build = () => {
  if (building) return; building = true;
  try {
    execFileSync(process.execPath, [path.join(ROOT, "build/build.mjs")], { stdio: "pipe" });
    failure = null;
    console.log(`  rebuilt  ${new Date().toLocaleTimeString()}`);
  } catch (e) {
    failure = (e.stderr || e.stdout || e).toString().trim();
    console.log(`  build failed:\n${failure.split("\n").map(l => "    " + l).join("\n")}`);
  }
  stamp = Date.now();
  building = false;
};

/* When a save breaks the build, say so on the page itself. Otherwise the preview keeps
   showing the last good build and the edit looks as if it simply did not take. */
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const failurePage = () => `<!doctype html><meta charset="utf-8"><title>Not built — Commodore Press</title>
<body style="margin:0;background:#F2EDE1;color:#1E1C18;font:15px/1.6 'IBM Plex Mono',ui-monospace,Menlo,monospace">
<div style="max-width:880px;margin:10vh auto;padding:0 24px">
<p style="letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:#7B3F2E">The page did not build</p>
<p style="font:22px/1.4 'EB Garamond',Georgia,serif">Your last save broke a file. Fix the spot below and save again — this page reloads by itself.</p>
<pre style="white-space:pre-wrap;overflow-x:auto;background:#1E1C18;color:#F2EDE1;padding:20px;border-radius:4px">${esc(failure)}</pre>
</div></body>`;

// a tiny reloader, injected only in preview — it never reaches dist/
const RELOADER = `<script>(function(){let s=null;setInterval(async()=>{try{const r=await fetch("/__stamp");const t=await r.text();if(s===null)s=t;else if(t!==s)location.reload()}catch(e){}},700)})()</script>`;

http.createServer((req, res) => {
  if (req.url === "/__stamp") { res.writeHead(200, { "content-type": "text/plain", "cache-control": "no-store" }); return res.end(String(stamp)); }
  if (failure && (req.url === "/" || req.url.startsWith("/index.html"))) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    return res.end(failurePage().replace("</body>", RELOADER + "</body>"));
  }
  let file = path.join(ROOT, "dist", decodeURIComponent(req.url.split("?")[0].replace(/^\//, "")));
  // entry pages live at dist/t/<id>/index.html, the way a static host serves them
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(path.join(ROOT, "dist")) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain" }); return res.end("not on the shelf");
  }
  let body = fs.readFileSync(file);
  if (file.endsWith(".html")) body = Buffer.from(body.toString("utf8").replace("</body>", RELOADER + "</body>"));
  const type = { ".html": "text/html; charset=utf-8", ".txt": "text/plain", ".jpg": "image/jpeg", ".png": "image/png", ".xml": "application/xml" }[path.extname(file)] || "application/octet-stream";
  res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}).listen(PORT, () => {
  build();
  console.log(`\n  Commodore Press — preview on http://localhost:${PORT}`);
  console.log(`  watching content/ theme/ templates/ assets/ — save anything and the page reloads\n`);
});

let timer = null;
for (const d of ["content", "theme", "templates", "assets"]) {
  if (!fs.existsSync(path.join(ROOT, d))) continue;
  fs.watch(path.join(ROOT, d), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(build, 180); });
}

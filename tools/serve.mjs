/* Commodore Press preview — rebuilds when you save, reloads the page itself.
   Run: npm start   then open http://localhost:4321 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = +(process.env.PORT || 4321);
let stamp = Date.now(), building = false;

const build = () => {
  if (building) return; building = true;
  try {
    execFileSync(process.execPath, [path.join(ROOT, "build/build.mjs")], { stdio: "pipe" });
    stamp = Date.now();
    console.log(`  rebuilt  ${new Date().toLocaleTimeString()}`);
  } catch (e) {
    console.log(`  build failed:\n${(e.stderr || e.stdout || e).toString().trim().split("\n").map(l => "    " + l).join("\n")}`);
  }
  building = false;
};

// a tiny reloader, injected only in preview — it never reaches dist/
const RELOADER = `<script>(function(){let s=null;setInterval(async()=>{try{const r=await fetch("/__stamp");const t=await r.text();if(s===null)s=t;else if(t!==s)location.reload()}catch(e){}},700)})()</script>`;

http.createServer((req, res) => {
  if (req.url === "/__stamp") { res.writeHead(200, { "content-type": "text/plain", "cache-control": "no-store" }); return res.end(String(stamp)); }
  const file = path.join(ROOT, "dist", req.url === "/" ? "index.html" : req.url.replace(/^\//, "").split("?")[0]);
  if (!file.startsWith(path.join(ROOT, "dist")) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain" }); return res.end("not on the shelf");
  }
  let body = fs.readFileSync(file);
  if (file.endsWith(".html")) body = Buffer.from(body.toString("utf8").replace("</body>", RELOADER + "</body>"));
  const type = { ".html": "text/html; charset=utf-8", ".txt": "text/plain", ".jpg": "image/jpeg", ".png": "image/png" }[path.extname(file)] || "application/octet-stream";
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

/* The Log — the editor's signed column. One Markdown file per piece in content/log/.

   Everything else on the site is JSON because it has fields; a column is prose, and
   writing prose inside JSON quotes is how nobody writes. So a piece is a plain file:

     ---
     title: The question goes with the number
     date: 2026-09-21
     dek: One line — what the piece argues. Used in the list, the share card and the email.
     across: press:forty-two, lives:john-snow, atlas:track
     status: draft
     ---
     The piece, in Markdown. [Links to the library](press:forty-two) resolve to its pages.

     ## Sources
     - Where each figure came from, one line each.

   The filename is `YYYY-MM-DD-slug.md`; the slug is the permalink (/log/<slug>/). A piece
   prints only when `status: published`. This module is read by the build, the check, the
   link checker and the proofreader, so they can never disagree about what a piece is. */
import fs from "node:fs";
import path from "node:path";

export const LOG_DIR = "content/log";

export function loadLog(ROOT) {
  const dir = path.join(ROOT, LOG_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".md") && !f.startsWith("_")).sort().map(f => {
    const file = `${LOG_DIR}/${f}`;
    const raw = fs.readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n");
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const meta = {}, problems = [];
    if (!m) problems.push("no front matter — the file must open with a `---` block (title, date, dek, status)");
    else for (const line of m[1].split("\n")) {
      if (!line.trim() || line.trim().startsWith("#")) continue;
      const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
      if (!kv) { problems.push(`front matter line not understood: "${line.trim()}" — write it as \`name: value\``); continue; }
      meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
    }
    const fm = f.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
    return {
      file, meta, problems,
      body: m ? m[2].trim() : raw,
      slug: fm ? fm[2] : f.replace(/\.md$/, ""),
      fileDate: fm ? fm[1] : null,
      across: (meta.across || "").split(",").map(s => s.trim()).filter(Boolean),
      published: meta.status === "published",
    };
  });
}

/* Newest first, published only. */
export const publishedLog = ROOT => loadLog(ROOT).filter(x => x.published)
  .sort((a, b) => (b.meta.date || "").localeCompare(a.meta.date || "") || a.slug.localeCompare(b.slug));

/* Every link a piece prints, for the link checker: [text](https://…) and bare list URLs. */
export const logLinks = body => [...body.matchAll(/\]\((https?:\/\/[^)\s]+)\)|(?:^|\s)(https?:\/\/[^\s)]+)/gm)].map(m => (m[1] || m[2]).replace(/[.,;:]+$/, ""));

/* Internal references a piece makes, in its `across` and inside its links. */
export const logRefs = x => [...x.across, ...[...x.body.matchAll(/\]\(((?:press|lives|atlas):[a-z0-9-]+)\)/g)].map(m => m[1])];

/* The piece has a Sources section with at least one line in it. */
export const hasSources = body => /^##\s+Sources\s*\n+\s*\S/im.test(body);

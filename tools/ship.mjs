/* One command from a finished edit to a live page.
 *
 *   npm run ship -- "Press: add The Heated Disk"
 *
 * Runs the house rules, builds and tests locally, commits the sources and pushes.
 * GitHub Actions runs the check again and builds dist/ itself before it deploys, so a
 * broken entry cannot reach readers even if this script is run in a hurry.
 *
 * This is the human's command. /press-publish stays human-invoked for the same reason:
 * nothing about the Press publishes itself. */

import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const y = "\x1b[33m", g = "\x1b[32m", d = "\x1b[2m", b = "\x1b[1m", x = "\x1b[0m";
const say = s => console.log(s);
const die = s => { console.error(`\n${y}  ${s}${x}\n`); process.exit(1); };
const git = a => execSync(`git ${a}`, { cwd: ROOT, encoding: "utf8" }).trim();

const argv = process.argv.slice(2);
const FLAGS = new Set(argv.filter(a => a.startsWith("--")));
const message = argv.filter(a => !a.startsWith("--")).join(" ").trim();
if (!message) die(`Say what changed:  npm run ship -- "Press: add The Heated Disk"`);

/* A commit nobody can read later is worth less than no commit. */
if (message.length < 12) die(`"${message}" will not mean anything in six months. Write the sentence.`);

try { git("rev-parse --is-inside-work-tree"); } catch { die("Not a git repository."); }
if (!git("remote").includes("origin")) die("No origin remote. See DEPLOY.md.");

/* ---------- the branch guard ----------
   The push below is `HEAD:main`: it sends whatever branch you are standing on to the
   live site. That is fine on main and a trap everywhere else — the moment it is most
   likely to bite is sitting on a review branch, wanting to ship one small fix, which
   would put the whole unreviewed branch in front of readers. Refuse instead. */
const branch = git("rev-parse --abbrev-ref HEAD");
if (branch !== "main" && !FLAGS.has("--allow-branch"))
  die(`You are on "${branch}", and ship pushes to main — that would publish this whole branch.\n` +
      `  Finish the review first:   git checkout main && git merge ${branch}\n` +
      `  Or, if you truly mean it:  npm run ship -- --allow-branch "${message}"`);
if (branch !== "main") say(`\n${y}  Shipping "${branch}" straight to main because you asked for it.${x}`);

const step = (label, cmd, args) => {
  say(`\n${b}  ${label}${x}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) die(`${label} failed — nothing was committed or pushed.`);
};

/* ---------- the whole gate, not a third of it ----------
   `check` proves the shape of the content. It cannot tell whether a link still opens or
   whether a note to self is about to print. Both of those have reached the live site
   before. All three run here, cheapest first, so the slow one is never the reason a
   broken entry ships.

   `links` needs the network and caches for a fortnight, so a second run costs almost
   nothing; it exits non-zero only on a genuinely dead link, and offline every host reads
   as unconfirmed rather than dead, so being on a train does not block a ship. */
step("The house rules", "npm", ["run", "check"]);
step("The prose", "npm", ["run", "proofread"]);
if (FLAGS.has("--skip-links")) say(`\n${y}  Skipping the link check because you asked.${x}`);
else step("Every link still opens", "npm", ["run", "links", "--", "--quiet"]);
step("Build", "npm", ["run", "build"]);
/* The reading tools in a real browser: share links, the quote credit, progress. `check`
   reads content and cannot see behaviour; this can. Without Chrome it skips and says so. */
step("The reading tools", "npm", ["test"]);

git("add -A");
const staged = git("diff --cached --stat");
/* Nothing new to commit is not the same as nothing to publish: commits made earlier and
   never pushed still have to go out. This used to exit here and print "the live site is
   already current" with two unpushed commits sitting on main. */
spawnSync("git", ["fetch", "--quiet", "origin"], { cwd: ROOT, stdio: "inherit" });
const unpushed = git("rev-list --count origin/main..HEAD");
if (!staged && unpushed === "0") { say(`\n${g}  Nothing changed. The live site is already current.${x}\n`); process.exit(0); }
if (staged) {
  say(`\n${d}${staged}${x}`);
  step("Commit", "git", ["commit", "-q", "-m", message]);
} else say(`\n${d}  Nothing new to commit; ${unpushed} earlier commit(s) not yet published.${x}`);

/* More than one person — or session — works in this repo, and a remote that has moved
   on is the ordinary case, not an error. Rebase onto it rather than failing the push.
   --autostash protects anything still uncommitted in the tree. */
say(`\n${b}  Push${x}`);
spawnSync("git", ["fetch", "--quiet", "origin"], { cwd: ROOT, stdio: "inherit" });
const behind = git("rev-list --count HEAD..origin/main");
if (behind !== "0") {
  say(`${d}  origin/main moved ${behind} commit(s) ahead — rebasing onto it first${x}`);
  const rb = spawnSync("git", ["rebase", "--autostash", "origin/main"], { cwd: ROOT, stdio: "inherit" });
  if (rb.status !== 0) {
    spawnSync("git", ["rebase", "--abort"], { cwd: ROOT, stdio: "ignore" });
    die(`Your commit is made but conflicts with origin/main. Nothing was pushed.\n  Resolve by hand: git pull --rebase origin main`);
  }
}
if (spawnSync("git", ["push", "origin", "HEAD:main"], { cwd: ROOT, stdio: "inherit" }).status !== 0) {
  die(`Push failed. Your commit is safe locally — nothing was lost.\n  Usually: git pull --rebase origin main, then npm run ship again.`);
}

say(`\n${g}  Pushed.${x} ${d}GitHub Actions is checking and deploying now.${x}`);
say(`${d}  Watch:  https://github.com/42thecommodore/the-commodore-press/actions${x}`);
say(`${d}  Live:   https://42thecommodore.github.io/the-commodore-press/${x}`);
say(`${d}  It takes about two minutes. If the check fails there, the live site is left alone.${x}\n`);

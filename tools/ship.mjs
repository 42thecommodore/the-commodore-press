/* One command from a finished edit to a live page.
 *
 *   npm run ship -- "Press: add The Heated Disk"
 *
 * Runs the house rules, rebuilds dist/, commits content and the built file together,
 * and pushes. GitHub Actions runs the same check again before it deploys, so a broken
 * entry cannot reach readers even if this script is run in a hurry.
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

const message = process.argv.slice(2).join(" ").trim();
if (!message) die(`Say what changed:  npm run ship -- "Press: add The Heated Disk"`);

/* A commit nobody can read later is worth less than no commit. */
if (message.length < 12) die(`"${message}" will not mean anything in six months. Write the sentence.`);

try { git("rev-parse --is-inside-work-tree"); } catch { die("Not a git repository."); }
if (!git("remote").includes("origin")) die("No origin remote. See DEPLOY.md.");

const step = (label, cmd, args) => {
  say(`\n${b}  ${label}${x}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) die(`${label} failed — nothing was committed or pushed.`);
};

step("The house rules", "npm", ["run", "check"]);
step("Build", "npm", ["run", "build"]);

git("add -A");
const staged = git("diff --cached --stat");
if (!staged) { say(`\n${g}  Nothing changed. The live site is already current.${x}\n`); process.exit(0); }
say(`\n${d}${staged}${x}`);

/* Content and dist/ go together, so the deployable file always matches its sources. */
step("Commit", "git", ["commit", "-q", "-m", message]);
step("Push", "git", ["push", "origin", "HEAD"]);

say(`\n${g}  Pushed.${x} ${d}GitHub Actions is checking and deploying now.${x}`);
say(`${d}  Watch:  https://github.com/42thecommodore/the-commodore-press/actions${x}`);
say(`${d}  Live:   https://42thecommodore.github.io/the-commodore-press/${x}`);
say(`${d}  It takes about two minutes. If the check fails there, the live site is left alone.${x}\n`);

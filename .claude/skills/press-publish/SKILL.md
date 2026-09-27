---
name: press-publish
description: Validate, build and publish the Commodore Press site. Use when the user wants to publish, deploy, ship, push live, or update the live Commodore Press site.
argument-hint: "[what changed]"
disable-model-invocation: true
allowed-tools: Bash(npm run ship:*) Bash(npm run live:*) Bash(npm run check) Bash(npm run build) Bash(git status:*) Bash(git diff:*) Bash(git log:*)
---

# Publishing

Publishing is one command. It refuses to run off `main`, then runs check → proofread → links → build → test, commits the sources and pushes. GitHub Actions runs the check again, builds `dist/` itself and deploys; if the check fails there, the live site is left alone. Then `ship` waits for the deploy and visits every live page (`tools/live.mjs`), and ends in **live and verified** or in the list of what is wrong.

```bash
npm run ship -- "Press: <what changed>"
```

Before running it:

1. **Errors block.** If `npm run check` fails, say what is broken and fix it first. Never publish around it.
2. **Look at it.** `npm start`, then the front door, one title, one life with a plate, the Atlas, search (`/`) and night mode. A build can pass every check and still look wrong.
3. **Write the message as the house would**: what changed, plainly. "Press: add The Heated Disk; correct Harrison's prize."

Offline, pass `--skip-links --no-wait` and say so, and run `npm run live` once back online. Tell the user it is done only after **live and verified** — that line is the confirmation, not the push.

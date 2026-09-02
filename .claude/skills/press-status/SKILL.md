---
name: press-status
description: Report where the Commodore Press stands — what is on the shelves, what is half-finished, what breaks the house rules, and what to pick up next. Use when the user asks how the site is doing, what needs work, what to write next, or opens a working session on the Press.
allowed-tools: Bash(npm run stats) Bash(npm run check) Bash(git status:*) Bash(git log:*) Read Glob Grep
---

# Press status

The state below is real, not remembered — it was read from the workspace just now.

## Inventory and backlog

!`cd "$CLAUDE_PROJECT_DIR" && npm run stats --silent 2>&1 | sed 's/\x1b\[[0-9;]*m//g'`

## House rules

!`cd "$CLAUDE_PROJECT_DIR" && npm run check --silent 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true`

## Uncommitted

!`cd "$CLAUDE_PROJECT_DIR" && git status --short 2>/dev/null | head -20 || echo "not a git repository"`

---

## Now read it back to the user

Do **not** paste the above. Give them the two or three things actually worth doing, in
order, and say why.

**Errors** block publication. Common ones and what they mean:
- `is still a TODO` — a scaffolded entry nobody finished. Finish it or delete the file.
- `points at "…", which does not exist` — a cross-wing link whose target was renamed.
  Fix the `to`; never delete the link silently.
- `has a number with no source line` — the house rule. Find the source or cut the number.

**Warnings** never block, but they are the editorial backlog:
- `no portrait` — a Life showing the press mark. Fix with `press-plate`.
- `links to no other wing` — the entry is an island. The library earns its shape from
  cross-links; this is the cheapest improvement available.
- `names nothing contested` — usually means the research step was skipped.

## Priority order

1. Anything breaking a promise the site makes publicly — a missing source, a dead link.
2. Finishing something half-written, over starting something new.
3. Cross-links. Minutes of work, and they make the whole library denser.

If it is all clean, say so plainly, then look at which `field` values are thin across
`content/books/` and suggest the next title or life from that gap.

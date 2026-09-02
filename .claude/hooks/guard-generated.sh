#!/bin/bash
# PreToolUse guard. Two things in this workspace must not be edited by hand:
#   dist/                      — generated; hand edits are silently destroyed by the next build
#   content/corrections.json   — the colophon promises corrections are appended, never patched
# An instruction in CLAUDE.md is followed most of the time. This is followed every time.
node "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-generated.mjs"

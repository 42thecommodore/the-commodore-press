#!/bin/bash
# PostToolUse. Runs the house rules after any edit under content/ and reports
# only real errors, so a broken entry surfaces the moment it is written rather
# than at publish time. Never blocks an edit.
cd "$CLAUDE_PROJECT_DIR" || exit 0
OUT=$(node tools/validate.mjs 2>&1) || {
  echo "House rules broken by that edit:"
  echo "$OUT" | sed 's/\x1b\[[0-9;]*m//g' | grep -E '^\s+✗' | head -12
  echo "Run: npm run check"
}
exit 0

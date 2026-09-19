# House change log

Edits to the *rules*, not to the entries. When the standard itself changes — the validator,
the house voice, what `keep` is for, what counts as a source — write it down here with the
date and the reason.

Entry-level history lives in git. Corrections live in the colophon. This file is for the
things that would otherwise quietly drift.

| Date | What changed | Why |
|---|---|---|
| 2026-09-01 | The site was split from one hand-edited 636 KB file into `content/` + a build. | Every part became separately updatable, and the house rules became machine-checkable. |
| 2026-09-01 | Two rules moved from CLAUDE.md into hooks: `dist/` is unwritable by hand, and `corrections.json` can only be appended to. | An instruction is followed most of the time. The colophon's promise to readers needs better than that. |
| 2026-09-01 | `/press-publish` set to `disable-model-invocation: true`. | Publishing is irreversible and outward-facing. It should require a person asking for it. |
| 2026-09-01 | Every count written in prose — the meta description and the three wing intros — now comes from the build (`{{N_BOOKS}}`, `{{W_LIVES_CAP}}` etc.). | The hand-written 'twenty ideas' and 'thirty-one sources' were both wrong the moment the shelves grew. |
| 2026-09-15 | Every content field is described in `schemas/`; the editor shows it on hover, and `npm run check` now fails on any field name the schemas do not list. Broken JSON is reported by line and column with the likely fix, in the terminal and in the preview. | So the Press can be maintained by its owner without reading code. A misspelt `chnaged` was valid JSON that the page silently dropped — the one kind of mistake nothing caught. |
| 2026-09-01 | House decision: a Life stays plateless when the only available image carries a licence its uploader likely could not grant. First applied to Henrietta Lacks. | For an entry about consent, a family photo on a shaky licence would undercut the page. The press mark is the honest fallback. |
| 2026-09-18 | The famous/obscure split in the Lives card and the Lives wing intro now comes from the build too (`{{W_FAMOUS_CAP}}`, `{{N_OBSCURE}}`). | The 09-01 rule missed it. "Twenty-one famous, five you have never heard of" was typed by hand and went stale the day Jobs and Moses shipped; it said 21 and 5 while the shelf held 23 and 5. |
| 2026-09-18 | The front door gained three blocks drawn entirely from `content/`: the four parts of an entry shown on a real life, the four newest lives, and a wall of every portrait. | A first-time reader met a mission statement and five wing names, and nothing to hold. The method is the product; showing it on a real entry explains it faster than the colophon does. Built from content so none of it can go stale. |

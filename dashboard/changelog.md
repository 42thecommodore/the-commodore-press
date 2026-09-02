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
| 2026-09-01 | House decision: a Life stays plateless when the only available image carries a licence its uploader likely could not grant. First applied to Henrietta Lacks. | For an entry about consent, a family photo on a shaky licence would undercut the page. The press mark is the honest fallback. |

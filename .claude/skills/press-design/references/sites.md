# The reference sites, as measured

Named by Luca on 2026-09-26 as the feel the Press should have. What follows was read off the
live pages with the browser's computed styles on that date, not remembered — re-measure
before leaning on a number, the sites change. A reference is evidence of a pattern, never a
template: the Press copies no one's layout, logo or wording.

| Site | What it measurably does | What the Press took |
|---|---|---|
| **press.stripe.com** | One family (Ivar Text / Ivar Display) at nearly one size, 17px; hierarchy by weight, not size or case; links bold, sentence case; radius 0; almost no chrome (mark, back arrow, "?"). A book's page is the book's colour, in its ink, with the book shown large. | Garamond for everything read or pressed; square corners; the entry page shows the book on its own colour. |
| **apple.com** | One family (SF Pro); nav 12px sentence case at 80% ink; each block one headline, one short line, at most two actions; no label above a headline; negative tracking on large type. | One focus in the hero; no eyebrow labels; tracking -.02 to -.03em on display sizes. |
| **lowercasecapital.com** | EB Garamond — the Press's own face — everywhere; its small labels are Garamond capitals (12px, ~.075em), never a monospace; one accent colour; engraved drawings as navigation; a scalloped wave band across the top. | Labels as Garamond capitals at 13px, .08em; the wave. |
| **usvc.com** | Serif display (Romie) tracked about -3%, a second line in italic in one accent; one small capitals label in the whole hero; a source line printed under its chart. | The italic second line in the hero; sources printed where the figure is. |
| **anthropic.com/claude-corps** | Warm off-white; serif body at 17px; nav and buttons in a small sans, sentence case; a hero that is one sentence in a lot of space; paragraphs led by a bold word ("Impact. …"). Monospace capitals appear **only** on pure data — a city, an index number — in grey under a hairline. | Mono for data only, in its own case. |

**The common rule** across all five, which became the Press's type rule: the interface is
set in the reading face, in sentence case; monospace is for data; corners are square or
nearly; nothing sits above a headline to announce it.

Scroll-driven pages (Stripe's shelf, Apple's tiles, Anthropic's story) often capture blank
in a hidden browser pane. Jump to a section with `scrollIntoView` and wait, or read the
computed styles directly; a blank screenshot is the capture, not the site.

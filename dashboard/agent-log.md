# The weekly agent's log

Each Sunday run appends one entry here, newest at the bottom, in the shape set out in
`dashboard/weekly-agent.md`. Before choosing its work, each run reads the last six entries,
and above all their **Lessons**. This log is how the agent improves from week to week.

Entries are the agent's own notes about its work. They are not sources, and nothing here
prints on the site. A **Proposed change to the brief** is only a proposal. It takes effect
when Luca edits `weekly-agent.md`.

---

## 2026-11-03 — weekly/2026-11-03

*The trial run, made by hand in the session that built the agent, at Luca's request.*

**Chose:** fact-check Jamsetji Tata (№ 51). `npm run check` held, and `npm run links` found no dead links (74 of 102 opened; 28 refused the checker: WorldCat 429, science.org/NEJM/Mercatus/PPIC/econlib 403). So the first item with work in it was item 3, and Tata was the one Life in 27–60 committed once and never revisited.
**Did:** Seven of the eight claims were confirmed against Harris. One source line quoted Harris one word short ("capitalized … and called 30 lacs" for "capitalized it and called it 30 lacs") and gave p. 152 for the vesting order, which is on p. 153. The line is fixed and correction 32 is proposed, with `corrected: [32]` on the entry. The copy is unchanged. The opium-chests gloss stays, because Harris's sentence before the letter ("urged his sons to ensure a minimum quantity of freight") supports it.
**Opened / could not open:** Opened: Harris (1925), DLI scan `in.ernet.dli.2015.229072`, full text, and the main session itself checked the two errors against it. Also opened: Wacha, 2nd ed., the Rare Book Society of India PDF, searched by OCR. Not opened: Saklatvala (1970), the full 1898 letter to Vivekananda (only a summary of the tata.com transcript), and the IISc "Origin" PDF. All went to research-leads.md.
**Gates:** check, proofread, build and test all pass.
**Lessons:**
- archive.org DLI scans fetch cleanly with curl. The plain text is at `https://archive.org/download/<id>/<file>_djvu.txt`. Find page numbers by the running heads (`… THE INSTITUTE: COMPLETION 153`), and check a page against the head *above* the line, not the one below.
- The entry's "not in … Saklatvala's 1970 life" was never backed by an opened document. When a Life claims something is absent from N books, check that every one of the N was opened.
- Do not fill a lead with bibliographic detail from memory. This run wrote a co-author and publisher for Saklatvala that nobody had read, and caught it before committing.
**Proposed change to the brief:** in §3 item 3, replace "Pick the Life whose figures were checked longest ago, or never" with "Pick the Life with the fewest commits touching it (`git log --oneline -- <file> | wc -l`), Lives № 27–60 first, then 01–26". That is how this run chose, and it is reproducible.

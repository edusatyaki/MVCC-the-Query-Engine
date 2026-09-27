# MVCC & the Query Engine - animated infographic deck

An infographic, motion-graphics retelling of a **PostgreSQL Internals** lecture,
built to be presented. Every concept from the source deck is here, but the
static slides are replaced with animated SVG scenes that build themselves one
step at a time as you talk.

It uses the same sketchnote design and presenter engine as
[Database-Optimization](https://github.com/edusatyaki/Database-Optimization).

## Run it

```bash
python3 serve.py 8105
```

Then open <http://localhost:8105>. `serve.py` sends `no-store` on every
response, so a plain reload always shows the file on disk. It is also
registered in `.claude/launch.json` as `mvcc-query-engine`.

## Driving it

The whole deck runs on the arrow keys.

| Key | Action |
|-----|--------|
| `Right` / `Space` / click | next step: advances the animation, then the slide |
| `Left` | previous step |
| `Down` / `Up` | skip to next / previous slide |
| `S` | speaker notes drawer |
| `O` | run of show: jump to any slide |
| `T` | light / dark theme |
| `F` *(or the **Present** button)* | full screen |
| `+` / `-` / `0` | type size, for the room you are in |
| `M` *(or the **Voice** button)* | mute / unmute the narrator |
| `V` | replay the narration for this page |
| `Home` / `End` | first / last slide |

34 slides, 74 pages, 21 cases: sized for an 80-minute class. Notes are written for speaking aloud, one per page, in plain language
a class 10 student can follow.

The counter in the rail is a **page number that counts right-arrow presses**:
every step is one page, so it runs from `Page 1 / 74` to `Page 74 / 74`, and
the run of show (`O`) lists the page each slide starts on.

## The narrator

Every page has a spoken explanation, in words a class 10 student can follow. The
teacher does not read the slide aloud: they explain the one idea behind it,
point at the picture ("see the arrow on top", "follow the numbers down the
middle"), use an everyday comparison (an ATM queue, a school notice board, a
cricket captain's batting order), and ask the class to guess before the answer.
It plays automatically each time the page changes, and stops the moment you
move on.

- The voice is **pre-recorded**: `audio/<slide>-<step>.mp3`, 74 clips, about 25
  minutes in total, 9 MB. It is Microsoft's neural Indian English male voice
  `en-IN-PrabhatNeural`, generated with the free `edge-tts` tool, so it sounds
  like a person rather than a robot. The next page's clip is fetched ahead of
  time, so there is no wait when you move on.
- If a clip cannot be played, the browser's own speech voice reads the same
  words instead, so the deck never goes silent.
- Browsers only allow sound after the first click or key press, so the narrator
  starts from your first interaction. The button reads *Voice: click to start*
  until then.
- **Mute** with the Voice button or `M`; the choice is remembered. `V` replays
  the current page. The button pulses while the teacher is talking.
- The scripts live in `NARRATION` inside `index.html`, one entry per step,
  keyed by slide id. Technical words are spelled the way they should be spoken
  (`P S Q L`, `x min`, `C T I D`). Speaker notes (`S`) stay separate, for the
  presenter.

### Re-recording after an edit

```bash
python3 -m venv .venv && .venv/bin/pip install edge-tts
.venv/bin/python tools/gen_audio.py              # every clip
.venv/bin/python tools/gen_audio.py casewait     # only the slides you name
```

The script reads `NARRATION` out of `index.html` (it needs `node`), sends each
line to Microsoft's speech service and writes the MP3s into `audio/`.

## Structure: requirement first, then cases

One table runs through the whole lecture: NeoBank's `accounts`, and row 101,
Asha's account with 50,000 in the Pune branch. Asha reads; Ravi writes.

**Every chapter opens with its requirement.** The chapter card is one page:
*the requirement* (what the system has to achieve), *why it is hard*, and the
list of cases the chapter will solve.

**Every case is short: one picture per click.** A strip at the top of the slide
shows the phase:

| Phase | What happens on screen |
|-------|------------------------|
| 1. Problem | A problem card asks the question, with the scene set up |
| 2. See it go wrong | One animation of the failure: the reader stuck at a lock, the report that adds up to 105,000, the row that vanishes mid-count (skipped when the problem card already shows it) |
| 3. Fix it | The fix as a picture plus the real psql commands, with a one-line takeaway |

| Ch | Chapter | The requirement | Cases |
|----|---------|-----------------|-------|
| 1 | One table, one story | One small bank table every idea can be checked on | (setup) |
| 2 | Readers and writers | Many people read and change the same data at once; nobody sees a half-finished change | 1-2 |
| 3 | Keeping two versions | Keep the old and new value side by side, and let each person pick the right one | 3-6 |
| 4 | Deleting, undoing, cleaning | Handle DELETE, cancelling a change, and cleaning up old copies | 7-11 |
| 5 | Reading your query | Turn typed text into something the database understands, and catch mistakes early | 12-14 |
| 6 | Choosing the fastest way | Find the fastest way to the answer without trying every way first | 15-19 |
| 7 | Running the plan | Send rows early, use little memory, show each person only what they should see | 20-21 |

Part 1 (MVCC) is chapters 2 to 4. Part 2 (query processing) is chapters 5 to 7.
The two halves meet in case 21, where every `next()` on the scan node runs the
xmin/xmax visibility rule from Part 1.

## ctid, xmin and xmax, explained

Chapter 3 explains the three hidden columns on pages 17-23, built around the
**replace principle**: an UPDATE never edits a row. It *ends* the old version
(old `xmax` = my transaction number) and *creates* a new one (new `xmin` = the
same number, at a new `ctid`). The same number in the old `xmax` and the new
`xmin` is what links them, and a red arrow draws that link on pages 17 and 20.
Every version can be read as a sentence: *"I live at (0,2), I was born by 802,
and nobody has ended me."*

| Column | Meaning | Read it as |
|--------|---------|-----------|
| `ctid` | the row version's address in the table, `(page, slot)`; `(0,2)` is page 0, slot 2 | where it lives |
| `xmin` | the number of the transaction that created this version | born by |
| `xmax` | the number of the transaction that deleted or replaced it; `0` means nobody has | ended by |

Then one click per command shows the stored versions with the changed value
highlighted, next to the real `SELECT ctid, xmin, xmax, balance` output:
INSERT sets `xmin`; UPDATE sets the old version's `xmax` and writes a new version
at a new `ctid` with a new `xmin`; DELETE only sets `xmax`; ROLLBACK leaves the
cancelled number on disk but it counts as 0. A cheat-sheet table closes it, with
the rule that a number in `xmin` or `xmax` only counts if that transaction
finished. The narrator explains each of these, and the voice on the row-versions,
stickers and watch-it-work pages now spells out what each value means.

## Real PostgreSQL in every case

Every case shows the actual commands in a psql window, with the output
PostgreSQL prints, next to the picture, so the idea is tied to code:

| Case | What the psql window runs |
|------|---------------------------|
| Row versions | `SELECT ctid, balance ...` before and after an `UPDATE`: the address changes |
| Stickers | `SELECT xmin, xmax, acc_no, balance FROM accounts` |
| Watch it work | Two sessions on one timeline with `txid_current()`, `UPDATE`, `COMMIT` and `xmin/xmax` |
| DELETE | A `REPEATABLE READ` report still counts 3 after another session's `DELETE` |
| ROLLBACK | `BEGIN; UPDATE ...; ROLLBACK;` and the old balance is back at once |
| VACUUM | `n_dead_tup` from `pg_stat_user_tables` before and after `VACUUM` |
| Bloat | `pg_relation_size` from 94 MB to 188 MB after `UPDATE accounts SET balance = balance * 1.01`; `autovacuum_vacuum_scale_factor`; `VACUUM ANALYZE` |
| Parser / analyzer | The real error messages: syntax error at "FORM", relation does not exist, `text > integer`, permission denied |
| Views | `EXPLAIN SELECT ... FROM pune_hnw` reads `accounts` |
| Planner | `CREATE INDEX`; `EXPLAIN` for Seq Scan, Index Scan, Bitmap Heap Scan, the hash join and the winning plan; `pg_stats` for statistics |
| Executor | The `EXPLAIN` stack (Limit, Sort, Scan) and the final three rows |

The outputs are written to match the lecture's NeoBank numbers (1,000,000
rows, 12,000 pages, Pune 30%); XIDs, sizes and costs are illustrative.

## What is animated

| Scene | Motion |
|-------|--------|
| Problem scenes | Each case first animates what breaks: an in-place overwrite that destroys 50000, a sum that invents 5,000, a DELETE that makes a count wrong, an undo log copied back row by row, 990,000 index hops, 20 all-pairs join lines, nodes that buffer a million rows |
| psql timeline | Chapter 2 shows two psql sessions as one timeline: numbered moments run down the middle, and each line appears in Ravi's or Asha's window in the order it happened (BEGIN, UPDATE, Asha's SELECT, COMMIT, SELECT again). In a lock-only database Asha's SELECT hangs until moment 5; in PostgreSQL it returns 50000 at moment 3 and 40000 after the commit. The report case shows SUM(balance) starting at moment 1, the transfer committing at moments 2-5, and the report still printing 100000 at moment 6 |
| Locks make readers wait | Ravi's UPDATE reaches the row and locks it; Asha's SELECT stalls at the lock |
| The core promise | Two versions of the row; Asha's query takes the finished one and returns at once |
| A report that adds up | A transfer lands mid-count and the total comes out 105,000; with a snapshot it is 100,000 |
| Append-only versions | UPDATE expires v1 and appends v2 at a new ctid in the heap page |
| The rule | A tuple passes Rule 1 and Rule 2, joined by AND, and comes out visible |
| Watch it work | The two versions of Asha's row, marked visible or invisible, before and after Ravi finishes |
| DELETE and ROLLBACK | xmax is stamped instead of the row being erased; an aborted XID leaves v2 invisible forever |
| VACUUM | Dead slots are pinned by a long report, then the rest are swept to free space |
| Bloat and autovacuum | The heap doubles after the interest job; dead tuples climb to a threshold in a sawtooth that tightens when the scale factor drops |
| The pipeline | The query rides into each of the four stages as it is named |
| Parse tree | The query's words arranged into a tree by the grammar |
| Analyzer | The query tree is checked against pg_class, pg_attribute, privileges and views in turn |
| Rewriter | The view node is replaced by its stored definition |
| Scan and join methods | A scan head sweeps pages; B-tree hops land on random pages; a bitmap visits pages in order; nested loop probes, hash builds and probes, merge zips |
| Choosing the winner | Seq, index and bitmap costs grow as bars and the cheapest turns green |
| Volcano | next() calls cascade down while rows bubble up |
| Where MVCC lives | Tuples stream out of the scan with their filter and visibility verdicts; the top three ride back to the client |

Motion respects `prefers-reduced-motion`: with that setting on, packets are not
emitted and entrances resolve instantly.

## Nothing off the page

A slide clips rather than scrolls, and an inner wrapper scales the step down if
it would not fit. All 74 pages were walked at 1280x760 with no script errors,
no label off the canvas, and no page needing to be scaled down.

## Checking for overlaps

`tools/overlap-audit.js` walks every page and step and lists anything that
overlaps: text on text inside the pictures, labels half across a box, lines
running through labels, page text on page text (sidebar, titles, cards,
terminals), text over a picture, and text cut off inside its box. Open the deck,
paste the file into the browser console, and an empty list means all clear.

It came back empty at 1024x768, 1280x760, 1366x640, 1440x900, 1920x1080 and the
narrow 820px layout, and at 130% and 150% text size. At normal text size no page
needs to be scaled down; at 130% and above the busiest pages (the psql
timelines) are scaled to fit by the deck's auto-fit, never cut off.

## Design

The sketchnote layout inherited from Database-Optimization: cream paper,
highlighter ribbons and hand-drawn boxes. **Every piece of text is Arial**,
headings, body, SQL and the labels inside the SVG scenes included, and no web
fonts are loaded. Arial runs wider than the original sketch faces, so the type
scale and the SVG label sizes were retuned to match. The page is plain ASCII:
arrows and symbols are drawn in SVG rather than typed as Unicode characters.

## Deploy

`.github/workflows/static.yml` publishes the repository to GitHub Pages on every
push to `main`. Enable Pages with the **GitHub Actions** source in the
repository settings for the first deploy.

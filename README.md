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
| `Home` / `End` | first / last slide |

42 slides, 157 steps. Notes are written for speaking aloud, one per step.

## Structure: it is a story

One table runs through the whole lecture: NeoBank's `accounts`, and row 101,
Asha's account with 50,000 in the Pune branch. Asha reads; Ravi writes. Seven
chapters, six of which open with a chapter card that states the situation,
names the problem, and only then turns to the mechanism.

| Ch | Chapter | The problem that opens it |
|----|---------|---------------------------|
| 1 | One table, one story | The running example: one table, a reader and a writer. |
| 2 | Readers and writers | If every write locks its row, every read of that row waits. |
| 3 | Row versions | How can Asha read 50000 while Ravi writes 40000 to the same row? |
| 4 | Deleting, undoing, cleaning | If nothing is overwritten, what do DELETE and ROLLBACK do, and who cleans up? |
| 5 | From SQL text to a query tree | A perfectly isolated transaction can still be slow. |
| 6 | Choosing the cheapest plan | The same query can be answered in many ways, some far slower. |
| 7 | Running the plan | The planner hands over a tree; something has to run it. |

Part 1 (MVCC) is chapters 2 to 4. Part 2 (query processing) is chapters 5 to 7.
The two halves meet on the execution-trace slide, where every `next()` on the
scan node runs the xmin/xmax visibility rule from Part 1.

## What is animated

| Scene | Motion |
|-------|--------|
| Locks make readers wait | Ravi's UPDATE reaches the row and locks it; Asha's SELECT stalls at the lock |
| The core promise | Two versions of the row; Asha's query takes the committed one and returns at once, while a second writer still queues |
| Long reads | Transfers tick past on a five-minute timeline while the report's snapshot line stays put |
| Append-only versions | UPDATE expires v1 and appends v2 at a new ctid in the heap page |
| The rule | A tuple passes Rule 1 and Rule 2, joined by AND, and comes out visible |
| Tracing xmin / xmax | The heap is redrawn at each XID, with each tuple marked visible, invisible or dead for the current reader, while the event table grows one row per step |
| DELETE and ROLLBACK | xmax is stamped instead of the row being erased; an aborted XID leaves v2 invisible forever |
| VACUUM | Dead slots are pinned by a long report, then swept to free space, then compacted by VACUUM FULL |
| Bloat and autovacuum | The heap doubles after the interest job; dead tuples climb to a threshold in a sawtooth that tightens when the scale factor drops |
| The pipeline | The query rides into each of the four stages as it is named |
| Parse tree | The tree builds one branch per step |
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
it would not fit. Every one of the 157 steps was walked at 1074x863 in both
themes: no errors, and no step needed more than the 3% safety margin.

## Design

A **sketchnote**, inherited from Database-Optimization: cream paper, marker
headings, highlighter ribbons and hand-drawn boxes. Caveat for headings,
Patrick Hand for body text, JetBrains Mono for SQL. The page is plain ASCII:
arrows and symbols are drawn in SVG rather than typed as Unicode characters.

## Deploy

`.github/workflows/static.yml` publishes the repository to GitHub Pages on every
push to `main`. Enable Pages with the **GitHub Actions** source in the
repository settings for the first deploy.

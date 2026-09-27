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

40 slides, 182 steps, 22 cases. Notes are written for speaking aloud, one per step.

## Structure: requirement first, then cases

One table runs through the whole lecture: NeoBank's `accounts`, and row 101,
Asha's account with 50,000 in the Pune branch. Asha reads; Ravi writes.

**Every chapter opens with its requirement.** The chapter card builds in four
steps: the chapter name, *the requirement* (what the system has to achieve),
*why it is hard*, and the list of cases the chapter will solve.

**Every case runs in three phases**, shown as a strip at the top of the slide:

| Phase | What happens on screen |
|-------|------------------------|
| 1. The problem | A problem card states the situation as a question, with the scene set up but nothing solved |
| 2. See the problem | The failure is animated: the reader stuck at a lock, the report that adds up to 105,000, the row that vanishes mid-count |
| 3. Solve it (step k of n) | The fix is built visually, one step per click, with the problem kept in view above it |

| Ch | Chapter | The requirement | Cases |
|----|---------|-----------------|-------|
| 1 | One table, one story | One shared example every idea can be tested on | (setup) |
| 2 | Readers and writers | Many readers and writers on the same rows; no dirty reads, no needless waiting | 1-2 |
| 3 | Row versions | A place for both versions, a label on each, and a rule that picks one | 3-6 |
| 4 | Deleting, undoing, cleaning | Remove rows, cancel work, and clear old versions without unbounded growth | 7-12 |
| 5 | From SQL text to a query tree | Check grammar, names, types and permissions, and expand views | 13-15 |
| 6 | Choosing the cheapest plan | Find the fastest way to 15,000 of 1,000,000 rows without trying them all | 16-20 |
| 7 | Running the plan | Stream rows early, use little memory, and apply MVCC to every tuple | 21-22 |

Part 1 (MVCC) is chapters 2 to 4. Part 2 (query processing) is chapters 5 to 7.
The two halves meet in case 22, where every `next()` on the scan node runs the
xmin/xmax visibility rule from Part 1.

## What is animated

| Scene | Motion |
|-------|--------|
| Problem scenes | Each case first animates what breaks: an in-place overwrite that destroys 50000, a sum that invents 5,000, a DELETE that makes a count wrong, an undo log copied back row by row, 990,000 index hops, 20 all-pairs join lines, nodes that buffer a million rows |
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
it would not fit. All 182 steps were walked at 1280x760 with no script errors;
only one step needs scaling at all, and only to 90%.

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

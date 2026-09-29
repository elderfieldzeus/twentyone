# Journal

<!-- One recap per phase, newest last, added by gw-approve when a phase closes. Plain words, under about
     150 words each, and links to cards instead of copying them. For example:

## Phase 1: Voting works (2026-09-24)
- **Shipped:** members can see this month's books and vote once each ([1.1](cards/1.1-book-list.md), [1.2](cards/1.2-voting.md)).
- **Try it:** run `npm run dev`, open http://localhost:3000 and vote.
- **Decisions:** SQLite for storage ([0001](decisions/0001-database.md)).
- **Calls:** results stay hidden until the vote closes (card 1.2).
- **Lessons added:** L-004, write a behavior spec before UI animation.
-->

## Phase 1: Tested blackjack engine (2026-09-28)
- **Shipped:** the app foundation, card and shoe state, hand scoring, and the game engine ([1.1](cards/1.1-app-foundation.md), [1.2](cards/1.2-cards-and-shoe.md), [1.3](cards/1.3-hand-scoring.md), [1.4](cards/1.4-game-state-engine.md)).
- **Try it:** run `npm test` to run 21 unit tests and one browser test.
- **Decisions:** App Router, Tailwind CSS, Motion, Vitest, Testing Library, and Playwright ([0001](decisions/0001-nextjs-router.md), [0002](decisions/0002-styling.md), [0003](decisions/0003-animation.md), [0004](decisions/0004-testing.md)).
- **Calls:** use immutable state, stable card IDs, learning units, and pure game transitions.
- **Lessons added:** none.

## Phase 2: Exact move analysis (2026-09-28)
- **Shipped:** exact stand, hit, double, split, resplit, and best-move evaluation ([2.1](cards/2.1-stand-and-hit-analysis.md), [2.2](cards/2.2-double-and-split-analysis.md), [2.3](cards/2.3-best-move-evaluation.md)).
- **Try it:** run `npm test` to run 34 unit tests and one browser test.
- **Decisions:** no new stack decisions.
- **Calls:** optimize later hit choices, return `null` for invalid moves, and use a strict tolerance for tied moves.
- **Lessons added:** none.

## Phase 3: Playable casino table (2026-09-28)
- **Shipped:** a responsive casino table, complete hand controls, split-hand pages, and card motion ([3.1](cards/3.1-casino-table-shell.md), [3.2](cards/3.2-core-hand-controls.md), [3.3](cards/3.3-split-hand-play.md), [3.4](cards/3.4-card-animation.md)).
- **Try it:** run `npm run dev`, open the printed URL, deal a hand, and use the available actions.
- **Decisions:** no new stack decisions.
- **Calls:** use semantic regions, stable browser fixtures, system motion settings, fixed hand pages, private hole-card values, and delayed results.
- **Lessons added:** none.

## Phase 4: Visible move guidance (2026-09-29)
- **Shipped:** post-move analysis, table options, and persistent session progress ([4.1](cards/4.1-move-analysis-panel.md), [4.2](cards/4.2-table-options.md), [4.3](cards/4.3-session-progress.md)).
- **Try it:** run `npm run dev`, play a hand, change table options, and inspect the progress counters.
- **Decisions:** standard moves stay exact, while Split uses a labeled estimate ([0005](decisions/0005-exact-split-analysis.md)).
- **Calls:** analysis runs off the interface thread, browser checks run serially, and pending grades settle exactly once across session boundaries.
- **Lessons added:** none.

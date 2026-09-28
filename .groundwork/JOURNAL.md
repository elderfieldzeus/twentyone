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

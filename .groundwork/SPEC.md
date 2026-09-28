# Twentyone: Spec

Status: confirmed · Last updated: 2026-09-28

## Problem
Blackjack players cannot easily see whether each move was statistically correct while they play.
Twentyone combines a playable game with immediate analysis after each player move.

## Users
- Blackjack players who want to practice against a simulated dealer.
- Learners who want to compare each move with the statistically best move.

## Goals
- A user can play blackjack against one simulated dealer.
- Cards move with clean animations during play.
- After each player move, the interface shows the move probabilities in a right-side analysis panel.
- The analysis identifies the best move independently of the hand result.

## Non-goals
- Multiplayer blackjack.
- A persistent database.

## Features
### Blackjack game
A user plays blackjack one-on-one against a simulated dealer.
By default, each hand starts with a freshly shuffled six-deck shoe.
The dealer stands on soft 17.
The dealer receives a hidden card and checks for blackjack before the player moves.
When the dealer has no hidden card, the dealer draws the second card after all player hands finish.
The player can hit, stand, double down, and split.
The player can split two cards with the same value.
Ten, jack, queen, and king have the same value for splitting.
The player can create no more than four hands.
The player can double down after a split.
Each split ace receives one additional card.
The player cannot split aces a second time.
Twenty-one after a split is a normal 21, not blackjack.
Equal totals produce a push, including equal blackjacks.
The app has no bankroll, bet selection, or other betting controls.
Double-down analysis uses a theoretical two-unit result.

### Table options
The first version includes an options menu for table rules.
Users can change the deck count.
Users can change whether the shoe is shuffled after each hand.
Users can change whether the dealer has a hidden card.
Users can change whether the dealer stands on soft 17.
Users can change the maximum number of split hands.
Users can change whether doubling after a split is allowed.
Users can change whether aces can be split again.
Users can choose a 3:2 or 6:5 blackjack payout.
The default blackjack payout is 3:2.
Changing a table rule archives the current session and starts a new session with a new shoe.

### Card animation
Cards animate during gameplay.
The initial deal, card flip, hit, split, dealer draw, and card removal use animation.
The app provides a reduced-motion option.

### Move analysis
After each player move, a right-side panel shows the probabilities for the available moves.
The panel identifies the statistically best move even when the user's move produces a good result.
When automatic shuffling is on, analysis does not use cards from earlier hands.
When automatic shuffling is off, analysis uses the actual cards left in the shoe.
For each available move, the panel shows win, push, and loss probabilities and expected value.
The app calculates probabilities exactly instead of using repeated simulation.
Probabilities appear with one decimal place.
Expected value appears with two decimal places.
The panel clearly labels the best move.
The panel stays hidden until the player acts.
It then shows whether the selected move was best and compares all moves available before the action.
The selected move receives a `Best move` or `Not the best move` grade.
After a hit, the panel shows feedback for that hit but does not reveal the next best move.
The next decision remains unassisted until the player acts again.

### Learning history
The app tracks hands played, wins, losses, pushes, and correct move percentage.
Reset archives the current session and starts new counters.
The app saves learning history in local browser storage.
Users can delete saved history with a separate action.
Users can reopen a saved hand for review.
Users can retry a move that was not the best move.
Each saved hand contains its cards, actions, move grades, probabilities, result, table rules, and time.
Retry attempts do not change the saved hand or session statistics.
Saved reviews let users move backward and forward through each decision.
Each review step shows the cards, probabilities, and selected move for that decision.
A retry restores the exact cards and table rules from that decision.

### Casino interface
The website looks and feels like a blackjack table in a casino.
The game area uses a dark green table surface and familiar casino card placement.
The analysis area stays clean and readable beside the table.
The interface does not copy Chess.com branding.
The game supports keyboard controls, touch controls, and screen readers.
Move grades use text or symbols in addition to color.

### Later phases
No later features are defined yet.

## Constraints
- The app uses Next.js and TypeScript.
- The app is frontend-only and has no database.
- The analysis experience uses Chess.com Game Review as an interaction reference without copying its branding.
- On small screens, the analysis panel appears below the table instead of to its right.

## Codebase map
- `.groundwork/` contains the product spec, workflow, cards, and evidence. (found)
- `app/` will contain routes, layouts, and page composition. (planned)
- `components/` will contain casino table, card, control, analysis, and review components. (planned)
- `lib/blackjack/` will contain cards, rules, game state, and exact analysis. (planned)
- `lib/history/` will contain local session and hand storage. (planned)
- `tests/` will contain shared test support and browser journeys. (planned)

## Changes
None.

## Open questions
None.

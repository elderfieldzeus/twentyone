# Review evidence

- `npm test`: 36 unit tests and 13 browser tests passed.
- `npm run lint`: passed with no errors.
- `npm run build`: production build completed.
- Standard-motion browser check: cards reported active movement and controls stayed locked during transitions.
- Reduced-motion browser check: controls stayed available and cards reported no active movement.
- Opening-deal browser check: four cards moved in player, dealer, player, dealer order.
- Dealer-total browser check: the total excluded the hidden card until it flipped.
- Flip browser check: the front and back faces stayed mounted through the rotation.
- Hidden-card browser check: the card back received the center hit target before the flip.
- Hole-card privacy check: the front face did not exist in the page before dealer reveal.
- Reset browser check: all finished cards exited together before the next deal.
- Empty-table browser check: the first load showed no cards.
- Dealer-play browser check: each hit appeared separately before the total and result finished.
- Hole-card motion check: the covered card moved into place with no front face mounted.
- Dealer-stack check: hit cards did not reuse opening-deal positions.
- Visible-travel check: the covered hole card stayed opaque while it was still moving.
- Result-timing check: outcomes stayed hidden through the reveal and dealer hits.

The card transitions use layout motion for deal, hit, split, dealer draws, flips, and removal.
Exiting cards leave the access tree during their visual removal.

Verdict: all acceptance criteria passed.
No project lessons apply.

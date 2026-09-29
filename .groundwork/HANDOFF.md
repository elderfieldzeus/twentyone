# Handoff

<!-- The current state, overwritten (not appended) at every role change and before stopping.
     A fresh session, in any tool or model, should be able to continue from this file plus the current card. -->

- **Phase:** 4 of 5, Visible move guidance
- **Current card:** none
- **Status:** Card 4.2 passed review and is ready for the runner commit
- **Last step:** Re-review passed all checks, live desktop and mobile verification, and decision 0002 compliance
- **Next step:** commit card 4.2, then continue with the next eligible Phase 4 card
- **Failing checks:** none
- **Notes:** Only the covered card back exists before dealer reveal. Results wait for the dealer reveal and all dealer hits.
- **Notes:** Keep the large center suit visible on mobile. Keep desktop cards unchanged.
- **Notes:** Split hands show one per phone page and two per tablet or desktop page.
- **Notes:** Move analysis stays hidden before play and remains linked to the acted hand.
- **Notes:** Standard move results use the actual shoe. Exact split results run in a web worker.
- **Notes:** Selected grade and Best prior move are visible.
- **Notes:** Deal no longer blocks. Exact standard feedback takes about 4 seconds. Lint and build pass.
- **Notes:** The current exact joint solver uses four bounded workers. Lint and build pass.
- **Notes:** Standard moves stay exact. Split results can be approximate and must say so.
- **Notes:** Approximate split feedback appears in about 3 seconds. All focused card checks pass.
- **Notes:** Analysis runs off the UI thread. Browser checks run serially for stable UI timing.
- **Notes:** Mixed feedback completes within 15 seconds. Standard rows are exact. Split has a row-level estimate label.
- **Notes:** Applying options stores the prior session locally, clears the table, and prepares a new shoe.
- **Notes:** Disabling hand shuffling keeps the remaining shoe between hands.
- **Notes:** Another project owns port 3100. Validation used isolated port 3200 without changing project config.

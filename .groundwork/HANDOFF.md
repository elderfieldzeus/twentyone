# Handoff

<!-- The current state, overwritten (not appended) at every role change and before stopping.
     A fresh session, in any tool or model, should be able to continue from this file plus the current card. -->

- **Phase:** 5 of 5, Learning history
- **Current card:** none
- **Status:** Card 5.1 passed review and is done
- **Last step:** Reviewer verified separate split-hand archive records; unit, lint, TypeScript, and Webpack build checks passed
- **Next step:** start card 5.2
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
- **Notes:** Card 4.3 failing checks also ran against Twentyone on isolated port 3200.
- **Notes:** Each split hand settlement counts as one completed hand. Blackjack counts as a win.
- **Notes:** Table option changes archive and reset session progress.
- **Notes:** Fast Hit then Stand records 2 decisions, 1 correct decision, and 50% accuracy.
- **Notes:** A pending prior-hand grade updates stored progress exactly once and cannot restore old feedback after the next hand starts.
- **Notes:** Reload recovers pending grades without feedback. Reset and Apply options settle pending grades into the archive before zeroing progress.
- **Notes:** Card 5.1 tests use a Session history button and region, plus separate summary and hands archive fields.
- **Notes:** Saved-card checks allow complete arrays while requiring the expected card and action entries.
- **Notes:** Unit checks pass: 6 files and 36 tests. Lint has no errors and one warning.
- **Notes:** Card 5.1 browser checks and the default Turbopack build remain unverified because the environment blocked port binding with EPERM.

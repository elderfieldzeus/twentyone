# Failing test evidence

- `npm run test:e2e -- tests/e2e/split-hand-play.spec.ts`
- Result: 1 test failed.
- Failure: the Split button was not present after a same-value deal.

The engine tests for four hands, repeated splits, and split aces pass.
The browser failure shows that the missing work is the table interface.

## Hand carousel revision

- `npx playwright test --config /tmp/twentyone-playwright.config.ts tests/e2e/split-hand-play.spec.ts`
- Result: the existing split test passed and the new responsive page tests failed.
- Failure: the `Player hand pages` navigation did not exist.

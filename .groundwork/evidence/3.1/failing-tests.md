# Failing tests

Command: `npm run test:e2e -- tests/e2e/casino-shell.spec.ts`

Summary: Browser tests failed because the casino table and analysis regions do not exist.

```text
Running 2 tests using 1 worker
FAIL shows an accessible casino table and desktop analysis area
The Blackjack table region was not found.
```

## Mobile card-face revision

- `npx playwright test --config /tmp/twentyone-playwright.config.ts tests/e2e/casino-shell.spec.ts --grep "center suit"`
- Result: 1 test failed.
- Failure: the mobile corner suit was visible before the responsive rule.

# Failing test evidence

- `npm run test:e2e -- tests/e2e/card-animation.spec.ts`
- Result: 2 tests failed.
- Failures: the table had no standard or reduced motion state.

The failures confirm that card motion, action locks, and reduced-motion behavior are not implemented.

# Failing test evidence

- `npm run test:e2e -- tests/e2e/card-animation.spec.ts`
- Result: 2 tests failed.
- Failures: the table had no standard or reduced motion state.

The failures confirm that card motion, action locks, and reduced-motion behavior are not implemented.

## Revision

- `npm run test:e2e -- tests/e2e/card-animation.spec.ts`
- Result: the opening-deal test failed before the revision.
- Failure: no cards exposed a deal position, so the browser could not find a one-by-one sequence.

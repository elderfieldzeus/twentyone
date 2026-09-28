# Failing tests

Command: `npm run test:unit -- tests/unit/double-split-analysis.test.ts`

Summary: 5 tests failed because double and split analysis functions do not exist.

```text
FAIL  tests/unit/double-split-analysis.test.ts
TypeError: analyzeDouble is not a function
TypeError: analyzeSplit is not a function
Test Files  1 failed (1)
Tests  5 failed (5)
```

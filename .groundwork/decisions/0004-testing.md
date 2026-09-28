---
id: 0004
title: Test tools
status: accepted
date: 2026-09-28
---
## Context
Twentyone needs fast tests for exact blackjack calculations and browser tests for gameplay and animation behavior.
The tools must support TypeScript and Next.js.

## Options
### A. Vitest, Testing Library, and Playwright
Use Vitest for logic and component tests, Testing Library for user-facing component behavior, and Playwright for browser tests.

Pros:
- Provides fast TypeScript tests for the calculation engine.
- Covers browser behavior with real end-to-end tests.

Cons:
- Uses separate tools for local tests and browser tests.
- Requires browser installation for Playwright.

Switching later requires converting test configuration, mocks, and browser fixtures.

### B. Jest, Testing Library, and Playwright
Use Jest for logic and component tests, Testing Library for user-facing component behavior, and Playwright for browser tests.

Pros:
- Uses a mature test runner with broad library support.
- Covers browser behavior with real end-to-end tests.

Cons:
- Needs more configuration for current TypeScript and module patterns.
- Uses separate tools for local tests and browser tests.

Switching later requires converting test configuration, mocks, and browser fixtures.

## Decision
The human chose option A with the reply `AAAA`.
Twentyone will use Vitest, Testing Library, and Playwright.

## Consequences
Vitest will run logic and component tests.
Testing Library will check user-facing component behavior.
Playwright will check complete browser journeys and visual states.

---
id: 0001
title: Next.js router
status: accepted
date: 2026-09-28
---
## Context
Twentyone needs a Next.js application structure before implementation starts.
The app is frontend-only, but it includes several game and review screens.

## Options
### A. App Router
Use the current Next.js `app` directory model.

Pros:
- Supports layouts and modern Next.js features.
- Matches the main path for new Next.js applications.

Cons:
- Requires clear client component boundaries for the interactive game.

Switching later requires moving routes and revising component boundaries.

### B. Pages Router
Use the older Next.js `pages` directory model.

Pros:
- Uses a simple and established client rendering model.
- Has a large set of existing examples.

Cons:
- Does not use the main structure for new Next.js applications.

Switching later requires moving every route and layout.

## Decision
The human chose option A with the reply `AAAA`.
Twentyone will use the Next.js App Router.

## Consequences
Routes and layouts will use the `app` directory.
Interactive game components will use explicit client component boundaries.

---
id: 0002
title: Styling system
status: accepted
date: 2026-09-28
---
## Context
Twentyone needs a responsive casino interface with detailed card and table visuals.
The styling system must support accessible states and a small-screen layout.

## Options
### A. Tailwind CSS
Use utility classes with a small global theme layer.

Pros:
- Makes responsive layout and state styling fast to inspect.
- Keeps most styles close to their components.

Cons:
- Can make complex component markup harder to scan.
- Requires Tailwind knowledge for consistent use.

Switching later requires rewriting most component class names.

### B. CSS Modules
Use one scoped CSS file for each component or feature.

Pros:
- Keeps markup shorter.
- Uses standard CSS without a utility framework.

Cons:
- Spreads responsive and state rules across more files.
- Requires manual theme conventions.

Switching later requires moving and rewriting most component styles.

### C. Vanilla CSS
Use global CSS with component naming rules.

Pros:
- Adds no styling dependency.
- Gives direct control over every rule.

Cons:
- Makes style isolation and naming discipline manual.
- Can become difficult to maintain as the interface grows.

Switching later requires reorganizing selectors and component styles.

## Decision
The human chose option A with the reply `AAAA`.
Twentyone will use Tailwind CSS.

## Consequences
Responsive layout and visual states will use Tailwind utilities.
A small global theme layer will define shared casino colors and design values.

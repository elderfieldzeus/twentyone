---
id: 0003
title: Card animation
status: accepted
date: 2026-09-28
---
## Context
Twentyone needs smooth deal, flip, hit, split, draw, and removal animations.
Animations must respect reduced-motion preferences.

## Options
### A. Motion
Use the Motion library for React layout and state animations.

Pros:
- Handles entry, exit, layout, and gesture animation through one API.
- Makes split-hand layout transitions easier to coordinate.

Cons:
- Adds a runtime dependency and bundle cost.
- Requires care to prevent animation state from controlling game state.

Switching later requires rewriting animated wrappers and transition definitions.

### B. CSS animations
Use CSS transitions and keyframes with React state classes.

Pros:
- Adds no animation dependency.
- Keeps simple animations close to the visual layer.

Cons:
- Makes coordinated layout and exit animations more complex.
- Requires more manual timing and cleanup logic.

Switching later requires replacing animation classes and event handling.

## Decision
The human chose option A with the reply `AAAA`.
Twentyone will use Motion for React.

## Consequences
Motion will handle card entry, exit, flip, and layout transitions.
Game rules will remain separate from animation state.

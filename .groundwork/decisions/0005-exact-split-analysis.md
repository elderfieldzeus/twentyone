---
id: 0005
title: Exact split analysis architecture
status: accepted
date: 2026-09-29
---
## Context
The move panel must show exact results from the actual finite shoe.
Exact analysis for up to four split hands does not finish within the 60-second live limit.
The current TypeScript solver uses canonical rank counts, bounded caches, and four workers.
Independent hand analysis is not exact because each hand changes the shoe for later hands and the dealer.
The app must stay frontend-only unless this decision changes that constraint.

## Options
### A. Compressed TypeScript value function
Keep the frontend-only stack and replace the joint search with a more compact exact dynamic program.

Pros:
- Keeps the current Next.js and TypeScript stack.
- Keeps actual-shoe results exact.
- Needs no service or network request.

Cons:
- Has high algorithm risk.
- Can still miss the live limit or exceed browser memory.
- Needs more profiling and proof before the card can pass.

Switching later discards specialized solver work but keeps the panel contract.

### B. Bundled WebAssembly solver
Implement the exact solver in a compiled language and run it in browser workers.

Pros:
- Keeps analysis local and frontend-only.
- Gives tighter memory control and faster computation.
- Keeps actual-shoe results exact.

Cons:
- Adds a compiled WebAssembly build step and toolchain.
- Adds a second implementation language.
- Native speed does not guarantee that the current search finishes within 60 seconds.

Switching later requires replacing the WebAssembly interface and build step.

### C. Analysis service
Run the exact solver in a server process with more memory and CPU.

Pros:
- Supports native code and larger shared caches.
- Keeps heavy work outside the browser.
- Can scale compute separately from the interface.

Cons:
- Changes the frontend-only constraint.
- Adds hosting, network delay, failure handling, and operating cost.
- Sends hand and shoe state to a service.

Switching later requires replacing the service API and deployment setup.

### D. Approximate split results
Use sampling or a reduced shoe model only for split moves.

Pros:
- Returns feedback quickly in the current browser stack.
- Uses much less memory.

Cons:
- Breaks the confirmed exact-analysis requirement.
- Makes split results inconsistent with other moves.
- Requires visible accuracy wording and different tests.

Switching later requires replacing stored split results and user-facing accuracy text.

## Decision
The human first selected option A: "A".
Option A reached its documented time and memory failure condition.
The human then selected option D: "ok D".

## Consequences
The app keeps its frontend-only TypeScript stack.
Standard move analysis remains exact for the actual finite shoe.
Split analysis uses a fast approximate calculation.
The panel must clearly label approximate split results.
The browser must show split feedback within the live limit.
No service or WebAssembly toolchain is added.

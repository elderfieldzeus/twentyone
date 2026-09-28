import { describe, expect, it } from "vitest";

import { createDeck, type Card, type Rank, type Shoe } from "@/lib/blackjack/cards";
import { applyAction, availableActions, createGame, defaultRules } from "@/lib/blackjack/game";

function shoe(...ranks: Rank[]): Shoe {
  const deck = createDeck();
  const used = new Set<string>();
  const cards = ranks.map((rank) => {
    const card = deck.find((candidate) => candidate.rank === rank && !used.has(candidate.id));
    if (!card) throw new Error(`No card remains for ${rank}`);
    used.add(card.id);
    return card;
  });
  return { cards: cards as Card[], deckCount: 1 };
}

describe("game state", () => {
  it("deals a hidden dealer card and exposes valid opening actions", () => {
    const game = createGame(shoe("8", "10", "8", "7", "2", "3"), defaultRules);

    expect(game.dealer.cards).toHaveLength(2);
    expect(game.dealer.holeRevealed).toBe(false);
    expect(availableActions(game)).toEqual(["hit", "stand", "double", "split"]);
  });

  it("hits once and blocks double down after the opening cards", () => {
    const game = createGame(shoe("5", "10", "6", "7", "2"), defaultRules);
    const hit = applyAction(game, "hit");

    expect(hit.playerHands[0].cards).toHaveLength(3);
    expect(availableActions(hit)).toEqual(["hit", "stand"]);
  });

  it("doubles for one card and a two-unit result", () => {
    const game = createGame(shoe("5", "10", "6", "7", "K"), defaultRules);
    const doubled = applyAction(game, "double");

    expect(doubled.playerHands[0]).toMatchObject({ status: "stood", units: 2 });
    expect(doubled.playerHands[0].cards).toHaveLength(3);
    expect(doubled.phase).toBe("complete");
  });

  it("splits same-value cards into two active hands", () => {
    const game = createGame(shoe("8", "10", "8", "7", "2", "3", "10"), defaultRules);
    const split = applyAction(game, "split");

    expect(split.playerHands).toHaveLength(2);
    expect(split.playerHands.map((hand) => hand.cards.map((card) => card.rank))).toEqual([
      ["8", "2"],
      ["8", "3"],
    ]);
    expect(split.activeHandIndex).toBe(0);
  });

  it("blocks split and double actions when active rules forbid them", () => {
    const game = createGame(shoe("8", "10", "8", "7", "2", "3"), {
      ...defaultRules,
      maxSplitHands: 1,
      doubleAfterSplit: false,
    });

    expect(availableActions(game)).toEqual(["hit", "stand", "double"]);
    expect(() => applyAction(game, "split")).toThrow("Action split is not available");
  });

  it("supports repeated splits up to four hands", () => {
    let game = createGame(shoe("10", "5", "J", "6", "Q", "K", "2", "3", "4", "7"), defaultRules);

    game = applyAction(game, "split");
    game = applyAction(game, "split");
    game = applyAction(game, "stand");
    game = applyAction(game, "stand");
    game = applyAction(game, "split");

    expect(game.playerHands).toHaveLength(4);
    expect(availableActions(game)).not.toContain("split");
  });

  it("deals one card to split aces and follows the resplit option", () => {
    const game = createGame(shoe("A", "10", "A", "7", "A", "5", "2", "3"), {
      ...defaultRules,
      resplitAces: true,
    });
    const split = applyAction(game, "split");

    expect(availableActions(split)).toEqual(["split"]);
    expect(split.playerHands[1].status).toBe("stood");
  });

  it("draws the second dealer card after player hands when no hole card is used", () => {
    const game = createGame(shoe("10", "6", "8", "A"), { ...defaultRules, dealerHasHoleCard: false });
    const complete = applyAction(game, "stand");

    expect(game.dealer.cards).toHaveLength(1);
    expect(complete.dealer.cards.map((card) => card.rank)).toEqual(["6", "A"]);
    expect(complete.phase).toBe("complete");
  });

  it("stands or hits on soft 17 according to the active rule", () => {
    const stands = applyAction(
      createGame(shoe("10", "A", "8", "6", "2"), { ...defaultRules, dealerStandsOnSoft17: true }),
      "stand",
    );
    const hits = applyAction(
      createGame(shoe("10", "A", "8", "6", "2"), { ...defaultRules, dealerStandsOnSoft17: false }),
      "stand",
    );

    expect(stands.dealer.cards).toHaveLength(2);
    expect(hits.dealer.cards).toHaveLength(3);
  });
});

import { describe, expect, it } from "vitest";

import { evaluateMoves, formatOutcome } from "@/lib/blackjack/evaluate";
import { createDeck, type Card, type Rank, type Shoe } from "@/lib/blackjack/cards";
import { defaultRules } from "@/lib/blackjack/game";

function takeCards(...ranks: Rank[]): Card[] {
  const deck = createDeck();
  const used = new Set<string>();
  return ranks.map((rank) => {
    const card = deck.find((candidate) => candidate.rank === rank && !used.has(candidate.id));
    if (!card) throw new Error(`No card remains for ${rank}`);
    used.add(card.id);
    return card;
  });
}

function shoe(...ranks: Rank[]): Shoe {
  return { cards: takeCards(...ranks), deckCount: 1 };
}

describe("move evaluation", () => {
  it("grades the highest expected value as the best move", () => {
    const moves = evaluateMoves({
      playerCards: takeCards("10", "K"),
      dealerCards: takeCards("10", "7"),
      shoe: shoe("2"),
      rules: defaultRules,
    });

    expect(moves.find((move) => move.action === "stand")?.grade).toBe("Best move");
    expect(moves.find((move) => move.action === "hit")?.grade).toBe("Not the best move");
  });

  it("grades tied top moves as best", () => {
    const moves = evaluateMoves({
      playerCards: takeCards("10", "9"),
      dealerCards: takeCards("10", "K"),
      shoe: shoe("K"),
      rules: defaultRules,
    });

    expect(moves.filter((move) => move.grade === "Best move").map((move) => move.action)).toEqual([
      "hit",
      "stand",
    ]);
  });

  it("omits double and split when they are unavailable", () => {
    const moves = evaluateMoves({
      playerCards: takeCards("2", "3", "4"),
      dealerCards: takeCards("10", "7"),
      shoe: shoe("10"),
      rules: defaultRules,
    });

    expect(moves.map((move) => move.action)).toEqual(["hit", "stand"]);
  });

  it("formats stable display values", () => {
    expect(formatOutcome({ win: 0.625, push: 0.125, loss: 0.25, expectedValue: 1 / 3 })).toEqual({
      win: "62.5%",
      push: "12.5%",
      loss: "25.0%",
      expectedValue: "+0.33",
    });
  });
});

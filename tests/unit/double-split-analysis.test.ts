import { describe, expect, it } from "vitest";

import { analyzeDouble, analyzeSplit } from "@/lib/blackjack/analysis";
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

describe("double-down analysis", () => {
  it("draws one card and applies a two-unit result", () => {
    const result = analyzeDouble({
      playerCards: takeCards("5", "6"),
      dealerCards: takeCards("10", "7"),
      shoe: shoe("10", "2"),
      rules: defaultRules,
    });

    expect(result).toEqual({ win: 0.5, push: 0, loss: 0.5, expectedValue: 0 });
  });

  it("rejects double after a hit or a forbidden split", () => {
    const common = { dealerCards: takeCards("10", "7"), shoe: shoe("10"), rules: defaultRules };
    expect(analyzeDouble({ ...common, playerCards: takeCards("2", "3", "4") })).toBeNull();
    expect(
      analyzeDouble({
        ...common,
        playerCards: takeCards("5", "6"),
        fromSplit: true,
        rules: { ...defaultRules, doubleAfterSplit: false },
      }),
    ).toBeNull();
  });
});

describe("split analysis", () => {
  it("deals both hands from one shared shoe without replacement", () => {
    const result = analyzeSplit({
      playerCards: takeCards("8", "8"),
      dealerCards: takeCards("10", "7"),
      shoe: shoe("10", "10"),
      rules: defaultRules,
    });

    expect(result?.expectedValue).toBe(2);
    expect(result?.hands).toHaveLength(2);
    expect(result?.hands.every((hand) => hand.win === 1)).toBe(true);
  });

  it("gives each split ace one card and treats 21 as a normal win", () => {
    const result = analyzeSplit({
      playerCards: takeCards("A", "A"),
      dealerCards: takeCards("10", "9"),
      shoe: shoe("K", "K"),
      rules: defaultRules,
    });

    expect(result?.expectedValue).toBe(2);
    expect(result?.hands.every((hand) => hand.expectedValue === 1)).toBe(true);
  });

  it("rejects non-pairs and the configured split limit", () => {
    const common = {
      dealerCards: takeCards("10", "7"),
      shoe: shoe("2", "3"),
      rules: defaultRules,
    };
    expect(analyzeSplit({ ...common, playerCards: takeCards("8", "9") })).toBeNull();
    expect(analyzeSplit({ ...common, playerCards: takeCards("8", "8"), currentHandCount: 4 })).toBeNull();
  });
});

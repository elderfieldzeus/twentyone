import { describe, expect, it } from "vitest";

import { createDeck, type Card, type Rank, type Shoe } from "@/lib/blackjack/cards";
import { analyzeHit, analyzeStand } from "@/lib/blackjack/analysis";
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

describe("exact stand analysis", () => {
  it("weights each unknown dealer card by its shoe frequency", () => {
    const result = analyzeStand({
      playerCards: takeCards("10", "8"),
      dealerCards: takeCards("10"),
      shoe: shoe("7", "10"),
      rules: defaultRules,
    });

    expect(result).toEqual({ win: 0.5, push: 0, loss: 0.5, expectedValue: 0 });
  });

  it("counts duplicate ranks as separate remaining cards", () => {
    const result = analyzeStand({
      playerCards: takeCards("10", "9"),
      dealerCards: takeCards("10"),
      shoe: shoe("8", "8", "10"),
      rules: defaultRules,
    });

    expect(result).toEqual({ win: 2 / 3, push: 0, loss: 1 / 3, expectedValue: 1 / 3 });
  });
});

describe("exact hit analysis", () => {
  it("counts every possible next card and returns certain loss when each card busts", () => {
    const result = analyzeHit({
      playerCards: takeCards("K", "Q"),
      dealerCards: takeCards("10", "7"),
      shoe: shoe("2", "K"),
      rules: defaultRules,
    });

    expect(result).toEqual({ win: 0, push: 0, loss: 1, expectedValue: -1 });
  });

  it("returns probabilities that total one", () => {
    const result = analyzeHit({
      playerCards: takeCards("10", "2"),
      dealerCards: takeCards("10", "7"),
      shoe: shoe("2", "5", "9"),
      rules: defaultRules,
    });

    expect(result.win + result.push + result.loss).toBeCloseTo(1, 12);
  });
});

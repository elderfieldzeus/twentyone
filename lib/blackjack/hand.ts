import type { Card } from "./cards";

export type HandScore = Readonly<{
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}>;

export type BlackjackPayout = "3:2" | "6:5";
export type HandResult = "blackjack" | "win" | "push" | "loss";

export type Settlement = Readonly<{
  result: HandResult;
  netUnits: number;
}>;

export function scoreHand(cards: readonly Card[], options: { fromSplit?: boolean } = {}): HandScore {
  const aceCount = cards.filter((card) => card.rank === "A").length;
  let total = cards.reduce((sum, card) => sum + card.value, 0);
  let reducedAces = 0;

  while (total > 21 && reducedAces < aceCount) {
    total -= 10;
    reducedAces += 1;
  }

  return {
    total,
    isSoft: aceCount > reducedAces,
    isBust: total > 21,
    isBlackjack: cards.length === 2 && total === 21 && !options.fromSplit,
  };
}

export function settleHand(
  player: HandScore,
  dealer: HandScore,
  blackjackPayout: BlackjackPayout,
): Settlement {
  if (player.isBust) {
    return { result: "loss", netUnits: -1 };
  }

  if (player.isBlackjack && dealer.isBlackjack) {
    return { result: "push", netUnits: 0 };
  }

  if (player.isBlackjack) {
    return { result: "blackjack", netUnits: blackjackPayout === "3:2" ? 1.5 : 1.2 };
  }

  if (dealer.isBlackjack) {
    return { result: "loss", netUnits: -1 };
  }

  if (dealer.isBust || player.total > dealer.total) {
    return { result: "win", netUnits: 1 };
  }

  if (player.total < dealer.total) {
    return { result: "loss", netUnits: -1 };
  }

  return { result: "push", netUnits: 0 };
}

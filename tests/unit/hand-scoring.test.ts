import { describe, expect, it } from "vitest";

import { createDeck, type Card, type Rank } from "@/lib/blackjack/cards";
import { scoreHand, settleHand } from "@/lib/blackjack/hand";

const deck = createDeck();

function cards(...ranks: Rank[]): Card[] {
  const available = [...deck];

  return ranks.map((rank) => {
    const index = available.findIndex((card) => card.rank === rank);
    const [card] = available.splice(index, 1);

    if (!card) {
      throw new Error(`No card remains for rank ${rank}`);
    }

    return card;
  });
}

describe("scoreHand", () => {
  it("scores hard and soft hands", () => {
    expect(scoreHand(cards("10", "7"))).toMatchObject({ total: 17, isSoft: false, isBust: false });
    expect(scoreHand(cards("A", "6"))).toMatchObject({ total: 17, isSoft: true, isBust: false });
  });

  it("reduces aces until the hand no longer busts", () => {
    expect(scoreHand(cards("A", "A", "9"))).toMatchObject({ total: 21, isSoft: true, isBust: false });
    expect(scoreHand(cards("A", "A", "9", "K"))).toMatchObject({ total: 21, isSoft: false, isBust: false });
  });

  it("identifies busts", () => {
    expect(scoreHand(cards("K", "Q", "2"))).toMatchObject({ total: 22, isBust: true });
  });

  it("identifies only an unsplit two-card 21 as blackjack", () => {
    expect(scoreHand(cards("A", "K"))).toMatchObject({ total: 21, isBlackjack: true });
    expect(scoreHand(cards("A", "K"), { fromSplit: true })).toMatchObject({ total: 21, isBlackjack: false });
    expect(scoreHand(cards("7", "7", "7"))).toMatchObject({ total: 21, isBlackjack: false });
  });
});

describe("settleHand", () => {
  it("returns a push for equal totals and equal blackjacks", () => {
    expect(settleHand(scoreHand(cards("10", "8")), scoreHand(cards("K", "8")), "3:2")).toEqual({
      result: "push",
      netUnits: 0,
    });
    expect(settleHand(scoreHand(cards("A", "K")), scoreHand(cards("A", "Q")), "3:2")).toEqual({
      result: "push",
      netUnits: 0,
    });
  });

  it("settles wins, losses, and busts", () => {
    expect(settleHand(scoreHand(cards("10", "9")), scoreHand(cards("10", "8")), "3:2")).toEqual({
      result: "win",
      netUnits: 1,
    });
    expect(settleHand(scoreHand(cards("10", "7")), scoreHand(cards("10", "8")), "3:2")).toEqual({
      result: "loss",
      netUnits: -1,
    });
    expect(settleHand(scoreHand(cards("K", "Q", "2")), scoreHand(cards("10", "8")), "3:2")).toEqual({
      result: "loss",
      netUnits: -1,
    });
  });

  it.each([
    ["3:2", 1.5],
    ["6:5", 1.2],
  ] as const)("pays blackjack at %s", (payout, netUnits) => {
    expect(settleHand(scoreHand(cards("A", "K")), scoreHand(cards("10", "9")), payout)).toEqual({
      result: "blackjack",
      netUnits,
    });
  });
});

import { describe, expect, it } from "vitest";

import { createDeck, createShoe, dealCard, startHand } from "@/lib/blackjack/cards";

describe("cards", () => {
  it("creates the 52 ranks and suits with blackjack values", () => {
    const deck = createDeck();

    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => `${card.rank}-${card.suit}`)).size).toBe(52);
    expect(deck.find((card) => card.rank === "A")?.value).toBe(11);
    expect(
      deck.filter((card) => ["10", "J", "Q", "K"].includes(card.rank)).every((card) => card.value === 10),
    ).toBe(true);
  });
});

describe("shoe", () => {
  it.each([
    [1, 52],
    [6, 312],
  ])("creates a %i-deck shoe with %i physical cards", (deckCount, cardCount) => {
    const shoe = createShoe(deckCount, () => 0.5);

    expect(shoe.cards).toHaveLength(cardCount);
    expect(new Set(shoe.cards.map((card) => card.id)).size).toBe(cardCount);
  });

  it("deals each physical card once and reports the remaining cards", () => {
    let shoe = createShoe(1, () => 0.5);
    const dealtIds = new Set<string>();

    while (shoe.cards.length > 0) {
      const dealt = dealCard(shoe);
      dealtIds.add(dealt.card.id);
      shoe = dealt.shoe;
    }

    expect(dealtIds.size).toBe(52);
    expect(shoe.cards).toEqual([]);
    expect(() => dealCard(shoe)).toThrow("Cannot deal from an empty shoe");
  });

  it("creates a fresh shoe when each hand must shuffle", () => {
    const first = dealCard(createShoe(1, () => 0.5)).shoe;

    const next = startHand(first, { deckCount: 1, shuffleAfterEachHand: true }, () => 0.25);

    expect(next.cards).toHaveLength(52);
  });

  it("keeps the remaining shoe between hands when shuffling is off", () => {
    const first = dealCard(createShoe(1, () => 0.5)).shoe;

    const next = startHand(first, { deckCount: 1, shuffleAfterEachHand: false }, () => 0.25);

    expect(next).toBe(first);
    expect(next.cards).toHaveLength(51);
  });
});

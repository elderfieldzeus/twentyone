export const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export const suits = ["clubs", "diamonds", "hearts", "spades"] as const;

export type Rank = (typeof ranks)[number];
export type Suit = (typeof suits)[number];

export type Card = Readonly<{
  id: string;
  rank: Rank;
  suit: Suit;
  value: number;
}>;

export type Shoe = Readonly<{
  cards: readonly Card[];
  deckCount: number;
}>;

export type TableShuffleRules = Readonly<{
  deckCount: number;
  shuffleAfterEachHand: boolean;
}>;

type RandomSource = () => number;

function rankValue(rank: Rank): number {
  if (rank === "A") {
    return 11;
  }

  if (rank === "J" || rank === "Q" || rank === "K") {
    return 10;
  }

  return Number(rank);
}

export function createDeck(deckIndex = 0): Card[] {
  return suits.flatMap((suit) =>
    ranks.map((rank) => ({
      id: `${deckIndex}:${suit}:${rank}`,
      rank,
      suit,
      value: rankValue(rank),
    })),
  );
}

function shuffle(cards: readonly Card[], random: RandomSource): Card[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createShoe(deckCount: number, random: RandomSource = Math.random): Shoe {
  if (!Number.isInteger(deckCount) || deckCount < 1) {
    throw new RangeError("Deck count must be a positive integer");
  }

  const cards = Array.from({ length: deckCount }, (_, deckIndex) => createDeck(deckIndex)).flat();

  return { cards: shuffle(cards, random), deckCount };
}

export function dealCard(shoe: Shoe): { card: Card; shoe: Shoe } {
  const [card, ...cards] = shoe.cards;

  if (!card) {
    throw new Error("Cannot deal from an empty shoe");
  }

  return {
    card,
    shoe: { ...shoe, cards },
  };
}

export function startHand(shoe: Shoe, rules: TableShuffleRules, random: RandomSource = Math.random): Shoe {
  if (rules.shuffleAfterEachHand) {
    return createShoe(rules.deckCount, random);
  }

  return shoe;
}

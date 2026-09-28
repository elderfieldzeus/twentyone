import { dealCard, type Card, type Shoe } from "./cards";
import { scoreHand, settleHand, type BlackjackPayout, type Settlement } from "./hand";

export type PlayerAction = "hit" | "stand" | "double" | "split";
export type HandStatus = "active" | "stood";

export type TableRules = Readonly<{
  deckCount: number;
  shuffleAfterEachHand: boolean;
  dealerHasHoleCard: boolean;
  dealerStandsOnSoft17: boolean;
  maxSplitHands: number;
  doubleAfterSplit: boolean;
  resplitAces: boolean;
  blackjackPayout: BlackjackPayout;
}>;

export type PlayerHand = Readonly<{
  cards: readonly Card[];
  status: HandStatus;
  units: number;
  fromSplit: boolean;
  splitAces: boolean;
}>;

export type GameState = Readonly<{
  shoe: Shoe;
  rules: TableRules;
  dealer: Readonly<{ cards: readonly Card[]; holeRevealed: boolean }>;
  playerHands: readonly PlayerHand[];
  activeHandIndex: number;
  phase: "player" | "complete";
  settlements: readonly Settlement[];
}>;

export const defaultRules: TableRules = {
  deckCount: 6,
  shuffleAfterEachHand: true,
  dealerHasHoleCard: true,
  dealerStandsOnSoft17: true,
  maxSplitHands: 4,
  doubleAfterSplit: true,
  resplitAces: false,
  blackjackPayout: "3:2",
};

function draw(shoe: Shoe): { card: Card; shoe: Shoe } {
  return dealCard(shoe);
}

export function createGame(initialShoe: Shoe, rules: TableRules): GameState {
  let shoe = initialShoe;
  const playerCards: Card[] = [];
  const dealerCards: Card[] = [];

  for (const recipient of ["player", "dealer", "player"] as const) {
    const dealt = draw(shoe);
    shoe = dealt.shoe;
    (recipient === "player" ? playerCards : dealerCards).push(dealt.card);
  }

  if (rules.dealerHasHoleCard) {
    const dealt = draw(shoe);
    shoe = dealt.shoe;
    dealerCards.push(dealt.card);
  }

  const state: GameState = {
    shoe,
    rules,
    dealer: { cards: dealerCards, holeRevealed: false },
    playerHands: [
      { cards: playerCards, status: "active", units: 1, fromSplit: false, splitAces: false },
    ],
    activeHandIndex: 0,
    phase: "player",
    settlements: [],
  };

  const dealerBlackjack = rules.dealerHasHoleCard && scoreHand(dealerCards).isBlackjack;
  const playerBlackjack = scoreHand(playerCards).isBlackjack;
  return dealerBlackjack || playerBlackjack ? completeGame(state, dealerCards, shoe) : state;
}

export function availableActions(state: GameState): PlayerAction[] {
  if (state.phase !== "player") return [];
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand || hand.status !== "active") return [];

  if (hand.splitAces) {
    const [first, second] = hand.cards;
    return first && second && second.rank === "A" && state.playerHands.length < state.rules.maxSplitHands
      ? ["split"]
      : [];
  }

  const actions: PlayerAction[] = ["hit", "stand"];
  if (hand.cards.length === 2 && (!hand.fromSplit || state.rules.doubleAfterSplit)) actions.push("double");

  const [first, second] = hand.cards;
  if (
    first &&
    second &&
    first.value === second.value &&
    state.playerHands.length < state.rules.maxSplitHands
  ) {
    actions.push("split");
  }
  return actions;
}

function completeGame(state: GameState, dealerCards: readonly Card[], shoe: Shoe): GameState {
  const dealerScore = scoreHand(dealerCards);
  const playerHands = state.playerHands.map((hand) => ({ ...hand, status: "stood" as const }));
  const settlements = playerHands.map((hand) => {
    const result = settleHand(scoreHand(hand.cards, { fromSplit: hand.fromSplit }), dealerScore, state.rules.blackjackPayout);
    return { ...result, netUnits: result.netUnits * hand.units };
  });

  return {
    ...state,
    shoe,
    dealer: { cards: dealerCards, holeRevealed: true },
    playerHands,
    phase: "complete",
    settlements,
  };
}

function finishDealer(state: GameState): GameState {
  let shoe = state.shoe;
  const dealerCards = [...state.dealer.cards];

  if (!state.rules.dealerHasHoleCard) {
    const dealt = draw(shoe);
    shoe = dealt.shoe;
    dealerCards.push(dealt.card);
  }

  while (true) {
    const score = scoreHand(dealerCards);
    const mustHit = score.total < 17 || (score.total === 17 && score.isSoft && !state.rules.dealerStandsOnSoft17);
    if (!mustHit) break;
    const dealt = draw(shoe);
    shoe = dealt.shoe;
    dealerCards.push(dealt.card);
  }

  return completeGame(state, dealerCards, shoe);
}

function advance(state: GameState, playerHands: readonly PlayerHand[], shoe: Shoe): GameState {
  const nextIndex = playerHands.findIndex((hand, index) => index > state.activeHandIndex && hand.status === "active");
  const next = { ...state, shoe, playerHands };
  return nextIndex >= 0 ? { ...next, activeHandIndex: nextIndex } : finishDealer(next);
}

export function applyAction(state: GameState, action: PlayerAction): GameState {
  if (!availableActions(state).includes(action)) throw new Error(`Action ${action} is not available`);

  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) throw new Error("Active hand does not exist");

  if (action === "split") {
    const [left, right] = hand.cards;
    if (!left || !right) throw new Error("A split requires two cards");
    let shoe = state.shoe;
    const leftDraw = draw(shoe);
    shoe = leftDraw.shoe;
    const rightDraw = draw(shoe);
    shoe = rightDraw.shoe;
    const splitAces = left.rank === "A";
    const leftStatus: HandStatus = splitAces && !(state.rules.resplitAces && leftDraw.card.rank === "A") ? "stood" : "active";
    const rightStatus: HandStatus = splitAces && !(state.rules.resplitAces && rightDraw.card.rank === "A") ? "stood" : "active";
    const splitHands: PlayerHand[] = [
      { cards: [left, leftDraw.card], status: leftStatus, units: 1, fromSplit: true, splitAces },
      { cards: [right, rightDraw.card], status: rightStatus, units: 1, fromSplit: true, splitAces },
    ];
    const playerHands = [...state.playerHands];
    playerHands.splice(state.activeHandIndex, 1, ...splitHands);
    const activeHandIndex = playerHands.findIndex((candidate, index) => index >= state.activeHandIndex && candidate.status === "active");
    if (activeHandIndex < 0) return finishDealer({ ...state, shoe, playerHands });
    return { ...state, shoe, playerHands, activeHandIndex };
  }

  if (action === "stand") {
    const playerHands = state.playerHands.map((current, index) =>
      index === state.activeHandIndex ? { ...current, status: "stood" as const } : current,
    );
    return advance(state, playerHands, state.shoe);
  }

  const dealt = draw(state.shoe);
  const cards = [...hand.cards, dealt.card];
  const mustStand = action === "double" || scoreHand(cards, { fromSplit: hand.fromSplit }).total >= 21;
  const updated = { ...hand, cards, status: mustStand ? ("stood" as const) : hand.status, units: action === "double" ? 2 : 1 };
  const playerHands = state.playerHands.map((current, index) => (index === state.activeHandIndex ? updated : current));
  return mustStand ? advance(state, playerHands, dealt.shoe) : { ...state, shoe: dealt.shoe, playerHands };
}

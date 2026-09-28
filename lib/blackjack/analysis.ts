import type { Card, Shoe } from "./cards";
import type { TableRules } from "./game";
import { scoreHand, settleHand } from "./hand";

export type OutcomeProbabilities = Readonly<{
  win: number;
  push: number;
  loss: number;
  expectedValue: number;
}>;

export type AnalysisInput = Readonly<{
  playerCards: readonly Card[];
  dealerCards: readonly Card[];
  shoe: Shoe;
  rules: TableRules;
  fromSplit?: boolean;
}>;

export type SplitAnalysisInput = AnalysisInput & Readonly<{ currentHandCount?: number }>;
export type SplitAnalysis = Readonly<{ hands: readonly OutcomeProbabilities[]; expectedValue: number }>;

const zero: OutcomeProbabilities = { win: 0, push: 0, loss: 0, expectedValue: 0 };
const dealerCache = new Map<string, OutcomeProbabilities>();
const standCache = new Map<string, OutcomeProbabilities>();
const hitCache = new Map<string, OutcomeProbabilities>();
const splitDealerCache = new Map<string, SplitAnalysis>();
const splitPathCache = new Map<string, SplitAnalysis>();

function cardsKey(cards: readonly Card[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([rank, count]) => `${rank}${count}`).join(",");
}

function inputKey(input: AnalysisInput): string {
  return [
    cardsKey(input.playerCards),
    cardsKey(input.dealerCards),
    cardsKey(input.shoe.cards),
    input.rules.dealerStandsOnSoft17,
    input.rules.blackjackPayout,
    input.fromSplit ?? false,
  ].join("|");
}

function save(cache: Map<string, OutcomeProbabilities>, key: string, value: OutcomeProbabilities): OutcomeProbabilities {
  if (cache.size >= 50_000) cache.clear();
  cache.set(key, value);
  return value;
}

function saveSplit(cache: Map<string, SplitAnalysis>, key: string, value: SplitAnalysis): SplitAnalysis {
  if (cache.size >= 50_000) cache.clear();
  cache.set(key, value);
  return value;
}

function add(left: OutcomeProbabilities, right: OutcomeProbabilities, weight = 1): OutcomeProbabilities {
  return {
    win: left.win + right.win * weight,
    push: left.push + right.push * weight,
    loss: left.loss + right.loss * weight,
    expectedValue: left.expectedValue + right.expectedValue * weight,
  };
}

function removeRank(cards: readonly Card[], rank: Card["rank"]): readonly Card[] {
  const index = cards.findIndex((card) => card.rank === rank);
  return [...cards.slice(0, index), ...cards.slice(index + 1)];
}

function choices(cards: readonly Card[]): Array<{ card: Card; cards: readonly Card[]; probability: number }> {
  const groups = new Map<Card["rank"], Card[]>();
  for (const card of cards) groups.set(card.rank, [...(groups.get(card.rank) ?? []), card]);
  return [...groups.values()].map((group) => ({
    card: group[0],
    cards: removeRank(cards, group[0].rank),
    probability: group.length / cards.length,
  }));
}

function terminal(playerCards: readonly Card[], dealerCards: readonly Card[], rules: TableRules, fromSplit: boolean): OutcomeProbabilities {
  const settlement = settleHand(
    scoreHand(playerCards, { fromSplit }),
    scoreHand(dealerCards),
    rules.blackjackPayout,
  );
  return {
    win: settlement.result === "win" || settlement.result === "blackjack" ? 1 : 0,
    push: settlement.result === "push" ? 1 : 0,
    loss: settlement.result === "loss" ? 1 : 0,
    expectedValue: settlement.netUnits,
  };
}

function playDealer(
  playerCards: readonly Card[],
  dealerCards: readonly Card[],
  shoeCards: readonly Card[],
  rules: TableRules,
  fromSplit: boolean,
): OutcomeProbabilities {
  const key = [cardsKey(playerCards), cardsKey(dealerCards), cardsKey(shoeCards), rules.dealerStandsOnSoft17, rules.blackjackPayout, fromSplit].join("|");
  const cached = dealerCache.get(key);
  if (cached) return cached;
  const score = scoreHand(dealerCards);
  const mustHit = score.total < 17 || (score.total === 17 && score.isSoft && !rules.dealerStandsOnSoft17);
  if (!mustHit || shoeCards.length === 0) return save(dealerCache, key, terminal(playerCards, dealerCards, rules, fromSplit));

  return save(dealerCache, key, choices(shoeCards).reduce(
    (result, choice) =>
      add(result, playDealer(playerCards, [...dealerCards, choice.card], choice.cards, rules, fromSplit), choice.probability),
    zero,
  ));
}

export function analyzeStand(input: AnalysisInput): OutcomeProbabilities {
  const key = inputKey(input);
  const cached = standCache.get(key);
  if (cached) return cached;
  if (scoreHand(input.playerCards, { fromSplit: input.fromSplit }).isBust) {
    return save(standCache, key, { win: 0, push: 0, loss: 1, expectedValue: -1 });
  }

  if (input.dealerCards.length >= 2) {
    return save(standCache, key, playDealer(input.playerCards, input.dealerCards, input.shoe.cards, input.rules, input.fromSplit ?? false));
  }

  return save(standCache, key, choices(input.shoe.cards).reduce(
    (result, choice) =>
      add(
        result,
        playDealer(input.playerCards, [...input.dealerCards, choice.card], choice.cards, input.rules, input.fromSplit ?? false),
        choice.probability,
      ),
    zero,
  ));
}

export function analyzeHit(input: AnalysisInput): OutcomeProbabilities {
  const key = inputKey(input);
  const cached = hitCache.get(key);
  if (cached) return cached;
  if (input.shoe.cards.length === 0) return save(hitCache, key, analyzeStand(input));

  return save(hitCache, key, choices(input.shoe.cards).reduce((result, choice) => {
    const playerCards = [...input.playerCards, choice.card];
    const nextInput = { ...input, playerCards, shoe: { ...input.shoe, cards: choice.cards } };
    const score = scoreHand(playerCards, { fromSplit: input.fromSplit });
    let outcome: OutcomeProbabilities;

    if (score.isBust) {
      outcome = { win: 0, push: 0, loss: 1, expectedValue: -1 };
    } else {
      const stand = analyzeStand(nextInput);
      const hit = analyzeHit(nextInput);
      outcome = hit.expectedValue > stand.expectedValue ? hit : stand;
    }

    return add(result, outcome, choice.probability);
  }, zero));
}

function withUnits(outcome: OutcomeProbabilities, units: number): OutcomeProbabilities {
  return { ...outcome, expectedValue: outcome.expectedValue * units };
}

export function analyzeDouble(input: AnalysisInput): OutcomeProbabilities | null {
  if (input.playerCards.length !== 2 || (input.fromSplit && !input.rules.doubleAfterSplit)) return null;
  if (input.shoe.cards.length === 0) return null;

  return choices(input.shoe.cards).reduce((result, choice) => {
    const outcome = analyzeStand({
      ...input,
      playerCards: [...input.playerCards, choice.card],
      shoe: { ...input.shoe, cards: choice.cards },
    });
    return add(result, withUnits(outcome, 2), choice.probability);
  }, zero);
}

type SplitHand = Readonly<{ cards: readonly Card[]; units: number; splitAces: boolean }>;

function addSplit(left: SplitAnalysis, right: SplitAnalysis, weight: number): SplitAnalysis {
  const length = Math.max(left.hands.length, right.hands.length);
  return {
    hands: Array.from({ length }, (_, index) => add(left.hands[index] ?? zero, right.hands[index] ?? zero, weight)),
    expectedValue: left.expectedValue + right.expectedValue * weight,
  };
}

function settleSplitHands(hands: readonly SplitHand[], dealerCards: readonly Card[], rules: TableRules): SplitAnalysis {
  const outcomes = hands.map((hand) => withUnits(terminal(hand.cards, dealerCards, rules, true), hand.units));
  return { hands: outcomes, expectedValue: outcomes.reduce((sum, outcome) => sum + outcome.expectedValue, 0) };
}

function playSplitDealer(
  hands: readonly SplitHand[],
  dealerCards: readonly Card[],
  shoeCards: readonly Card[],
  rules: TableRules,
): SplitAnalysis {
  const key = [hands.map((hand) => `${cardsKey(hand.cards)}:${hand.units}`).join("/"), cardsKey(dealerCards), cardsKey(shoeCards), rules.dealerStandsOnSoft17, rules.blackjackPayout].join("|");
  const cached = splitDealerCache.get(key);
  if (cached) return cached;
  const score = scoreHand(dealerCards);
  const allBust = hands.every((hand) => scoreHand(hand.cards, { fromSplit: true }).isBust);
  const mustHit = !allBust && (score.total < 17 || (score.total === 17 && score.isSoft && !rules.dealerStandsOnSoft17));
  if (!mustHit || shoeCards.length === 0) return saveSplit(splitDealerCache, key, settleSplitHands(hands, dealerCards, rules));
  return saveSplit(splitDealerCache, key, choices(shoeCards).reduce<SplitAnalysis>(
    (result, choice) => addSplit(result, playSplitDealer(hands, [...dealerCards, choice.card], choice.cards, rules), choice.probability),
    { hands: hands.map(() => zero), expectedValue: 0 },
  ));
}

function bestSplitPath(
  hands: readonly SplitHand[],
  activeIndex: number,
  dealerCards: readonly Card[],
  shoeCards: readonly Card[],
  rules: TableRules,
): SplitAnalysis {
  const key = [hands.map((hand) => `${cardsKey(hand.cards)}:${hand.units}:${hand.splitAces}`).join("/"), activeIndex, cardsKey(dealerCards), cardsKey(shoeCards), rules.maxSplitHands, rules.doubleAfterSplit, rules.resplitAces, rules.dealerStandsOnSoft17, rules.blackjackPayout].join("|");
  const cached = splitPathCache.get(key);
  if (cached) return cached;
  if (activeIndex >= hands.length) return saveSplit(splitPathCache, key, playSplitDealer(hands, dealerCards, shoeCards, rules));
  const hand = hands[activeIndex];
  const handScore = scoreHand(hand.cards, { fromSplit: true });
  const canResplit = hand.cards.length === 2 && hand.cards[0]?.value === hand.cards[1]?.value && hands.length < rules.maxSplitHands;
  const forced = handScore.isBust || handScore.total >= 21 || (hand.splitAces && !(rules.resplitAces && canResplit));
  if (forced || shoeCards.length === 0) return saveSplit(splitPathCache, key, bestSplitPath(hands, activeIndex + 1, dealerCards, shoeCards, rules));

  const candidates: SplitAnalysis[] = [bestSplitPath(hands, activeIndex + 1, dealerCards, shoeCards, rules)];
  const drawAction = (units: number, continueHand: boolean): SplitAnalysis =>
    choices(shoeCards).reduce<SplitAnalysis>((result, choice) => {
      const updated = hands.map((item, index) =>
        index === activeIndex ? { ...item, cards: [...item.cards, choice.card], units } : item,
      );
      const nextScore = scoreHand(updated[activeIndex].cards, { fromSplit: true });
      const nextIndex = continueHand && !nextScore.isBust && nextScore.total < 21 ? activeIndex : activeIndex + 1;
      return addSplit(result, bestSplitPath(updated, nextIndex, dealerCards, choice.cards, rules), choice.probability);
    }, { hands: hands.map(() => zero), expectedValue: 0 });

  candidates.push(drawAction(1, true));
  if (hand.cards.length === 2 && rules.doubleAfterSplit && !hand.splitAces) candidates.push(drawAction(2, false));

  if (canResplit && (!hand.splitAces || rules.resplitAces) && shoeCards.length >= 2) {
    const [left, right] = hand.cards;
    let splitResult: SplitAnalysis = { hands: [], expectedValue: 0 };
    for (const leftChoice of choices(shoeCards)) {
      for (const rightChoice of choices(leftChoice.cards)) {
        const probability = leftChoice.probability * rightChoice.probability;
        const splitAces = left.rank === "A";
        const updated = [...hands];
        updated.splice(activeIndex, 1,
          { cards: [left, leftChoice.card], units: 1, splitAces },
          { cards: [right, rightChoice.card], units: 1, splitAces },
        );
        splitResult = addSplit(
          splitResult,
          bestSplitPath(updated, activeIndex, dealerCards, rightChoice.cards, rules),
          probability,
        );
      }
    }
    candidates.push(splitResult);
  }

  return saveSplit(splitPathCache, key, candidates.reduce((best, candidate) => candidate.expectedValue > best.expectedValue ? candidate : best));
}

export function analyzeSplit(input: SplitAnalysisInput): SplitAnalysis | null {
  const [left, right] = input.playerCards;
  const handCount = input.currentHandCount ?? 1;
  if (!left || !right || input.playerCards.length !== 2 || left.value !== right.value) return null;
  if (handCount >= input.rules.maxSplitHands || input.shoe.cards.length < 2) return null;

  let result: SplitAnalysis = { hands: [], expectedValue: 0 };

  for (const leftChoice of choices(input.shoe.cards)) {
    for (const rightChoice of choices(leftChoice.cards)) {
      const probability = leftChoice.probability * rightChoice.probability;
      const splitAces = left.rank === "A";
      const hands: SplitHand[] = [
        { cards: [left, leftChoice.card], units: 1, splitAces },
        { cards: [right, rightChoice.card], units: 1, splitAces },
      ];
      result = addSplit(
        result,
        bestSplitPath(hands, 0, input.dealerCards, rightChoice.cards, input.rules),
        probability,
      );
    }
  }

  return result;
}

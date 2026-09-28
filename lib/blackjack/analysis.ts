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

const zero: OutcomeProbabilities = { win: 0, push: 0, loss: 0, expectedValue: 0 };
const dealerCache = new Map<string, OutcomeProbabilities>();
const standCache = new Map<string, OutcomeProbabilities>();
const hitCache = new Map<string, OutcomeProbabilities>();

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

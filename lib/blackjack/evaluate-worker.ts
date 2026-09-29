import { availableActions, type GameState, type PlayerAction } from "./game";
import { evaluateMoves } from "./evaluate";
import type { Card, Shoe } from "./cards";

type WorkerRequest = Readonly<{ action: PlayerAction; game: GameState; handNumber: number; requestId: number; prepare?: boolean }>;

function sampleShoe(shoe: Shoe): Shoe {
  const byRank = new Map<Card["rank"], Card>();
  for (const card of shoe.cards) if (!byRank.has(card.rank)) byRank.set(card.rank, card);
  const ranks = [...byRank.values()];
  const cards = Array.from({ length: Math.min(8, ranks.length) }, (_, index) => ranks[Math.floor(index * ranks.length / Math.min(8, ranks.length))]);
  return { cards, deckCount: 1 };
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const { action, game, handNumber, requestId, prepare } = event.data;
  const hand = game.playerHands[game.activeHandIndex];
  const dealerUpCard = game.dealer.cards[0];
  if (!hand || !dealerUpCard) return;
  const actions = availableActions(game);
  const input = {
    playerCards: hand.cards,
    dealerCards: [dealerUpCard],
    shoe: game.shoe,
    rules: game.rules,
    fromSplit: hand.fromSplit,
    currentHandCount: game.playerHands.length,
  };
  const hasSplit = actions.includes("split");
  let evaluations = hasSplit ? [] : evaluateMoves(input).filter((evaluation) => actions.includes(evaluation.action));
  const approximateActions: PlayerAction[] = [];
  if (hasSplit) {
    const exact = evaluateMoves({ ...input, currentHandCount: game.rules.maxSplitHands })
      .filter((evaluation) => actions.includes(evaluation.action));
    const estimate = evaluateMoves({ ...input, shoe: sampleShoe(game.shoe) })
      .find((evaluation) => evaluation.action === "split");
    const candidates = estimate ? [...exact, estimate] : exact;
    const bestValue = Math.max(...candidates.map((candidate) => candidate.outcome.expectedValue));
    evaluations = candidates.map((candidate) => ({
      ...candidate,
      grade: Math.abs(candidate.outcome.expectedValue - bestValue) <= 1e-12 ? "Best move" : "Not the best move",
    }));
    approximateActions.push("split");
  }
  self.postMessage({ action, evaluations, handNumber, requestId, approximateActions, prepare });
});

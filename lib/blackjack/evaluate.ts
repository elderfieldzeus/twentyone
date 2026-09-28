import {
  analyzeDouble,
  analyzeHit,
  analyzeSplit,
  analyzeStand,
  type OutcomeProbabilities,
  type SplitAnalysisInput,
} from "./analysis";

export type MoveAction = "hit" | "stand" | "double" | "split";
export type MoveGrade = "Best move" | "Not the best move";
export type MoveEvaluation = Readonly<{
  action: MoveAction;
  outcome: OutcomeProbabilities;
  grade: MoveGrade;
}>;

function splitOutcome(input: SplitAnalysisInput): OutcomeProbabilities | null {
  const split = analyzeSplit(input);
  if (!split) return null;
  const divisor = split.hands.length;
  return {
    win: split.hands.reduce((sum, hand) => sum + hand.win, 0) / divisor,
    push: split.hands.reduce((sum, hand) => sum + hand.push, 0) / divisor,
    loss: split.hands.reduce((sum, hand) => sum + hand.loss, 0) / divisor,
    expectedValue: split.expectedValue,
  };
}

export function evaluateMoves(input: SplitAnalysisInput): MoveEvaluation[] {
  const candidates: Array<{ action: MoveAction; outcome: OutcomeProbabilities | null }> = [
    { action: "hit", outcome: analyzeHit(input) },
    { action: "stand", outcome: analyzeStand(input) },
    { action: "double", outcome: analyzeDouble(input) },
    { action: "split", outcome: splitOutcome(input) },
  ];
  const available = candidates.filter(
    (candidate): candidate is { action: MoveAction; outcome: OutcomeProbabilities } => candidate.outcome !== null,
  );
  const bestValue = Math.max(...available.map((candidate) => candidate.outcome.expectedValue));

  return available.map(({ action, outcome }) => ({
    action,
    outcome,
    grade: Math.abs(outcome.expectedValue - bestValue) <= 1e-12 ? "Best move" : "Not the best move",
  }));
}

export function formatOutcome(outcome: OutcomeProbabilities): Record<keyof OutcomeProbabilities, string> {
  const expectedValue = outcome.expectedValue.toFixed(2);
  return {
    win: `${(outcome.win * 100).toFixed(1)}%`,
    push: `${(outcome.push * 100).toFixed(1)}%`,
    loss: `${(outcome.loss * 100).toFixed(1)}%`,
    expectedValue: outcome.expectedValue > 0 ? `+${expectedValue}` : expectedValue,
  };
}

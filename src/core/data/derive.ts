/**
 * Pure derivations over the collections. Everything shown on every surface — the
 * balance, monthly in/out, goal progress — is computed here, never stored. These are
 * the "derived figures" the design’s State section calls out. Pure + synchronous so
 * they’re trivially unit-testable and safe in Server Components.
 */
import type { CaisseData, Contribution, Expense, Goal } from "./types";

export const TV_PAGES = [
  { key: "objectifs", label: "Objectifs" },
  { key: "contributions", label: "Contributions" },
  { key: "caisse", label: "Caisse & dépenses" },
  { key: "accueil", label: "Accueil" },
] as const;

export const sumContributions = (rows: Contribution[]): number =>
  rows.reduce((total, c) => total + c.amountCents, 0);

export const sumExpenses = (rows: Expense[]): number =>
  rows.reduce((total, e) => total + e.amountCents, 0);

/** Fraction raised toward a goal, clamped to [0, 1]. */
export const goalProgress = (goal: Goal): number =>
  goal.targetCents <= 0 ? 0 : Math.min(1, Math.max(0, goal.raisedCents / goal.targetCents));

/** Whole-percent for labels ("62 %"). */
export const goalPercent = (goal: Goal): number => Math.round(goalProgress(goal) * 100);

export const goalRemainingCents = (goal: Goal): number =>
  Math.max(0, goal.targetCents - goal.raisedCents);

export interface CaisseTotals {
  monthInCents: number;
  monthOutCents: number;
  balanceCents: number;
  contributionCount: number;
  activeGoals: number;
}

/** The headline figures shared by the hero, TV, phone board, and dashboard. */
export function computeTotals(data: CaisseData): CaisseTotals {
  const monthInCents = sumContributions(data.contributions);
  const monthOutCents = sumExpenses(data.expenses);
  return {
    monthInCents,
    monthOutCents,
    balanceCents: data.openingCents + monthInCents - monthOutCents,
    contributionCount: data.contributions.length,
    activeGoals: data.goals.length,
  };
}

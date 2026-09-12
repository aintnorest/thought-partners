import { create } from "zustand";
import type { AnswerCard, Card, RecipePlan } from "@/lib/types";

export interface ActiveTimer {
  stepId: string;
  startedAt: number;
  sec: number;
  generation: number;
}

export interface StoreState {
  plan?: RecipePlan;
  stepIndex: number;
  cards: Card[];
  activeTimer?: ActiveTimer;
  generation: number;
  setPlan(plan: RecipePlan): void;
  next(): void;
  prev(): void;
  repeat(): void;
  goto(i: number): void;
  startTimer(sec: number): void;
  cancelTimer(): void;
  pushCard(card: Card): void;
  setAnswer(card: AnswerCard): void;
}

/** Every transition that changes which step is current, or clears the timer, invalidates in-flight heartbeat work. */
function invalidateTimer(state: Pick<StoreState, "generation">) {
  return { activeTimer: undefined, generation: state.generation + 1 };
}

function clampIndex(state: Pick<StoreState, "plan">, i: number): number {
  return Math.min(Math.max(0, i), Math.max(0, (state.plan?.steps.length ?? 0) - 1));
}

export const useStore = create<StoreState>()((set, get) => ({
  plan: undefined,
  stepIndex: 0,
  cards: [],
  activeTimer: undefined,
  generation: 0,
  setPlan: (plan) => set((state) => ({ plan, stepIndex: 0, ...invalidateTimer(state) })),
  next: () =>
    set((state) => ({
      stepIndex: clampIndex(state, state.stepIndex + 1),
      ...invalidateTimer(state),
    })),
  prev: () =>
    set((state) => ({
      stepIndex: clampIndex(state, state.stepIndex - 1),
      ...invalidateTimer(state),
    })),
  repeat: () => set((state) => invalidateTimer(state)),
  goto: (i) => set((state) => ({ stepIndex: clampIndex(state, i), ...invalidateTimer(state) })),
  startTimer: (sec) => {
    const state = get();
    const stepId = state.plan?.steps[state.stepIndex]?.id;
    const generation = state.generation + 1;

    set({
      activeTimer: stepId ? { stepId, startedAt: Date.now(), sec, generation } : undefined,
      generation,
    });
  },
  cancelTimer: () => set((state) => invalidateTimer(state)),
  pushCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  // Streaming answers upsert in place instead of appending a card per token —
  // `cards` stays an append-only log of discrete events (heartbeat, verdict),
  // while the one live answer for a step is replaced as new text arrives.
  setAnswer: (card) =>
    set((state) => {
      const index = state.cards.findLastIndex(
        (existing) => existing.kind === "answer" && existing.stepId === card.stepId,
      );

      if (index === -1) {
        return { cards: [...state.cards, card] };
      }

      const cards = state.cards.slice();
      cards[index] = card;
      return { cards };
    }),
}));

export function selectActiveTimer(state: StoreState): ActiveTimer | undefined {
  const timer = state.activeTimer;
  if (!timer || Date.now() >= timer.startedAt + timer.sec * 1000) {
    return undefined;
  }

  return timer;
}

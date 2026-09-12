import { create } from "zustand";
import type { Card, RecipePlan } from "@/lib/types";

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
}

export const useStore = create<StoreState>()((set, get) => ({
  plan: undefined,
  stepIndex: 0,
  cards: [],
  activeTimer: undefined,
  generation: 0,
  setPlan: (plan) => set({ plan, stepIndex: 0 }),
  next: () =>
    set((state) => ({
      stepIndex: Math.min(state.stepIndex + 1, Math.max(0, (state.plan?.steps.length ?? 0) - 1)),
      activeTimer: undefined,
      generation: state.generation + 1,
    })),
  prev: () =>
    set((state) => ({
      stepIndex: Math.max(0, state.stepIndex - 1),
      activeTimer: undefined,
      generation: state.generation + 1,
    })),
  repeat: () =>
    set((state) => ({
      activeTimer: undefined,
      generation: state.generation + 1,
    })),
  goto: (i) =>
    set((state) => ({
      stepIndex: Math.min(Math.max(0, i), Math.max(0, (state.plan?.steps.length ?? 0) - 1)),
      activeTimer: undefined,
      generation: state.generation + 1,
    })),
  startTimer: (sec) => {
    const state = get();
    const stepId = state.plan?.steps[state.stepIndex]?.id;
    const generation = state.generation + 1;

    set({
      activeTimer: stepId
        ? {
            stepId,
            startedAt: Date.now(),
            sec,
            generation,
          }
        : undefined,
      generation,
    });
  },
  cancelTimer: () =>
    set((state) => ({
      activeTimer: undefined,
      generation: state.generation + 1,
    })),
  pushCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
}));

export function selectActiveTimer(state: StoreState): ActiveTimer | undefined {
  const timer = state.activeTimer;
  if (!timer || Date.now() >= timer.startedAt + timer.sec * 1000) {
    return undefined;
  }

  return timer;
}

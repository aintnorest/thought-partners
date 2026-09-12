import { create } from "zustand";
import type { Card, RecipePlan } from "@/lib/types";

export interface ActiveTimer {
  stepId: string;
  startedAt: number;
  sec: number;
  generation: number;
}

export interface WatchState {
  active: boolean;
  status: "idle" | "watching" | "coach" | "intervene" | "ready" | "error";
  lastMessage?: string;
  lastFix?: string;
  risk?: {
    level: "low" | "medium" | "high";
    message: string;
  };
  readyCue?: string;
  deviation?: string;
}

export interface StoreState {
  plan?: RecipePlan;
  stepIndex: number;
  cards: Card[];
  activeTimer?: ActiveTimer;
  generation: number;
  watch: WatchState;
  setPlan(plan: RecipePlan): void;
  next(): void;
  prev(): void;
  repeat(): void;
  goto(i: number): void;
  startTimer(sec: number): void;
  cancelTimer(): void;
  pushCard(card: Card): void;
  startWatch(): void;
  stopWatch(): void;
  showFix(message: string): void;
  flagRisk(level: "low" | "medium" | "high", message: string): void;
  markStepReady(cue: string): void;
  recordDeviation(note: string): void;
}

/** Every transition that changes which step is current, or clears the timer, invalidates in-flight heartbeat work. */
function invalidateTimer(state: Pick<StoreState, "generation">) {
  return { activeTimer: undefined, generation: state.generation + 1 };
}

function clampIndex(state: Pick<StoreState, "plan">, i: number): number {
  return Math.min(Math.max(0, i), Math.max(0, (state.plan?.steps.length ?? 0) - 1));
}

function idleWatch(): WatchState {
  return {
    active: false,
    status: "idle",
  };
}

export const useStore = create<StoreState>()((set, get) => ({
  plan: undefined,
  stepIndex: 0,
  cards: [],
  activeTimer: undefined,
  generation: 0,
  watch: idleWatch(),
  setPlan: (plan) =>
    set((state) => ({ plan, stepIndex: 0, watch: idleWatch(), ...invalidateTimer(state) })),
  next: () =>
    set((state) => ({
      stepIndex: clampIndex(state, state.stepIndex + 1),
      watch: idleWatch(),
      ...invalidateTimer(state),
    })),
  prev: () =>
    set((state) => ({
      stepIndex: clampIndex(state, state.stepIndex - 1),
      watch: idleWatch(),
      ...invalidateTimer(state),
    })),
  repeat: () => set((state) => ({ watch: idleWatch(), ...invalidateTimer(state) })),
  goto: (i) =>
    set((state) => ({
      stepIndex: clampIndex(state, i),
      watch: idleWatch(),
      ...invalidateTimer(state),
    })),
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
  startWatch: () =>
    set((state) => ({
      watch: {
        ...state.watch,
        active: true,
        status: "watching",
        lastMessage: "Jacques will stay quiet unless something needs attention.",
      },
    })),
  stopWatch: () => set({ watch: idleWatch() }),
  showFix: (message) => {
    const state = get();
    const stepId = state.plan?.steps[state.stepIndex]?.id;
    set((current) => ({
      watch: {
        ...current.watch,
        active: true,
        status: "intervene",
        lastMessage: message,
        lastFix: message,
      },
      cards: stepId
        ? [...current.cards, { kind: "watch_fix", stepId, line: message }]
        : current.cards,
    }));
  },
  flagRisk: (level, message) =>
    set((state) => ({
      watch: {
        ...state.watch,
        active: true,
        status: level === "high" ? "intervene" : "coach",
        risk: { level, message },
        lastMessage: message,
      },
    })),
  markStepReady: (cue) => {
    const state = get();
    const stepId = state.plan?.steps[state.stepIndex]?.id;
    set((current) => ({
      watch: {
        ...current.watch,
        active: true,
        status: "ready",
        readyCue: cue,
        lastMessage: cue,
      },
      cards: stepId
        ? [...current.cards, { kind: "watch_ready", stepId, line: cue }]
        : current.cards,
    }));
  },
  recordDeviation: (note) =>
    set((state) => ({
      watch: {
        ...state.watch,
        active: true,
        status: "coach",
        deviation: note,
        lastMessage: note,
      },
    })),
}));

export function selectActiveTimer(state: StoreState): ActiveTimer | undefined {
  const timer = state.activeTimer;
  if (!timer || Date.now() >= timer.startedAt + timer.sec * 1000) {
    return undefined;
  }

  return timer;
}

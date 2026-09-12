import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { selectActiveTimer, useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";

const plan: RecipePlan = {
  id: "test-plan",
  title: "Test Plan",
  servings: 2,
  totalMinutes: 1,
  ingredients: [],
  equipment: [],
  steps: [
    {
      id: "first",
      kind: "prep",
      title: "First",
      detail: "Prepare the first step",
      ingredients: [],
      questions: [],
    },
    {
      id: "second",
      kind: "wait",
      title: "Second",
      detail: "Wait for the second step",
      durationSec: 5,
      ingredients: [],
      questions: [],
    },
  ],
};

describe("useStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    useStore.setState({
      plan: undefined,
      stepIndex: 0,
      cards: [],
      activeTimer: undefined,
      generation: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts a timer for the current step and stops selecting it after expiry", () => {
    useStore.getState().setPlan(plan);
    useStore.getState().startTimer(5);

    expect(selectActiveTimer(useStore.getState())).toEqual({
      stepId: "first",
      startedAt: Date.now(),
      sec: 5,
      generation: 2,
    });

    vi.advanceTimersByTime(5_001);

    expect(selectActiveTimer(useStore.getState())).toBeUndefined();
  });

  it("clears the active timer and increments generation when moving next", () => {
    useStore.getState().setPlan(plan);
    useStore.getState().startTimer(5);

    useStore.getState().next();

    expect(useStore.getState().stepIndex).toBe(1);
    expect(useStore.getState().activeTimer).toBeUndefined();
    expect(useStore.getState().generation).toBe(3);
  });

  it("replacing the plan invalidates a running timer", () => {
    useStore.getState().setPlan(plan);
    useStore.getState().startTimer(5);
    const before = useStore.getState().generation;

    useStore.getState().setPlan({ ...plan, id: "other" });

    expect(selectActiveTimer(useStore.getState())).toBeUndefined();
    expect(useStore.getState().generation).toBe(before + 1);
  });

  it("appends heartbeat cards", () => {
    const first = { kind: "heartbeat" as const, stepId: "first", line: "Check the pan" };
    const second = { kind: "heartbeat" as const, stepId: "second", line: "Stir now" };

    useStore.getState().pushCard(first);
    useStore.getState().pushCard(second);

    expect(useStore.getState().cards).toEqual([first, second]);
  });
});

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
      watch: { active: false, status: "idle" },
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

  it("records Watch Me fixes and readiness against the current step", () => {
    useStore.getState().setPlan(plan);

    useStore.getState().showFix("Lower heat and stir.");
    expect(useStore.getState().watch).toEqual(
      expect.objectContaining({
        active: true,
        status: "intervene",
        lastFix: "Lower heat and stir.",
      }),
    );
    expect(useStore.getState().cards).toEqual([
      { kind: "watch_fix", stepId: "first", line: "Lower heat and stir." },
    ]);

    useStore.getState().markStepReady("Glossy and even.");
    expect(useStore.getState().watch).toEqual(
      expect.objectContaining({
        active: true,
        status: "ready",
        readyCue: "Glossy and even.",
      }),
    );
    expect(useStore.getState().cards).toEqual([
      { kind: "watch_fix", stepId: "first", line: "Lower heat and stir." },
      { kind: "watch_ready", stepId: "first", line: "Glossy and even." },
    ]);
  });

  it("fills only missing image URLs without changing walkthrough state", () => {
    useStore.getState().setPlan({
      ...plan,
      steps: plan.steps.map((step) =>
        step.id === "second" ? { ...step, imageUrl: "existing-image" } : step,
      ),
    });
    useStore.getState().goto(1);
    useStore.getState().startTimer(5);
    const { activeTimer, generation, stepIndex } = useStore.getState();

    useStore.getState().applyImageUrls({
      first: "generated-image",
      second: "replacement-image",
    });

    const state = useStore.getState();
    expect(state.plan?.steps[0].imageUrl).toBe("generated-image");
    expect(state.plan?.steps[1].imageUrl).toBe("existing-image");
    expect(state.stepIndex).toBe(stepIndex);
    expect(state.generation).toBe(generation);
    expect(state.activeTimer).toBe(activeTimer);
  });
});

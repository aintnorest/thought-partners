import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";
import { HeartbeatScheduler } from "./heartbeat-scheduler";

vi.mock("@/lib/glue/app-bootstrap", () => ({
  useFlags: () => ({ fixture: true, noimages: false, novoice: false, nowatch: false }),
}));

const plan: RecipePlan = {
  id: "test-plan",
  title: "Test plan",
  servings: 1,
  totalMinutes: 1,
  ingredients: [],
  equipment: [],
  steps: [
    {
      id: "w1",
      kind: "wait",
      title: "Wait",
      detail: "Watch the sauce",
      durationSec: 30,
      attentionSec: 5,
      ingredients: [],
      questions: [],
      doneWhen: "bare bubble",
    },
  ],
};

describe("HeartbeatScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState({
      plan,
      stepIndex: 0,
      cards: [],
      activeTimer: undefined,
      generation: 0,
      watch: { active: false, status: "idle" },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("adds fixture heartbeat cards at the wait step's attention interval", () => {
    act(() => useStore.getState().startTimer(30));
    render(<HeartbeatScheduler />);

    act(() => vi.advanceTimersByTime(5_000));
    expect(useStore.getState().cards).toEqual([
      {
        kind: "heartbeat",
        stepId: "w1",
        line: "Check: bare bubble",
      },
    ]);

    act(() => vi.advanceTimersByTime(5_000));
    expect(useStore.getState().cards).toHaveLength(2);
  });

  it("stops adding heartbeats after moving to the next step", () => {
    act(() => useStore.getState().startTimer(30));
    render(<HeartbeatScheduler />);

    act(() => vi.advanceTimersByTime(5_000));
    expect(useStore.getState().cards).toHaveLength(1);

    act(() => useStore.getState().next());
    act(() => vi.advanceTimersByTime(5_000));
    expect(useStore.getState().cards).toHaveLength(1);
  });

  it("stops ticking once the timer expires naturally", () => {
    act(() => useStore.getState().startTimer(12));
    render(<HeartbeatScheduler />);

    act(() => vi.advanceTimersByTime(10_000));
    expect(useStore.getState().cards).toHaveLength(2);

    // Timer expired at 12s; ticks at 15s, 20s, 25s must add nothing.
    act(() => vi.advanceTimersByTime(15_000));
    expect(useStore.getState().cards).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});

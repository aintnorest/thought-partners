import { beforeEach, describe, expect, it } from "vitest";
import { runForStep, STALE } from "@/lib/hooks/request";
import { useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";

const plan: RecipePlan = {
  id: "request-plan",
  title: "Request Plan",
  servings: 2,
  totalMinutes: 10,
  ingredients: [],
  equipment: [],
  steps: [
    {
      id: "first",
      kind: "prep",
      title: "First",
      detail: "Prepare",
      ingredients: [],
      questions: [],
    },
    {
      id: "second",
      kind: "wait",
      title: "Second",
      detail: "Wait",
      ingredients: [],
      questions: [],
    },
  ],
};

describe("runForStep", () => {
  beforeEach(() => {
    useStore.setState({
      plan,
      stepIndex: 0,
      cards: [],
      activeTimer: undefined,
      generation: 0,
    });
  });

  it("resolves the value while the current step is unchanged", async () => {
    await expect(runForStep("first", async () => "answer")).resolves.toBe("answer");
  });

  it("aborts and resolves STALE when the current step changes", async () => {
    let signal: AbortSignal | undefined;
    let resolveRequest: ((value: string) => void) | undefined;
    const result = runForStep("first", (requestSignal) => {
      signal = requestSignal;
      return new Promise<string>((resolve) => {
        resolveRequest = resolve;
      });
    });

    useStore.getState().next();

    expect(signal?.aborted).toBe(true);
    resolveRequest?.("late answer");
    await expect(result).resolves.toBe(STALE);
  });

  it("unsubscribes after a completed request", async () => {
    let signal: AbortSignal | undefined;

    await runForStep("first", async (requestSignal) => {
      signal = requestSignal;
      return "answer";
    });
    useStore.getState().next();

    expect(signal?.aborted).toBe(false);
  });
});

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/plan.carbonara.json";
import { selectAnswerFor, selectCurrentStep } from "@/lib/cards";
import { useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";
import { useAnswer } from "./use-answer";

vi.mock("@copilotkit/react-core/v2", () => ({
  useAgent: () => ({ agent: undefined, isReady: false }),
  useCopilotKit: () => ({ copilotkit: undefined }),
}));

vi.mock("@/lib/glue/app-bootstrap", () => ({
  useFlags: () => ({ fixture: false, noimages: false, novoice: false }),
}));

const plan = fixture as RecipePlan;

describe("useAnswer", () => {
  beforeEach(() => {
    useStore.setState({
      plan: undefined,
      stepIndex: 0,
      cards: [],
      activeTimer: undefined,
      generation: 0,
    });
    useStore.getState().setPlan(plan);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("streams the fallback response into the current step's answer card", async () => {
    const encoder = new TextEncoder();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode("Slice "));
              controller.enqueue(encoder.encode("thinner."));
              controller.close();
            },
          }),
        ),
      ),
    );
    const { result } = renderHook(() => useAnswer());

    expect(result.current.ready).toBe(true);
    await act(async () => {
      await result.current.ask("How thin?");
    });

    const step = selectCurrentStep(useStore.getState());
    if (!step) throw new Error("Expected a current step");
    expect(selectAnswerFor(step.id)(useStore.getState())).toEqual({
      kind: "answer",
      stepId: step.id,
      question: "How thin?",
      text: "Slice thinner.",
      streaming: false,
    });
    expect(result.current.state.status).toBe("idle");
  });

  it("exposes a retry and stops streaming when the fallback fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 502 })));
    const { result } = renderHook(() => useAnswer());

    await act(async () => {
      await result.current.ask("How thin?");
    });

    expect(result.current.state).toMatchObject({
      status: "error",
      message: "Jacques couldn't answer that",
    });
    expect(result.current.state.status === "error" && result.current.state.retry).toBeTypeOf(
      "function",
    );

    const step = selectCurrentStep(useStore.getState());
    if (!step) throw new Error("Expected a current step");
    expect(selectAnswerFor(step.id)(useStore.getState())?.streaming).toBe(false);
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";

const { sessionInstances, RealtimeSessionMock, RealtimeAgentMock, toolMock } = vi.hoisted(() => {
  const sessionInstances: InstanceType<typeof RealtimeSessionMock>[] = [];

  class RealtimeSessionMock {
    connect = vi.fn(async () => {});
    close = vi.fn();
    sendMessage = vi.fn();
    listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
    on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      const existing = this.listeners[event] ?? [];
      existing.push(handler);
      this.listeners[event] = existing;
    });
    emit(event: string, ...args: unknown[]) {
      for (const handler of this.listeners[event] ?? []) handler(...args);
    }
    constructor(
      public agent: unknown,
      public options: unknown,
    ) {
      sessionInstances.push(this);
    }
  }

  class RealtimeAgentMock {
    constructor(public config: unknown) {}
  }

  const toolMock = vi.fn((config: { execute: (args: unknown) => Promise<unknown> }) => config);

  return { sessionInstances, RealtimeSessionMock, RealtimeAgentMock, toolMock };
});

vi.mock("@openai/agents/realtime", () => ({
  RealtimeAgent: RealtimeAgentMock,
  RealtimeSession: RealtimeSessionMock,
  tool: toolMock,
}));

import {
  currentStepPayload,
  NARRATE_STEP_PROMPT,
  recordAnswer,
  useJacquesVoice,
} from "./use-jacques-voice";

const plan: RecipePlan = {
  id: "test-plan",
  title: "Weeknight Carbonara",
  servings: 2,
  totalMinutes: 20,
  ingredients: [],
  equipment: [],
  steps: [
    {
      id: "s1",
      kind: "prep",
      title: "Dice the guanciale",
      detail: "Cut the guanciale into quarter-inch strips.",
      ingredients: ["guanciale"],
      questions: ["Why quarter-inch?", "Can I use pancetta?", "Do I need the rind?"],
      doneWhen: "Strips are even and no larger than a matchstick.",
    },
    {
      id: "s2",
      kind: "combine",
      title: "Toss the pasta",
      detail: "Off heat, toss the pasta with the egg mixture until glossy.",
      ingredients: ["pasta", "egg"],
      questions: ["Why off heat?", "How glossy?", "What if it clumps?"],
    },
  ],
};

function resetStore() {
  useStore.setState({
    plan: undefined,
    stepIndex: 0,
    cards: [],
    activeTimer: undefined,
    generation: 0,
    watch: { active: false, status: "idle" },
  });
}

describe("currentStepPayload", () => {
  beforeEach(resetStore);

  it("reports an error placeholder when no recipe is loaded", () => {
    expect(currentStepPayload()).toEqual({ error: "No recipe is loaded yet." });
  });

  it("grounds the model in the current step's real content", () => {
    useStore.getState().setPlan(plan);

    expect(currentStepPayload()).toEqual({
      recipeTitle: "Weeknight Carbonara",
      stepNumber: 1,
      totalSteps: 2,
      title: "Dice the guanciale",
      detail: "Cut the guanciale into quarter-inch strips.",
      doneWhen: "Strips are even and no larger than a matchstick.",
      durationSec: null,
      ingredients: ["guanciale"],
      tools: [],
    });
  });
});

describe("recordAnswer", () => {
  beforeEach(resetStore);

  it("pushes an answer card for the current step and notifies the caller", () => {
    useStore.getState().setPlan(plan);
    const onQuestion = vi.fn();

    recordAnswer(
      "Can I use pancetta?",
      "Yes, pancetta works if guanciale is unavailable.",
      onQuestion,
    );

    expect(useStore.getState().cards).toEqual([
      {
        kind: "answer",
        stepId: "s1",
        question: "Can I use pancetta?",
        text: "Yes, pancetta works if guanciale is unavailable.",
        streaming: false,
      },
    ]);
    expect(onQuestion).toHaveBeenCalledWith("Can I use pancetta?");
  });

  it("does nothing to the store when no plan is loaded, but still notifies the caller", () => {
    const onQuestion = vi.fn();
    recordAnswer("Any tips?", "Not right now.", onQuestion);

    expect(useStore.getState().cards).toEqual([]);
    expect(onQuestion).toHaveBeenCalledWith("Any tips?");
  });
});

describe("useJacquesVoice", () => {
  beforeEach(() => {
    resetStore();
    sessionInstances.length = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ value: "ek_test123", expiresAt: 1_700_000_600 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mints a session token, connects, and narrates the current step once connected", async () => {
    useStore.getState().setPlan(plan);
    const { result } = renderHook(() => useJacquesVoice({ enabled: true }));

    await act(async () => {
      await result.current.start();
    });

    expect(fetch).toHaveBeenCalledWith("/api/realtime/session", { method: "POST" });
    expect(sessionInstances).toHaveLength(1);
    expect(sessionInstances[0].connect).toHaveBeenCalledWith({ apiKey: "ek_test123" });
    expect(sessionInstances[0].sendMessage).toHaveBeenCalledWith(NARRATE_STEP_PROMPT);
    // Without this, the mic hears Jacques's own voice through the speaker and server VAD
    // treats it as a barge-in, cutting him off mid-sentence every time he starts talking.
    expect(sessionInstances[0].options).toMatchObject({
      config: {
        audio: {
          input: {
            noiseReduction: { type: "far_field" },
            turnDetection: { type: "server_vad", createResponse: true, interruptResponse: false },
          },
        },
      },
    });

    await waitFor(() => expect(result.current.status).toBe("connected"));
  });

  it("narrates again when the cook advances to a new step", async () => {
    useStore.getState().setPlan(plan);
    const { result } = renderHook(() => useJacquesVoice({ enabled: true }));

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe("connected"));

    const session = sessionInstances[0];
    session.sendMessage.mockClear();

    act(() => {
      useStore.getState().next();
    });

    expect(session.sendMessage).toHaveBeenCalledWith(NARRATE_STEP_PROMPT);
  });

  it("surfaces a session error and releases the connection on stop", async () => {
    useStore.getState().setPlan(plan);
    const { result } = renderHook(() => useJacquesVoice({ enabled: true }));

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe("connected"));

    const session = sessionInstances[0];
    act(() => {
      session.emit("error", { error: new Error("transport dropped") });
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("transport dropped");

    act(() => {
      result.current.stop();
    });
    expect(session.close).toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("stops the session when voice mode becomes disabled", async () => {
    useStore.getState().setPlan(plan);
    const { result, rerender } = renderHook(({ enabled }) => useJacquesVoice({ enabled }), {
      initialProps: { enabled: true },
    });

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe("connected"));

    rerender({ enabled: false });

    expect(sessionInstances[0].close).toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("reports an error when no OPENAI_API_KEY is configured server-side", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "OPENAI_API_KEY not set" }, { status: 503 })),
    );
    const { result } = renderHook(() => useJacquesVoice({ enabled: true }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe("error");
    expect(sessionInstances).toHaveLength(0);
  });
});

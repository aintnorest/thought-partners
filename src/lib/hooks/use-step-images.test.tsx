import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";
import { useStepImages } from "./use-step-images";

const { flags } = vi.hoisted(() => ({
  flags: { fixture: false, noimages: false, novoice: false },
}));

vi.mock("@/lib/glue/app-bootstrap", () => ({
  useFlags: () => flags,
}));

const plan: RecipePlan = {
  id: "image-plan",
  title: "Image plan",
  servings: 1,
  totalMinutes: 5,
  ingredients: [],
  equipment: [],
  steps: [
    {
      id: "chop",
      kind: "prep",
      title: "Chop",
      detail: "Chop the vegetables",
      ingredients: [],
      imagePrompt: "Finely chopped vegetables on a board",
      questions: [],
    },
  ],
};

describe("useStepImages", () => {
  beforeEach(() => {
    flags.fixture = false;
    flags.noimages = false;
    flags.novoice = false;
    useStore.setState({
      plan: undefined,
      stepIndex: 0,
      cards: [],
      activeTimer: undefined,
      generation: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("requests only missing prompted steps and applies returned image URLs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ chop: "data:image/png;base64,c3RlcA==" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    useStore.getState().setPlan(plan);

    renderHook(() => useStepImages());

    await waitFor(() => {
      expect(useStore.getState().plan?.steps[0]?.imageUrl).toBe("data:image/png;base64,c3RlcA==");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/images");
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toEqual({
      planId: "image-plan",
      steps: [{ id: "chop", imagePrompt: "Finely chopped vegetables on a board" }],
    });
  });

  it("does not request images when noimages is enabled", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    flags.noimages = true;
    useStore.getState().setPlan(plan);

    renderHook(() => useStepImages());

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still backfills under StrictMode's mount-unmount-mount", async () => {
    const fetchMock = vi.fn().mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
          setTimeout(() => resolve(Response.json({ chop: "data:image/png;base64,c3RlcA==" })), 10);
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    useStore.getState().setPlan(plan);

    renderHook(() => useStepImages(), { reactStrictMode: true });

    await waitFor(() => {
      expect(useStore.getState().plan?.steps[0]?.imageUrl).toBe("data:image/png;base64,c3RlcA==");
    });
    // First attempt aborted by the simulated unmount, second attempt completes.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

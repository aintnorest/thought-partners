import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/plan.carbonara.json";
import { useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";
import { useVisionCheck } from "./use-vision-check";

const plan = fixture as RecipePlan;
const fetchMock = vi.fn();

describe("useVisionCheck", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    useStore.setState({
      plan,
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

  it("posts the current step and stores a valid verdict", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        status: "close",
        observed: "uneven",
        fix: "halve the big ones",
      }),
    );
    const file = new File(["photo"], "prep.jpg", { type: "image/jpeg" });
    const { result } = renderHook(() => useVisionCheck());

    await act(async () => {
      await result.current.check(file);
    });

    expect(result.current.state).toEqual({ status: "idle" });
    expect(useStore.getState().cards).toEqual([
      {
        kind: "verdict",
        stepId: plan.steps[0].id,
        verdict: {
          status: "close",
          observed: "uneven",
          fix: "halve the big ones",
        },
      },
    ]);

    expect(fetchMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.method).toBe("POST");
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get("stepId")).toBe(plan.steps[0].id);
  });

  it("exposes a retry after a failed response without storing a card", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "unavailable" }, { status: 502 }));
    const file = new File(["photo"], "prep.jpg", { type: "image/jpeg" });
    const { result } = renderHook(() => useVisionCheck());

    await act(async () => {
      await result.current.check(file);
    });

    expect(result.current.state).toMatchObject({
      status: "error",
      message: "Jacques couldn't read that photo",
      retry: expect.any(Function),
    });
    expect(useStore.getState().cards).toEqual([]);
  });
});

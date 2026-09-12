import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/plan.carbonara.json";
import { useStore } from "@/lib/store";
import { useImportPlan } from "./use-import-plan";

describe("useImportPlan", () => {
  beforeEach(() => {
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

  it("installs a valid imported plan and returns to idle", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useImportPlan());

    await act(() => result.current.submit({ text: "Carbonara recipe" }));

    expect(useStore.getState().plan?.id).toBe("carbonara");
    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("exposes an explicit retry that reposts the same input", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useImportPlan());
    const input = { url: "https://example.com/recipe" };

    await act(() => result.current.submit(input));

    const failed = result.current.state;
    if (failed.status !== "error") {
      throw new Error("Expected import failure state");
    }

    act(() => failed.retry());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const bodies = fetchMock.mock.calls.map(([, init]) => init?.body);
    expect(bodies).toEqual([JSON.stringify(input), JSON.stringify(input)]);
  });
});

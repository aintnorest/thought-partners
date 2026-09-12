import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/plan.carbonara.json";
import type { RecipePlan } from "@/lib/types";
import { POST } from "./route";

const { generateTextMock } = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
}));

vi.mock("ai", () => ({
  generateText: generateTextMock,
}));

const plan = fixture as RecipePlan;

function heartbeatRequest(body: unknown) {
  return new Request("http://localhost/api/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/heartbeat", () => {
  beforeEach(() => {
    generateTextMock.mockReset();
  });

  it("rejects a negative elapsed time before calling the provider", async () => {
    const response = await POST(heartbeatRequest({ stepId: "boil-water", elapsedSec: -1, plan }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid request" });
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown step before calling the provider", async () => {
    const response = await POST(heartbeatRequest({ stepId: "missing", elapsedSec: 90, plan }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "unknown stepId" });
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("returns only the first generated line", async () => {
    generateTextMock.mockResolvedValue({
      text: "Ninety seconds in — big bubbles across the whole surface yet?\nextra",
    });

    const response = await POST(heartbeatRequest({ stepId: "boil-water", elapsedSec: 90, plan }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      line: "Ninety seconds in — big bubbles across the whole surface yet?",
    });
    expect(generateTextMock).toHaveBeenCalledOnce();
  });

  it("falls back to a short local line when generation fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    generateTextMock.mockRejectedValue(new Error("provider leaked detail"));

    const response = await POST(heartbeatRequest({ stepId: "boil-water", elapsedSec: 90, plan }));
    const body = (await response.json()) as { line: string };

    expect(response.status).toBe(200);
    expect(body.line).toContain("1 min in");
    expect(body.line.trim()).not.toBe("");
    expect(body.line.trim().split(/\s+/).length).toBeLessThanOrEqual(20);
    expect(body.line).not.toContain("provider leaked detail");

    consoleError.mockRestore();
  });
});

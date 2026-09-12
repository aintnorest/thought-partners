import { streamText } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/plan.carbonara.json";
import type { RecipePlan } from "@/lib/types";
import { POST } from "./route";

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

const plan = fixture as RecipePlan;
const step = plan.steps[0];

function request(body: unknown): Request {
  return new Request("http://localhost/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validBody() {
  return {
    planId: plan.id,
    stepId: step.id,
    question: "How thin should I slice it?",
    plan,
  };
}
beforeEach(() => {
  vi.mocked(streamText).mockReset();
  vi.mocked(streamText).mockReturnValue({
    toTextStreamResponse: () =>
      new Response("Slice thinner.", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
  } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/ask", () => {
  it("rejects a missing question before calling the model", async () => {
    const { question: _question, ...body } = validBody();

    const response = await POST(request(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid request" });
    expect(streamText).not.toHaveBeenCalled();
  });

  it("rejects an unknown stepId before calling the model", async () => {
    const response = await POST(request({ ...validBody(), stepId: "missing-step" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "unknown stepId" });
    expect(streamText).not.toHaveBeenCalled();
  });

  it("streams the model answer as raw text with current-step context", async () => {
    const response = await POST(request(validBody()));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe("Slice thinner.");
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining(step.title),
      }),
    );
  });

  it("returns a generic 502 when the answer stream cannot start", async () => {
    const error = new Error("provider leaked detail");
    vi.mocked(streamText).mockImplementationOnce(() => {
      throw error;
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(request(validBody()));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "answer unavailable" });
    expect(consoleError).toHaveBeenCalledWith("Failed to start answer stream", error);
    consoleError.mockRestore();
  });
});

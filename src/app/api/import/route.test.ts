import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/plan.carbonara.json";
import type { RecipePlan } from "@/lib/types";

const { generateObjectMock } = vi.hoisted(() => ({
  generateObjectMock: vi.fn(),
}));

vi.mock("ai", () => ({
  generateObject: generateObjectMock,
}));

import { POST } from "./route";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/import", () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
  });

  it("rejects an empty request before calling the model", async () => {
    const response = await post({});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid request" });
    expect(generateObjectMock).not.toHaveBeenCalled();
  });

  it("returns a generated plan without image URLs", async () => {
    const generated = structuredClone(fixture) as RecipePlan;
    generated.id = "generated-plan";
    generateObjectMock.mockResolvedValue({ object: generated });

    const response = await post({ text: "A complete pasta recipe" });
    const body = (await response.json()) as RecipePlan;

    expect(response.status).toBe(200);
    expect(body.id).toBe("generated-plan");
    expect(body.steps.every((step) => step.imageUrl === undefined)).toBe(true);
    expect(generateObjectMock).toHaveBeenCalledOnce();
  });

  it("retries once then returns the fixture when generation fails", async () => {
    generateObjectMock.mockRejectedValue(new Error("provider failed"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const response = await post({ text: "A complete pasta recipe" });
      const body = (await response.json()) as RecipePlan;

      expect(response.status).toBe(200);
      expect(body.id).toBe("carbonara");
      expect(generateObjectMock).toHaveBeenCalledTimes(2);
    } finally {
      consoleError.mockRestore();
    }
  });
});

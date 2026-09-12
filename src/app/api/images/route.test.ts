import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetCacheForTests } from "@/lib/images/cache";
import { generateTechniqueImage } from "@/lib/images/generate";
import { POST } from "./route";

vi.mock("@/lib/images/generate", () => ({
  generateTechniqueImage: vi.fn(),
}));

const mockedGenerateTechniqueImage = vi.mocked(generateTechniqueImage);

function request(body: unknown): Request {
  return new Request("http://localhost/api/images", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/images", () => {
  beforeEach(() => {
    _resetCacheForTests();
    mockedGenerateTechniqueImage.mockReset();
  });

  it("rejects an invalid body before generating images", async () => {
    const response = await POST(request({ planId: "plan", steps: "invalid" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid request" });
    expect(mockedGenerateTechniqueImage).not.toHaveBeenCalled();
  });

  it("rejects more than twelve steps before generating images", async () => {
    const steps = Array.from({ length: 13 }, (_, index) => ({
      id: `step-${index}`,
      imagePrompt: `prompt-${index}`,
    }));

    const response = await POST(request({ planId: "plan", steps }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid request" });
    expect(mockedGenerateTechniqueImage).not.toHaveBeenCalled();
  });

  it("returns only successfully generated step images", async () => {
    mockedGenerateTechniqueImage.mockImplementation(async (imagePrompt) =>
      imagePrompt === "slice the onion" ? "data:image/png;base64,onion" : undefined,
    );

    const response = await POST(
      request({
        planId: "plan",
        steps: [
          { id: "slice", imagePrompt: "slice the onion" },
          { id: "boil", imagePrompt: "boil the water" },
        ],
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      slice: "data:image/png;base64,onion",
    });
    expect(mockedGenerateTechniqueImage).toHaveBeenCalledTimes(2);
  });
});

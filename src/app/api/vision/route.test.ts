import { generateObject } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/plan.carbonara.json";
import type { RecipePlan, VisionVerdict } from "@/lib/types";
import { POST } from "./route";

vi.mock("ai", () => ({ generateObject: vi.fn() }));

const plan = fixture as RecipePlan;
const generateObjectMock = vi.mocked(generateObject);

function requestWith(form: FormData): Request {
  const request = new Request("http://localhost/api/vision", { method: "POST" });
  request.formData = async () => form;
  return request;
}

describe("POST /api/vision", () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
  });

  it("rejects a missing image before calling the model", async () => {
    const form = new FormData();
    form.set("stepId", "chop-guanciale");
    form.set("plan", JSON.stringify(plan));

    const response = await POST(requestWith(form));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid request" });
    expect(generateObjectMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown step before calling the model", async () => {
    const form = new FormData();
    form.set("image", new File([new Uint8Array([1, 2, 3])], "board.jpg", { type: "image/jpeg" }));
    form.set("stepId", "missing-step");
    form.set("plan", JSON.stringify(plan));

    const response = await POST(requestWith(form));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "unknown stepId" });
    expect(generateObjectMock).not.toHaveBeenCalled();
  });

  it("enforces the four megabyte image limit before calling the model", async () => {
    const form = new FormData();
    form.set(
      "image",
      new File([new Uint8Array(4 * 1024 * 1024 + 1)], "board.jpg", { type: "image/jpeg" }),
    );
    form.set("stepId", "chop-guanciale");
    form.set("plan", JSON.stringify(plan));

    const response = await POST(requestWith(form));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "image too large" });
    expect(generateObjectMock).not.toHaveBeenCalled();
  });

  it("returns the model's strict vision verdict", async () => {
    const verdict: VisionVerdict = {
      status: "close",
      observed: "pieces uneven",
      fix: "cut the large ones in half",
    };
    generateObjectMock.mockResolvedValue({ object: verdict } as never);
    const form = new FormData();
    form.set("image", new File([new Uint8Array([1, 2, 3])], "board.jpg", { type: "image/jpeg" }));
    form.set("stepId", "chop-guanciale");
    form.set("plan", JSON.stringify(plan));

    const response = await POST(requestWith(form));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(verdict);
    expect(generateObjectMock).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0 }));
  });
});

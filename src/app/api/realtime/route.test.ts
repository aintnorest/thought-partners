import { describe, expect, it } from "vitest";
import fixture from "@/fixtures/plan.carbonara.json";
import type { RecipePlan } from "@/lib/types";
import { POST } from "./route";

const plan = fixture as RecipePlan;

function requestWith(form: FormData): Request {
  const request = new Request("http://localhost/api/realtime", { method: "POST" });
  request.formData = async () => form;
  return request;
}

describe("POST /api/realtime", () => {
  it("acknowledges microphone chunks for the current step", async () => {
    const form = new FormData();
    form.set("plan", JSON.stringify(plan));
    form.set("stepId", "render-guanciale");
    form.set("source", "audio");
    form.set("audio", new File([new Uint8Array([1, 2, 3])], "turn.webm", { type: "audio/webm" }));

    const response = await POST(requestWith(form));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(await response.text()).toContain(
      '"audio":{"received":true,"bytes":3,"type":"audio/webm"}',
    );
  });

  it("rejects requests without audio or image media", async () => {
    const form = new FormData();
    form.set("plan", JSON.stringify(plan));
    form.set("stepId", "render-guanciale");
    form.set("source", "audio");

    const response = await POST(requestWith(form));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "missing media" });
  });

  it("rejects unknown steps before accepting mic data", async () => {
    const form = new FormData();
    form.set("plan", JSON.stringify(plan));
    form.set("stepId", "missing");
    form.set("source", "audio");
    form.set("audio", new File([new Uint8Array([1])], "turn.webm", { type: "audio/webm" }));

    const response = await POST(requestWith(form));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "unknown stepId" });
  });
});

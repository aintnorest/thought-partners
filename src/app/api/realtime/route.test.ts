import { describe, expect, it } from "vitest";
import fixture from "@/fixtures/plan.carbonara.json";
import { POST } from "./route";

function mediaForm(source: "audio" | "frame"): FormData {
  const form = new FormData();
  form.set("plan", JSON.stringify(fixture));
  form.set("stepId", "render-guanciale");
  form.set("source", source);
  return form;
}

function requestWith(form: FormData): Request {
  const request = new Request("http://localhost/api/realtime", { method: "POST" });
  request.formData = async () => form;
  return request;
}

function mediaFile(type: string, size = 3): File {
  return new File([new Uint8Array(size)], "capture", { type });
}

describe("POST /api/realtime", () => {
  it.each([
    ["audio", "audio", "audio/webm;codecs=opus"],
    ["audio", "audio", "audio/webm"],
    ["audio", "audio", "audio/mp4"],
    ["audio", "audio", "audio/aac"],
    ["audio", "audio", "audio/ogg;codecs=opus"],
    ["frame", "image", "image/jpeg"],
    ["frame", "image", "image/png"],
    ["frame", "image", "image/webp"],
  ] as const)("accepts %s capture with %s media of type %s", async (source, field, type) => {
    const form = mediaForm(source);
    form.set(field, mediaFile(type));

    const response = await POST(requestWith(form));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(await response.text()).toContain("event: watch_ack\n");
  });

  it.each([
    ["audio", "audio", "image", "audio/webm", "image/jpeg"],
    ["frame", "image", "audio", "image/jpeg", "audio/webm"],
  ] as const)(
    "rejects absent, mismatched, and malformed %s source media",
    async (source, field, otherField, type, otherType) => {
      const missing = mediaForm(source);
      expect((await POST(requestWith(missing))).status).toBe(400);

      const mismatched = mediaForm(source);
      mismatched.set(otherField, mediaFile(otherType));
      expect((await POST(requestWith(mismatched))).status).toBe(400);

      for (const media of [
        "not a file",
        mediaFile(type, 0),
        mediaFile(otherType),
        mediaFile("text/plain"),
        mediaFile(""),
        mediaFile(source === "audio" ? "audio/unsupported" : "image/svg+xml"),
      ]) {
        const form = mediaForm(source);
        form.set(field, media);
        expect((await POST(requestWith(form))).status).toBe(400);
      }
    },
  );

  it.each([
    ["audio", "audio", "audio/webm", 2 * 1024 * 1024],
    ["frame", "image", "image/jpeg", 4 * 1024 * 1024],
  ] as const)("enforces the %s size boundary", async (source, field, type, limit) => {
    const form = mediaForm(source);
    form.set(field, mediaFile(type, limit));
    expect((await POST(requestWith(form))).status).toBe(200);

    form.set(field, mediaFile(type, limit + 1));
    expect((await POST(requestWith(form))).status).toBe(400);
  });

  it("rejects malformed additional media even when source media is valid", async () => {
    const form = mediaForm("audio");
    form.set("audio", mediaFile("audio/webm"));
    form.set("image", mediaFile("text/html"));
    expect((await POST(requestWith(form))).status).toBe(400);

    form.set("image", "not a file");
    expect((await POST(requestWith(form))).status).toBe(400);
  });

  it("rejects an unknown step before acknowledging capture", async () => {
    const form = mediaForm("audio");
    form.set("stepId", "missing");
    form.set("audio", mediaFile("audio/webm"));

    expect((await POST(requestWith(form))).status).toBe(400);
  });
});

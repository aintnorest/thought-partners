import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/health", () => {
  it("reports ok with a timestamp and uptime", async () => {
    const response = GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(typeof body.uptimeMs).toBe("number");
    expect(body.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
    expect(body.keys).toEqual({
      openai: Boolean(process.env.OPENAI_API_KEY),
      google: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      fal: Boolean(process.env.FAL_KEY),
    });
  });

  it("reports which provider keys are configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "openai-key");
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    vi.stubEnv("FAL_KEY", "fal-key");

    const body = await GET().json();

    expect(body.keys).toEqual({
      openai: true,
      google: false,
      fal: true,
    });
  });
});

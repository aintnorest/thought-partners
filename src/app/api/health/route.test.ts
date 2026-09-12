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
    expect(body.keys).toEqual({ openrouter: Boolean(process.env.OPENROUTER_API_KEY) });
  });

  it("reports whether the OpenRouter key is configured without leaking it", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-secret");
    const body = await GET().json();
    expect(body.keys).toEqual({ openrouter: true });
    expect(JSON.stringify(body)).not.toContain("sk-or-secret");

    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect((await GET().json()).keys).toEqual({ openrouter: false });
  });
});

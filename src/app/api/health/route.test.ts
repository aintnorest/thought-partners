import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const req = (query = "") => new Request(`http://localhost/api/health${query}`);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/health", () => {
  it("reports ok with a timestamp and uptime", async () => {
    const response = await GET(req());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(typeof body.uptimeMs).toBe("number");
    expect(body.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
    expect(body.keys).toEqual({
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    });
    expect(body.openrouter).toBeUndefined();
  });

  it("reports whether the OpenAI key is configured without leaking it", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-secret");
    const body = await (await GET(req())).json();
    expect(body.keys.openai).toBe(true);
    expect(JSON.stringify(body)).not.toContain("sk-openai-secret");

    vi.stubEnv("OPENAI_API_KEY", "");
    expect((await (await GET(req())).json()).keys.openai).toBe(false);
  });

  it("reports whether the OpenRouter key is configured without leaking it", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-secret");
    const body = await (await GET(req())).json();
    expect(body.keys.openrouter).toBe(true);
    expect(JSON.stringify(body)).not.toContain("sk-or-secret");

    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect((await (await GET(req())).json()).keys.openrouter).toBe(false);
  });

  it("probes the key against OpenRouter only when asked, without leaking it", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-secret");
    const fetchMock = vi.fn(async () =>
      Response.json({ data: { usage: 1.5, limit: 20, limit_remaining: 18.5 } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const body = await (await GET(req("?probe=1"))).json();
    expect(body.openrouter).toEqual({ valid: true, usage: 1.5, limit: 20, limitRemaining: 18.5 });
    expect(JSON.stringify(body)).not.toContain("sk-or-secret");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/auth/key",
      expect.objectContaining({ headers: { Authorization: "Bearer sk-or-secret" } }),
    );
  });
});

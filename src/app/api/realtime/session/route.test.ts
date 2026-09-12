import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/realtime/session", () => {
  it("returns 503 without leaking anything when OPENAI_API_KEY is unset", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await POST();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "OPENAI_API_KEY not set" });
  });

  it("mints a client secret using the server key, without leaking it to the response", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-secret");
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      Response.json({ value: "ek_abc123", expires_at: 1_700_000_600 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ value: "ek_abc123", expiresAt: 1_700_000_600 });
    expect(JSON.stringify(body)).not.toContain("sk-openai-secret");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/realtime/client_secrets",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer sk-openai-secret" }),
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsedBody = JSON.parse(init.body as string);
    expect(parsedBody.session.type).toBe("realtime");
    expect(typeof parsedBody.session.model).toBe("string");
  });

  it("returns 502 without leaking the key when OpenAI rejects the request", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unauthorized", { status: 401 })),
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(JSON.stringify(body)).not.toContain("sk-openai-secret");
  });

  it("returns 502 when the response is missing expected fields", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ unexpected: true })),
    );

    const response = await POST();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "voice session unavailable" });
  });

  it("returns 502 without throwing when the network call fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const response = await POST();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "voice session unavailable" });

    consoleError.mockRestore();
  });
});

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function call(path: string, headers: Record<string, string> = {}, method = "POST") {
  return proxy(new NextRequest(`https://jacques.test${path}`, { method, headers }));
}

describe("proxy origin gate", () => {
  it("refuses API calls with no browser origin signal", async () => {
    const response = call("/api/ask");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden" });
  });

  it("allows same-origin browser requests via Sec-Fetch-Site", () => {
    expect(call("/api/ask", { "sec-fetch-site": "same-origin" }).status).toBe(200);
  });

  it("allows an Origin matching the served host, including localhost", () => {
    expect(
      call("/api/ask", { origin: "http://localhost:3000", host: "localhost:3000" }).status,
    ).toBe(200);
    expect(
      call("/api/ask", {
        origin: "https://thought-partners-mu.vercel.app",
        host: "10.0.0.1",
        "x-forwarded-host": "thought-partners-mu.vercel.app",
      }).status,
    ).toBe(200);
  });

  it("refuses a foreign Origin", () => {
    expect(
      call("/api/images", { origin: "https://evil.example", host: "jacques.test" }).status,
    ).toBe(403);
  });

  it("leaves /api/health open", () => {
    expect(call("/api/health", {}, "GET").status).toBe(200);
  });
});

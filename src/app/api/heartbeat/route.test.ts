import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/heartbeat", () => {
  it("reports that the handler is not implemented", async () => {
    const response = await POST(new Request("http://localhost/api/heartbeat", { method: "POST" }));

    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({ error: "not implemented" });
  });
});

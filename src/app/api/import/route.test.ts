import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/import", () => {
  it("returns the carbonara fixture", async () => {
    const response = await POST(new Request("http://localhost/api/import", { method: "POST" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe("carbonara");
    expect(Array.isArray(body.steps)).toBe(true);
  });
});

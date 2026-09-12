import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

function postJson(body: unknown): Request {
  return new Request("http://localhost/api/recipes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/recipes", () => {
  it("returns the seeded recipes", async () => {
    const response = GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.recipes)).toBe(true);
    expect(body.recipes.length).toBeGreaterThan(0);
  });
});

describe("POST /api/recipes", () => {
  it("creates a recipe and returns 201", async () => {
    const response = await POST(
      postJson({ title: "API Test Dish", servings: 3, steps: [{ instruction: "Cook it" }] }),
    );
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.recipe.title).toBe("API Test Dish");
    expect(body.recipe.servings).toBe(3);
  });

  it("returns 400 for a malformed JSON body", async () => {
    const request = new Request("http://localhost/api/recipes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 422 for a body that fails validation", async () => {
    const response = await POST(postJson({ title: "", servings: 1, steps: [] }));
    expect(response.status).toBe(422);

    const body = await response.json();
    expect(typeof body.error).toBe("string");
  });
});

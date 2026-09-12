import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRecipeText, isAllowedUrl, MAX_BODY_BYTES } from "./fetch-recipe";

vi.mock("node:dns/promises", () => {
  const lookup = async () => [{ address: "93.184.216.34", family: 4 }];
  return { lookup, default: { lookup } };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isAllowedUrl", () => {
  it.each([
    "ftp://example.com/recipe",
    "http://user:pw@example.com/recipe",
    "http://127.0.0.1/",
    "http://10.0.0.1/",
    "http://169.254.169.254/",
    "http://0.0.0.0/",
    "http://0.1.2.3/",
    "http://localhost/",
  ])("rejects %s", (url) => {
    expect(isAllowedUrl(new URL(url))).toBe(false);
  });

  it("accepts a public HTTPS URL", () => {
    expect(isAllowedUrl(new URL("https://example.com/recipe"))).toBe(true);
  });
});

describe("fetchRecipeText", () => {
  it("rejects a response body larger than the byte limit", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_BODY_BYTES + 1));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

    await expect(fetchRecipeText("https://example.com/recipe")).rejects.toThrow(/too large/);
  });

  it("rejects pages with no readable text after HTML cleanup", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(`<script>${"not readable".repeat(10)}</script>`, { status: 200 }),
        ),
    );

    await expect(fetchRecipeText("https://example.com/recipe")).rejects.toThrow(/no readable text/);
  });
});

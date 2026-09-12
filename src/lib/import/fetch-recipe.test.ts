import { describe, expect, it } from "vitest";
import { isAllowedUrl } from "./fetch-recipe";

describe("isAllowedUrl", () => {
  it.each([
    "ftp://example.com/recipe",
    "http://user:pw@example.com/recipe",
    "http://127.0.0.1/",
    "http://10.0.0.1/",
    "http://169.254.169.254/",
    "http://localhost/",
  ])("rejects %s", (url) => {
    expect(isAllowedUrl(new URL(url))).toBe(false);
  });

  it("accepts a public HTTPS URL", () => {
    expect(isAllowedUrl(new URL("https://example.com/recipe"))).toBe(true);
  });
});

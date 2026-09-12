import { describe, expect, it } from "vitest";
import {
  createRecipe,
  estimateTotalSeconds,
  getRecipe,
  listRecipes,
  type Recipe,
  ValidationError,
} from "@/lib/recipes";

describe("createRecipe", () => {
  it("persists a valid recipe with generated step ids", () => {
    const recipe = createRecipe({
      title: "Test Toast",
      servings: 2,
      steps: [
        { instruction: "Toast the bread", durationSeconds: 120, doneWhen: "Bread is golden." },
        { instruction: "Butter it" },
      ],
    });

    expect(recipe.id).toBe("test-toast");
    expect(recipe.steps.map((step) => step.id)).toEqual(["test-toast-1", "test-toast-2"]);
    expect(recipe.steps[0]?.doneWhen).toBe("Bread is golden.");
    expect(getRecipe(recipe.id)).toEqual(recipe);
    expect(listRecipes()).toContainEqual(recipe);
  });

  it("generates a unique id when the slug already exists", () => {
    const first = createRecipe({ title: "Dupe", servings: 1, steps: [{ instruction: "Do it" }] });
    const second = createRecipe({ title: "Dupe", servings: 1, steps: [{ instruction: "Do it" }] });

    expect(first.id).toBe("dupe");
    expect(second.id).not.toBe(first.id);
    expect(second.id.startsWith("dupe-")).toBe(true);
  });

  it.each([
    ["missing title", { servings: 1, steps: [{ instruction: "x" }] }],
    ["blank title", { title: "  ", servings: 1, steps: [{ instruction: "x" }] }],
    ["non-integer servings", { title: "x", servings: 1.5, steps: [{ instruction: "x" }] }],
    ["zero servings", { title: "x", servings: 0, steps: [{ instruction: "x" }] }],
    ["empty steps", { title: "x", servings: 1, steps: [] }],
    ["blank instruction", { title: "x", servings: 1, steps: [{ instruction: " " }] }],
    [
      "negative duration",
      { title: "x", servings: 1, steps: [{ instruction: "x", durationSeconds: -1 }] },
    ],
    ["blank doneWhen", { title: "x", servings: 1, steps: [{ instruction: "x", doneWhen: " " }] }],
  ])("rejects %s", (_label, input) => {
    expect(() => createRecipe(input)).toThrow(ValidationError);
  });

  it("rejects non-object input", () => {
    expect(() => createRecipe(null)).toThrow(ValidationError);
    expect(() => createRecipe("nope")).toThrow(ValidationError);
  });
});

describe("estimateTotalSeconds", () => {
  it("sums step durations and treats missing durations as zero", () => {
    const recipe: Recipe = {
      id: "r",
      title: "R",
      servings: 1,
      steps: [
        { id: "r-1", instruction: "a", durationSeconds: 30 },
        { id: "r-2", instruction: "b" },
        { id: "r-3", instruction: "c", durationSeconds: 90 },
      ],
    };

    expect(estimateTotalSeconds(recipe)).toBe(120);
  });
});

describe("getRecipe", () => {
  it("returns undefined for an unknown id", () => {
    expect(getRecipe("does-not-exist")).toBeUndefined();
  });
});

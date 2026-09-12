import { describe, expect, it } from "vitest";
import { normalizePlan, PLAN_STEPS, planInvariantErrors, recipePlanSchema } from "@/lib/schemas";
import type { RecipePlan, Step } from "@/lib/types";

function makeStep(id: string, overrides: Partial<Step> = {}): Step {
  return {
    id,
    kind: "prep",
    title: `Step ${id}`,
    detail: "Prepare the ingredients.",
    ingredients: [],
    questions: ["Question one?", "Question two?", "Question three?"],
    doneWhen: "The ingredients are ready.",
    ...overrides,
  };
}

function makePlan(steps: Step[]): RecipePlan {
  return {
    id: "test-plan",
    title: "Test Plan",
    servings: 2,
    totalMinutes: 30,
    ingredients: [],
    equipment: [],
    steps,
  };
}

describe("plan schemas", () => {
  it("accepts a request step without doneWhen but reports the planner invariant", () => {
    const plan = makePlan([makeStep("s1", { doneWhen: undefined })]);

    expect(recipePlanSchema.safeParse(plan).success).toBe(true);
    expect(planInvariantErrors(plan)).toContain('step "s1" is missing doneWhen');
  });

  it("reports plans over the shared maximum step count", () => {
    const plan = makePlan(
      Array.from({ length: PLAN_STEPS.max + 1 }, (_, index) => makeStep(`s${index + 1}`)),
    );

    expect(planInvariantErrors(plan)).toContain(`plan has more than ${PLAN_STEPS.max} steps`);
  });

  it("normalizes parallel steps and removes generated image URLs", () => {
    const plan = makePlan([
      makeStep("s1", {
        parallelWith: ["s2", "unknown", "s1", "s2"],
        imageUrl: "https://example.com/one.png",
      }),
      makeStep("s2", { imageUrl: "https://example.com/two.png" }),
    ]);

    expect(normalizePlan(plan).steps).toEqual([
      makeStep("s1", { parallelWith: ["s2"] }),
      makeStep("s2", { parallelWith: ["s1"] }),
    ]);
  });

  it("gives the final plate step an image prompt when the model omitted one", () => {
    const plan = makePlan([
      makeStep("s1", { imagePrompt: "shrimp turning pink" }),
      makeStep("s2", { kind: "plate" }),
    ]);

    const steps = normalizePlan(plan).steps;
    expect(steps[0].imagePrompt).toBe("shrimp turning pink");
    expect(steps[1].imagePrompt).toBe(`${plan.title} plated and ready to serve`);
  });
});

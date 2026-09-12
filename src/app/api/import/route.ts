import { generateObject } from "ai";
import { z } from "zod";
import fixture from "@/fixtures/plan.carbonara.json";
import { fetchRecipeText } from "@/lib/import/fetch-recipe";
import { MODELS } from "@/lib/models";
import { lowReasoning, openrouter } from "@/lib/openrouter";
import { buildPlanPrompt } from "@/lib/prompts/plan";
import {
  planInvariantErrors,
  recipePlanModelSchema,
  recipePlanSchema,
  stripNulls,
} from "@/lib/schemas";
import type { RecipePlan } from "@/lib/types";

const importRequestSchema = z
  .object({
    url: z.string().trim().min(1).optional(),
    text: z.string().trim().min(1).optional(),
  })
  .refine(({ url, text }) => url !== undefined || text !== undefined);

type PlanAttempt = { plan: RecipePlan } | { error: string; cause?: unknown };

function withoutImageUrls(plan: RecipePlan): RecipePlan {
  return {
    ...plan,
    steps: plan.steps.map((step) => {
      const cleanStep = { ...step };
      delete cleanStep.imageUrl;
      return cleanStep;
    }),
  };
}

async function generatePlan(prompt: string): Promise<PlanAttempt> {
  try {
    const { object: raw } = await generateObject({
      model: openrouter.chat(MODELS.plan),
      schema: recipePlanModelSchema,
      prompt,
      providerOptions: lowReasoning,
    });

    const candidate = stripNulls(raw) as Record<string, unknown>;
    if (typeof candidate.id !== "string" || candidate.id.trim().length === 0) {
      candidate.id = `plan-${Date.now().toString(36)}`;
    }

    const validated = recipePlanSchema.safeParse(candidate);
    if (!validated.success) {
      return {
        error: validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      };
    }
    const object = validated.data;

    const invariantErrors = planInvariantErrors(object);
    if (invariantErrors.length > 0) {
      return { error: invariantErrors.join("; ") };
    }

    return { plan: withoutImageUrls(object) };
  } catch (cause) {
    return {
      error: cause instanceof Error ? cause.message : "model generation failed",
      cause,
    };
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const parsed = importRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  let recipeText = parsed.data.text;
  if (parsed.data.url) {
    try {
      recipeText = await fetchRecipeText(parsed.data.url);
    } catch {
      if (!recipeText) {
        return Response.json({ error: "could not fetch recipe URL" }, { status: 400 });
      }
    }
  }

  const firstAttempt = await generatePlan(buildPlanPrompt(recipeText ?? ""));
  if ("plan" in firstAttempt) {
    return Response.json(firstAttempt.plan);
  }

  const secondAttempt = await generatePlan(buildPlanPrompt(recipeText ?? "", firstAttempt.error));
  if ("plan" in secondAttempt) {
    return Response.json(secondAttempt.plan);
  }

  console.error(
    "Recipe planning failed after one retry; returning fixture",
    secondAttempt.cause ?? secondAttempt.error,
  );
  return Response.json(withoutImageUrls(fixture as RecipePlan));
}

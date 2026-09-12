import { z } from "zod";
import type { RecipePlan, Step, VisionVerdict } from "@/lib/types";

export const PLAN_STEPS = { min: 6, max: 12 } as const;

export const stepKindSchema = z.enum(["prep", "heat", "wait", "combine", "plate", "check"]);

export const ingredientSchema = z.object({
  name: z.string().min(1),
  qty: z.number().optional(),
  unit: z.string().optional(),
  prep: z.string().optional(),
});

export const stepSchema = z.object({
  id: z.string().min(1),
  kind: stepKindSchema,
  title: z.string().min(1).max(60),
  detail: z.string().min(1),
  durationSec: z.number().positive().optional(),
  attentionSec: z.number().positive().optional(),
  ingredients: z.array(z.string()),
  tools: z.array(z.string()).optional(),
  parallelWith: z.array(z.string()).optional(),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional(),
  questions: z.array(z.string()).length(3),
  doneWhen: z.string().min(1).optional(),
}) satisfies z.ZodType<Step>;

export const recipePlanSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  servings: z.number().int().positive(),
  totalMinutes: z.number().positive(),
  ingredients: z.array(ingredientSchema),
  equipment: z.array(z.string()),
  steps: z.array(stepSchema).min(1),
}) satisfies z.ZodType<RecipePlan>;

export const visionVerdictSchema = z.object({
  status: z.enum(["good", "close", "off"]),
  observed: z.string().min(1),
  fix: z.string().optional(),
}) satisfies z.ZodType<VisionVerdict>;

// --- Model-facing schemas ---------------------------------------------------
// OpenAI strict structured output requires every property in `required`, so optional
// fields are expressed as nullable here and stripped back to undefined afterwards.

export const stepModelSchema = z.object({
  id: z.string(),
  kind: stepKindSchema,
  title: z.string(),
  detail: z.string(),
  durationSec: z.number().nullable(),
  attentionSec: z.number().nullable(),
  ingredients: z.array(z.string()),
  tools: z.array(z.string()).nullable(),
  parallelWith: z.array(z.string()).nullable(),
  imagePrompt: z.string().nullable(),
  questions: z.array(z.string()),
  doneWhen: z.string(),
});

export const recipePlanModelSchema = z.object({
  id: z.string(),
  title: z.string(),
  servings: z.number(),
  totalMinutes: z.number(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      qty: z.number().nullable(),
      unit: z.string().nullable(),
      prep: z.string().nullable(),
    }),
  ),
  equipment: z.array(z.string()),
  steps: z.array(stepModelSchema),
});

export const visionVerdictModelSchema = z.object({
  status: z.enum(["good", "close", "off"]),
  observed: z.string(),
  fix: z.string().nullable(),
});

/** Recursively drops `null` values so a model-shaped object can be validated by the contract schemas. */
export function stripNulls<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripNulls) as T;
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry !== null) out[key] = stripNulls(entry);
    }
    return out as T;
  }
  return value;
}
/** Normalizes model plans before enforcing their semantic invariants. */
export function normalizePlan(plan: RecipePlan): RecipePlan {
  const ids = new Set(plan.steps.map((step) => step.id));
  const parallelById = new Map(plan.steps.map((step) => [step.id, new Set<string>()]));

  for (const step of plan.steps) {
    const parallel = parallelById.get(step.id);
    if (!parallel) continue;

    for (const other of step.parallelWith ?? []) {
      if (other === step.id || !ids.has(other)) continue;
      parallel.add(other);
      parallelById.get(other)?.add(step.id);
    }
  }

  return {
    ...plan,
    steps: plan.steps.map((step) => {
      const cleanStep = { ...step };
      const parallel = parallelById.get(step.id);
      delete cleanStep.imageUrl;

      if (step.parallelWith !== undefined || (parallel?.size ?? 0) > 0) {
        cleanStep.parallelWith = [...(parallel ?? [])];
      }

      return cleanStep;
    }),
  };
}

/** Semantic invariants from planner-and-brains §5 that zod shape alone cannot express. */
export function planInvariantErrors(plan: RecipePlan): string[] {
  const errors: string[] = [];
  if (plan.steps.length > PLAN_STEPS.max) {
    errors.push(`plan has more than ${PLAN_STEPS.max} steps`);
  }

  const ids = new Set<string>();
  for (const step of plan.steps) {
    if (!step.doneWhen) errors.push(`step "${step.id}" is missing doneWhen`);
    if (ids.has(step.id)) errors.push(`duplicate step id "${step.id}"`);
    ids.add(step.id);
  }
  for (const step of plan.steps) {
    for (const other of step.parallelWith ?? []) {
      if (other === step.id) errors.push(`step "${step.id}" lists itself in parallelWith`);
      else if (!ids.has(other)) errors.push(`step "${step.id}" parallelWith unknown id "${other}"`);
    }
  }
  return errors;
}

/** Resolves a client-supplied stepId against the submitted plan, or returns undefined. */
export function findStep(plan: RecipePlan, stepId: string): Step | undefined {
  return plan.steps.find((step) => step.id === stepId);
}

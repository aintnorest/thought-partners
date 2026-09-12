import { PLAN_STEPS } from "@/lib/schemas";

export function buildPlanPrompt(recipeText: string, priorError?: string): string {
  const retryInstruction = priorError
    ? `\nThe previous plan failed validation: ${priorError}\nCorrect every listed problem.`
    : "";

  return `Turn the recipe below into one RecipePlan with ${PLAN_STEPS.min}–${PLAN_STEPS.max} optimally ordered steps.

Requirements:
- Put all mise en place first. Merge trivially serial actions into one step.
- Use step ids s1 through sN in order. Use only these kinds: prep, heat, wait, combine, plate, check.
- Add parallelWith only for steps safe to do concurrently. References must be distinct existing ids and symmetric: if s2 names s3, s3 names s2.
- Give every step exactly 3 short questions a home cook would ask.
- Give every step a concrete sensory doneWhen cue.
- Keep each title at 60 characters or fewer. Write detail as 1–3 imperative sentences suitable for speaking aloud, with no preamble.
- Set durationSec on every timed step. For wait steps, set attentionSec to about one third of durationSec.
- Add imagePrompt only when a visual teaches a knife cut, doneness state, fold, or similarly visual technique. Make it content-only: subject and action. Never mention medium, style, lighting, viewpoint, camera, composition, or background.
- Use ingredient names consistently with the top-level ingredients list.
- Return only data matching the required schema.${retryInstruction}

Recipe:
${recipeText}`;
}

import type { RecipePlan, Step } from "@/lib/types";

function formatIngredient(ingredient: RecipePlan["ingredients"][number]): string {
  const amount = [ingredient.qty, ingredient.unit].filter((value) => value !== undefined).join(" ");
  const preparation = ingredient.prep ? `, ${ingredient.prep}` : "";
  return `${ingredient.name}${amount ? `: ${amount}` : ""}${preparation}`;
}

export function buildAskMessages(
  plan: RecipePlan,
  step: Step,
  question: string,
): { system: string; prompt: string } {
  const planIngredients = plan.ingredients.map(formatIngredient).join("; ");
  const orderedSteps = plan.steps
    .map((planStep, index) => `${index + 1}. ${planStep.title}`)
    .join("\n");

  const system = [
    "You are Jacques, the cook's sous chef.",
    "Answer in 60 words or fewer. Be imperative and concrete. Give sensory cues. Use no preamble.",
    "Treat the plan and current step below as the only source of truth. Never invent ingredients or times.",
    `PLAN: ${plan.title}`,
    `INGREDIENTS: ${planIngredients}`,
    `ORDERED STEPS:\n${orderedSteps}`,
    "CURRENT STEP:",
    `Title: ${step.title}`,
    `Detail: ${step.detail}`,
    `Done when: ${step.doneWhen ?? "Not specified"}`,
    `Ingredients: ${step.ingredients.join(", ") || "None"}`,
    `Tools: ${step.tools?.join(", ") || "None"}`,
  ].join("\n");

  return {
    system,
    prompt: `Answer the cook's question: ${question}`,
  };
}

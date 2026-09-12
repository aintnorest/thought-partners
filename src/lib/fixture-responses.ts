import type { RecipePlan, Step, VisionVerdict } from "@/lib/types";

/**
 * Deterministic, offline stand-ins for the conversational surfaces (Q&A, vision) this track
 * does not implement. Track A owns `/api/ask` and `/api/vision`; these responders exist only
 * so the UI has something real to render against `src/fixtures/plan.carbonara.json` while the
 * live routes land — `page.tsx` is the single call site that would be swapped to a live fetch.
 */

const WORD_CHUNK = 3;

/** Splits an answer into small word-groups so callers can simulate a stream with a delay per chunk. */
export function fixtureAnswerChunks(plan: RecipePlan, step: Step, question: string): string[] {
  const answer = composeAnswer(plan, step, question);
  const words = answer.split(" ");
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += WORD_CHUNK) {
    chunks.push(words.slice(i, i + WORD_CHUNK).join(" "));
  }

  return chunks;
}

function composeAnswer(plan: RecipePlan, step: Step, question: string): string {
  const cue = step.doneWhen ? ` You're looking for: ${step.doneWhen.toLowerCase()}` : "";
  return `For "${step.title.toLowerCase()}" in ${plan.title}: ${question.replace(/\?$/, "")} — follow the step as written.${cue}`;
}

const VERDICT_CYCLE: VisionVerdict["status"][] = ["good", "close", "off"];
let verdictCallCount = 0;

/** Cycles good/close/off so a fixture run-through demonstrates all three rail colors. */
export function fixtureVerdict(step: Step): VisionVerdict {
  const status = VERDICT_CYCLE[verdictCallCount % VERDICT_CYCLE.length];
  verdictCallCount += 1;

  switch (status) {
    case "good":
      return {
        status,
        observed: step.doneWhen ?? `${step.title} looks on track.`,
        fix: undefined,
      };
    case "close":
      return {
        status,
        observed: `Close — ${step.title.toLowerCase()} is nearly there.`,
        fix: "Give it another minute, then check again.",
      };
    case "off":
      return {
        status,
        observed: `This doesn't match "${step.title.toLowerCase()}" yet.`,
        fix: step.doneWhen ? `Aim for: ${step.doneWhen.toLowerCase()}` : "Retake the photo closer.",
      };
  }
}

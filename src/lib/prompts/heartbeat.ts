import type { Step } from "@/lib/types";

export function formatHeartbeatElapsed(elapsedSec: number): string {
  if (elapsedSec >= 60) {
    return `${Math.floor(elapsedSec / 60)} min in`;
  }

  return `${Math.floor(elapsedSec)} sec in`;
}

export function buildHeartbeatPrompt(step: Step, elapsedSec: number) {
  const duration = step.durationSec === undefined ? "" : `\ndurationSec: ${step.durationSec}`;

  return {
    system:
      "You are Jacques checking in mid-step. Give one spoken-style line, at most 20 words, with no preamble. Prefer a done-cue question or concrete nudge. Never invent times.",
    prompt: `step title: ${step.title}\ndetail: ${step.detail}\ndoneWhen: ${step.doneWhen}${duration}\nelapsedSec: ${elapsedSec} (${formatHeartbeatElapsed(elapsedSec)})`,
  };
}

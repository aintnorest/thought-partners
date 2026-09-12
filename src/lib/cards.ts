import type { StoreState } from "@/lib/store";
import type { AnswerCard, HeartbeatCard, Step, VerdictCard } from "@/lib/types";

export const selectHeartbeatFor =
  (stepId: string) =>
  (state: StoreState): HeartbeatCard | undefined =>
    state.cards.findLast(
      (card): card is HeartbeatCard => card.kind === "heartbeat" && card.stepId === stepId,
    );

export const selectVerdictFor =
  (stepId: string) =>
  (state: StoreState): VerdictCard | undefined =>
    state.cards.findLast(
      (card): card is VerdictCard => card.kind === "verdict" && card.stepId === stepId,
    );

export const selectAnswerFor =
  (stepId: string) =>
  (state: StoreState): AnswerCard | undefined =>
    state.cards.findLast(
      (card): card is AnswerCard => card.kind === "answer" && card.stepId === stepId,
    );

export const selectCurrentStep = (state: StoreState): Step | undefined =>
  state.plan?.steps[state.stepIndex];

export type StepKind = "prep" | "heat" | "wait" | "combine" | "plate" | "check";

export interface Ingredient {
  name: string;
  qty?: number;
  unit?: string;
  prep?: string;
}

export interface Step {
  id: string;
  kind: StepKind;
  title: string;
  detail: string;
  durationSec?: number;
  attentionSec?: number;
  ingredients: string[];
  tools?: string[];
  parallelWith?: string[];
  imagePrompt?: string;
  imageUrl?: string;
  questions: string[];
  doneWhen?: string;
}

export interface RecipePlan {
  id: string;
  title: string;
  servings: number;
  totalMinutes: number;
  ingredients: Ingredient[];
  equipment: string[];
  steps: Step[];
}

export interface VisionVerdict {
  status: "good" | "close" | "off";
  observed: string;
  fix?: string;
}

export interface HeartbeatCard {
  kind: "heartbeat";
  stepId: string;
  line: string;
}

export interface VerdictCard {
  kind: "verdict";
  stepId: string;
  verdict: VisionVerdict;
}

export interface AnswerCard {
  kind: "answer";
  stepId: string;
  question: string;
  text: string;
  streaming: boolean;
}

export type Card = HeartbeatCard | VerdictCard | AnswerCard;

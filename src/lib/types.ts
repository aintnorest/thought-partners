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

export type Card = HeartbeatCard;

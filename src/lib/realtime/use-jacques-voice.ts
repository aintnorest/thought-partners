"use client";

import { RealtimeAgent, RealtimeSession, tool } from "@openai/agents/realtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { MODELS } from "@/lib/models";
import { useStore } from "@/lib/store";

export type VoiceStatus = "idle" | "connecting" | "connected" | "error";

export interface VoiceState {
  status: VoiceStatus;
  error?: string;
}

export interface JacquesVoice extends VoiceState {
  start(): Promise<void>;
  stop(): void;
}

export interface UseJacquesVoiceArgs {
  /** Whether voice mode is available at all (kill switches, offline fixture demo). */
  enabled: boolean;
  /** Called when the cook asks a spoken question, so the UI can also show it inline. */
  onQuestion?: (question: string) => void;
}

export const JACQUES_VOICE_INSTRUCTIONS = `You are Jacques, a warm, confident sous chef narrating a recipe out loud for a home cook and answering their spoken questions.

Rules:
- Always call get_current_step before narrating a step or answering a cooking question. Never invent step content, ingredients, times, or instructions that get_current_step did not return.
- When asked to narrate the current step, read its "detail" text aloud closely, in your own warm voice, in three sentences or fewer.
- Keep spoken answers to 60 words or fewer, imperative, no preamble.
- After every spoken answer to a question, call answer_question with the question you heard, verbatim, and a concise written version of your answer.
- If you don't know something, say so briefly. Never guess.`;

export const NARRATE_STEP_PROMPT =
  "The cook is now on a new step. Call get_current_step, then narrate it: read the step detail aloud warmly, three sentences or fewer.";

/** Read-only snapshot of the walkthrough for the model to ground itself before speaking. */
export function currentStepPayload(): Record<string, unknown> {
  const { plan, stepIndex } = useStore.getState();
  const step = plan?.steps[stepIndex];
  if (!plan || !step) {
    return { error: "No recipe is loaded yet." };
  }
  return {
    recipeTitle: plan.title,
    stepNumber: stepIndex + 1,
    totalSteps: plan.steps.length,
    title: step.title,
    detail: step.detail,
    doneWhen: step.doneWhen ?? null,
    durationSec: step.durationSec ?? null,
    ingredients: step.ingredients,
    tools: step.tools ?? [],
  };
}

/** Records a spoken Q&A turn as a text card so it also appears inline in the walkthrough. */
export function recordAnswer(
  question: string,
  answer: string,
  onQuestion?: (question: string) => void,
): void {
  const { plan, stepIndex } = useStore.getState();
  const stepId = plan?.steps[stepIndex]?.id;
  if (stepId) {
    useStore
      .getState()
      .setAnswer({ kind: "answer", stepId, question, text: answer, streaming: false });
  }
  onQuestion?.(question);
}

function createJacquesAgent(onQuestion?: (question: string) => void): RealtimeAgent {
  const getCurrentStep = tool({
    name: "get_current_step",
    description:
      "Get the home cook's current recipe step and surrounding context. Call this before narrating or answering any question.",
    parameters: z.object({}),
    execute: async () => JSON.stringify(currentStepPayload()),
  });

  const answerQuestion = tool({
    name: "answer_question",
    description:
      "Record the cook's spoken question and your spoken answer so it also appears as a text card in the app.",
    parameters: z.object({
      question: z.string().describe("The question the cook asked, verbatim"),
      answer: z
        .string()
        .describe("A concise (60 words or fewer) written version of your spoken answer"),
    }),
    execute: async ({ question, answer }) => {
      recordAnswer(question, answer, onQuestion);
      return "recorded";
    },
  });

  return new RealtimeAgent({
    name: "Jacques",
    instructions: JACQUES_VOICE_INSTRUCTIONS,
    tools: [getCurrentStep, answerQuestion],
  });
}

function describeSessionError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Jacques's voice session hit an error.";
}

export function useJacquesVoice({ enabled, onQuestion }: UseJacquesVoiceArgs): JacquesVoice {
  const [state, setState] = useState<VoiceState>({ status: "idle" });
  const sessionRef = useRef<RealtimeSession | null>(null);
  const narratedStepRef = useRef<string | undefined>(undefined);
  const onQuestionRef = useRef(onQuestion);
  onQuestionRef.current = onQuestion;

  const stop = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    narratedStepRef.current = undefined;
    setState({ status: "idle" });
  }, []);

  const start = useCallback(async () => {
    if (!enabled || sessionRef.current) return;
    setState({ status: "connecting" });

    try {
      const response = await fetch("/api/realtime/session", { method: "POST" });
      if (!response.ok) throw new Error(`voice session unavailable (${response.status})`);
      const body = (await response.json()) as { value: string };

      const agent = createJacquesAgent((question) => onQuestionRef.current?.(question));
      const session = new RealtimeSession(agent, {
        model: MODELS.realtime,
        config: {
          audio: {
            input: {
              // Kitchen-counter phone/laptop speaker+mic, not a headset: without this, the mic
              // hears Jacques's own voice and server VAD treats it as the cook barging in,
              // cutting him off mid-sentence every time he starts talking.
              noiseReduction: { type: "far_field" },
              turnDetection: {
                type: "server_vad",
                createResponse: true,
                interruptResponse: false,
              },
            },
          },
        },
      });

      session.on("error", ({ error }) => {
        setState({ status: "error", error: describeSessionError(error) });
      });

      await session.connect({ apiKey: body.value });
      sessionRef.current = session;
      setState({ status: "connected" });

      const step = useStore.getState().plan?.steps[useStore.getState().stepIndex];
      if (step) {
        narratedStepRef.current = step.id;
        session.sendMessage(NARRATE_STEP_PROMPT);
      }
    } catch (error) {
      sessionRef.current?.close();
      sessionRef.current = null;
      setState({ status: "error", error: describeSessionError(error) });
    }
  }, [enabled]);

  // Narrate the new step whenever it changes while connected.
  useEffect(() => {
    if (state.status !== "connected") return;
    return useStore.subscribe((current) => {
      const session = sessionRef.current;
      const step = current.plan?.steps[current.stepIndex];
      if (session && step && step.id !== narratedStepRef.current) {
        narratedStepRef.current = step.id;
        session.sendMessage(NARRATE_STEP_PROMPT);
      }
    });
  }, [state.status]);

  // Stop when voice mode becomes unavailable (kill switches, fixture demo).
  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  // Always release the connection on unmount.
  useEffect(() => {
    return () => {
      sessionRef.current?.close();
      sessionRef.current = null;
    };
  }, []);

  return { ...state, start, stop };
}

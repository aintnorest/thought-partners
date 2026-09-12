"use client";

import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useEffect, useRef, useState } from "react";
import { selectCurrentStep } from "@/lib/cards";
import { useFlags } from "@/lib/glue/app-bootstrap";
import { type RequestState, runForStep, STALE } from "@/lib/hooks/request";
import { useStore } from "@/lib/store";

const ERROR_MESSAGE = "Jacques couldn't answer that";

type InFlightAnswer = {
  controller: AbortController;
  stopAgent?: () => void;
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function useAnswer(): {
  state: RequestState;
  ready: boolean;
  ask(question: string): Promise<void>;
} {
  const flags = useFlags();
  const { agent, isReady } = useAgent();
  const { copilotkit } = useCopilotKit();
  const [state, setState] = useState<RequestState>({ status: "idle" });
  const inFlightRef = useRef<InFlightAnswer | null>(null);

  useEffect(
    () => () => {
      const inFlight = inFlightRef.current;
      inFlightRef.current = null;
      inFlight?.controller.abort();
      inFlight?.stopAgent?.();
    },
    [],
  );

  async function ask(question: string): Promise<void> {
    if (flags.fixture) return;

    const snapshot = useStore.getState();
    const plan = snapshot.plan;
    const step = selectCurrentStep(snapshot);
    if (!plan || !step) return;

    const previous = inFlightRef.current;
    previous?.controller.abort();
    previous?.stopAgent?.();

    const inFlight: InFlightAnswer = { controller: new AbortController() };
    inFlightRef.current = inFlight;
    setState({ status: "pending" });

    let answerText = "";
    let primaryProducedText = false;

    const isCurrent = () =>
      inFlightRef.current === inFlight && selectCurrentStep(useStore.getState())?.id === step.id;

    const updateAnswer = (text: string, streaming: boolean) => {
      if (!isCurrent()) return;
      answerText = text;
      useStore.getState().setAnswer({
        kind: "answer",
        stepId: step.id,
        question,
        text,
        streaming,
      });
    };

    updateAnswer("", true);

    try {
      if (isReady && agent && copilotkit) {
        try {
          let rejectRunFailure: (error: Error) => void = () => undefined;
          const runFailure = new Promise<never>((_resolve, reject) => {
            rejectRunFailure = reject;
          });
          const subscription = agent.subscribe({
            onTextMessageContentEvent: ({ textMessageBuffer }) => {
              primaryProducedText ||= textMessageBuffer.length > 0;
              updateAnswer(textMessageBuffer, true);
            },
            onTextMessageEndEvent: ({ textMessageBuffer }) => {
              primaryProducedText ||= textMessageBuffer.length > 0;
              updateAnswer(textMessageBuffer, false);
            },
            onRunFailed: ({ error }) => rejectRunFailure(error),
          });

          try {
            agent.addMessage({
              id: crypto.randomUUID(),
              role: "user",
              content: question,
            });

            const result = await runForStep(step.id, async (stepSignal) => {
              const stopRuntime = () => copilotkit.stopAgent({ agent });
              const stopForNavigation = () => {
                inFlight.controller.abort();
                stopRuntime();
              };
              inFlight.stopAgent = stopRuntime;
              stepSignal.addEventListener("abort", stopForNavigation, { once: true });

              try {
                inFlight.controller.signal.throwIfAborted();
                return await Promise.race([copilotkit.runAgent({ agent }), runFailure]);
              } finally {
                stepSignal.removeEventListener("abort", stopForNavigation);
              }
            });

            if (result === STALE || !isCurrent()) return;
            updateAnswer(answerText, false);
            setState({ status: "idle" });
            return;
          } finally {
            subscription.unsubscribe();
            inFlight.stopAgent = undefined;
          }
        } catch (error) {
          if (inFlight.controller.signal.aborted || isAbortError(error) || !isCurrent()) {
            return;
          }
          copilotkit.stopAgent({ agent });
          inFlight.stopAgent = undefined;
          if (primaryProducedText) throw error;
        }
      }

      answerText = "";
      const result = await runForStep(step.id, async (stepSignal) => {
        const abortForNavigation = () => inFlight.controller.abort();
        stepSignal.addEventListener("abort", abortForNavigation, { once: true });

        try {
          inFlight.controller.signal.throwIfAborted();
          const response = await fetch("/api/ask", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              planId: plan.id,
              stepId: step.id,
              question,
              plan,
            }),
            signal: inFlight.controller.signal,
          });
          if (!response.ok) {
            throw new Error(`Ask failed with status ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) return answerText;

          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            answerText += decoder.decode(value, { stream: true });
            updateAnswer(answerText, true);
          }
          answerText += decoder.decode();
          return answerText;
        } finally {
          stepSignal.removeEventListener("abort", abortForNavigation);
        }
      });

      if (result === STALE || !isCurrent()) return;
      updateAnswer(result, false);
      setState({ status: "idle" });
    } catch (error) {
      if (inFlight.controller.signal.aborted || isAbortError(error) || !isCurrent()) {
        return;
      }

      updateAnswer(answerText, false);
      setState({
        status: "error",
        message: ERROR_MESSAGE,
        retry: () => void ask(question),
      });
    } finally {
      if (inFlightRef.current === inFlight) {
        inFlightRef.current = null;
      }
    }
  }

  return { state, ready: !flags.fixture, ask };
}

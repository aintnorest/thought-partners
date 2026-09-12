"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import fixture from "@/fixtures/plan.carbonara.json";
import type { RequestState } from "@/lib/hooks/request";
import { useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";

const IMPORT_ERROR = "Jacques couldn't read that recipe";

type ImportInput = { url?: string; text?: string };

function isRecipePlan(value: unknown): value is RecipePlan {
  if (typeof value !== "object" || value === null || !("steps" in value)) {
    return false;
  }

  const { steps } = value;
  return (
    Array.isArray(steps) &&
    steps.length > 0 &&
    steps.every(
      (step) =>
        typeof step === "object" &&
        step !== null &&
        "id" in step &&
        typeof step.id === "string" &&
        "kind" in step &&
        typeof step.kind === "string" &&
        "title" in step &&
        typeof step.title === "string" &&
        "detail" in step &&
        typeof step.detail === "string" &&
        "questions" in step &&
        Array.isArray(step.questions),
    )
  );
}

export function useImportPlan(): {
  state: RequestState;
  submit(input: ImportInput): Promise<void>;
  useSample(): void;
} {
  const [state, setState] = useState<RequestState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  const submit: (input: ImportInput) => Promise<void> = useCallback(async (input) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: "pending" });

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Import failed with status ${response.status}`);
      }

      const plan: unknown = await response.json();
      if (!isRecipePlan(plan)) {
        throw new Error("Import returned an invalid recipe plan");
      }

      if (controllerRef.current !== controller) {
        return;
      }

      useStore.getState().setPlan(plan);
      setState({ status: "idle" });
    } catch (error) {
      if (controllerRef.current !== controller) {
        return;
      }

      if (error instanceof Error && error.name === "AbortError") {
        setState({ status: "idle" });
        return;
      }

      setState({
        status: "error",
        message: IMPORT_ERROR,
        retry: () => void submit(input),
      });
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }, []);

  const useSample = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    useStore.getState().setPlan(fixture as RecipePlan);
    setState({ status: "idle" });
  }, []);

  return { state, submit, useSample };
}

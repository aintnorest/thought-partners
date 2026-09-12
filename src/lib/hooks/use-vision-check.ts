"use client";

import { useEffect, useRef, useState } from "react";
import { selectCurrentStep } from "@/lib/cards";
import { type RequestState, runForStep, STALE } from "@/lib/hooks/request";
import { useStore } from "@/lib/store";
import type { VisionVerdict } from "@/lib/types";

const ERROR_MESSAGE = "Jacques couldn't read that photo";

function parseVerdict(value: unknown): VisionVerdict | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const { status, observed, fix } = value as Record<string, unknown>;
  if (
    (status !== "good" && status !== "close" && status !== "off") ||
    typeof observed !== "string"
  ) {
    return undefined;
  }

  return {
    status,
    observed,
    ...(typeof fix === "string" ? { fix } : {}),
  };
}

export function useVisionCheck(): {
  state: RequestState;
  check(file: File): Promise<void>;
} {
  const plan = useStore((store) => store.plan);
  const step = useStore(selectCurrentStep);
  const [state, setState] = useState<RequestState>({ status: "idle" });
  const fileRef = useRef<File | undefined>(undefined);

  useEffect(() => {
    fileRef.current = undefined;
    setState({ status: "idle" });
  }, [step?.id]);

  async function check(file: File): Promise<void> {
    if (!plan || !step) return;

    fileRef.current = file;
    setState({ status: "pending" });

    try {
      const verdict = await runForStep(step.id, async (signal) => {
        const form = new FormData();
        form.set("image", file);
        form.set("stepId", step.id);
        form.set("plan", JSON.stringify(plan));

        const response = await fetch("/api/vision", {
          method: "POST",
          body: form,
          signal,
        });
        if (!response.ok) throw new Error(ERROR_MESSAGE);

        const parsed = parseVerdict(await response.json());
        if (!parsed) throw new Error(ERROR_MESSAGE);
        return parsed;
      });

      if (verdict === STALE) return;

      useStore.getState().pushCard({
        kind: "verdict",
        stepId: step.id,
        verdict,
      });
      setState({ status: "idle" });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        return;
      }
      setState({
        status: "error",
        message: ERROR_MESSAGE,
        retry: () => {
          const retryFile = fileRef.current;
          if (retryFile) void check(retryFile);
        },
      });
    }
  }

  return { state, check };
}

"use client";

import { useEffect } from "react";
import { useFlags } from "@/lib/glue/app-bootstrap";
import { selectActiveTimer, useStore } from "@/lib/store";
import type { RecipePlan, Step } from "@/lib/types";

function fixtureLine(step: Step): string {
  return step.doneWhen ? `Check: ${step.doneWhen}` : "How is it looking?";
}

async function fetchLine(
  stepId: string,
  elapsedSec: number,
  plan: RecipePlan,
): Promise<string | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3_000);

  try {
    const response = await fetch("/api/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, elapsedSec, plan }),
      signal: controller.signal,
    });

    if (!response.ok) return undefined;

    const body: unknown = await response.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("line" in body) ||
      typeof body.line !== "string"
    ) {
      return undefined;
    }

    return body.line;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function HeartbeatScheduler(): null {
  const timer = useStore(selectActiveTimer);
  const plan = useStore((state) => state.plan);
  const flags = useFlags();

  useEffect(() => {
    if (!timer || !plan) return;

    const step = plan.steps.find((candidate) => candidate.id === timer.stepId);
    if (step?.kind !== "wait") return;

    const interval = step.attentionSec ?? (step.durationSec ? step.durationSec / 3 : undefined);
    if (interval === undefined || !Number.isFinite(interval) || interval <= 0) return;

    const generation = timer.generation;
    const intervalId = setInterval(async () => {
      const elapsedSec = Math.round((Date.now() - timer.startedAt) / 1_000);
      const line = flags.fixture ? fixtureLine(step) : await fetchLine(step.id, elapsedSec, plan);

      if (line === undefined) return;
      if (selectActiveTimer(useStore.getState())?.generation !== generation) return;

      useStore.getState().pushCard({
        kind: "heartbeat",
        stepId: step.id,
        line,
      });
    }, interval * 1_000);

    return () => clearInterval(intervalId);
  }, [timer, plan, flags.fixture]);

  return null;
}

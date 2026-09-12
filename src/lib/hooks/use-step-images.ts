"use client";

import { useEffect, useRef, useState } from "react";
import { useFlags } from "@/lib/glue/app-bootstrap";
import { useStore } from "@/lib/store";

export type StepImagesStatus = "idle" | "pending" | "settled";

/**
 * One `/api/images` attempt per plan id for steps that have an `imagePrompt` but no `imageUrl`.
 * `status` is "pending" while that request is in flight so the panel can show a skeleton
 * instead of the "no visual" empty state; it becomes "settled" on success or failure.
 */
export function useStepImages(): { status: StepImagesStatus } {
  const planId = useStore((state) => state.plan?.id);
  const { fixture, noimages } = useFlags();
  const attemptedPlanIds = useRef(new Set<string>());
  const [status, setStatus] = useState<StepImagesStatus>("idle");

  useEffect(() => {
    const plan = useStore.getState().plan;
    if (!planId || !plan || plan.id !== planId || fixture || noimages) {
      return;
    }

    const missing = plan.steps.filter((step) => step.imagePrompt && !step.imageUrl);
    if (missing.length === 0 || attemptedPlanIds.current.has(planId)) {
      return;
    }

    attemptedPlanIds.current.add(planId);
    const controller = new AbortController();
    setStatus("pending");

    void (async () => {
      try {
        const response = await fetch("/api/images", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            planId,
            steps: missing.map(({ id, imagePrompt }) => ({ id, imagePrompt })),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const urls = (await response.json()) as Record<string, string>;
        if (!controller.signal.aborted) {
          useStore.getState().applyImageUrls(urls);
        }
      } catch {
        // Step images are optional; the composed empty state remains usable.
      } finally {
        if (!controller.signal.aborted) setStatus("settled");
      }
    })();

    return () => {
      // An aborted attempt is not an attempt: StrictMode (and any remount) must be able to retry.
      controller.abort();
      attemptedPlanIds.current.delete(planId);
    };
  }, [fixture, noimages, planId]);

  return { status };
}

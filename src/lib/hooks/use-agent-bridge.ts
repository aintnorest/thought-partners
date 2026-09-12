"use client";

import { useAgentContext, useFrontendTool } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { z } from "zod";
import { useStore } from "@/lib/store";

export function useAgentBridge(): void {
  const plan = useStore((state) => state.plan);
  const stepIndex = useStore((state) => state.stepIndex);
  const activeTimer = useStore((state) => state.activeTimer);
  const step = plan?.steps[stepIndex];
  const timerRunning = Boolean(activeTimer);

  const recipeContext = useMemo(
    () =>
      plan
        ? {
            title: plan.title,
            servings: plan.servings,
            steps: plan.steps.map(({ id, kind, title }) => ({ id, kind, title })),
          }
        : null,
    [plan],
  );
  const positionContext = useMemo(
    () =>
      plan && step
        ? {
            stepId: step.id,
            index: stepIndex + 1,
            of: plan.steps.length,
            title: step.title,
            detail: step.detail,
            doneWhen: step.doneWhen ?? null,
            ingredients: step.ingredients,
            tools: step.tools ?? [],
            timerRunning,
          }
        : null,
    [plan, step, stepIndex, timerRunning],
  );

  useAgentContext({
    description: "The recipe being cooked",
    value: recipeContext,
  });
  useAgentContext({
    description: "Where the cook is right now",
    value: positionContext,
  });

  useFrontendTool({
    name: "highlight_step",
    description: "Move the walkthrough to a specific step by id.",
    parameters: z.object({ stepId: z.string() }),
    handler: async ({ stepId }) => {
      const state = useStore.getState();
      const currentPlan = state.plan;
      const index = currentPlan?.steps.findIndex((candidate) => candidate.id === stepId) ?? -1;
      if (!currentPlan || index < 0) {
        return `No step with id ${stepId}.`;
      }

      const target = currentPlan.steps[index];
      state.goto(index);
      return `Showing step ${index + 1}: ${target.title}`;
    },
  });

  useFrontendTool({
    name: "start_timer",
    description: "Start the countdown for the current step.",
    parameters: z.object({ seconds: z.number().int().min(10).max(3600).optional() }),
    handler: async ({ seconds }) => {
      const state = useStore.getState();
      const currentStep = state.plan?.steps[state.stepIndex];
      if (!currentStep) {
        return "There is no current step to time.";
      }

      const duration = seconds ?? currentStep.durationSec;
      if (duration === undefined) {
        return `Step ${currentStep.title} has no timer duration.`;
      }

      state.startTimer(duration);
      return `Started a ${duration}-second timer for ${currentStep.title}.`;
    },
  });

  useFrontendTool({
    name: "show_heartbeat",
    description: "Show one short coaching line (≤ 20 words) as a toast on the current step.",
    parameters: z.object({ line: z.string().max(140) }),
    handler: async ({ line }) => {
      const state = useStore.getState();
      const currentStep = state.plan?.steps[state.stepIndex];
      if (!currentStep) {
        return "There is no current step for coaching.";
      }

      state.pushCard({ kind: "heartbeat", stepId: currentStep.id, line });
      return `Showing coaching for ${currentStep.title}.`;
    },
  });
}

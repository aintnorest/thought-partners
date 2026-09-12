"use client";

import { useEffect } from "react";
import { selectCurrentStep } from "@/lib/cards";
import { selectActiveTimer, useStore } from "@/lib/store";

export function useWalkthroughControls(): {
  onPrev(): void;
  onNext(): void;
  onToggleTimer(): void;
  timerActive: boolean;
  timerAvailable: boolean;
  cascadeKey: string;
} {
  const step = useStore(selectCurrentStep);
  const timerActive = Boolean(useStore(selectActiveTimer));
  const generation = useStore((store) => store.generation);
  const timerAvailable = Boolean(step?.durationSec);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      const activeElement = document.activeElement;
      if (
        activeElement instanceof Element &&
        activeElement.matches("input, textarea, [contenteditable]")
      ) {
        return;
      }

      const store = useStore.getState();
      if (event.key === "ArrowRight") {
        event.preventDefault();
        store.next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        store.prev();
      } else if (event.key === "r") {
        event.preventDefault();
        store.repeat();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function onToggleTimer() {
    if (!timerAvailable) return;

    const store = useStore.getState();
    if (timerActive) {
      store.cancelTimer();
    } else {
      store.startTimer(step?.durationSec ?? 0);
    }
  }

  return {
    onPrev: useStore.getState().prev,
    onNext: useStore.getState().next,
    onToggleTimer,
    timerActive,
    timerAvailable,
    cascadeKey: `${step?.id}:${generation}`,
  };
}

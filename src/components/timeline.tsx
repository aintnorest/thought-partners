"use client";

import type { Step } from "@/lib/types";

export function Timeline({
  steps,
  currentIndex,
  onSelect,
}: {
  steps: Step[];
  currentIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Dots — its own scroll container so a long step list never widens the page itself. */}
      <div className="relative min-w-0 flex-1 overflow-x-auto">
        <div className="absolute inset-x-0 top-[19px] border-t border-whisper-warm pointer-events-none" />
        <div className="relative flex w-max items-center gap-2">
          {steps.map((step, i) => {
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isUpcoming = i > currentIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect(i)}
                className="relative flex h-11 w-11 shrink-0 items-center justify-center"
                aria-label={`Step ${i + 1}: ${step.title}`}
              >
                {isDone && <div className="h-3 w-3 rounded-full bg-herb" />}

                {isCurrent && (
                  <div className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-3 w-3 animate-ember-pulse rounded-full bg-ember" />
                    <div className="relative h-3 w-3 rounded-full bg-ember" />
                  </div>
                )}

                {isUpcoming && <div className="h-3 w-3 rounded-full border border-stone-gray" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Counter */}
      <span className="shrink-0 font-mono text-sm text-stone-gray">
        {currentIndex + 1} / {steps.length}
      </span>
    </div>
  );
}

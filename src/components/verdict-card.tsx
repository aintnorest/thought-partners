"use client";

import { useState } from "react";
import type { VerdictCard as VerdictCardData } from "@/lib/types";

export function VerdictCard({
  card,
  onDismiss,
}: {
  card?: VerdictCardData;
  onDismiss: () => void;
}) {
  const [dismissing, setDismissing] = useState(false);

  if (!card) return null;

  const statusColorMap: Record<string, string> = {
    good: "bg-herb",
    close: "bg-saffron",
    off: "bg-brick",
  };

  const railColor = statusColorMap[card.verdict.status] || "bg-stone-gray";

  function handleDismiss() {
    setDismissing(true);
    setTimeout(onDismiss, 200);
  }

  return (
    <div
      className={`flex gap-4 ${
        dismissing ? "animate-collapse-out" : "animate-rise-in"
      }`}
    >
      <div className={`w-1 shrink-0 rounded-full ${railColor}`} />
      <div className="flex-1 bg-raised-charcoal rounded-3xl p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="text-warm-off-white">{card.verdict.observed}</p>
            {card.verdict.fix && (
              <p className="text-stone-gray text-sm mt-2">
                <span className="text-sm uppercase tracking-[0.08em]">Fix:</span>{" "}
                {card.verdict.fix}
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 text-stone-gray hover:text-warm-off-white transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

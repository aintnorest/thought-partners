import type { Step } from "@/lib/types";
import { StepKindIcon } from "./step-kind-icon";

const KIND_LABELS: Record<string, string> = {
  prep: "PREP",
  heat: "HEAT",
  wait: "WAIT",
  combine: "COMBINE",
  plate: "PLATE",
  check: "CHECK",
};

export function StepCard({ step }: { step: Step }) {
  const kindLabel = KIND_LABELS[step.kind] || step.kind.toUpperCase();

  return (
    <div className="rounded-3xl bg-raised-charcoal border border-whisper-warm p-6 md:p-8">
      {/* Kind chip with icon */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-whisper-warm px-3 py-1">
        <StepKindIcon kind={step.kind} className="h-4 w-4" />
        <span className="text-sm uppercase tracking-[0.08em] text-stone-gray">
          {kindLabel}
        </span>
      </div>

      {/* Title */}
      <h2 className="mb-4 text-[clamp(2rem,7vw,3.25rem)] font-bold tracking-[-0.02em] text-warm-off-white">
        {step.title}
      </h2>

      {/* Detail */}
      <p className="mb-4 max-w-[65ch] text-[clamp(1.25rem,3.5vw,1.5rem)] leading-[1.55] text-warm-off-white/90">
        {step.detail}
      </p>

      {/* Done when */}
      {step.doneWhen && (
        <p className="mb-4 text-base text-stone-gray">
          <span className="font-semibold">Done when:</span> {step.doneWhen}
        </p>
      )}

      {/* Ingredients */}
      {step.ingredients.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {step.ingredients.map((ingredient) => (
            <span
              key={ingredient}
              className="rounded-full border border-whisper-warm px-3 py-1 text-sm text-stone-gray"
            >
              {ingredient}
            </span>
          ))}
        </div>
      )}

      {/* Tools */}
      {step.tools && step.tools.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {step.tools.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-whisper-warm px-3 py-1 text-sm text-stone-gray"
            >
              {tool}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

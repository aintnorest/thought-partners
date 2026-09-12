import type { StepKind } from "@/lib/types";

export function StepKindIcon({
  kind,
  className,
}: {
  kind: StepKind;
  className?: string;
}) {
  const baseClasses = "text-current";
  const classes = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={classes}
    >
      {kind === "prep" && (
        <>
          {/* Knife blade */}
          <path d="M6 12l8 -8l2 2l-8 8z" />
          {/* Knife handle */}
          <circle cx="17" cy="3" r="1.5" />
          {/* Cutting board edge */}
          <rect x="4" y="14" width="14" height="8" rx="1" />
        </>
      )}
      {kind === "heat" && (
        <>
          {/* Flame outline */}
          <path d="M12 2c0 0 -2 3 -2 5c0 2 1.5 3 2 4c0.5 -1 2 -2 2 -4c0 -2 -2 -5 -2 -5z" />
          {/* Flame inner flicker */}
          <path d="M12 5c0 1 -0.5 2 -0.5 2.5c0 0.5 0.5 1 0.5 1.5" />
          {/* Pan outline */}
          <path d="M4 12h16c1 0 1 1 1 2v6c0 1 -0.5 1 -1 1h-16c-0.5 0 -1 0 -1 -1v-6c0 -1 0 -2 1 -2z" />
          {/* Pan handle */}
          <line x1="2" y1="14" x2="1" y2="16" />
        </>
      )}
      {kind === "wait" && (
        <>
          {/* Clock circle */}
          <circle cx="12" cy="12" r="9" />
          {/* Clock center dot */}
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          {/* Hour hand */}
          <line x1="12" y1="12" x2="12" y2="8" />
          {/* Minute hand */}
          <line x1="12" y1="12" x2="15" y2="12" />
        </>
      )}
      {kind === "combine" && (
        <>
          {/* Bowl outline */}
          <path d="M3 14c0 3 3 6 9 6s9 -3 9 -6" />
          {/* Bowl bottom */}
          <path d="M4 14h16" />
          {/* Whisk handle */}
          <line x1="12" y1="8" x2="12" y2="14" />
          {/* Whisk wires */}
          <path d="M9 12c0.5 1 0.5 2 0 2.5" />
          <path d="M12 12v2.5" />
          <path d="M15 12c-0.5 1 -0.5 2 0 2.5" />
        </>
      )}
      {kind === "plate" && (
        <>
          {/* Plate circle */}
          <circle cx="12" cy="12" r="9" />
          {/* Plate rim */}
          <circle cx="12" cy="12" r="7" />
          {/* Plate detail */}
          <path d="M7 12a5 5 0 0 1 10 0" />
        </>
      )}
      {kind === "check" && (
        <>
          {/* Camera/frame outline */}
          <rect x="3" y="4" width="18" height="16" rx="2" />
          {/* Camera lens */}
          <circle cx="12" cy="12" r="4" />
          {/* Flash */}
          <rect x="15" y="5" width="2" height="2" rx="0.5" />
          {/* Checkmark */}
          <path d="M8 12l2 2l4 -4" />
        </>
      )}
    </svg>
  );
}

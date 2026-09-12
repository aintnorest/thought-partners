"use client";

import type { ReactNode } from "react";

// Chevron left icon (24x24 viewBox)
function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// Chevron right icon (24x24 viewBox)
function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Clock icon (24x24 viewBox)
function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Mic icon (24x24 viewBox)
function MicIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export function ControlCluster({
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  onToggleTimer,
  timerActive,
  timerDisabled,
  novoice,
  onMic,
  micStatus,
  camera,
}: {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  onToggleTimer: () => void;
  timerActive: boolean;
  timerDisabled: boolean;
  novoice: boolean;
  onMic?: () => void;
  /** Omit when `onMic` is a non-voice shortcut (e.g. scroll-to-Watch-Me in fixture mode). */
  micStatus?: "idle" | "connecting" | "connected" | "error";
  camera: ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[640px]">
      <div
        className="flex flex-col gap-3 px-4 pt-3 bg-cast-iron/95 border-t border-whisper-warm"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {/* Camera row — the one Ember CTA gets the full row width so its label never wraps or overflows. */}
        <div className="flex justify-center">{camera}</div>

        {/* Nav row */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={prevDisabled}
            aria-label="Previous step"
            className="min-h-14 min-w-14 flex items-center justify-center rounded-full border border-whisper-warm text-warm-off-white hover:bg-raised-charcoal active:-translate-y-px active:brightness-95 transition-all"
          >
            <ChevronLeftIcon />
          </button>

          <button
            type="button"
            onClick={onToggleTimer}
            disabled={timerDisabled}
            aria-label={timerActive ? "Cancel timer" : "Start timer"}
            className={`min-h-14 min-w-14 flex items-center justify-center rounded-full transition-all active:-translate-y-px active:brightness-95 ${
              timerDisabled
                ? "border border-whisper-warm text-stone-gray opacity-40 cursor-not-allowed"
                : timerActive
                  ? "bg-ember text-cast-iron"
                  : "border border-whisper-warm text-warm-off-white hover:bg-raised-charcoal"
            }`}
          >
            <ClockIcon />
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            aria-label="Next step"
            className="min-h-14 min-w-14 flex items-center justify-center rounded-full border border-whisper-warm text-warm-off-white hover:bg-raised-charcoal active:-translate-y-px active:brightness-95 transition-all"
          >
            <ChevronRightIcon />
          </button>

          {!novoice && onMic && (
            <button
              type="button"
              onClick={onMic}
              aria-label={
                micStatus === undefined
                  ? "Microphone capture"
                  : micStatus === "connected"
                    ? "Stop Jacques's voice"
                    : micStatus === "connecting"
                      ? "Connecting to Jacques's voice"
                      : micStatus === "error"
                        ? "Retry Jacques's voice"
                        : "Start Jacques's voice"
              }
              className={`min-h-14 min-w-14 flex items-center justify-center rounded-full border transition-all active:-translate-y-px active:brightness-95 ${
                micStatus === "connected"
                  ? "border-herb text-herb pulse-ember"
                  : micStatus === "connecting"
                    ? "border-saffron text-saffron"
                    : micStatus === "error"
                      ? "border-brick text-brick"
                      : "border-whisper-warm text-warm-off-white hover:bg-raised-charcoal"
              }`}
            >
              <MicIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

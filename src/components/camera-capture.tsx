"use client";

import { useRef } from "react";

function CameraIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function CameraCapture({ onCapture }: { onCapture?: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!onCapture) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full border border-whisper-warm text-stone-gray px-4 min-h-14 inline-flex items-center gap-2 whitespace-nowrap opacity-60 cursor-not-allowed"
      >
        <CameraIcon />
        <span className="text-sm">Offline demo</span>
      </button>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onCapture(file);
          }
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="bg-ember text-cast-iron rounded-full px-4 min-h-14 inline-flex items-center gap-2 whitespace-nowrap"
      >
        <CameraIcon />
        <span className="text-sm">Check your work</span>
      </button>
    </>
  );
}

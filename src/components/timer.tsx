"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function Timer() {
  const activeTimer = useStore((state) => state.activeTimer);
  const [remainingMs, setRemainingMs] = useState<number>(0);

  useEffect(() => {
    if (!activeTimer) {
      return;
    }

    // Compute initial remaining time
    const computeRemaining = () => {
      const ms = activeTimer.startedAt + activeTimer.sec * 1000 - Date.now();
      return Math.max(0, ms);
    };

    setRemainingMs(computeRemaining());

    const interval = setInterval(() => {
      const ms = computeRemaining();
      setRemainingMs(ms);

      if (ms <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [activeTimer]);

  if (!activeTimer) {
    return null;
  }

  // Format remaining time as M:SS
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isFinal10 = remainingMs <= 10_000;
  const totalMs = activeTimer.sec * 1000;
  const progressDeg = 360 * (remainingMs / totalMs);
  const ringColor = isFinal10 ? "var(--color-saffron)" : "var(--color-ember)";
  const digitColor = isFinal10 ? "text-saffron" : "text-warm-off-white";
  const animateClass = isFinal10 ? "animate-saffron-pulse" : "";

  return (
    <div className="flex justify-center py-6">
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{
          width: "clamp(10rem, 20vw, 16rem)",
          height: "clamp(10rem, 20vw, 16rem)",
        }}
      >
        {/* Conic gradient ring background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${ringColor} ${progressDeg}deg, var(--color-whisper-warm) 0deg)`,
            borderRadius: "9999px",
          }}
        />

        {/* Inner circle to create ring effect */}
        <div className="absolute inset-2 bg-cast-iron rounded-full" />

        {/* Timer digits */}
        <span
          role="timer"
          className={`relative font-mono font-medium ${remainingMs > 0 ? "text-[clamp(3rem,12vw,5rem)]" : "text-lg"} ${digitColor} ${animateClass}`}
        >
          {remainingMs > 0 ? formatted : "Time is up"}
        </span>
      </div>
    </div>
  );
}

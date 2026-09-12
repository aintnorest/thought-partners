"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import fixture from "@/fixtures/plan.carbonara.json";
import { type Flags, readFlags } from "@/lib/glue/flags";
import { HeartbeatScheduler } from "@/lib/glue/heartbeat-scheduler";
import { useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";

const FlagsContext = createContext<Flags | null>(null);

export function useFlags(): Flags {
  const flags = useContext(FlagsContext);

  if (flags === null) {
    throw new Error("useFlags must be used within AppBootstrap");
  }

  return flags;
}

export function AppBootstrap({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Flags | null>(null);

  useEffect(() => {
    const nextFlags = readFlags(window.location.search);

    if (nextFlags.fixture) {
      const plan = fixture as RecipePlan;
      useStore.getState().setPlan(plan);

      if (!nextFlags.noimages) {
        for (const step of plan.steps) {
          if (step.imageUrl) {
            const img = new Image();
            img.src = step.imageUrl;
          }
        }
      }
    }

    if (process.env.NODE_ENV !== "production") {
      // Dev-only handle so run-throughs can drive the store from the console.
      (window as Window & { __jacques?: typeof useStore }).__jacques = useStore;
    }

    setFlags(nextFlags);
  }, []);

  if (flags === null) {
    return null;
  }

  return (
    <FlagsContext.Provider value={flags}>
      {children}
      <HeartbeatScheduler />
    </FlagsContext.Provider>
  );
}

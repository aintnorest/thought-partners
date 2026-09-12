import { useStore } from "@/lib/store";

export const STALE = Symbol("stale");

export type RequestState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "error"; message: string; retry: () => void };

/** Runs `fn` with an AbortSignal that fires when the current step stops being `stepId`
 *  (navigation, repeat-with-goto, a new plan, or unmount via the returned disposer).
 *  Resolves STALE instead of the value if the step changed while in flight. */
export async function runForStep<T>(
  stepId: string,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T | typeof STALE> {
  const controller = new AbortController();
  const currentId = () => {
    const s = useStore.getState();
    return s.plan?.steps[s.stepIndex]?.id;
  };
  const unsubscribe = useStore.subscribe(() => {
    if (currentId() !== stepId) controller.abort();
  });

  try {
    const value = await fn(controller.signal);
    return currentId() === stepId ? value : STALE;
  } finally {
    unsubscribe();
  }
}

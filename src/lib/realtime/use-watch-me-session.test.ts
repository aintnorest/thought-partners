import { afterEach, describe, expect, it, vi } from "vitest";
import type { Step } from "@/lib/types";
import { isWatchableStep, pickAudioMimeType } from "./use-watch-me-session";

describe("Watch Me media helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("selects the first MediaRecorder audio type supported by the browser", () => {
    vi.stubGlobal("MediaRecorder", {
      isTypeSupported: vi.fn((mimeType: string) => mimeType === "audio/webm"),
    } as unknown as typeof MediaRecorder);

    expect(pickAudioMimeType()).toBe("audio/webm");
  });

  it("marks only visual cue cooking steps as watchable", () => {
    const step: Step = {
      id: "s1",
      kind: "heat",
      title: "Render the guanciale",
      detail: "Cook until crisp-edged.",
      ingredients: [],
      questions: ["one", "two", "three"],
      doneWhen: "Golden with crisp edges.",
    };

    expect(isWatchableStep(step)).toBe(true);
    expect(isWatchableStep({ ...step, kind: "plate" })).toBe(false);
    expect(isWatchableStep({ ...step, doneWhen: undefined })).toBe(false);
  });
});

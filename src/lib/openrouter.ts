import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/** Server-only. Every model call in the app goes through this provider; the key never reaches the browser. */
export const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

/** Keep gpt-5-mini reasoning cheap: plan/ask/vision/heartbeat are small structured tasks. */
export const lowReasoning = { openrouter: { reasoning: { effort: "low" as const } } };

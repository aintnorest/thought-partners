// Namespaced OpenRouter model ids. Track A owns the values after the contract commit.
export const MODELS = {
  plan: "openai/gpt-4.1-mini", // non-reasoning: ~5x faster plan generation for the demo's first beat
  ask: "openai/gpt-4.1-mini",
  agent: "openai/gpt-4.1-mini",
  vision: "openai/gpt-5-mini",
  heartbeat: "openai/gpt-4.1-nano", // hard 2.5 s budget; reasoning models miss it
  image: "google/gemini-3.1-flash-lite-image",
  imageFallback: "google/gemini-2.5-flash-image",
  voice: "openai/gpt-audio-mini",
} as const;

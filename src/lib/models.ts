// Namespaced OpenRouter model ids. Track A owns the values after the contract commit.
export const MODELS = {
  plan: "openai/gpt-5-mini",
  ask: "openai/gpt-5-mini",
  vision: "openai/gpt-5-mini",
  heartbeat: "openai/gpt-5-mini",
  image: "google/gemini-3.1-flash-lite-image",
  imageFallback: "google/gemini-2.5-flash-image",
  voice: "openai/gpt-audio-mini",
} as const;

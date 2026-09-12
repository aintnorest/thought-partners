import { createHash } from "node:crypto";

type ImageCache = {
  values: Map<string, string>;
  inFlight: Map<string, Promise<string | undefined>>;
};

declare global {
  var __jacquesImageCache: ImageCache | undefined;
}

function imageCache(): ImageCache {
  globalThis.__jacquesImageCache ??= { values: new Map(), inFlight: new Map() };
  return globalThis.__jacquesImageCache;
}

export function cacheKey(imagePrompt: string): string {
  return createHash("sha256").update(imagePrompt).digest("hex");
}

export function getOrCreate(
  key: string,
  produce: () => Promise<string | undefined>,
): Promise<string | undefined> {
  const cache = imageCache();
  const cached = cache.values.get(key);
  if (cached !== undefined) return Promise.resolve(cached);

  const existing = cache.inFlight.get(key);
  if (existing !== undefined) return existing;

  const pending = Promise.resolve()
    .then(produce)
    .then((value) => {
      if (value !== undefined) cache.values.set(key, value);
      return value;
    })
    .finally(() => {
      if (cache.inFlight.get(key) === pending) cache.inFlight.delete(key);
    });

  cache.inFlight.set(key, pending);
  return pending;
}

export function _resetCacheForTests(): void {
  globalThis.__jacquesImageCache = undefined;
}

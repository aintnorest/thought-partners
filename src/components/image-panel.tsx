"use client";

import { useState } from "react";

export function ImagePanel({
  imageUrl,
  alt,
  hidden,
}: {
  imageUrl?: string;
  alt: string;
  hidden?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  if (hidden) {
    return null;
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-whisper-warm"
      style={{ aspectRatio: "4/3" }}
    >
      {/* Shimmer skeleton layer */}
      {imageUrl && (
        <div className="absolute inset-0 overflow-hidden bg-raised-charcoal">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-whisper-warm to-transparent" />
        </div>
      )}

      {/* Image or empty state */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-raised-charcoal px-6">
          <p className="text-center text-stone-gray">
            No visual for this step — trust the description.
          </p>
        </div>
      )}
    </div>
  );
}

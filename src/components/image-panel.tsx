"use client";

import { useState } from "react";

export function ImagePanel({
  imageUrl,
  alt,
  hidden,
  pending,
}: {
  imageUrl?: string;
  alt: string;
  hidden?: boolean;
  /** True while Jacques is still generating this step's image; shows the skeleton instead of the empty state. */
  pending?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  if (hidden) {
    return null;
  }

  const showSkeleton = Boolean(imageUrl) || pending;

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-whisper-warm"
      style={{ aspectRatio: "4/3" }}
      aria-busy={pending && !imageUrl ? true : undefined}
    >
      {/* Shimmer skeleton layer */}
      {showSkeleton && (
        <div className="absolute inset-0 overflow-hidden bg-raised-charcoal">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-whisper-warm to-transparent" />
        </div>
      )}

      {/* Image, generating caption, or empty state */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
        />
      ) : pending ? (
        <div className="absolute inset-0 flex items-end justify-start p-5">
          <p className="text-sm uppercase tracking-[0.08em] text-stone-gray">
            Jacques is sketching this step…
          </p>
        </div>
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

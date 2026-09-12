"use client";

import { useEffect, useState } from "react";

export function ImportForm({
  onSubmit,
  onUseSample,
  pending = false,
}: {
  onSubmit: (input: { url?: string; text?: string }) => void;
  onUseSample: () => void;
  pending?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [submissionKind, setSubmissionKind] = useState<"url" | "text">("text");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!pending) {
      setElapsedSeconds(0);
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((elapsed) => elapsed + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [pending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim() || undefined;
    const trimmedText = text.trim() || undefined;
    setSubmissionKind(trimmedUrl ? "url" : "text");
    onSubmit({ url: trimmedUrl, text: trimmedText });
  }

  const helperCopy =
    elapsedSeconds >= 20
      ? "Almost there — long recipes take a little longer."
      : elapsedSeconds >= 8
        ? "Working out the order and the timers."
        : submissionKind === "url"
          ? "Fetching the page and reading the steps."
          : "Reading the steps.";

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" aria-busy={pending}>
        <div>
          <label className="text-sm uppercase tracking-[0.08em] text-stone-gray">Recipe URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            disabled={pending}
            aria-disabled={pending}
            className="mt-2 w-full rounded-2xl border border-whisper-warm bg-transparent px-4 py-3 min-h-14 text-warm-off-white focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember"
          />
        </div>

        <div>
          <label className="text-sm uppercase tracking-[0.08em] text-stone-gray">
            Or paste the recipe text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            disabled={pending}
            aria-disabled={pending}
            className="mt-2 w-full rounded-2xl border border-whisper-warm bg-transparent px-4 py-3 text-warm-off-white leading-[1.55] focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={pending}
            aria-disabled={pending}
            className="self-start rounded-full bg-ember text-cast-iron px-6 min-h-14 active:-translate-y-px active:brightness-95"
          >
            {pending ? (
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="pulse-ember h-2 w-2 rounded-full bg-ember ring-2 ring-cast-iron"
                />
                {submissionKind === "url"
                  ? "Jacques is reading the recipe…"
                  : "Jacques is planning…"}
              </span>
            ) : (
              "Start cooking"
            )}
          </button>
          <p
            className="min-h-6 text-stone-gray"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {pending ? helperCopy : null}
          </p>
        </div>
      </form>

      <button
        onClick={onUseSample}
        type="button"
        disabled={pending}
        aria-disabled={pending}
        className="self-start rounded-full border border-whisper-warm text-warm-off-white px-6 min-h-14 active:-translate-y-px active:brightness-95"
      >
        Load sample recipe (Carbonara)
      </button>
    </div>
  );
}

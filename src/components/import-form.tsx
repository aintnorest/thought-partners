"use client";

import { useState } from "react";

export function ImportForm({
  onSubmit,
  onUseSample,
}: {
  onSubmit: (input: { url?: string; text?: string }) => void;
  onUseSample: () => void;
}) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ url: url.trim() || undefined, text: text.trim() || undefined });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="text-sm uppercase tracking-[0.08em] text-stone-gray">Recipe URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
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
            className="mt-2 w-full rounded-2xl border border-whisper-warm bg-transparent px-4 py-3 text-warm-off-white leading-[1.55] focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember"
          />
        </div>

        <button
          type="submit"
          className="self-start rounded-full bg-ember text-cast-iron px-6 min-h-14 active:-translate-y-px active:brightness-95"
        >
          Start cooking
        </button>
      </form>

      <button
        onClick={onUseSample}
        className="self-start rounded-full border border-whisper-warm text-warm-off-white px-6 min-h-14 active:-translate-y-px active:brightness-95"
      >
        Load sample recipe (Carbonara)
      </button>
    </div>
  );
}

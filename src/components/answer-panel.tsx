import type { AnswerCard as AnswerCardData } from "@/lib/types";

function formatMarkdownLite(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function AnswerPanel({
  card,
  offlineMessage,
}: {
  card?: AnswerCardData;
  offlineMessage?: string;
}) {
  if (!card && !offlineMessage) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-raised-charcoal border border-whisper-warm p-5 animate-rise-in">
      {offlineMessage ? (
        <div className="text-stone-gray">{offlineMessage}</div>
      ) : card ? (
        <>
          <div className="text-sm uppercase tracking-[0.08em] text-stone-gray mb-3">
            {card.question}
          </div>
          <div className="text-warm-off-white leading-[1.55]">
            {card.text.split("\n").map((line, i) => (
              line.trim() && (
                <p key={i} className="mb-2">
                  {formatMarkdownLite(line)}
                </p>
              )
            ))}
          </div>
          {card.streaming && (
            <div className="h-4 w-24 rounded bg-raised-charcoal overflow-hidden relative mt-4">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-whisper-warm to-transparent animate-shimmer" />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

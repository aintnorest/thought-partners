import type { HeartbeatCard } from "@/lib/types";

export function HeartbeatToast({ card }: { card?: HeartbeatCard }) {
  if (!card) return null;

  return (
    <div
      key={card.line}
      className="flex items-center gap-3 rounded-2xl bg-raised-charcoal border-l-4 border-saffron pl-4 pr-5 py-3 animate-rise-in"
    >
      <svg
        className="h-4 w-4 text-saffron shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <p className="text-warm-off-white text-sm">{card.line}</p>
    </div>
  );
}

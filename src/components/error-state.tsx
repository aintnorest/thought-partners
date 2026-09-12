"use client";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-brick/40 bg-raised-charcoal p-6 flex flex-col gap-4">
      <p className="text-brick">{message}</p>
      <button
        onClick={onRetry}
        className="self-start rounded-full border border-brick text-brick px-6 min-h-14 active:-translate-y-px active:brightness-95"
      >
        Try again
      </button>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline" };

export default function Offline() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">You&rsquo;re offline</h1>
        <p className="max-w-prose text-neutral-400">
          Jacques can&rsquo;t reach the kitchen right now. Reconnect to keep cooking — recently
          viewed pages stay available.
        </p>
      </div>
    </main>
  );
}

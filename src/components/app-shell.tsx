import type { ReactNode } from "react";

/**
 * DESIGN.md §5 — portrait-first single column, always. Desktop only widens toward 640px;
 * the app never goes side-by-side. Safe-area padding on all four edges for PWA chrome.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-[100dvh] bg-cast-iron"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[640px] flex-col">{children}</div>
    </div>
  );
}

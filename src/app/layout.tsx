import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { AppBootstrap } from "@/lib/glue/app-bootstrap";
import "./globals.css";

/* Locked type pair (DESIGN.md §3): Outfit everywhere, JetBrains Mono for clock/quantity figures. */
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  applicationName: "Jacques",
  title: {
    default: "Jacques — Agentic Sous Chef",
    template: "%s · Jacques",
  },
  description: "An agentic sous chef that coaches home cooks through recipes in real time.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jacques",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1916",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${outfit.className} min-h-dvh bg-cast font-sans text-cream antialiased`}
      >
        <AppBootstrap>{children}</AppBootstrap>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

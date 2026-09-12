import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { AppBootstrap } from "@/lib/glue/app-bootstrap";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

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
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh bg-cast-iron text-warm-off-white antialiased">
        <AppBootstrap>{children}</AppBootstrap>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

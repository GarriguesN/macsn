// app/layout.tsx — root layout mobile-first (PWA)
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import AppBootstrap from "@/components/AppBootstrap";

export const metadata: Metadata = {
  title: "Macsn",
  description:
    "Escanea tus comidas y controla calorías y macros. Snap it. Track it. Move on.",
  applicationName: "Macsn",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Macsn",
  },
  formatDetection: { telephone: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#34A853",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-system-bg text-label antialiased">
        <AppProvider>
          <AppBootstrap>{children}</AppBootstrap>
        </AppProvider>
      </body>
    </html>
  );
}
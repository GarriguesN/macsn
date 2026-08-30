// app/layout.tsx — minimal Next.js root layout (backend shell)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "macsn backend",
  description: "Macro Scanner API — BAML + MiniMax M3 + SQLite",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          padding: "24px",
          background: "#0b0b0c",
          color: "#e5e5e5",
        }}
      >
        <main>
          <h1>macsn backend</h1>
          <p style={{ opacity: 0.7 }}>
            API REST. See <code>README.md</code> for endpoints.
          </p>
          {children}
        </main>
      </body>
    </html>
  );
}

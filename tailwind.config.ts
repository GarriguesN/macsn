// tailwind.config.ts — design tokens del plan v2 §13 (iOS HIG + Macsn brand)
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "system-bg": "#FAFAF7",
        "grouped-bg": "#F2F2EE",
        surface: "#FFFFFF",
        separator: "#E5E5E0",
        label: "#1A1A1A",
        "label-secondary": "#6B6B6B",
        "label-tertiary": "#A0A0A0",
        primary: { DEFAULT: "#34A853", dark: "#1F7A3A" },
        // Activity rings / macros
        move: "#FF3B30",
        exercise: "#34A853",
        stand: "#5AC8FA",
        "macro-p": "#1F7A3A",
        "macro-f": "#F59E0B",
        "macro-h": "#0EA5E9",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "large-title": ["34pt", { lineHeight: "41pt", letterSpacing: "0.4pt" }],
        "title-1": ["28pt", { lineHeight: "34pt", letterSpacing: "0.36pt" }],
        "title-2": ["22pt", { lineHeight: "28pt", letterSpacing: "0.35pt" }],
        "title-3": ["20pt", { lineHeight: "25pt", letterSpacing: "0.38pt" }],
        headline: ["17pt", { lineHeight: "22pt", letterSpacing: "-0.41pt" }],
        body: ["17pt", { lineHeight: "22pt", letterSpacing: "-0.41pt" }],
        callout: ["16pt", { lineHeight: "21pt", letterSpacing: "-0.32pt" }],
        subhead: ["15pt", { lineHeight: "20pt", letterSpacing: "-0.24pt" }],
        footnote: ["13pt", { lineHeight: "18pt", letterSpacing: "-0.08pt" }],
        "caption-1": ["12pt", { lineHeight: "16pt", letterSpacing: "0pt" }],
        "caption-2": ["11pt", { lineHeight: "14pt", letterSpacing: "0pt" }],
      },
      borderRadius: {
        sm: "8pt",
        md: "12pt",
        lg: "20pt",
        xl: "24pt",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.04)",
        md: "0 4px 12px rgba(0,0,0,0.06)",
        lg: "0 12px 32px rgba(0,0,0,0.10)",
        fab: "0 6px 16px rgba(52,168,83,0.30)",
      },
    },
  },
  plugins: [],
};

export default config;
// components/home/HomeHeader.tsx — saludo + botón ajustes del Home
"use client";

import IconButton from "@/components/ui/IconButton";

interface HomeHeaderProps {
  greeting: string;
  subtitle: string;
  onSettingsClick: () => void;
}

/**
 * Header del Home del mockup: padding 50px 24px 16px, fondo #f5f5f5,
 * flex row space-between, greeting a la izquierda + settings 40x40 a la derecha.
 */
export default function HomeHeader({
  greeting,
  subtitle,
  onSettingsClick,
}: HomeHeaderProps) {
  return (
    <div
      className="flex justify-between items-start shrink-0"
      style={{ padding: "50px 24px 16px", background: "#f5f5f5" }}
    >
      <div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#1a1a1a",
            letterSpacing: "-0.5px",
            marginBottom: "4px",
          }}
        >
          {greeting}
        </div>
        <div style={{ fontSize: "14px", color: "#757575", fontWeight: 500 }}>
          {subtitle}
        </div>
      </div>
      <IconButton
        onClick={onSettingsClick}
        ariaLabel="Ir a ajustes"
        size={40}
        color="#757575"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </IconButton>
    </div>
  );
}
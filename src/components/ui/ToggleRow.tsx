// components/ui/ToggleRow.tsx — fila de ajustes con icono + texto + chevron
"use client";

import type { ReactNode } from "react";

interface ToggleRowProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  ariaLabel: string;
  /** Color del icono (default #1a1a1a) */
  iconColor?: string;
  /** Variante: "default" (negro), "danger" (rojo) */
  variant?: "default" | "danger";
}

export default function ToggleRow({
  icon,
  title,
  subtitle,
  onClick,
  ariaLabel,
  iconColor = "#1a1a1a",
  variant = "default",
}: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="btn-mockup flex items-center w-full text-left bg-transparent border-0 cursor-pointer"
      style={{ padding: "16px 0" }}
    >
      <div
        className="shrink-0"
        style={{ marginRight: "14px", color: iconColor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: variant === "danger" ? "#e81e3a" : "#1a1a1a",
            marginBottom: subtitle ? "2px" : 0,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "12px",
              color: "#757575",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#a0a0a0"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}
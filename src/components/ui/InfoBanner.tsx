// components/ui/InfoBanner.tsx — tarjeta de info con icono (mockup)
import type { ReactNode } from "react";

interface InfoBannerProps {
  icon?: ReactNode;
  title?: string;
  children: ReactNode;
  /** Variante: "neutral" (gris #f8f9fa), "green" (#f0f7f2) */
  variant?: "neutral" | "green";
  /** Mostrar icono de información automático si no se pasa `icon` */
  showDefaultIcon?: boolean;
  iconColor?: string;
}

export default function InfoBanner({
  icon,
  title,
  children,
  variant = "neutral",
  showDefaultIcon = true,
  iconColor = "#1e7b3d",
}: InfoBannerProps) {
  const bg = variant === "green" ? "#f0f7f2" : "#f8f9fa";
  return (
    <div
      className="flex items-start gap-3 rounded-2xl"
      style={{ background: bg, padding: "14px 16px" }}
    >
      {(icon || showDefaultIcon) && (
        <div
          className="shrink-0"
          style={{ color: iconColor, marginTop: "2px" }}
        >
          {icon ?? (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
        </div>
      )}
      <div
        style={{
          fontSize: "12.5px",
          color: "#757575",
          lineHeight: 1.4,
        }}
      >
        {title && (
          <strong
            style={{
              color: "#1a1a1a",
              display: "block",
              marginBottom: "4px",
              fontWeight: 700,
            }}
          >
            {title}
          </strong>
        )}
        {children}
      </div>
    </div>
  );
}
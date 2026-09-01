// components/onboarding/WizardHeader.tsx — header reutilizable de los steps 1-3
"use client";

import IconButton from "@/components/ui/IconButton";
import ProgressDots from "@/components/ui/ProgressDots";

interface WizardHeaderProps {
  /** 0-based step index */
  step: number;
  /** Total de steps (default 4) */
  totalSteps?: number;
  onBack: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  /** Variante: "wizard" (default) | "edit" */
  variant?: "wizard" | "edit";
  /** Si true, oculta los botones back/skip (caso resumen) */
  hideNav?: boolean;
  /** Título del header (en modo edit es obligatorio) */
  title?: string;
  description?: string;
}

/**
 * Header del wizard: back/skip + progress + título.
 * Variante "edit": solo botón X (cancelar) + título. Sin progress ni skip.
 */
export default function WizardHeader({
  step,
  totalSteps = 4,
  onBack,
  onSkip,
  skipLabel = "Omitir",
  variant = "wizard",
  hideNav = false,
  title,
  description,
}: WizardHeaderProps) {
  if (variant === "edit") {
    return (
      <div
        className="shrink-0"
        style={{ padding: "50px 24px 16px", background: "#fafafa" }}
      >
        {!hideNav && (
          <div
            className="flex justify-between items-center"
            style={{ marginBottom: "24px" }}
          >
            <IconButton
              onClick={onBack}
              variant="ghostGreen"
              ariaLabel="Cancelar edición"
              size={32}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </IconButton>
          </div>
        )}
        {title && (
          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#1a1a1a",
              marginBottom: "8px",
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </div>
        )}
        {description && (
          <div
            style={{
              fontSize: "14px",
              color: "#757575",
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="shrink-0"
      style={{ padding: "50px 24px 16px", background: "#fafafa" }}
    >
      <div
        className="flex justify-between items-center"
        style={{ marginBottom: "24px" }}
      >
        <IconButton
          onClick={onBack}
          variant="ghostGreen"
          ariaLabel="Volver"
          size={32}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </IconButton>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            aria-label="Ir al inicio"
            className="btn-mockup bg-transparent border-0 cursor-pointer"
            style={{
              padding: 0,
              color: "#1e7b3d",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {skipLabel}
          </button>
        )}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <ProgressDots total={totalSteps} current={step} />
      </div>

      {title && (
        <div
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#1a1a1a",
            marginBottom: "8px",
            letterSpacing: "-0.5px",
          }}
        >
          {title}
        </div>
      )}
      {description && (
        <div
          style={{
            fontSize: "14px",
            color: "#757575",
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}
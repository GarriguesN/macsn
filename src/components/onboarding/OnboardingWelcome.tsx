// components/onboarding/OnboardingWelcome.tsx — Vista 0 del mockup
"use client";

import PrimaryButton from "@/components/ui/PrimaryButton";
import MascotLogo from "@/components/shared/MascotLogo";
import { ONBOARDING_FEATURES, ICON_SHIELD } from "@/data/onboarding";

interface OnboardingWelcomeProps {
  onContinue: () => void;
  onSkip: () => void;
}

/**
 * Vista 0 del mockup:
 * - Logo "M." + wordmark "Macsn"
 * - Headline "Entiende tu comida. Alcanza tus objetivos."
 * - 4 features listadas (icono circular verde + título + desc)
 * - CTA "Comenzar" verde oscuro
 * - Nota de privacidad con escudo gris
 */
export default function OnboardingWelcome({
  onContinue,
  onSkip,
}: OnboardingWelcomeProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col scrollbar-none overflow-y-hidden"
      style={{
        background: "#fafafa",
        padding: "60px 24px 30px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="flex flex-col items-center text-center anim-fade-up"
      >
        <MascotLogo withWordmark />
        <div
          style={{
            fontSize: "26px",
            fontWeight: 800,
            color: "#1a1a1a",
            lineHeight: 1.25,
            marginBottom: "16px",
            marginTop: "16px",
          }}
        >
          Entiende tu comida.
          <br />
          Alcanza tus objetivos
          <span style={{ color: "#28a745" }}>.</span>
        </div>
        <div
          style={{
            fontSize: "15px",
            color: "#757575",
            lineHeight: 1.5,
            padding: "0 10px",
          }}
        >
          Escanea tus comidas, descubre sus macros
          <br />
          y toma mejores decisiones cada día.
        </div>
      </div>

      {/* Lista de features */}
      <div
        className="flex flex-col gap-1 anim-fade-up-delay-1"
        style={{ marginTop: "36px", marginBottom: "40px" }}
      >
        {ONBOARDING_FEATURES.map((f, i) => (
          <div
            key={i}
            className="flex items-start"
            style={{
              padding: "16px 0",
              borderBottom:
                i === ONBOARDING_FEATURES.length - 1
                  ? "none"
                  : "1px solid #f0f0f0",
            }}
          >
            <div
              className="rounded-full flex items-center justify-center shrink-0"
              style={{
                width: "48px",
                height: "48px",
                background: "#f0f7f2",
                marginRight: "16px",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="#1e7b3d"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={f.iconPath} />
                {f.hasExtraPaths && <circle cx="12" cy="13" r="4" />}
                {f.isTarget && (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </>
                )}
              </svg>
            </div>
            <div className="flex-1" style={{ paddingTop: "2px" }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "4px",
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#757575",
                  lineHeight: 1.45,
                }}
              >
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA + nota privacidad */}
      <div className="mt-auto flex flex-col gap-3 anim-fade-up-delay-2">
        <PrimaryButton onClick={onContinue} ariaLabel="Continuar a objetivos">
          Comenzar
        </PrimaryButton>
        <div
          className="flex items-start justify-center gap-2"
          style={{ marginTop: "16px", padding: "0 10px" }}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="#a0a0a0"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: "2px" }}
          >
            <path d={ICON_SHIELD} />
          </svg>
          <div
            style={{
              fontSize: "11.5px",
              color: "#a0a0a0",
              lineHeight: 1.4,
              textAlign: "left",
            }}
          >
            Al continuar, aceptas que tus datos se almacenan localmente en tu
            dispositivo y no se comparten.
          </div>
        </div>
      </div>
    </div>
  );
}
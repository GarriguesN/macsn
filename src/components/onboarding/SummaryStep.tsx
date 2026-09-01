// components/onboarding/SummaryStep.tsx — Vista 4: resumen final + "¿Qué hacer ahora?"
"use client";

import WizardHeader from "@/components/onboarding/WizardHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { ICON_CAMERA, SUMMARY_NEXT_STEPS } from "@/data/onboarding";
import { ACTIVITY_LABEL, GOAL_SHORT_BADGE, GOAL_SUMMARY_TITLE } from "@/data/user";
import type { OnboardingState } from "@/components/onboarding/OnboardingFlow";

interface SummaryStepProps {
  state: OnboardingState;
  onFinish: () => void;
}

function calcAge(birthday: string): number {
  const d = new Date(birthday);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default function SummaryStep({ state, onFinish }: SummaryStepProps) {
  const age = calcAge(state.birthday);
  const personalStr = `${state.height} cm · ${state.weight} kg · ${age} años`;
  const proGrams = Math.round((state.targetKcal * (state.macroPro / 100)) / 4);
  const carGrams = Math.round((state.targetKcal * (state.macroCar / 100)) / 4);
  const fatGrams = Math.round((state.targetKcal * (state.macroFat / 100)) / 9);

  return (
    <div
      className="absolute inset-0 flex flex-col anim-fade-right"
      style={{ background: "#fafafa" }}
    >
      <WizardHeader
        step={3}
        onBack={() => {}}
        onSkip={undefined}
        title="¡Todo listo!"
        description="Tu perfil ha sido configurado. Ya puedes empezar a escanear tus comidas y alcanzar tus objetivos."
      />

      <div
        className="flex-1 overflow-y-auto scrollbar-none flex flex-col gap-6"
        style={{ padding: "0 24px 24px" }}
      >
        {/* Tarjeta resumen */}
        <div
          className="bg-white rounded-2xl"
          style={{ border: "1px solid #f0f0f0", padding: "20px 16px 8px" }}
        >
          <div
            className="flex justify-between items-center"
            style={{ marginBottom: "16px" }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              Resumen de tu configuración
            </div>
          </div>

          <SummaryRow
            icon={
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            }
            title="Objetivo"
            subtitle={GOAL_SUMMARY_TITLE[state.goal]}
            badge={GOAL_SHORT_BADGE[state.goal]}
          />

          <SummaryRow
            icon={
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            title="Datos personales"
            subtitle={personalStr}
          />

          <SummaryRow
            icon={
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 16l-3-4-2 2 M11 12l2-2-2-2" />
              </svg>
            }
            title="Nivel de actividad"
            subtitle={ACTIVITY_LABEL[state.activity]}
          />

          <SummaryRow
            icon={
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
              </svg>
            }
            title="Calorías diarias objetivo"
            subtitle={`${state.targetKcal} kcal`}
          />

          <SummaryRow
            icon={
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
            }
            title="Macronutrientes"
            macros={[
              { color: "#1e7b3d", label: "Proteínas", g: proGrams, pct: state.macroPro },
              { color: "#2d9cdb", label: "Hidratos", g: carGrams, pct: state.macroCar },
              { color: "#f39c12", label: "Grasas", g: fatGrams, pct: state.macroFat },
            ]}
          />

          <SummaryRow
            icon={
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20" />
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
            }
            title="Comidas al día"
            subtitle={`${state.mealsPerDay} comidas`}
          />
        </div>

        {/* ¿Qué hacer ahora? */}
        <div style={{ marginTop: "8px" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#1a1a1a",
              marginBottom: "14px",
              letterSpacing: "-0.3px",
            }}
          >
            ¿Qué puedes hacer ahora?
          </div>
          <div className="flex flex-col gap-3">
            {SUMMARY_NEXT_STEPS.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white rounded-2xl"
                style={{
                  border: "1px solid #f0f0f0",
                  padding: "16px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  className="rounded-[14px] flex items-center justify-center shrink-0"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: s.iconBg,
                    color: s.iconColor,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={s.iconPath} />
                    {s.isTarget && (
                      <>
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </>
                    )}
                    {i === 0 && <circle cx="12" cy="13" r="4" />}
                  </svg>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14.5px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: "3px",
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#757575",
                      lineHeight: 1.35,
                    }}
                  >
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="shrink-0"
        style={{
          padding: "16px 24px 34px",
          background: "#fafafa",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <PrimaryButton onClick={onFinish} ariaLabel="Registrar comida">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={ICON_CAMERA} />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Registrar comida
        </PrimaryButton>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-componente: fila del checklist de resumen
// ============================================================================

interface SummaryRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  macros?: { color: string; label: string; g: number; pct: number }[];
}

function SummaryRow({ icon, title, subtitle, badge, macros }: SummaryRowProps) {
  return (
    <div
      className="flex items-center"
      style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}
    >
      <div
        className="rounded-xl flex items-center justify-center shrink-0"
        style={{
          width: "40px",
          height: "40px",
          background: "#f0f7f2",
          color: "#1e7b3d",
          marginRight: "14px",
        }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: subtitle || macros ? "2px" : 0,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: "13px", color: "#757575" }}>{subtitle}</div>
        )}
        {macros && (
          <div
            className="flex items-center flex-wrap gap-2"
            style={{ fontSize: "11px", color: "#757575", marginTop: "4px" }}
          >
            {macros.map((m, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: m.color,
                  }}
                />
                {m.label} {m.g} g ({m.pct}%)
              </div>
            ))}
          </div>
        )}
      </div>
      {badge && (
        <div
          style={{
            background: "#f0f7f2",
            color: "#1e7b3d",
            fontSize: "11px",
            fontWeight: 700,
            padding: "4px 8px",
            borderRadius: "100px",
          }}
        >
          {badge}
        </div>
      )}
      {!badge && !macros && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a0a0a0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </div>
  );
}
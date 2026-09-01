// components/onboarding/DailyGoalStep.tsx — Vista 3: kcal + macros + comidas/día
"use client";

import clsx from "clsx";
import WizardHeader from "@/components/onboarding/WizardHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoBanner from "@/components/ui/InfoBanner";
import { MEAL_OPTIONS } from "@/data/onboarding";
import { GOAL_BADGE_TEXT } from "@/data/user";
import type { OnboardingState } from "@/components/onboarding/OnboardingFlow";

interface DailyGoalStepProps {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  editMode?: boolean;
}

const MACRO_COLORS = {
  pro: "#1e7b3d",
  car: "#2d9cdb",
  fat: "#f39c12",
} as const;

export default function DailyGoalStep({
  state,
  update,
  onContinue,
  onBack,
  onSkip,
  editMode = false,
}: DailyGoalStepProps) {
  const goalSum = state.macroPro + state.macroCar + state.macroFat;
  const sumValid = Math.abs(goalSum - 100) < 0.5;

  // Normaliza los ratios para mostrar gramos
  const proGrams = Math.round((state.targetKcal * (state.macroPro / 100)) / 4);
  const carGrams = Math.round((state.targetKcal * (state.macroCar / 100)) / 4);
  const fatGrams = Math.round((state.targetKcal * (state.macroFat / 100)) / 9);

  return (
    <div
      className="absolute inset-0 flex flex-col anim-fade-right"
      style={{ background: "#fafafa" }}
    >
      <WizardHeader
        step={2}
        onBack={onBack}
        onSkip={editMode ? undefined : onSkip}
        title={editMode ? "Editar objetivos diarios" : "Define tu objetivo diario"}
        description={
          editMode
            ? "Ajusta tus calorías y macros. Guarda cuando termines."
            : "Establece tus calorías diarias objetivo y cómo quieres distribuir tus macronutrientes. Puedes ajustarlo más adelante."
        }
      />

      <div
        className="flex-1 overflow-y-auto scrollbar-none flex flex-col gap-4"
        style={{ padding: "0 24px 24px" }}
      >
        {/* 1. Calorías */}
        <div
          className="bg-white rounded-2xl"
          style={{ border: "1px solid #f0f0f0", padding: "20px 16px" }}
        >
          <div
            style={{
              fontSize: "14.5px",
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: "4px",
            }}
          >
            1. Calorías diarias objetivo
          </div>
          <div
            style={{
              fontSize: "12.5px",
              color: "#757575",
              marginBottom: "24px",
            }}
          >
            Basado en tus datos y objetivo seleccionado.
          </div>

          <div
            className="flex items-center justify-center gap-7"
            style={{ marginBottom: "20px" }}
          >
            <button
              type="button"
              onClick={() => update({ targetKcal: state.targetKcal - 50 })}
              aria-label="Restar 50 kcal"
              className="btn-mockup rounded-full flex items-center justify-center cursor-pointer bg-white border-0"
              style={{
                width: "44px",
                height: "44px",
                border: "1px solid #e0e0e0",
                color: "#1e7b3d",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div className="text-center">
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#1a1a1a",
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {state.targetKcal}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#a0a0a0",
                  marginTop: "4px",
                }}
              >
                kcal/día
              </div>
            </div>
            <button
              type="button"
              onClick={() => update({ targetKcal: state.targetKcal + 50 })}
              aria-label="Sumar 50 kcal"
              className="btn-mockup rounded-full flex items-center justify-center cursor-pointer bg-white border-0"
              style={{
                width: "44px",
                height: "44px",
                border: "1px solid #e0e0e0",
                color: "#1e7b3d",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center">
            <div
              className="flex items-center gap-1.5"
              style={{
                background: "#f0f7f2",
                color: "#1e7b3d",
                fontSize: "11.5px",
                fontWeight: 700,
                padding: "8px 14px",
                borderRadius: "100px",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {GOAL_BADGE_TEXT[state.goal]}
            </div>
          </div>
        </div>

        {/* 2. Distribución de macros */}
        <div
          className="bg-white rounded-2xl"
          style={{ border: "1px solid #f0f0f0", padding: "20px 16px" }}
        >
          <div
            className="flex items-center justify-between gap-3"
            style={{ marginBottom: "4px" }}
          >
            <div
              style={{
                fontSize: "14.5px",
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              2. Distribución de macronutrientes
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "100px",
                background: sumValid ? "#f0f7f2" : "#fff5f5",
                color: sumValid ? "#1e7b3d" : "#e81e3a",
              }}
            >
              {sumValid ? `${goalSum}% ✓` : `${goalSum}%`}
            </div>
          </div>
          <div
            style={{
              fontSize: "12.5px",
              color: "#757575",
              marginBottom: "24px",
            }}
          >
            Ajusta los porcentajes según tu preferencia.
          </div>

          <div className="flex flex-col gap-5">
            <MacroSlider
              label="Proteínas"
              color={MACRO_COLORS.pro}
              grams={proGrams}
              pct={state.macroPro}
              onChange={(p) => update({ macroPro: p })}
            />
            <MacroSlider
              label="Hidratos"
              color={MACRO_COLORS.car}
              grams={carGrams}
              pct={state.macroCar}
              onChange={(p) => update({ macroCar: p })}
            />
            <MacroSlider
              label="Grasas"
              color={MACRO_COLORS.fat}
              grams={fatGrams}
              pct={state.macroFat}
              onChange={(p) => update({ macroFat: p })}
            />

            {/* Fibra (estática) */}
            <div
              className="flex items-center justify-between gap-3"
              style={{ opacity: 0.85 }}
            >
              <div
                className="flex items-center gap-1.5"
                style={{ width: "100px" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#a0a0a0",
                  }}
                />
                <div
                  style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}
                >
                  Fibra
                </div>
              </div>
              <div style={{ width: "40px", fontSize: "13px", color: "#757575" }}>
                25 g
              </div>
              <div
                className="relative"
                style={{ flex: 1, height: "4px", background: "#f0f0f0", borderRadius: "2px" }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: "10%",
                    background: "#a0a0a0",
                    borderRadius: "2px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "10%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "2px solid #a0a0a0",
                  }}
                />
              </div>
              <div
                style={{
                  width: "32px",
                  textAlign: "right",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#a0a0a0",
                }}
              >
                —
              </div>
            </div>
          </div>
        </div>

        {/* 3. Comidas al día */}
        <div
          className="bg-white rounded-2xl"
          style={{ border: "1px solid #f0f0f0", padding: "16px" }}
        >
          <div
            style={{
              fontSize: "14.5px",
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: "4px",
            }}
          >
            3. ¿Cuántas comidas haces al día?
          </div>
          <div
            style={{
              fontSize: "12.5px",
              color: "#757575",
              marginBottom: "16px",
            }}
          >
            Esto nos ayuda a distribuir mejor tus objetivos.
          </div>

          <div
            className="flex rounded-[10px] overflow-hidden"
            style={{ border: "1px solid #e0e0e0", marginBottom: "16px" }}
          >
            {MEAL_OPTIONS.map((m, i) => {
              const active = state.mealsPerDay === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => update({ mealsPerDay: m.value })}
                  className="btn-mockup flex-1 cursor-pointer border-0 transition-all duration-200"
                  style={{
                    padding: "12px 0",
                    background: active ? "#1e7b3d" : "#ffffff",
                    color: active ? "#ffffff" : "#1a1a1a",
                    fontSize: "14px",
                    fontWeight: 600,
                    borderRight:
                      i === MEAL_OPTIONS.length - 1
                        ? "none"
                        : "1px solid #e0e0e0",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <div
            className="flex items-start gap-3 rounded-xl"
            style={{ padding: "12px", background: "#f8f9fa" }}
          >
            <div
              className="shrink-0 rounded-full flex items-center justify-center bg-white"
              style={{
                width: "28px",
                height: "28px",
                border: "1px solid #e0e0e0",
                color: "#1e7b3d",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20" />
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
            </div>
            <div style={{ fontSize: "12px", color: "#757575", lineHeight: 1.4 }}>
              Recomendado: 4 comidas al día para mantener tu energía estable y
              mejorar tu rendimiento.
            </div>
          </div>
        </div>

        <div style={{ marginTop: "8px" }}>
          <InfoBanner title="Todo esto se puede cambiar">
            Podrás modificar tus objetivos, calorías y macros en cualquier
            momento desde la configuración.
          </InfoBanner>
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
        <PrimaryButton
          onClick={onContinue}
          ariaLabel={editMode ? "Guardar cambios" : "Continuar al resumen"}
        >
          {editMode ? "Guardar cambios" : "Continuar"}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-componente: slider de macros con track coloreado + thumb blanco
// ============================================================================

interface MacroSliderProps {
  label: string;
  color: string;
  grams: number;
  pct: number;
  onChange: (p: number) => void;
}

function MacroSlider({ label, color, grams, pct, onChange }: MacroSliderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        className="flex items-center gap-1.5"
        style={{ width: "100px" }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
          }}
        />
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>
          {label}
        </div>
      </div>
      <div style={{ width: "40px", fontSize: "13px", color: "#757575" }}>
        {grams} g
      </div>
      <div
        className="relative flex items-center"
        style={{ flex: 1, height: "24px" }}
      >
        {/* Track fondo */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "4px",
            background: "#f0f0f0",
            borderRadius: "2px",
          }}
        />
        {/* Track progreso */}
        <div
          style={{
            position: "absolute",
            width: `${pct}%`,
            height: "4px",
            background: color,
            borderRadius: "2px",
          }}
        />
        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            left: `${pct}%`,
            transform: "translateX(-50%)",
            width: "12px",
            height: "12px",
            background: "#ffffff",
            border: `3px solid ${color}`,
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
        {/* Input range invisible encima */}
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-mockup"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            zIndex: 3,
            margin: 0,
          }}
          aria-label={`Porcentaje de ${label}`}
        />
      </div>
      <div
        style={{
          width: "32px",
          textAlign: "right",
          fontSize: "14px",
          fontWeight: 700,
          color,
        }}
      >
        {pct}%
      </div>
    </div>
  );
}
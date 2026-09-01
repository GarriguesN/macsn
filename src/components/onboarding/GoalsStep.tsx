// components/onboarding/GoalsStep.tsx — Vista 1: selección de objetivo
"use client";

import clsx from "clsx";
import WizardHeader from "@/components/onboarding/WizardHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoBanner from "@/components/ui/InfoBanner";
import { GOAL_OPTIONS } from "@/data/onboarding";
import type { GoalKey } from "@/types";

interface GoalsStepProps {
  selected: GoalKey;
  onSelect: (key: GoalKey) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  editMode?: boolean;
}

/**
 * Vista 1 del mockup: lista de 5 objetivos seleccionables.
 * Cada item: icono circular 42x42 + título + desc + check 24x24.
 */
export default function GoalsStep({
  selected,
  onSelect,
  onContinue,
  onBack,
  onSkip,
  editMode = false,
}: GoalsStepProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col anim-fade-right"
      style={{ background: "#fafafa" }}
    >
      <WizardHeader
        step={0}
        onBack={onBack}
        onSkip={editMode ? undefined : onSkip}
        title={
          editMode
            ? "Editar objetivo"
            : "¿Cuáles son tus objetivos?"
        }
        description={
          editMode
            ? "Selecciona tu nuevo objetivo principal."
            : "Selecciona tu objetivo principal. Podrás ajustarlo más adelante en ajustes."
        }
      />

      {/* Lista scrollable */}
      <div
        className="flex-1 overflow-y-auto scrollbar-none flex flex-col gap-2.5"
        style={{ padding: "0 24px 24px" }}
      >
        {GOAL_OPTIONS.map((g) => {
          const isSelected = g.key === selected;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => onSelect(g.key)}
              aria-label={`Seleccionar ${g.title}`}
              className={clsx(
                "btn-mockup flex items-center text-left cursor-pointer rounded-2xl",
                "transition-all duration-200"
              )}
              style={{
                padding: "14px",
                border: isSelected
                  ? "2px solid #1e7b3d"
                  : "2px solid #f0f0f0",
                background: isSelected ? "#fafefa" : "#ffffff",
                flexShrink: 0,
              }}
            >
              <div
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: "42px",
                  height: "42px",
                  background: isSelected ? "#1e7b3d" : "#f0f7f2",
                  color: isSelected ? "#ffffff" : "#1e7b3d",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={g.iconPath} />
                  {g.isTarget && (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </>
                  )}
                </svg>
              </div>
              <div className="flex-1" style={{ padding: "0 14px" }}>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    marginBottom: "2px",
                  }}
                >
                  {g.title}
                </div>
                <div
                  style={{
                    fontSize: "12.5px",
                    color: "#757575",
                    lineHeight: 1.3,
                  }}
                >
                  {g.desc}
                </div>
              </div>
              <div
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: "24px",
                  height: "24px",
                  background: isSelected ? "#1e7b3d" : "transparent",
                  border: isSelected
                    ? "2px solid #1e7b3d"
                    : "2px solid #e0e0e0",
                  boxSizing: "border-box",
                }}
              >
                {isSelected && (
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}

        <div style={{ marginTop: "4px" }}>
          <InfoBanner title="Esto nos ayuda a personalizar tu experiencia">
            Calcularemos tus necesidades calóricas y de macronutrientes según
            tu objetivo.
          </InfoBanner>
        </div>
      </div>

      {/* Footer */}
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
          ariaLabel={editMode ? "Guardar objetivo" : "Continuar a datos personales"}
        >
          {editMode ? "Guardar" : "Continuar"}
        </PrimaryButton>
      </div>
    </div>
  );
}
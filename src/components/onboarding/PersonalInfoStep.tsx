// components/onboarding/PersonalInfoStep.tsx — Vista 2: sexo, fecha, altura, peso, actividad
"use client";

import { useState } from "react";
import clsx from "clsx";
import WizardHeader from "@/components/onboarding/WizardHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoBanner from "@/components/ui/InfoBanner";
import Modal from "@/components/ui/Modal";
import {
  ACTIVITY_OPTIONS,
  HEIGHT_TICKS,
  SEX_OPTIONS,
  WEIGHT_TICKS,
} from "@/data/onboarding";
import type { OnboardingState } from "@/components/onboarding/OnboardingFlow";
import type { Sex } from "@/types";

interface PersonalInfoStepProps {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  editMode?: boolean;
}

/** Formatea ISO date a "DD MMM YYYY" (es-ES corto) */
function fmtBirthday(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PersonalInfoStep({
  state,
  update,
  onContinue,
  onBack,
  onSkip,
  editMode = false,
}: PersonalInfoStepProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div
      className="absolute inset-0 flex flex-col anim-fade-right"
      style={{ background: "#fafafa" }}
    >
      <WizardHeader
        step={1}
        onBack={onBack}
        onSkip={editMode ? undefined : onSkip}
        title={editMode ? "Editar datos personales" : "Cuéntanos sobre ti"}
        description={
          editMode
            ? "Modifica tus datos y guarda los cambios cuando termines."
            : "Necesitamos algunos datos para calcular tus necesidades y personalizar tus objetivos."
        }
      />

      {/* Contenido scrollable */}
      <div
        className="flex-1 overflow-y-auto scrollbar-none flex flex-col gap-4"
        style={{ padding: "0 24px 24px" }}
      >
        {/* Sexo */}
        <div
          className="bg-white rounded-2xl"
          style={{ border: "1px solid #f0f0f0", padding: "16px" }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: "12px",
            }}
          >
            Sexo
          </div>
          <div className="flex gap-3">
            {SEX_OPTIONS.map((s) => {
              const active = state.sex === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => update({ sex: s.key as Sex })}
                  aria-label={`Seleccionar género ${s.label.toLowerCase()}`}
                  className="btn-mockup flex-1 flex items-center justify-center gap-2 cursor-pointer rounded-xl transition-all duration-200"
                  style={{
                    padding: "12px",
                    background: active ? "#1e7b3d" : "#ffffff",
                    border: active ? "1px solid #1e7b3d" : "1px solid #e0e0e0",
                    color: active ? "#ffffff" : "#1a1a1a",
                    fontSize: "14.5px",
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fecha de nacimiento */}
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          aria-label="Editar fecha de nacimiento"
          className="btn-mockup bg-white rounded-2xl cursor-pointer w-full text-left"
          style={{
            border: "1px solid #f0f0f0",
            padding: "16px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: "2px",
            }}
          >
            Fecha de nacimiento
          </div>
          <div
            style={{
              fontSize: "12.5px",
              color: "#757575",
              marginBottom: "12px",
            }}
          >
            Selecciona tu fecha de nacimiento
          </div>
          <div className="flex justify-between items-center">
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              {fmtBirthday(state.birthday)}
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1e7b3d"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </button>

        {/* Modal de fecha */}
        <Modal
          open={showPicker}
          onClose={() => setShowPicker(false)}
          zIndex={300}
        >
          <div
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: "#1a1a1a",
              marginBottom: "4px",
            }}
          >
            Fecha de nacimiento
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#757575",
              marginBottom: "16px",
            }}
          >
            La usaremos para calcular tus necesidades.
          </div>
          <input
            type="date"
            value={state.birthday}
            onChange={(e) => update({ birthday: e.target.value })}
            className="w-full bg-white"
            style={{
              padding: "12px 14px",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              fontSize: "15px",
              color: "#1a1a1a",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          <div className="flex gap-2.5" style={{ marginTop: "18px" }}>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="btn-mockup flex-1 cursor-pointer border-0 rounded-xl"
              style={{
                padding: "14px",
                background: "#f5f5f5",
                color: "#1a1a1a",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="btn-mockup flex-1 cursor-pointer border-0 rounded-xl"
              style={{
                padding: "14px",
                background: "#0f5b2d",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Confirmar
            </button>
          </div>
        </Modal>

        {/* Altura */}
        <HeightWeightCard
          title="Altura"
          subtitle="Selecciona tu altura"
          unit="cm"
          value={state.height}
          min={140}
          max={220}
          onChange={(v) => update({ height: v })}
          ticks={HEIGHT_TICKS}
        />

        {/* Peso */}
        <HeightWeightCard
          title="Peso actual"
          subtitle="Selecciona tu peso"
          unit="kg"
          value={state.weight}
          min={40}
          max={150}
          onChange={(v) => update({ weight: v })}
          ticks={WEIGHT_TICKS}
        />

        {/* Nivel de actividad */}
        <div
          className="bg-white rounded-2xl"
          style={{ border: "1px solid #f0f0f0", padding: "16px" }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: "2px",
            }}
          >
            Nivel de actividad física
          </div>
          <div
            style={{
              fontSize: "12.5px",
              color: "#757575",
              marginBottom: "16px",
            }}
          >
            Selecciona tu nivel de actividad diaria
          </div>
          <div className="flex justify-between gap-1">
            {ACTIVITY_OPTIONS.map((act) => {
              const active = state.activity === act.key;
              return (
                <button
                  key={act.key}
                  type="button"
                  onClick={() => update({ activity: act.key })}
                  aria-label={`Nivel de actividad: ${act.label}`}
                  className={clsx(
                    "btn-mockup flex-1 flex flex-col items-center justify-center gap-2 cursor-pointer rounded-[10px] transition-all duration-200"
                  )}
                  style={{
                    padding: "12px 2px",
                    background: active ? "#f0f7f2" : "#ffffff",
                    border: active ? "1px solid #1e7b3d" : "1px solid #f0f0f0",
                    color: active ? "#1e7b3d" : "#757575",
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{ color: active ? "#1e7b3d" : "#a0a0a0" }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={act.iconPath} />
                      {act.hasCircle && <circle cx="12" cy="5" r="2" />}
                    </svg>
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: active ? 700 : 500,
                      color: active ? "#1e7b3d" : "#757575",
                      textAlign: "center",
                    }}
                  >
                    {act.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "8px" }}>
          <InfoBanner title="¿Por qué pedimos esta información?">
            Con estos datos calculamos tus necesidades calóricas y de
            macronutrientes de forma más precisa.
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
          ariaLabel={editMode ? "Guardar cambios" : "Continuar a objetivo diario"}
        >
          {editMode ? "Guardar cambios" : "Continuar"}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-componente: tarjeta con slider + ticks (altura / peso)
// ============================================================================

interface HeightWeightCardProps {
  title: string;
  subtitle: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  ticks: { label: string }[];
}

function HeightWeightCard({
  title,
  subtitle,
  unit,
  value,
  min,
  max,
  onChange,
  ticks,
}: HeightWeightCardProps) {
  return (
    <div
      className="bg-white rounded-2xl"
      style={{ border: "1px solid #f0f0f0", padding: "16px 16px 24px" }}
    >
      <div
        className="flex justify-between items-start"
        style={{ marginBottom: "16px" }}
      >
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: "2px",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "12.5px", color: "#757575" }}>{subtitle}</div>
        </div>
        <div
          style={{
            background: "#1e7b3d",
            color: "#ffffff",
            padding: "6px 10px",
            borderRadius: "8px",
            fontSize: "13.5px",
            fontWeight: 700,
          }}
        >
          {value} {unit}
        </div>
      </div>

      <div className="relative" style={{ padding: "0 10px" }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-mockup"
          aria-label={title}
        />
        <div
          className="flex justify-between"
          style={{ padding: "0 12px", marginTop: "4px" }}
        >
          {ticks.map((t, i) => (
            <div
              key={i}
              className="flex flex-col items-center"
              style={{ width: 0 }}
            >
              <div
                style={{
                  width: "1px",
                  height: "6px",
                  background: "#d0d0d0",
                  marginBottom: "4px",
                }}
              />
              <div
                style={{
                  fontSize: "10px",
                  color: "#a0a0a0",
                  fontWeight: 600,
                }}
              >
                {t.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
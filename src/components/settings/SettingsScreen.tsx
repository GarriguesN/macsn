// components/settings/SettingsScreen.tsx — tab "Ajustes" del mockup (reactivo al store)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ToggleRow from "@/components/ui/ToggleRow";
import ResetConfirm from "@/components/scanner/ResetConfirm";
import BottomNav from "@/components/nav/BottomNav";
import { useApp } from "@/lib/store";
import { ACTIVITY_LABEL } from "@/data/user";

const LANG_LABELS = {
  es: "Español",
  en: "English",
  ca: "Català",
  fr: "Français",
} as const;

const THEME_LABELS = {
  system: "Automático (sistema)",
  light: "Claro",
  dark: "Oscuro",
} as const;

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, targets, updateProfile, reset } = useApp();
  const [resetOpen, setResetOpen] = useState(false);

  // Helpers: cada handler modifica state y persiste
  const cycleUnits = () =>
    updateProfile({ units: profile.units === "metric" ? "imperial" : "metric" });
  const cycleReminders = () => updateProfile({ reminders: !profile.reminders });
  const cycleTheme = () => {
    const order: typeof profile.theme[] = ["system", "light", "dark"];
    const i = order.indexOf(profile.theme);
    updateProfile({ theme: order[(i + 1) % order.length] });
  };
  const cycleLanguage = () => {
    const order: typeof profile.language[] = ["es", "en", "ca", "fr"];
    const i = order.indexOf(profile.language);
    updateProfile({ language: order[(i + 1) % order.length] });
  };

  // Resumen de datos personales
  const age = calcAge(profile.birthday);
  const personalInfo = `${profile.height} cm · ${profile.weight} kg · ${age} años`;

  return (
    <>
      <main
        className="min-h-screen flex flex-col"
        style={{ background: "#f5f5f5" }}
      >
        <div
          className="shrink-0"
          style={{ padding: "50px 24px 16px", background: "#f5f5f5" }}
        >
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#1a1a1a",
              letterSpacing: "-1px",
            }}
          >
            Configuración
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto scrollbar-none flex flex-col"
          style={{ padding: "0 24px 120px", gap: "24px" }}
        >
          {/* Grupo Perfil */}
          <SettingsSection title="Perfil">
            <ToggleRow
              icon={
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
              }
              title="Objetivos diarios"
              subtitle={`${targets.kcal} kcal · ${targets.macroPro}/${targets.macroCar}/${targets.macroFat}`}
              onClick={() => router.push("/onboarding?edit=daily")}
              ariaLabel="Editar objetivos diarios"
            />
            <ToggleRow
              icon={
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
              title="Datos personales"
              subtitle={personalInfo}
              onClick={() => router.push("/onboarding?edit=personal")}
              ariaLabel="Editar datos personales"
            />
          </SettingsSection>

          {/* Grupo Preferencias */}
          <SettingsSection title="Preferencias">
            <ToggleRow
              icon={
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
                  <rect x="3" y="8" width="18" height="8" rx="2" ry="2" />
                  <line x1="7" y1="8" x2="7" y2="10" />
                  <line x1="11" y1="8" x2="11" y2="12" />
                  <line x1="15" y1="8" x2="15" y2="10" />
                </svg>
              }
              title="Unidades"
              subtitle={profile.units === "metric" ? "Métrico (kg/cm)" : "Imperial (lb/in)"}
              onClick={cycleUnits}
              ariaLabel="Cambiar unidades"
            />
            <ToggleRow
              icon={
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
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              }
              title="Recordatorios"
              subtitle={profile.reminders ? "Activados" : "Desactivados"}
              onClick={cycleReminders}
              ariaLabel="Activar o desactivar recordatorios"
            />
            <ToggleRow
              icon={
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
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              }
              title="Tema"
              subtitle={THEME_LABELS[profile.theme]}
              onClick={cycleTheme}
              ariaLabel="Cambiar tema"
            />
            <ToggleRow
              icon={
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              }
              title="Idioma"
              subtitle={LANG_LABELS[profile.language]}
              onClick={cycleLanguage}
              ariaLabel="Cambiar idioma"
            />
          </SettingsSection>

          {/* Datos y privacidad */}
          <div
            className="bg-white rounded-2xl"
            style={{ border: "1px solid #f0f0f0", padding: "4px 16px" }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#a0a0a0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "12px 0 6px",
              }}
            >
              Datos y privacidad
            </div>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              aria-label="Restablecer onboarding"
              className="btn-mockup flex items-center w-full text-left bg-transparent border-0 cursor-pointer"
              style={{ padding: "16px 0" }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e81e3a"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: "14px" }}
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              <div className="flex-1">
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#e81e3a",
                    marginBottom: "2px",
                  }}
                >
                  Restablecer onboarding
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#757575",
                  }}
                >
                  Borra tus datos locales y vuelve al inicio
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      <ResetConfirm
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={async () => {
          await reset();
          setResetOpen(false);
          router.push("/onboarding");
        }}
      />
      <BottomNav />
    </>
  );
}

// ============================================================================
// Sub-componente: sección con título + card
// ============================================================================

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "13.5px",
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: "10px",
          paddingLeft: "4px",
        }}
      >
        {title}
      </div>
      <div
        className="bg-white rounded-2xl"
        style={{
          padding: "4px 16px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
          border: "1px solid #f0f0f0",
        }}
      >
        {wrapChildrenWithBorders(children)}
      </div>
    </div>
  );
}

function wrapChildrenWithBorders(children: React.ReactNode) {
  const arr = Array.isArray(children) ? children : [children];
  return arr.map((child, i) => (
    <div
      key={i}
      style={{
        borderBottom: i === arr.length - 1 ? "none" : "1px solid #f0f0f0",
      }}
    >
      {child}
    </div>
  ));
}

function calcAge(birthday: string): number {
  const dt = new Date(birthday);
  const diff = Date.now() - dt.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

// evita warning por import no usado
export const __ACTIVITY = ACTIVITY_LABEL;
// components/home/HomeScreen.tsx — pantalla principal "Hoy" (reactiva al store)
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import HomeHeader from "@/components/home/HomeHeader";
import MealRow from "@/components/home/MealRow";
import MacroRingChart, { type RingDatum } from "@/components/charts/MacroRingChart";
import Scanner from "@/components/scanner/Scanner";
import MealDetail from "@/components/meals/MealDetail";
import ScannedMealDetail from "@/components/meals/ScannedMealDetail";
import AllMeals from "@/components/meals/AllMeals";
import BottomNav from "@/components/nav/BottomNav";
import {
  useApp,
  selectMealsByDate,
  selectTotalsByDate,
  isOnboardingComplete,
  type StoredMeal,
} from "@/lib/store";
import { todayISO } from "@/lib/date";
import type { ScanResult, MealType } from "@/types";

const RING_COLORS = {
  kcal: "#e81e3a",
  pro: "#28a745",
  car: "#2d9cdb",
  fat: "#f39c12",
} as const;

function pct(value: number, goal: number) {
  if (!goal || goal <= 0) return 0;
  return Math.round((value / goal) * 100);
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, targets, meals, hydrated } = useApp();

  // Gate de onboarding: si no ha pasado, redirigir al wizard.
  // El store ya devuelve defaults si el backend nunca se ha contactado,
  // así que cuando el usuario aún no ha hecho onboarding su profile es el DEFAULT_PROFILE.
  useEffect(() => {
    if (!hydrated) return;
    if (!isOnboardingComplete(profile)) {
      router.replace("/onboarding");
    }
  }, [hydrated, profile, router]);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scannedOpen, setScannedOpen] = useState(false);
  const [allMealsOpen, setAllMealsOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState<StoredMeal | null>(null);
  const [pendingScan, setPendingScan] = useState<{
    scan: ScanResult;
    mealType: MealType;
  } | null>(null);

  const today = todayISO();
  const todayMeals = useMemo(
    () => selectMealsByDate(meals, today),
    [meals, today]
  );
  const totals = useMemo(
    () => selectTotalsByDate(meals, today),
    [meals, today]
  );

  // Mientras redirige o está hidratando, no pintamos la Home
  if (!hydrated || !isOnboardingComplete(profile)) {
    return null;
  }

  const greeting = `Hola, ${profile.name}`;
  const subtitle =
    todayMeals.length === 0
      ? "Aún no has registrado comidas"
      : `Hoy registraste ${todayMeals.length} ${
          todayMeals.length === 1 ? "comida" : "comidas"
        }`;

  const ringData: RingDatum[] = [
    {
      key: "kcal",
      color: RING_COLORS.kcal,
      value: totals.kcal,
      goal: targets.kcal,
      r: 84,
      stroke: 10,
    },
    {
      key: "pro",
      color: RING_COLORS.pro,
      value: totals.p,
      goal: targets.pro,
      r: 72,
      stroke: 10,
    },
    {
      key: "car",
      color: RING_COLORS.car,
      value: totals.h,
      goal: targets.car,
      r: 60,
      stroke: 10,
    },
    {
      key: "fat",
      color: RING_COLORS.fat,
      value: totals.f,
      goal: targets.fat,
      r: 48,
      stroke: 10,
    },
  ];

  const onSettingsClick = () => router.push("/ajustes");

  return (
    <>
      <main
        className="min-h-screen flex flex-col"
        style={{ background: "#f5f5f5", paddingBottom: "120px" }}
      >
        <HomeHeader
          greeting={greeting}
          subtitle={subtitle}
          onSettingsClick={onSettingsClick}
        />

        <div
          className="flex-1 overflow-y-auto scrollbar-none flex flex-col"
          style={{
            padding: "0 24px 100px",
            gap: "30px",
          }}
        >
          {/* Tarjeta resumen (ring + leyenda) */}
          <div style={{ padding: "1rem 0.5rem" }}>
            <div
              className="flex items-center justify-between"
              style={{ gap: "20px" }}
            >
              <MacroRingChart
                data={ringData}
                centerValue={`${totals.kcal}`}
                centerSub={`/ ${targets.kcal} kcal`}
              />

              <div
                className="flex flex-col flex-1 anim-fade-up"
                style={{ animationDelay: "0.05s" }}
              >
                <MacroLegendRow
                  color={RING_COLORS.pro}
                  label="Proteínas"
                  value={totals.p}
                  unit="g"
                  pct={pct(totals.p, targets.pro)}
                  withBorder={false}
                />
                <MacroLegendRow
                  color={RING_COLORS.car}
                  label="Hidratos"
                  value={totals.h}
                  unit="g"
                  pct={pct(totals.h, targets.car)}
                  withBorder
                />
                <MacroLegendRow
                  color={RING_COLORS.fat}
                  label="Grasas"
                  value={totals.f}
                  unit="g"
                  pct={pct(totals.f, targets.fat)}
                  withBorder
                />
              </div>
            </div>
          </div>

          {/* Lista de comidas */}
          <div>
            <div
              className="flex justify-between items-center"
              style={{ marginBottom: "16px" }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#1a1a1a",
                }}
              >
                Comidas de hoy
              </div>
              {todayMeals.length > 3 && (
                <button
                  type="button"
                  onClick={() => setAllMealsOpen(true)}
                  aria-label="Ver todas las comidas de hoy"
                  className="btn-mockup bg-transparent border-0 cursor-pointer"
                  style={{
                    padding: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1e7b3d",
                  }}
                >
                  Ver todas
                </button>
              )}
            </div>

            {todayMeals.length === 0 ? (
              <EmptyMeals onScan={() => setScannerOpen(true)} />
            ) : (
              <div
                className="bg-white rounded-3xl"
                style={{
                  padding: "0 16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                  border: "1px solid #f0f0f0",
                }}
              >
                {todayMeals.slice(0, 4).map((m, i, arr) => (
                  <MealRow
                    key={m.id}
                    meal={mealRowFrom(m)}
                    isLast={i === arr.length - 1 && arr.length <= 4}
                    onClick={() => {
                      setActiveMeal(m);
                      setDetailOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sub-vistas (modales) */}
      <Scanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCaptured={(scan, mealType) => {
          setScannerOpen(false);
          setPendingScan({ scan, mealType });
          setScannedOpen(true);
        }}
      />
      <MealDetail
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setActiveMeal(null);
        }}
        meal={activeMeal}
        onEdit={() => {
          setDetailOpen(false);
          setScannedOpen(true);
        }}
      />
      <ScannedMealDetail
        open={scannedOpen}
        onClose={() => {
          setScannedOpen(false);
          setPendingScan(null);
          if (activeMeal) setActiveMeal(null);
        }}
        draft={pendingScan?.scan ?? null}
        meal={!pendingScan ? activeMeal : null}
        defaultMealType={pendingScan?.mealType ?? "lunch"}
      />
      <AllMeals
        open={allMealsOpen}
        onClose={() => setAllMealsOpen(false)}
      />
      <BottomNav />
    </>
  );
}

// ============================================================================
// Sub-componentes
// ============================================================================

interface MacroLegendRowProps {
  color: string;
  label: string;
  value: number;
  unit: string;
  pct: number;
  withBorder: boolean;
}

function MacroLegendRow({
  color,
  label,
  value,
  unit,
  pct,
  withBorder,
}: MacroLegendRowProps) {
  return (
    <div
      style={{
        padding: "9px 0",
        borderTop: withBorder ? "1px solid #f0f0f0" : "none",
      }}
    >
      <div
        className="flex items-center"
        style={{ gap: "7px", marginBottom: "3px" }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
          }}
        />
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#1a1a1a",
          }}
        >
          {label}
        </div>
      </div>
      <div
        className="flex items-baseline justify-between"
        style={{ paddingLeft: "15px" }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 800,
            color: "#1a1a1a",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}{" "}
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#a0a0a0" }}>
            {unit}
          </span>
        </div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#a0a0a0",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pct}%
        </div>
      </div>
    </div>
  );
}

function EmptyMeals({ onScan }: { onScan: () => void }) {
  return (
    <div
      className="bg-white rounded-3xl"
      style={{
        padding: "32px 20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        border: "1px solid #f0f0f0",
        textAlign: "center",
      }}
    >
      <div
        className="rounded-full flex items-center justify-center mx-auto"
        style={{
          width: "64px",
          height: "64px",
          background: "#f0f7f2",
          marginBottom: "14px",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1e7b3d"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </div>
      <div
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: "4px",
        }}
      >
        Tu primera comida te espera
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "#757575",
          marginBottom: "18px",
        }}
      >
        Escanea tu plato o regístralo manualmente
      </div>
      <button
        type="button"
        onClick={onScan}
        className="btn-mockup cursor-pointer border-0 rounded-2xl"
        style={{
          padding: "14px 24px",
          background: "#1e7b3d",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 700,
        }}
      >
        Escanear comida
      </button>
    </div>
  );
}

/** Convierte un StoredMeal al shape esperado por MealRow (mockup-friendly) */
function mealRowFrom(m: StoredMeal) {
  const title = m.items[0]?.name ?? "Comida";
  // primera imagen del item, o null
  // (los items seed no tienen foto por item — usamos la del meal si existe)
  const photo = m.photo_base64;
  const img =
    photo && photo.startsWith("data:image/")
      ? photo
      : photo ||
        "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=200&h=200&fit=crop";

  const time = new Date(m.created_at).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    id: m.id ?? 0,
    type: mealTypeLabel(m.meal),
    title,
    time,
    kcal: m.kcal,
    pro: m.p,
    car: m.h,
    fat: m.f,
    img,
  };
}

function mealTypeLabel(t: string): string {
  switch (t) {
    case "breakfast":
      return "Desayuno";
    case "lunch":
      return "Comida";
    case "dinner":
      return "Cena";
    case "snack":
      return "Merienda";
    default:
      return "Comida";
  }
}
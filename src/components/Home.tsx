// components/Home.tsx — pantalla principal: rings + leyenda + comidas + FAB + nav
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Beef,
  Camera,
  ChevronRight,
  Droplet,
  Flame,
  Utensils,
  Wheat,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { getCachedMeals, pendingScanCount, setCachedMeals } from "@/lib/db";
import { addDaysISO, fmtNum, formatSpanishLong, todayISO } from "@/lib/date";
import { fillRatio, pctText } from "@/lib/ring-math";
import type { DailyTotalsRow, Meal } from "@/types";
import RingChart, { type RingDatum } from "@/components/RingChart";
import MacroLegendRow from "@/components/MacroLegendRow";
import MealCard from "@/components/MealCard";
import FAB from "@/components/FAB";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import Sparkline from "@/components/Sparkline";
import ScanPlaceholderModal from "@/components/ScanPlaceholderModal";
import MealContextMenu from "@/components/MealContextMenu";
import ScanPendingBanner from "@/components/ScanPendingBanner";
import PrimaryButton from "@/components/PrimaryButton";

const RING_SIZE = 194;

/**
 * Meta en gramos de un macro a partir de kcal_goal + ratio (% de kcal del macro).
 * Proteínas e hidratos: 4 kcal/g. Grasas: 9 kcal/g.
 * Sin kcal_goal o sin ratio -> null (sin objetivo, anillo vacío).
 */
function macroGoalGrams(
  t: DailyTotalsRow | null,
  key: "p_ratio_goal" | "f_ratio_goal" | "h_ratio_goal"
): number | null {
  if (!t?.kcal_goal) return null;
  const ratio = t[key];
  if (!ratio || ratio <= 0) return null;
  const kcalPerGram = key === "f_ratio_goal" ? 9 : 4;
  return Math.round((t.kcal_goal * (ratio / 100)) / kcalPerGram);
}

export default function Home() {
  const [today, setToday] = useState(todayISO());
  const [weekStart, setWeekStart] = useState(() => addDaysISO(todayISO(), -6));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<DailyTotalsRow | null>(null);
  const [weekMeals, setWeekMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [menu, setMenu] = useState<{ meal: Meal; x: number; y: number } | null>(
    null
  );
  const [pending, setPending] = useState(0);

  const load = useCallback(async () => {
    const date = todayISO();
    const from = addDaysISO(date, -6);
    setToday(date);
    setWeekStart(from);
    setLoading(true);
    setError(null);
    try {
      const [dayMeals, dayTotals, range, pend] = await Promise.all([
        api.getMeals(date),
        api.getTotals(date),
        api.getMealRange(from, date),
        pendingScanCount(),
      ]);
      setMeals(dayMeals);
      setTotals(dayTotals);
      setWeekMeals(range);
      setPending(pend);
      // infraestructura offline-first: seed del cache (SW real en ticket #3)
      void setCachedMeals(date, dayMeals).catch(() => undefined);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setError(msg);
      // fallback a cache local si la red falla
      const cached = await getCachedMeals(date).catch(() => null);
      if (cached) setMeals(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const kcalGoal = totals?.kcal_goal ?? null;
  const pGoal = macroGoalGrams(totals, "p_ratio_goal");
  const hGoal = macroGoalGrams(totals, "h_ratio_goal");
  const fGoal = macroGoalGrams(totals, "f_ratio_goal");

  const kcal = totals?.kcal ?? 0;
  const p = totals?.p ?? 0;
  const h = totals?.h ?? 0;
  const f = totals?.f ?? 0;

  const ringData: RingDatum[] = [
    { key: "kcal", label: "Calorías", value: kcal, goal: kcalGoal, color: "#FF3B30", stroke: 18 },
    { key: "p", label: "Proteínas", value: p, goal: pGoal, color: "#1F7A3A", stroke: 16 },
    { key: "h", label: "Hidratos", value: h, goal: hGoal, color: "#0EA5E9", stroke: 14 },
    { key: "f", label: "Grasas", value: f, goal: fGoal, color: "#F59E0B", stroke: 12 },
  ];

  const legend = [
    { color: "#FF3B30", label: "Calorías", value: `${fmtNum(kcal)} kcal`, goal: kcalGoal, unit: "kcal", ratio: fillRatio(kcal, kcalGoal) },
    { color: "#1F7A3A", label: "Proteínas", value: `${fmtNum(p)} g`, goal: pGoal, unit: "g", ratio: fillRatio(p, pGoal) },
    { color: "#0EA5E9", label: "Hidratos", value: `${fmtNum(h)} g`, goal: hGoal, unit: "g", ratio: fillRatio(h, hGoal) },
    { color: "#F59E0B", label: "Grasas", value: `${fmtNum(f)} g`, goal: fGoal, unit: "g", ratio: fillRatio(f, fGoal) },
  ];

  /** Series de 7 días (hoy incluido) para los sparklines */
  const weekSeries = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
    const sums: Record<string, { kcal: number; p: number; f: number; h: number }> = {};
    for (const d of days) sums[d] = { kcal: 0, p: 0, f: 0, h: 0 };
    for (const m of weekMeals) {
      const s = sums[m.date];
      if (s) {
        s.kcal += m.kcal;
        s.p += m.p;
        s.f += m.f;
        s.h += m.h;
      }
    }
    return {
      kcal: days.map((d) => sums[d].kcal),
      p: days.map((d) => sums[d].p),
      f: days.map((d) => sums[d].f),
      h: days.map((d) => sums[d].h),
    };
  }, [weekMeals, weekStart]);

  const sparkRows = [
    { key: "kcal", label: "kcal", values: weekSeries.kcal, color: "#FF3B30", icon: Flame, today: `${fmtNum(weekSeries.kcal[6] ?? 0)}` },
    { key: "p", label: "Proteína", values: weekSeries.p, color: "#1F7A3A", icon: Beef, today: `${fmtNum(weekSeries.p[6] ?? 0)} g` },
    { key: "h", label: "Hidratos", values: weekSeries.h, color: "#0EA5E9", icon: Wheat, today: `${fmtNum(weekSeries.h[6] ?? 0)} g` },
    { key: "f", label: "Grasas", values: weekSeries.f, color: "#F59E0B", icon: Droplet, today: `${fmtNum(weekSeries.f[6] ?? 0)} g` },
  ];

  async function handleDelete() {
    if (!menu) return;
    const id = menu.meal.id;
    setMenu(null);
    try {
      await api.deleteMeal(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar la comida");
    }
  }

  const shown = meals.slice(0, 4);
  const hasMore = meals.length > 4;

  return (
    <main className="min-h-screen bg-system-bg pb-44 text-label">
      <header className="px-4 pt-6">
        <h1 className="text-large-title font-semibold text-label">Resumen</h1>
        <p className="mt-0.5 text-subhead text-label-secondary">
          {formatSpanishLong(today)}
        </p>
      </header>

      {error && (
        <div className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-md bg-[#FF3B30]/10 px-3 py-2 text-footnote text-[#FF3B30]">
          <span className="truncate">{error}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="shrink-0 font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Rings + leyenda (siempre renderizados: SSR muestra los 4 anillos) */}
      <section className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-4 px-4">
        <RingChart
          data={ringData}
          size={RING_SIZE}
          centerValue={fmtNum(kcal)}
          centerSub={kcalGoal ? `/ ${fmtNum(kcalGoal)} kcal` : "sin objetivo"}
        />
        <div className="flex min-w-[150px] flex-1 flex-col gap-3">
          {legend.map((r) => (
            <MacroLegendRow
              key={r.label}
              color={r.color}
              label={r.label}
              value={r.value}
              sub={
                r.goal
                  ? `/ ${fmtNum(r.goal)} ${r.unit} · ${pctText(r.ratio)}`
                  : "/ sin objetivo"
              }
            />
          ))}
        </div>
      </section>

      {/* Tendencia de la última semana */}
      <section className="mx-4 mt-6 rounded-lg bg-surface p-4 shadow-sm">
        <h2 className="text-title-3 font-semibold text-label">
          Última semana
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {sparkRows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.key} className="flex items-center gap-3">
                <Icon
                  className="h-4 w-4 shrink-0"
                  strokeWidth={2}
                  style={{ color: r.color }}
                />
                <span className="w-16 shrink-0 text-footnote text-label-secondary">
                  {r.label}
                </span>
                <Sparkline values={r.values} color={r.color} width={96} />
                <span className="ml-auto shrink-0 text-footnote font-semibold text-label">
                  {r.today}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comidas de hoy */}
      <section className="mt-6 px-4">
        <h2 className="text-title-2 font-semibold text-label">Hoy</h2>

        {pending > 0 && <ScanPendingBanner count={pending} />}

        {loading ? (
          <div className="mt-3 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[68px] animate-pulse rounded-lg bg-grouped-bg"
              />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon={Utensils}
              title="Hoy aún no hay comidas"
              subtitle="Escanea tu primera comida"
              action={
                <PrimaryButton
                  title="Escanear"
                  icon={Camera}
                  onPress={() => setScanOpen(true)}
                  className="max-w-[220px]"
                />
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-col gap-3">
              {shown.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onLongPress={(x, y) => setMenu({ meal, x, y })}
                />
              ))}
            </div>
            {hasMore && (
              <Link
                href="/historial"
                className="mt-3 flex items-center justify-center gap-1 py-2 text-footnote font-medium text-primary-dark"
              >
                Ver todas
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </>
        )}
      </section>

      <FAB onPress={() => setScanOpen(true)} />
      <BottomNav />
      <ScanPlaceholderModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
      />
      {menu && (
        <MealContextMenu
          meal={menu.meal}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onDelete={() => void handleDelete()}
        />
      )}
    </main>
  );
}
// components/history/HistoryScreen.tsx — tab "Diario" del mockup (reactivo al store)
"use client";

import { useMemo, useState } from "react";
import IconButton from "@/components/ui/IconButton";
import TabBar from "@/components/ui/TabBar";
import HistoryRow, { type HistoryEntryData } from "@/components/history/HistoryRow";
import HistoryDetail from "@/components/history/HistoryDetail";
import BottomNav from "@/components/nav/BottomNav";
import { useApp, selectDailySeries } from "@/lib/store";
import { HISTORY_TABS } from "@/data/onboarding";
import { addDaysISO, todayISO } from "@/lib/date";
import { fmtRelativeDay, fmtShortDate, ringDash } from "@/lib/meal-utils";
import type { HistoryScale } from "@/types";

const TABS = HISTORY_TABS.map((t) => ({ key: t.key as HistoryScale, label: t.label }));

export default function HistoryScreen() {
  const [scale, setScale] = useState<HistoryScale>("days");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDate, setDetailDate] = useState<string>(todayISO());

  const { meals, targets } = useApp();

  // Generar entradas según escala
  const entries = useMemo<HistoryEntryData[]>(() => {
    const today = todayISO();
    if (scale === "days") {
      // últimos 7 días (incluye hoy si hay datos)
      const from = addDaysISO(today, -6);
      const series = selectDailySeries(meals, 7, from);
      // si un día no tiene meals, lo saltamos (excepto hoy, que mostramos vacío)
      return series
        .map((d) => buildEntry(d, today, targets.kcal, targets.pro, targets.car, targets.fat))
        .reverse();
    }

    if (scale === "weeks") {
      // últimas 4 semanas (lun-dom)
      const groups = groupByWeek(meals, 4);
      return groups;
    }

    if (scale === "months") {
      // últimos 6 meses
      const groups = groupByMonth(meals, 6);
      return groups;
    }

    // years: últimos 3 años
    const groups = groupByYear(meals, 3);
    return groups;
  }, [meals, scale, targets]);

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
            className="flex justify-between items-start"
            style={{ marginBottom: "20px" }}
          >
            <div>
              <div
                style={{
                  fontSize: "34px",
                  fontWeight: 900,
                  color: "#1a1a1a",
                  letterSpacing: "-1px",
                  marginBottom: "2px",
                }}
              >
                Historial
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#757575",
                  fontWeight: 500,
                }}
              >
                Resumen de tus días
              </div>
            </div>
            <IconButton
              ariaLabel="Filtros avanzados"
              size={40}
              color="#1e7b3d"
              onClick={() => undefined}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </IconButton>
          </div>

          <TabBar
            tabs={TABS}
            active={scale}
            onChange={setScale}
            ariaLabel="Escala del historial"
          />
        </div>

        <div
          className="flex-1 overflow-y-auto scrollbar-none flex flex-col"
          style={{ padding: "0 24px 120px", gap: "12px" }}
        >
          {entries.length === 0 ? (
            <EmptyHistory scale={scale} />
          ) : (
            entries.map((entry, i) => (
              <HistoryRow
                key={`${entry.label}-${i}`}
                entry={entry}
                onClick={() => {
                  setDetailDate(entry.date);
                  setDetailOpen(true);
                }}
              />
            ))
          )}
        </div>
      </main>

      <HistoryDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        date={detailDate}
        scale={scale}
      />
      <BottomNav />
    </>
  );
}

// ============================================================================
// Builders
// ============================================================================

function buildEntry(
  day: { date: string; kcal: number; p: number; f: number; h: number; count: number },
  todayISO: string,
  goalKcal: number,
  goalPro: number,
  goalCar: number,
  goalFat: number
): HistoryEntryData {
  const pctCal = goalKcal ? Math.round((day.kcal / goalKcal) * 100) : 0;
  const pctPro = goalPro ? Math.round((day.p / goalPro) * 100) : 0;
  const pctCar = goalCar ? Math.round((day.h / goalCar) * 100) : 0;
  const pctFat = goalFat ? Math.round((day.f / goalFat) * 100) : 0;
  return {
    date: day.date,
    label: fmtRelativeDay(day.date, todayISO),
    shortDate: fmtShortDate(day.date),
    meals: day.count === 0 ? "Sin comidas" : `${day.count} ${day.count === 1 ? "comida" : "comidas"}`,
    kcal: Math.round(day.kcal),
    pro: Math.round(day.p),
    car: Math.round(day.h),
    fat: Math.round(day.f),
    pctCal,
    pctPro,
    pctCar,
    pctFat,
    ringCal: ringDash(36, pctCal),
    ringPro: ringDash(29, pctPro),
    ringCar: ringDash(22, pctCar),
    ringFat: ringDash(15, pctFat),
  };
}

interface DayLite {
  date: string;
  kcal: number;
  p: number;
  f: number;
  h: number;
  count: number;
}

function aggregateRange(
  meals: { date: string; kcal: number; p: number; f: number; h: number }[],
  from: string,
  to: string
): DayLite {
  return meals
    .filter((m) => m.date >= from && m.date <= to)
    .reduce<DayLite>(
      (acc, m) => ({
        date: from,
        kcal: acc.kcal + m.kcal,
        p: acc.p + m.p,
        f: acc.f + m.f,
        h: acc.h + m.h,
        count: acc.count + 1,
      }),
      { date: from, kcal: 0, p: 0, f: 0, h: 0, count: 0 }
    );
}

function groupByWeek(
  allMeals: { date: string; kcal: number; p: number; f: number; h: number }[],
  numWeeks: number
): HistoryEntryData[] {
  const today = todayISO();
  const entries: HistoryEntryData[] = [];
  for (let i = 0; i < numWeeks; i++) {
    const end = addDaysISO(today, -i * 7);
    const start = addDaysISO(end, -6);
    const agg = aggregateRange(allMeals, start, end);
    entries.push(
      buildEntry(agg, today, 2200 * 7, 140 * 7, 240 * 7, 70 * 7)
    );
    // override label con "Semana ..."
    entries[entries.length - 1].label = i === 0 ? "Esta semana" : `Hace ${i} sem`;
    entries[entries.length - 1].shortDate = `${fmtShortDate(start)} – ${fmtShortDate(end)}`;
  }
  return entries;
}

function groupByMonth(
  allMeals: { date: string; kcal: number; p: number; f: number; h: number }[],
  numMonths: number
): HistoryEntryData[] {
  const today = todayISO();
  const entries: HistoryEntryData[] = [];
  const now = new Date(today + "T00:00:00Z");
  for (let i = 0; i < numMonths; i++) {
    const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const next = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0));
    const start = ref.toISOString().slice(0, 10);
    const end = next.toISOString().slice(0, 10);
    const agg = aggregateRange(allMeals, start, end);
    const monthLabel = ref.toLocaleDateString("es-ES", { month: "long" });
    entries.push(buildEntry(agg, today, 2200 * 30, 140 * 30, 240 * 30, 70 * 30));
    const lastEntry = entries[entries.length - 1];
    lastEntry.label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    lastEntry.shortDate = `${fmtShortDate(start)} – ${fmtShortDate(end)}`;
  }
  return entries;
}

function groupByYear(
  allMeals: { date: string; kcal: number; p: number; f: number; h: number }[],
  numYears: number
): HistoryEntryData[] {
  const today = todayISO();
  const entries: HistoryEntryData[] = [];
  const now = new Date(today + "T00:00:00Z");
  for (let i = 0; i < numYears; i++) {
    const yr = now.getUTCFullYear() - i;
    const start = `${yr}-01-01`;
    const end = `${yr}-12-31`;
    const agg = aggregateRange(allMeals, start, end);
    entries.push(buildEntry(agg, today, 2200 * 365, 140 * 365, 240 * 365, 70 * 365));
    const lastEntry = entries[entries.length - 1];
    lastEntry.label = `${yr}`;
    lastEntry.shortDate = `01 ene – 31 dic`;
  }
  return entries;
}

function EmptyHistory({ scale }: { scale: HistoryScale }) {
  const labels: Record<HistoryScale, string> = {
    days: "Aún no hay días registrados",
    weeks: "Sin semanas con comidas",
    months: "Sin meses con comidas",
    years: "Sin años con comidas",
  };
  return (
    <div
      className="bg-white rounded-[20px]"
      style={{
        padding: "40px 20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
        border: "1px solid #f0f0f0",
        textAlign: "center",
      }}
    >
      <div
        className="rounded-full flex items-center justify-center mx-auto"
        style={{
          width: "56px",
          height: "56px",
          background: "#f0f7f2",
          marginBottom: "12px",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1e7b3d"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: "4px",
        }}
      >
        {labels[scale]}
      </div>
      <div style={{ fontSize: "12.5px", color: "#757575" }}>
        Empieza a registrar comidas y aparecerán aquí
      </div>
    </div>
  );
}
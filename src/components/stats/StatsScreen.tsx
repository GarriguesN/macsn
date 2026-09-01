// components/stats/StatsScreen.tsx — tab "Estadísticas" del mockup (reactivo al store)
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import IconButton from "@/components/ui/IconButton";
import TabBar from "@/components/ui/TabBar";
import MacroRingChart, { type RingDatum } from "@/components/charts/MacroRingChart";
import LineChart from "@/components/charts/LineChart";
import StackedBars from "@/components/charts/StackedBars";
import FoodDetail from "@/components/stats/FoodDetail";
import BottomNav from "@/components/nav/BottomNav";
import { useApp, selectDailySeries } from "@/lib/store";
import { STATS_RANGES } from "@/data/onboarding";
import { addDaysISO, todayISO } from "@/lib/date";
import type { HistoryScale, MacroUnit, StatsMetric, StatsRange } from "@/types";

const RANGE_TABS: { key: StatsRange; label: string }[] = STATS_RANGES.map(
  (r: { key: string; label: string }) => ({
    key: r.key as StatsRange,
    label: r.label,
  })
);

const RING_COLORS = {
  kcal: "#e81e3a",
  pro: "#28a745",
  car: "#2d9cdb",
  fat: "#f39c12",
} as const;

const METRIC_LABEL: Record<StatsMetric, string> = {
  kcal: "Calorías",
  p: "Proteínas",
  h: "Hidratos",
  f: "Grasas",
};

const METRIC_UNIT: Record<StatsMetric, "kcal" | "g"> = {
  kcal: "kcal",
  p: "g",
  h: "g",
  f: "g",
};

const X_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export default function StatsScreen() {
  const { meals, targets } = useApp();
  const [range, setRange] = useState<StatsRange>("week");
  const [metric, setMetric] = useState<StatsMetric>("kcal");
  const [unit, setUnit] = useState<MacroUnit>("g");
  const [foodOpen, setFoodOpen] = useState(false);
  const [foodIndex, setFoodIndex] = useState(0);

  // Determinar el rango en días y la fecha de inicio
  const { days, fromISO, subtitle } = useMemo(() => {
    const today = todayISO();
    if (range === "week") return { days: 7, fromISO: addDaysISO(today, -6), subtitle: "Últimos 7 días" };
    if (range === "month") return { days: 30, fromISO: addDaysISO(today, -29), subtitle: "Últimos 30 días" };
    if (range === "year") return { days: 365, fromISO: addDaysISO(today, -364), subtitle: "Último año" };
    return { days: 365, fromISO: addDaysISO(today, -364), subtitle: "Todo el historial" };
  }, [range]);

  // Serie diaria
  const series = useMemo(() => {
    if (range === "week") return selectDailySeries(meals, 7, fromISO);
    if (range === "month") return selectDailySeries(meals, 30, fromISO);
    if (range === "year") return selectDailySeries(meals, 365, fromISO);
    return selectDailySeries(meals, 365, fromISO);
  }, [meals, range, fromISO]);

  // KPIs
  const kpis = useMemo(() => {
    const totalsKcal = series.reduce((s, d) => s + d.kcal, 0);
    const totalsPro = series.reduce((s, d) => s + d.p, 0);
    const totalsCar = series.reduce((s, d) => s + d.h, 0);
    const totalsFat = series.reduce((s, d) => s + d.f, 0);
    const daysCount = series.filter((d) => d.kcal > 0).length || 1;
    const avgKcal = Math.round(totalsKcal / daysCount);
    const avgPro = Math.round(totalsPro / daysCount);
    const avgCar = Math.round(totalsCar / daysCount);
    const avgFat = Math.round(totalsFat / daysCount);
    const mealsCount = series.reduce((s, d) => s + d.count, 0);
    const daysHitGoal = series.filter(
      (d) => d.kcal >= (targets.kcal * 0.9) && d.kcal <= (targets.kcal * 1.1)
    ).length;
    return {
      totalKcal: totalsKcal,
      mealsCount,
      daysHitGoal,
      avgKcal,
      avgPro,
      avgCar,
      avgFat,
      pctPro: targets.pro ? Math.round((avgPro / targets.pro) * 100) : 0,
      pctCar: targets.car ? Math.round((avgCar / targets.car) * 100) : 0,
      pctFat: targets.fat ? Math.round((avgFat / targets.fat) * 100) : 0,
    };
  }, [series, targets]);

  // Datos para line chart (últimos 7 días, mapped a viewBox 0 0 300 120)
  const lineData = useMemo(() => {
    const last = series.slice(-7);
    const values = last.map((d) => metricValue(d, metric));
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const w = 280;
    const h = 100;
    const points = values.map((v, i) => {
      const x = values.length <= 1 ? 10 : 10 + (i / (values.length - 1)) * w;
      const y = h - 10 - ((v - min) / range) * (h - 20);
      return { cx: x + 10, cy: y + 10, value: v };
    });
    const polyPoints = points.map((p) => `${p.cx.toFixed(0)},${p.cy.toFixed(0)}`).join(" ");
    const linePoints = polyPoints;
    const polygon = `${polyPoints} ${(points[points.length - 1]?.cx ?? 0) + 10},${h + 10} 10,${h + 10}`;
    return {
      points,
      linePoints,
      polygon,
      yMax: Math.ceil(max * 1.1),
      goalY: metric === "kcal" ? h - 10 - ((targets.kcal - min) / range) * (h - 20) : null,
    };
  }, [series, metric, targets]);

  // Barras apiladas (últimos 7 días)
  const bars = useMemo(() => {
    const last = series.slice(-7);
    const today = todayISO();
    return last.map((d) => {
      const isToday = d.date === today;
      const sum = d.p + d.h + d.f || 1;
      return {
        proH: Math.round((d.p / sum) * 100),
        carH: Math.round((d.h / sum) * 100),
        fatH: Math.round((d.f / sum) * 100),
        date: d.date.slice(8, 10),
        isToday,
      };
    });
  }, [series]);

  // Alimentos frecuentes (top 5 por nombre)
  const frequentFoods = useMemo(() => {
    const counts = new Map<string, { count: number; kcal: number; img: string }>();
    for (const m of meals) {
      for (const it of m.items) {
        const existing = counts.get(it.name);
        if (existing) {
          existing.count += 1;
          existing.kcal += it.kcal;
        } else {
          counts.set(it.name, { count: 1, kcal: it.kcal, img: m.photo_base64 ?? "" });
        }
      }
    }
    return Array.from(counts.entries())
      .map(([name, v]) => ({ name, times: v.count, kcal: Math.round(v.kcal / v.count), img: v.img }))
      .sort((a, b) => b.times - a.times)
      .slice(0, 5);
  }, [meals]);

  const ringData: RingDatum[] = [
    {
      key: "kcal",
      color: RING_COLORS.kcal,
      value: kpis.avgKcal,
      goal: targets.kcal,
      r: 84,
      stroke: 10,
    },
    {
      key: "pro",
      color: RING_COLORS.pro,
      value: kpis.avgPro,
      goal: targets.pro,
      r: 72,
      stroke: 10,
    },
    {
      key: "car",
      color: RING_COLORS.car,
      value: kpis.avgCar,
      goal: targets.car,
      r: 60,
      stroke: 10,
    },
    {
      key: "fat",
      color: RING_COLORS.fat,
      value: kpis.avgFat,
      goal: targets.fat,
      r: 48,
      stroke: 10,
    },
  ];

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
                Estadísticas
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#757575",
                  fontWeight: 500,
                }}
              >
                Analiza tu progreso
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
            tabs={RANGE_TABS}
            active={range}
            onChange={(k) => setRange(k as StatsRange)}
            ariaLabel="Rango de estadísticas"
          />
        </div>

        <div
          className="flex-1 overflow-y-auto scrollbar-none flex flex-col"
          style={{ padding: "0 24px 120px", gap: "16px" }}
        >
          {/* TARJETA 1: Resumen general */}
          <div
            className="bg-white rounded-3xl"
            style={{
              padding: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
              border: "1px solid #f0f0f0",
            }}
          >
            <div
              className="flex justify-between items-center"
              style={{ marginBottom: "24px" }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#1a1a1a",
                }}
              >
                Resumen general
              </div>
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "#1e7b3d",
                }}
              >
                {subtitle}
              </div>
            </div>

            <div
              className="flex items-center justify-between"
              style={{ gap: "20px" }}
            >
              <MacroRingChart
                data={ringData}
                centerValue={fmtKcal(kpis.avgKcal)}
                centerSub="promedio"
              />

              <div
                className="flex flex-col flex-1 anim-fade-up"
                style={{ animationDelay: "0.05s" }}
              >
                <MacroLegendRow
                  color={RING_COLORS.pro}
                  label="Proteínas"
                  value={kpis.avgPro}
                  pct={kpis.pctPro}
                  withBorder={false}
                />
                <MacroLegendRow
                  color={RING_COLORS.car}
                  label="Hidratos"
                  value={kpis.avgCar}
                  pct={kpis.pctCar}
                  withBorder
                />
                <MacroLegendRow
                  color={RING_COLORS.fat}
                  label="Grasas"
                  value={kpis.avgFat}
                  pct={kpis.pctFat}
                  withBorder
                />
              </div>
            </div>

            <div
              style={{
                height: "1px",
                background: "#f0f0f0",
                width: "100%",
                margin: "20px 0",
              }}
            />

            <div
              className="grid grid-cols-2"
              style={{ gap: "16px" }}
            >
              <Kpi
                icon={
                  <path d="M12 2c0 0-5 6.5-5 11a5 5 0 0 0 10 0c0-4.5-5-11-5-11z" />
                }
                color="#28a745"
                value={fmtKcal(kpis.totalKcal)}
                label="Total consumido"
              />
              <Kpi
                icon={
                  <>
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                    <path d="M7 2v20" />
                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                  </>
                }
                color="#28a745"
                value={`${kpis.mealsCount}`}
                label="Comidas registradas"
              />
              <Kpi
                icon={
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </>
                }
                color="#28a745"
                value={`${kpis.daysHitGoal}/${series.length}`}
                label="Objetivo cumplido"
              />
              <Kpi
                icon={
                  <>
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </>
                }
                color="#28a745"
                value="— kg"
                label="Peso estimado"
              />
            </div>
          </div>

          {/* TARJETA 2: Line chart */}
          {lineData.points.length > 0 && (
            <div
              className="bg-white rounded-3xl"
              style={{
                padding: "24px 20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                border: "1px solid #f0f0f0",
              }}
            >
              <div
                className="flex justify-between items-start"
                style={{ marginBottom: "24px" }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "14.5px",
                      fontWeight: 800,
                      color: "#1a1a1a",
                      marginBottom: "6px",
                    }}
                  >
                    {METRIC_LABEL[metric]}
                  </div>
                  <div className="flex items-baseline" style={{ gap: "4px" }}>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: 900,
                        color: "#1a1a1a",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      {fmtMetric(metricValue(series[series.length - 1] ?? { date: "", kcal: 0, p: 0, h: 0, f: 0, count: 0 }, metric), metric)}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#a0a0a0",
                      }}
                    >
                      {METRIC_UNIT[metric]}/{range === "week" ? "día" : "media"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end" style={{ gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const order: StatsMetric[] = ["kcal", "p", "h", "f"];
                      const i = order.indexOf(metric);
                      setMetric(order[(i + 1) % order.length]);
                    }}
                    aria-label={`Cambiar métrica: ${METRIC_LABEL[metric]}`}
                    className="btn-mockup cursor-pointer bg-white"
                    style={{
                      border: "1px solid #e0e0e0",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {METRIC_LABEL[metric]}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </div>

              <LineChart
                linePoints={lineData.linePoints}
                polyPoints={lineData.polygon}
                chartPoints={lineData.points.map((p) => ({
                  cx: p.cx,
                  cy: p.cy,
                }))}
                yMax={lineData.yMax}
                goalY={lineData.goalY}
                goalLabel="Objetivo"
                xLabels={X_LABELS}
                fmtY={(n) => fmtMetric(n, metric)}
              />

              <div
                className="flex justify-center"
                style={{ gap: "20px", fontSize: "10px", fontWeight: 600, color: "#757575" }}
              >
                <div className="flex items-center" style={{ gap: "6px" }}>
                  <div style={{ width: "16px", height: "2px", background: "#e81e3a" }} />
                  Consumido
                </div>
                {lineData.goalY !== null && (
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    <div
                      style={{
                        width: "16px",
                        height: 0,
                        borderTop: "1.5px dashed #a0a0a0",
                      }}
                    />
                    Objetivo
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TARJETA 3: Barras apiladas */}
          {bars.length > 0 && bars.some((b) => b.proH + b.carH + b.fatH > 0) && (
            <div
              className="bg-white rounded-3xl"
              style={{
                padding: "24px 20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                border: "1px solid #f0f0f0",
              }}
            >
              <div
                className="flex justify-between items-start"
                style={{ marginBottom: "24px" }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "14.5px",
                      fontWeight: 800,
                      color: "#1a1a1a",
                      marginBottom: "2px",
                    }}
                  >
                    Distribución de macros
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "#a0a0a0",
                    }}
                  >
                    Promedio de {subtitle.toLowerCase()}
                  </div>
                </div>
                <div
                  className="flex rounded-md"
                  style={{ background: "#f5f5f5", padding: "2px" }}
                >
                  {(["g", "%"] as const).map((u) => {
                    const active = unit === u;
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        aria-label={`Unidad: ${u}`}
                        className="btn-mockup cursor-pointer border-0 rounded-[4px]"
                        style={{
                          padding: "4px 10px",
                          background: active ? "#ffffff" : "transparent",
                          fontSize: "10px",
                          fontWeight: active ? 700 : 500,
                          color: active ? "#1a1a1a" : "#757575",
                          boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                        }}
                      >
                        {u}
                      </button>
                    );
                  })}
                </div>
              </div>

              <StackedBars bars={bars} />

              <div
                className="flex justify-center"
                style={{ gap: "16px", fontSize: "10.5px", fontWeight: 700, color: "#1a1a1a" }}
              >
                <Legend color="#28a745" label="Proteínas" />
                <Legend color="#2d9cdb" label="Hidratos" />
                <Legend color="#f39c12" label="Grasas" />
              </div>
            </div>
          )}

          {/* TARJETA 4: Alimentos frecuentes */}
          {frequentFoods.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div
                className="flex justify-between items-center"
                style={{ marginBottom: "12px" }}
              >
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "#1a1a1a",
                    paddingLeft: "4px",
                  }}
                >
                  Alimentos más frecuentes
                </div>
                <button
                  type="button"
                  onClick={() => undefined}
                  aria-label="Ver todos los alimentos frecuentes"
                  className="btn-mockup bg-transparent border-0 cursor-pointer"
                  style={{
                    padding: 0,
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1e7b3d",
                  }}
                >
                  Ver todos
                </button>
              </div>

              <div className="carousel-snap">
                {frequentFoods.map((f, i) => (
                  <button
                    key={`${f.name}-${i}`}
                    type="button"
                    onClick={() => {
                      setFoodIndex(i);
                      setFoodOpen(true);
                    }}
                    aria-label={`Ver detalle de ${f.name}`}
                    className="btn-mockup bg-white rounded-2xl cursor-pointer border-0 text-left"
                    style={{
                      minWidth: "150px",
                      padding: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                      border: "1px solid #f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      scrollSnapAlign: "start",
                      font: "inherit",
                      color: "inherit",
                    }}
                  >
                    <div
                      className="shrink-0 overflow-hidden"
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: "#e0e0e0",
                      }}
                    >
                      {f.img && f.img.startsWith("data:image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.img}
                          alt={f.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Image
                          src={f.img || "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=100&h=100&fit=crop"}
                          alt={f.name}
                          width={44}
                          height={44}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#1a1a1a",
                          marginBottom: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "80px",
                        }}
                      >
                        {f.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#757575",
                          fontWeight: 500,
                        }}
                      >
                        {f.times} {f.times === 1 ? "vez" : "veces"}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#1a1a1a",
                          marginTop: "2px",
                        }}
                      >
                        {f.kcal}{" "}
                        <span style={{ fontWeight: 600, color: "#a0a0a0" }}>
                          kcal
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <FoodDetail
        open={foodOpen}
        onClose={() => setFoodOpen(false)}
        food={frequentFoods[foodIndex]}
      />
      <BottomNav />
    </>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function fmtKcal(n: number) {
  return Math.round(n).toLocaleString("es-ES");
}

function metricValue(
  d: { kcal: number; p: number; h: number; f: number },
  m: StatsMetric
): number {
  return d[m];
}

function fmtMetric(v: number, m: StatsMetric): string {
  return Math.round(v).toString();
}

interface MacroLegendRowProps {
  color: string;
  label: string;
  value: number;
  pct: number;
  withBorder: boolean;
}

function MacroLegendRow({ color, label, value, pct, withBorder }: MacroLegendRowProps) {
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
            g
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center" style={{ gap: "6px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: color,
        }}
      />
      {label}
    </div>
  );
}

interface KpiProps {
  icon: React.ReactNode;
  color: string;
  value: string;
  label: string;
}

function Kpi({ icon, color, value, label }: KpiProps) {
  return (
    <div className="flex flex-col">
      <div
        className="flex items-center"
        style={{ gap: "6px", marginBottom: "4px" }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
        <div
          style={{
            fontSize: "13.5px",
            fontWeight: 800,
            color: "#1a1a1a",
          }}
        >
          {value}
        </div>
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "#757575",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}
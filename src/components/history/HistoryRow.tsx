// components/history/HistoryRow.tsx — fila del historial (mockup)
"use client";

import HistoryRingChart from "@/components/charts/HistoryRingChart";

export interface HistoryEntryData {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Etiqueta principal: "Hoy", "Ayer", "Lun 13", "Hace 1 sem", etc. */
  label: string;
  /** Fecha completa legible: "15 may" o "13 may – 19 may" */
  shortDate: string;
  /** "4 comidas" o "Sin comidas" */
  meals: string;
  kcal: number;
  pro: number;
  car: number;
  fat: number;
  pctCal: number;
  pctPro: number;
  pctCar: number;
  pctFat: number;
  ringCal: string;
  ringPro: string;
  ringCar: string;
  ringFat: string;
}

interface HistoryRowProps {
  entry: HistoryEntryData;
  onClick?: () => void;
}

const RING_COLORS = {
  kcal: "#e81e3a",
  pro: "#28a745",
  car: "#2d9cdb",
  fat: "#f39c12",
} as const;

const RING_RADII = { kcal: 36, pro: 29, car: 22, fat: 15 } as const;

/**
 * Réplica exacta del mockup: card 1fr (fecha) + 80x80 ring + leyenda condensada + chevron.
 */
export default function HistoryRow({ entry, onClick }: HistoryRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalle del ${entry.label}`}
      className="btn-mockup bg-white rounded-[20px] cursor-pointer w-full text-left border-0"
      style={{
        padding: "16px",
        border: "1px solid #f0f0f0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        font: "inherit",
        color: "inherit",
      }}
    >
      {/* Columna 1: fecha */}
      <div style={{ width: "90px", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: entry.label === "Hoy" ? "#1e7b3d" : "#1a1a1a",
            marginBottom: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {entry.label}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#757575",
            fontWeight: 500,
            marginBottom: "6px",
          }}
        >
          {entry.shortDate}
        </div>
        <div style={{ fontSize: "11px", color: "#a0a0a0", fontWeight: 600 }}>
          {entry.meals}
        </div>
      </div>

      {/* Columna 2: mini-ring */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: "80px", height: "80px" }}
      >
        <HistoryRingChart
          data={[
            { key: "kcal", color: RING_COLORS.kcal, pct: entry.pctCal, r: RING_RADII.kcal },
            { key: "pro", color: RING_COLORS.pro, pct: entry.pctPro, r: RING_RADII.pro },
            { key: "car", color: RING_COLORS.car, pct: entry.pctCar, r: RING_RADII.car },
            { key: "fat", color: RING_COLORS.fat, pct: entry.pctFat, r: RING_RADII.fat },
          ]}
        />
      </div>

      {/* Columna 3: leyenda condensada */}
      <div
        className="flex flex-col items-end"
        style={{ flex: 1, gap: "5px", paddingLeft: "10px" }}
      >
        <LegendLine color={RING_COLORS.kcal} value={entry.kcal} unit="kcal" pct={entry.pctCal} />
        <LegendLine color={RING_COLORS.pro} value={entry.pro} unit="P" pct={entry.pctPro} />
        <LegendLine color={RING_COLORS.car} value={entry.car} unit="H" pct={entry.pctCar} />
        <LegendLine color={RING_COLORS.fat} value={entry.fat} unit="G" pct={entry.pctFat} />
      </div>

      {/* Columna 4: chevron */}
      <div style={{ marginLeft: "8px" }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d0d0d0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}

interface LegendLineProps {
  color: string;
  value: number;
  unit: string;
  pct: number;
}

function LegendLine({ color, value, unit, pct }: LegendLineProps) {
  return (
    <div
      className="flex items-end"
      style={{ fontSize: "10px", gap: "5px" }}
    >
      <div className="flex items-center" style={{ gap: "4px" }}>
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontWeight: 800,
            color: "#1a1a1a",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: "9px", fontWeight: 600, color: "#a0a0a0" }}>
          {unit}
        </div>
      </div>
      <div
        style={{
          fontWeight: 800,
          color,
          fontVariantNumeric: "tabular-nums",
          width: "26px",
          textAlign: "right",
        }}
      >
        {pct}%
      </div>
    </div>
  );
}
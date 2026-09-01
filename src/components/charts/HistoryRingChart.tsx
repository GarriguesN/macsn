// components/charts/HistoryRingChart.tsx — mini 4-anillos para filas de historial
"use client";

import { motion } from "framer-motion";

export interface MiniRingDatum {
  key: "kcal" | "pro" | "car" | "fat";
  color: string;
  /** Porcentaje 0-100 */
  pct: number;
  r: number;
}

interface HistoryRingChartProps {
  data: MiniRingDatum[];
}

const TRACK = "#f5f5f5";

/**
 * Mini-ring de 80x80 viewBox con r=36/29/22/15 (grosor 5).
 * Mantiene los stroke-dasharray que vienen del mockup para el progreso.
 */
export default function HistoryRingChart({ data }: HistoryRingChartProps) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      style={{ transform: "rotate(-90deg)" }}
      aria-hidden="true"
    >
      {data.map((d) => {
        const C = 2 * Math.PI * d.r;
        const filled = Math.min(d.pct, 100) / 100;
        return (
          <g key={d.key}>
            <circle
              cx="40"
              cy="40"
              r={d.r}
              fill="none"
              stroke={TRACK}
              strokeWidth={5}
            />
            <motion.circle
              cx="40"
              cy="40"
              r={d.r}
              fill="none"
              stroke={d.color}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${C * filled} ${C - C * filled}`}
              initial={{ strokeDasharray: `0 ${C}` }}
              animate={{
                strokeDasharray: `${C * filled} ${C - C * filled}`,
              }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </g>
        );
      })}
    </svg>
  );
}
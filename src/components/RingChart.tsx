// components/RingChart.tsx — 4 anillos concéntricos estilo Apple Fitness
"use client";

import { motion } from "framer-motion";
import { fillRatio } from "@/lib/ring-math";

export interface RingDatum {
  key: string;
  label: string;
  value: number;
  /** null = sin objetivo -> anillo vacío (nunca divide por cero) */
  goal: number | null;
  color: string;
  /** grosor del anillo (kcal 18 > P 16 > H 14 > G 12) */
  stroke: number;
}

interface RingChartProps {
  /** De dentro hacia fuera: kcal (18) -> P (16) -> H (14) -> G (12) */
  data: RingDatum[];
  size?: number;
  centerValue: string;
  centerSub: string;
}

const TRACK_COLOR = "#F2F2EE";

export default function RingChart({
  data,
  size = 194,
  centerValue,
  centerSub,
}: RingChartProps) {
  const c = size / 2;
  const outerR = c - 14;
  // Dibujar de fuera a dentro: primero el más fino (G, 12), último el grueso (kcal, 18)
  const rings = [...data].sort((a, b) => a.stroke - b.stroke);
  // Auto-fit del número central según longitud ("1.650" vs "12.345")
  const centerFontSize = Math.min(
    34,
    Math.max(20, Math.floor((size * 0.78) / Math.max(centerValue.length, 2)))
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label={`${centerValue} kcal consumidas`}
    >
      {rings.map((d, i) => {
        const r = outerR - i * 8;
        const C = 2 * Math.PI * r;
        const ratio = fillRatio(d.value, d.goal);
        return (
          <g key={d.key}>
            {/* pista: círculo completo gris (potencial 100%) */}
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={TRACK_COLOR}
              strokeWidth={d.stroke}
            />
            {/* progreso: desde las 12 en punto, sentido horario */}
            <motion.circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={d.stroke}
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - ratio) }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 22,
                duration: 0.9,
              }}
              transform={`rotate(-90 ${c} ${c})`}
            />
          </g>
        );
      })}
      <text
        x={c}
        y={c - 4}
        textAnchor="middle"
        fill="#1A1A1A"
        fontWeight={700}
        fontSize={centerFontSize}
      >
        {centerValue}
      </text>
      <text
        x={c}
        y={c + 20}
        textAnchor="middle"
        fill="#6B6B6B"
        fontSize={13}
      >
        {centerSub}
      </text>
    </svg>
  );
}
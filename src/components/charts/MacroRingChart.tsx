// components/charts/MacroRingChart.tsx — 4 anillos concéntricos del mockup (Home/Stats)
"use client";

import { motion } from "framer-motion";

export interface RingDatum {
  key: "kcal" | "pro" | "car" | "fat";
  color: string;
  /** Valor actual */
  value: number;
  /** Valor objetivo (null = sin meta) */
  goal: number | null;
  /** Radio del anillo */
  r: number;
  /** Grosor del trazo */
  stroke: number;
}

interface MacroRingChartProps {
  /** kcal/pro/car/fat en ese orden. El mockup los pinta de fuera a dentro. */
  data: RingDatum[];
  /** Tamaño total del SVG (px). Default 180. */
  size?: number;
  /** Valor central (texto grande) */
  centerValue: string;
  /** Sub-texto central ("/ 2200 kcal") */
  centerSub: string;
}

/**
 * Réplica 1:1 del SVG del mockup:
 * - viewBox 0 0 180 180, transform rotate(-90deg) para que empiece a las 12
 * - 4 anillos a r=84/72/60/48 con stroke=10
 * - cada anillo tiene "track" al 30/40% opacity + progreso coloreado
 * - en centro: <div> posicionado absolutamente (no <text>)
 */
export default function MacroRingChart({
  data,
  size = 180,
  centerValue,
  centerSub,
}: MacroRingChartProps) {
  // Calcula stroke-dasharray para el progreso
  const calcDash = (r: number, ratio: number) => {
    const C = 2 * Math.PI * r;
    const filled = Math.min(Math.max(ratio, 0), 1) * C;
    return `${filled} ${C - filled}`;
  };

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: "160px", height: "160px" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 180 180"
        style={{
          transform: "rotate(-90deg)",
          position: "absolute",
          left: "-10px",
          top: "-10px",
          overflow: "visible",
        }}
        aria-hidden="true"
      >
        {data.map((d, i) => {
          const ratio = d.goal ? d.value / d.goal : 0;
          return (
            <g key={d.key}>
              {/* track (fondo del anillo con opacidad 30%) */}
              <circle
                cx="90"
                cy="90"
                r={d.r}
                fill="none"
                stroke={d.color}
                strokeWidth={d.stroke}
                opacity="0.3"
              />
              {/* progreso */}
              <motion.circle
                cx="90"
                cy="90"
                r={d.r}
                fill="none"
                stroke={d.color}
                strokeWidth={d.stroke}
                strokeLinecap="round"
                strokeDasharray={calcDash(d.r, ratio)}
                initial={{ strokeDasharray: `0 ${2 * Math.PI * d.r}` }}
                animate={{
                  strokeDasharray: calcDash(d.r, ratio),
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </g>
          );
        })}
      </svg>

      {/* Texto central (no es <text> del SVG, igual que el mockup) */}
      <div
        className="text-center relative z-10"
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            fontSize: "28px",
            fontWeight: 900,
            color: "#1a1a1a",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          {centerValue}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#a0a0a0",
            fontWeight: 700,
            marginTop: "4px",
          }}
        >
          {centerSub}
        </div>
      </div>
    </div>
  );
}
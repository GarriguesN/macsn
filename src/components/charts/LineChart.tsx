// components/charts/LineChart.tsx — gráfico de líneas + área (Stats)
"use client";

interface LineChartProps {
  /** Polyline "x1,y1 x2,y2 ..." para la línea */
  linePoints: string;
  /** Polygon points para el área rellena */
  polyPoints: string;
  /** Puntos a dibujar como <circle> sobre la línea */
  chartPoints: { cx: number; cy: number }[];
  /** Y max (para escalar las etiquetas del eje Y) */
  yMax: number;
  /** Y en px donde dibujar la línea de objetivo (null = no mostrar) */
  goalY?: number | null;
  /** Etiqueta del goal (e.g. "Objetivo") */
  goalLabel?: string;
  /** Etiquetas del eje X (7 strings) */
  xLabels: string[];
  /** Color de la línea (default #e81e3a) */
  color?: string;
  /** Formateador del eje Y */
  fmtY: (v: number) => string;
}

/**
 * Réplica exacta del SVG del mockup:
 * - viewBox 0 0 300 120
 * - preserveAspectRatio="none"
 * - gradient lineal para el fill del área
 * - eje Y a la izquierda (5 valores: max, 75%, 50%, 25%, 0)
 * - líneas guía horizontales dashed
 * - línea de objetivo dashed gris
 */
export default function LineChart({
  linePoints,
  polyPoints,
  chartPoints,
  yMax,
  goalY = null,
  goalLabel = "Objetivo",
  xLabels,
  color = "#e81e3a",
  fmtY,
}: LineChartProps) {
  return (
    <div
      className="relative w-full"
      style={{ height: "160px", marginBottom: "12px" }}
    >
      {/* Eje Y (etiquetas) */}
      <div
        className="absolute left-0 top-0 bottom-5 flex flex-col justify-between"
        style={{ fontSize: "9px", color: "#a0a0a0", fontWeight: 600 }}
      >
        <span>{fmtY(yMax)}</span>
        <span>{fmtY(Math.round(yMax * 0.75))}</span>
        <span>{fmtY(Math.round(yMax * 0.5))}</span>
        <span>{fmtY(Math.round(yMax * 0.25))}</span>
        <span>0</span>
      </div>

      {/* Líneas guía horizontales */}
      <div
        className="absolute flex flex-col justify-between"
        style={{ left: "30px", right: 0, top: 0, bottom: "20px" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "100%",
              height: "1px",
              borderTop: "1px dashed #e0e0e0",
            }}
          />
        ))}
        <div style={{ width: "100%", height: "1px", background: "#e0e0e0" }} />
      </div>

      {/* Línea de objetivo */}
      {goalY !== null && (
        <div
          className="absolute"
          style={{
            left: "30px",
            right: 0,
            top: `${goalY}px`,
            width: "calc(100% - 30px)",
            height: 0,
            borderTop: "1.5px dashed #a0a0a0",
          }}
        />
      )}

      {/* SVG: polígono + línea + puntos */}
      <svg
        viewBox="0 0 300 120"
        preserveAspectRatio="none"
        className="absolute"
        style={{
          left: "30px",
          right: 0,
          top: 0,
          width: "calc(100% - 30px)",
          height: "140px",
          overflow: "visible",
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={polyPoints} fill="url(#lineGrad)" />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {chartPoints.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={3} fill={color} />
        ))}
      </svg>

      {/* Eje X */}
      <div
        className="absolute flex justify-between"
        style={{
          left: "30px",
          right: 0,
          bottom: 0,
          fontSize: "9.5px",
          color: "#757575",
          fontWeight: 600,
        }}
      >
        {xLabels.map((xl, i) => (
          <span key={i}>{xl}</span>
        ))}
      </div>
    </div>
  );
}
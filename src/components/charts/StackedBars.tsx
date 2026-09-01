// components/charts/StackedBars.tsx — barras apiladas de macros (Stats)
"use client";

interface StackedBarsProps {
  bars: {
    proH: number; // % alto del tramo proteína
    carH: number; // % alto del tramo hidratos
    fatH: number; // % alto del tramo grasas
    date: string;
    isToday?: boolean;
  }[];
}

/**
 * Réplica exacta del mockup:
 * - 7 barras de 26px de ancho, espaciadas uniformemente
 * - cada barra con 3 tramos verticales (P/C/F) en verde/azul/naranja
 * - línea horizontal dashed al 25% (objetivo)
 * - texto de fecha debajo
 */
export default function StackedBars({ bars }: StackedBarsProps) {
  return (
    <div
      className="relative flex justify-between items-end"
      style={{
        height: "140px",
        paddingBottom: "20px",
        borderBottom: "1px solid #f0f0f0",
        marginBottom: "12px",
      }}
    >
      {/* Línea objetivo al 25% */}
      <div
        className="absolute"
        style={{
          top: "25%",
          width: "100%",
          height: 0,
          borderTop: "1px dashed #e0e0e0",
        }}
      />

      {bars.map((b, i) => (
        <div
          key={i}
          className="flex flex-col items-center"
          style={{ width: "26px", height: "100%" }}
        >
          <div
            className="flex flex-col justify-end w-full"
            style={{
              flex: 1,
              gap: "2px",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "100%",
                height: `${b.proH}%`,
                background: "#28a745",
                borderRadius: "4px 4px 0 0",
              }}
            />
            <div
              style={{
                width: "100%",
                height: `${b.carH}%`,
                background: "#2d9cdb",
              }}
            />
            <div
              style={{
                width: "100%",
                height: `${b.fatH}%`,
                background: "#f39c12",
                borderRadius: "0 0 4px 4px",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: b.isToday ? 800 : 500,
              color: b.isToday ? "#1a1a1a" : "#757575",
              marginTop: "8px",
            }}
          >
            {b.date}
          </div>
        </div>
      ))}
    </div>
  );
}
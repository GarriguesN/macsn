// components/ui/ProgressDots.tsx — barra de progreso del wizard (4 segmentos)
interface ProgressDotsProps {
  total: number;
  current: number; // 0-based (0 = primer paso)
}

/**
 * 4 segmentos: verde activo (#1e7b3d) / gris pendiente (#e0e0e0)
 * 4px alto, 6px gap, border-radius 2px, flex-1 cada uno.
 */
export default function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div style={{ display: "flex", gap: "6px" }} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "4px",
            background: i <= current ? "#1e7b3d" : "#e0e0e0",
            borderRadius: "2px",
          }}
        />
      ))}
    </div>
  );
}
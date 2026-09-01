// components/shared/ScreenHeader.tsx — navbar reutilizable de sub-vistas
"use client";

interface ScreenHeaderProps {
  /** Botón izquierda: si se omite, se reserva un espacio de 24px */
  left?: React.ReactNode;
  /** Título central (opcional) */
  title?: string;
  /** Botón derecha: si se omite, se reserva un espacio de 24px */
  right?: React.ReactNode;
  /** Color de fondo (default #fafafa) */
  background?: string;
}

/**
 * Header de las sub-vistas del mockup: padding 50px 24px 16px, flex row,
 * fondo igual al body. Slots simétricos para mantener el título centrado.
 */
export default function ScreenHeader({
  left,
  title,
  right,
  background = "#fafafa",
}: ScreenHeaderProps) {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        padding: "50px 24px 16px",
        background,
      }}
    >
      <div className="shrink-0">{left ?? <div style={{ width: 24 }} />}</div>
      {title && (
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#1a1a1a",
          }}
        >
          {title}
        </div>
      )}
      <div className="shrink-0">{right ?? <div style={{ width: 24 }} />}</div>
    </div>
  );
}
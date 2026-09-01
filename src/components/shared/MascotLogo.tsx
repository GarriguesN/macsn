// components/shared/MascotLogo.tsx — logo "M." del onboarding
interface MascotLogoProps {
  /** Tamaño del cuadrado (default 72px) */
  size?: number;
  /** Mostrar el wordmark "Macsn" debajo */
  withWordmark?: boolean;
}

/**
 * Logo 1:1 del mockup:
 * - cuadrado blanco 72x72 con shadow y rounded-[20px]
 * - "M" en #0f5b2d + "." verde claro #28a745
 * - wordmark "Macsn" debajo en #0f5b2d, 24px bold
 */
export default function MascotLogo({
  size = 72,
  withWordmark = false,
}: MascotLogoProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="flex items-center justify-center bg-white"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "20px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: `${size * 0.58}px`,
            fontWeight: 900,
            color: "#0f5b2d",
            letterSpacing: "-2px",
            display: "flex",
            alignItems: "baseline",
          }}
        >
          M
          <span
            style={{
              color: "#28a745",
              fontSize: `${size * 0.52}px`,
              lineHeight: 0.5,
              marginLeft: "2px",
            }}
          >
            .
          </span>
        </div>
      </div>
      {withWordmark && (
        <div
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#0f5b2d",
          }}
        >
          Macsn
        </div>
      )}
    </div>
  );
}
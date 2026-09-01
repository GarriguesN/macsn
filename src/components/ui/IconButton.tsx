// components/ui/IconButton.tsx — botones redondos del mockup (settings, cerrar, etc.)
"use client";

interface IconButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  /** Estilo del mockup: 40x40 redondo blanco con borde */
  size?: 32 | 36 | 40 | 44 | 48 | 56;
  ariaLabel: string;
  /** Color del icono (por defecto #1a1a1a) */
  color?: string;
  /** Variante: "white" (default), "outline", "ghost", "ghostGreen", "circle" */
  variant?: "white" | "outline" | "ghost" | "ghostGreen" | "circle";
  /** Transform extra, e.g. "translateY(-4px)" para el FAB central del nav */
  style?: React.CSSProperties;
}

export default function IconButton({
  children,
  onClick,
  size = 40,
  ariaLabel,
  color = "#1a1a1a",
  variant = "white",
  style,
}: IconButtonProps) {
  const sizeClass = `w-[${size}px] h-[${size}px]`;

  const variantStyle: React.CSSProperties = (() => {
    switch (variant) {
      case "white":
        return {
          background: "#ffffff",
          border: "1px solid #f0f0f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        };
      case "outline":
        return {
          background: "#ffffff",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        };
      case "ghost":
        return {
          background: "transparent",
          border: "none",
          color,
        };
      case "ghostGreen":
        return {
          background: "transparent",
          border: "none",
          color: "#1e7b3d",
        };
      case "circle":
        return {
          background: "#ffffff",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        };
      default:
        return {};
    }
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`btn-mockup ${sizeClass} rounded-full flex items-center justify-center cursor-pointer shrink-0`}
      style={{ ...variantStyle, color: variant === "ghost" ? color : color, ...style }}
    >
      {children}
    </button>
  );
}
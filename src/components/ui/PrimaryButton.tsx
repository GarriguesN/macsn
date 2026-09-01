// components/ui/PrimaryButton.tsx — CTA verde grande del mockup
"use client";

import type { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick: () => void;
  /** Si true, renderiza un <button>; si false, un <a> */
  as?: "button" | "a";
  href?: string;
  /** Estilo "ghost" verde claro para acciones secundarias */
  variant?: "primary" | "tinted" | "danger";
  className?: string;
  ariaLabel?: string;
  type?: "button" | "submit";
}

/**
 * Botón principal del mockup.
 * - `primary` (default): fondo #0f5b2d, texto blanco, rounded-2xl, padding 18px
 * - `tinted`: fondo #f0f7f2, texto #1e7b3d (mismas dimensiones)
 * - `danger`: fondo #e81e3a, texto blanco
 */
export default function PrimaryButton({
  children,
  onClick,
  as = "button",
  href,
  variant = "primary",
  className = "",
  ariaLabel,
  type = "button",
}: PrimaryButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-brand-dark text-white"
      : variant === "danger"
      ? "bg-[#e81e3a] text-white"
      : "bg-brand-tint text-brand";

  const base =
    "btn-mockup w-full flex items-center justify-center gap-2 rounded-2xl text-[16px] font-bold cursor-pointer border-0";

  const style =
    variant === "primary" || variant === "danger"
      ? { padding: "18px", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }
      : { padding: "18px" };

  if (as === "a" && href) {
    return (
      <a
        href={href}
        className={`${base} ${variantClass} ${className}`}
        style={style}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variantClass} ${className}`}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
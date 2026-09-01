// components/ui/Badge.tsx — pill pequeña del mockup
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  /** Estilo: "green" (#f0f7f2/#1e7b3d), "neutral" (#f5f5f5/#1a1a1a), "soft" (#eef7fc/#2d9cdb), "warm" (#fef5e7/#f39c12) */
  variant?: "green" | "neutral" | "soft" | "warm";
  className?: string;
}

const VARIANTS = {
  green: { bg: "#f0f7f2", color: "#1e7b3d" },
  neutral: { bg: "#f5f5f5", color: "#1a1a1a" },
  soft: { bg: "#eef7fc", color: "#2d9cdb" },
  warm: { bg: "#fef5e7", color: "#f39c12" },
} as const;

export default function Badge({
  children,
  variant = "green",
  className,
}: BadgeProps) {
  const v = VARIANTS[variant];
  return (
    <span
      className={clsx(
        "inline-block rounded-full text-[11px] font-bold",
        className
      )}
      style={{
        background: v.bg,
        color: v.color,
        padding: "4px 10px",
      }}
    >
      {children}
    </span>
  );
}
// components/ConfidenceBadge.tsx — pill de confianza del análisis

import {
  AlertTriangle,
  BadgeCheck,
  XOctagon,
  type LucideIcon,
} from "lucide-react";
import type { Confidence } from "@/types";

const MAP: Record<
  Confidence,
  { icon: LucideIcon; label: string; fg: string; bg: string }
> = {
  alta: {
    icon: BadgeCheck,
    label: "Alta confianza",
    fg: "#1F7A3A",
    bg: "rgba(31,122,58,0.12)",
  },
  media: {
    icon: AlertTriangle,
    label: "Media confianza",
    fg: "#B45309",
    bg: "rgba(245,158,11,0.16)",
  },
  baja: {
    icon: XOctagon,
    label: "Baja confianza",
    fg: "#FF3B30",
    bg: "rgba(255,59,48,0.12)",
  },
};

export default function ConfidenceBadge({ level }: { level: Confidence }) {
  const c = MAP[level];
  const Icon = c.icon;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-caption-2 font-medium"
      style={{ color: c.fg, backgroundColor: c.bg }}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
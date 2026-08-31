// components/MealCard.tsx — tarjeta de comida (hora + nombre + macros + foto)

import {
  Apple,
  Coffee,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Meal, MealType } from "@/types";
import { formatTime, fmtNum, MEAL_LABELS } from "@/lib/date";
import ConfidenceBadge from "@/components/ConfidenceBadge";

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: UtensilsCrossed,
  snack: Apple,
};

interface MealCardProps {
  meal: Meal;
  /** Timer de 500ms en pointer-down: (x, y) del evento */
  onLongPress?: (x: number, y: number) => void;
}

export default function MealCard({ meal, onLongPress }: MealCardProps) {
  const Icon = MEAL_ICONS[meal.meal];
  const name = meal.items[0]?.name ?? null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const startLongPress = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return; // solo botón principal
    clearTimeout(timer);
    timer = setTimeout(() => onLongPress?.(e.clientX, e.clientY), 500);
  };
  const cancelLongPress = () => clearTimeout(timer);

  return (
    <div
      className="flex select-none items-center gap-3 rounded-lg bg-surface p-3 shadow-sm"
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={(e) => {
        // right-click / long-press de escritorio
        e.preventDefault();
        onLongPress?.(e.clientX, e.clientY);
      }}
      role="button"
      tabIndex={0}
      aria-label={name ?? "Comida"}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-grouped-bg">
        <Icon className="h-5 w-5 text-primary-dark" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-caption-1 text-label-tertiary">
            {formatTime(meal.created_at)}
          </span>
          <span className="text-caption-1 font-medium text-label-secondary">
            {MEAL_LABELS[meal.meal]}
          </span>
          {meal.confidence && (
            <ConfidenceBadge level={meal.confidence} />
          )}
        </div>
        {name && (
          <p className="mt-0.5 truncate text-headline font-semibold text-label">
            {name}
          </p>
        )}
        <p className="mt-0.5 text-footnote text-label-secondary">
          {fmtNum(meal.kcal)} kcal · {fmtNum(meal.p)}P/{fmtNum(meal.h)}H/
          {fmtNum(meal.f)}G
        </p>
      </div>
      {meal.photo_base64 && (
        // miniatura de la foto del plato (data URL del backend)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meal.photo_base64}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
      )}
    </div>
  );
}
// components/MealContextMenu.tsx — menú contextual por long-press en una MealCard
"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import type { Meal } from "@/types";

interface MealContextMenuProps {
  meal: Meal;
  x: number;
  y: number;
  onClose: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
}

const MENU_WIDTH = 200;

export default function MealContextMenu({
  meal,
  x,
  y,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: MealContextMenuProps) {
  const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const top = Math.min(y, window.innerHeight - 160);

  return (
    <>
      {/* backdrop invisible: cierra al tocar fuera */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[200px] overflow-hidden rounded-md bg-surface shadow-lg"
        style={{ left: Math.max(8, left), top: Math.max(8, top) }}
        role="menu"
        aria-label={`Opciones de ${meal.items[0]?.name ?? "comida"}`}
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onEdit?.();
            onClose();
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-subhead text-label hover:bg-grouped-bg active:bg-grouped-bg"
        >
          <Pencil className="h-4 w-4 text-label-secondary" />
          Editar
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onDuplicate?.();
            onClose();
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-subhead text-label hover:bg-grouped-bg active:bg-grouped-bg"
        >
          <Copy className="h-4 w-4 text-label-secondary" />
          Duplicar
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-subhead font-medium text-[#FF3B30] hover:bg-grouped-bg active:bg-grouped-bg"
        >
          <Trash2 className="h-4 w-4" />
          Borrar
        </button>
      </div>
    </>
  );
}
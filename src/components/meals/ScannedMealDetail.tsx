// components/meals/ScannedMealDetail.tsx — vista previa del escaneo (sliders editables)
//
// Flujos:
// 1. Scanner abre esta vista con un scan recién hecho → usuario edita → guarda
// 2. MealDetail "Editar" abre esta vista con la comida existente → guarda cambios
//
// La vista es dual: acepta un `draft` (scan recién hecho) o un `meal` existente.
// Si ambos son null, se muestra vacío (no debería ocurrir en flujo normal).

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ScreenHeader from "@/components/shared/ScreenHeader";
import IconButton from "@/components/ui/IconButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useApp, type StoredMeal } from "@/lib/store";
import type { FoodItem, MealType, ScanResult } from "@/types";
import { mealTypeLabel } from "@/lib/meal-utils";
import { todayISO } from "@/lib/date";

interface ScannedMealDetailProps {
  open: boolean;
  onClose: () => void;
  /** Scan recién hecho desde el flujo del escáner */
  draft?: ScanResult | null;
  /** Comida existente (modo edición desde MealDetail) */
  meal?: StoredMeal | null;
  /** Tipo de comida preseleccionado (en flujo de escaneo) */
  defaultMealType?: MealType;
}

const TARGET_KCAL = 2200;
const TARGET_PRO = 140;
const TARGET_CAR = 240;
const TARGET_FAT = 70;

export default function ScannedMealDetail({
  open,
  onClose,
  draft,
  meal,
  defaultMealType = "lunch",
}: ScannedMealDetailProps) {
  const { addMeal, updateMeal, targets } = useApp();

  const isEdit = !draft && !!meal;
  const initialMealType: MealType =
    meal?.meal ?? defaultMealType;

  // Estado local: lo que el usuario ve/edita
  const [items, setItems] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>(initialMealType);

  // Inicializa el estado desde draft/meal al abrir
  useEffect(() => {
    if (draft) {
      setItems(draft.items);
      setMealType(defaultMealType);
    } else if (meal) {
      setItems(
        meal.items.map((it) => ({
          name: it.name,
          grams: it.grams,
          kcal: it.kcal,
          p: it.p,
          f: it.f,
          h: it.h,
        })) as FoodItem[]
      );
      setMealType(meal.meal);
    } else {
      setItems([]);
      setMealType(defaultMealType);
    }
  }, [draft, meal, defaultMealType, open]);

  // Recalcular totales derivados (NO se guardan, se computan)
  const totals = useMemo(
    () =>
      items.reduce(
        (acc, it) => ({
          kcal: acc.kcal + it.kcal,
          p: acc.p + it.p,
          f: acc.f + it.f,
          h: acc.h + it.h,
        }),
        { kcal: 0, p: 0, f: 0, h: 0 }
      ),
    [items]
  );

  const pctCal = Math.round((totals.kcal / TARGET_KCAL) * 100);
  const pctPro = Math.round((totals.p / (targets.pro || TARGET_PRO)) * 100);
  const pctCar = Math.round((totals.h / (targets.car || TARGET_CAR)) * 100);
  const pctFat = Math.round((totals.f / (targets.fat || TARGET_FAT)) * 100);

  /** Reescala un item manteniendo ratios kcal-gramos */
  function rescale(idx: number, newGrams: number) {
    setItems((prev) => {
      const next = [...prev];
      const old = next[idx];
      if (!old || old.grams <= 0) {
        next[idx] = { ...old, grams: newGrams };
        return next;
      }
      const k = newGrams / old.grams;
      next[idx] = {
        ...old,
        grams: newGrams,
        kcal: Math.round(old.kcal * k),
        p: Math.round(old.p * k * 10) / 10,
        f: Math.round(old.f * k * 10) / 10,
        h: Math.round(old.h * k * 10) / 10,
      };
      return next;
    });
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (items.length === 0) return;
    const date = todayISO();
    if (isEdit && meal) {
      await updateMeal(meal.id!, {
        items,
        meal: mealType,
        // preservamos la fecha original (el usuario está editando, no moviendo)
      });
    } else {
      await addMeal({
        date,
        meal: mealType,
        items,
        kcal: totals.kcal,
        p: totals.p,
        f: totals.f,
        h: totals.h,
        photo_base64: null,
        confidence: draft?.confidence ?? "media",
        notes: null,
      });
    }
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex flex-col"
          style={{ background: "#fafafa", zIndex: 110 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <ScreenHeader
            left={
              <IconButton
                onClick={onClose}
                variant="ghostGreen"
                ariaLabel="Cerrar detalle"
                size={32}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </IconButton>
            }
          />

          <div
            className="flex-1 overflow-y-auto scrollbar-none flex flex-col"
            style={{ padding: "0 24px 120px", gap: "16px" }}
          >
            <div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#1a1a1a",
                  letterSpacing: "-0.5px",
                  marginBottom: "4px",
                  lineHeight: 1.2,
                }}
              >
                {draft?.plato ?? meal?.items[0]?.name ?? "Comida"}
              </div>
              <div style={{ fontSize: "14px", color: "#757575" }}>
                {isEdit ? "Edita cantidades y guarda" : "Edita cantidades y guarda"}
              </div>
            </div>

            {/* Resumen nutricional */}
            <div
              className="bg-white rounded-[20px]"
              style={{
                padding: "20px 16px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                border: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#1a1a1a",
                  marginBottom: "24px",
                }}
              >
                Resumen nutricional
              </div>

              <div
                className="grid grid-cols-2"
                style={{ gap: "20px 16px", marginBottom: "24px" }}
              >
                <Stat label="Calorías" value={totals.kcal} unit="kcal" pct={pctCal} color="#e81e3a" />
                <Stat label="Proteínas" value={Math.round(totals.p)} unit="g" pct={pctPro} color="#28a745" />
                <Stat label="Hidratos" value={Math.round(totals.h)} unit="g" pct={pctCar} color="#2d9cdb" />
                <Stat label="Grasas" value={Math.round(totals.f)} unit="g" pct={pctFat} color="#f39c12" />
              </div>

              <div
                style={{
                  height: "1px",
                  background: "#f0f0f0",
                  width: "100%",
                  margin: "20px 0 16px",
                }}
              />

              {/* Selector de tipo de comida */}
              <div className="flex" style={{ gap: "8px", flexWrap: "wrap" }}>
                {(
                  [
                    { key: "breakfast", label: "Desayuno" },
                    { key: "lunch", label: "Comida" },
                    { key: "dinner", label: "Cena" },
                    { key: "snack", label: "Merienda" },
                  ] as { key: MealType; label: string }[]
                ).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMealType(m.key)}
                    className="btn-mockup cursor-pointer border-0 rounded-full"
                    style={{
                      padding: "8px 14px",
                      background:
                        mealType === m.key ? "#1e7b3d" : "#f5f5f5",
                      color: mealType === m.key ? "#ffffff" : "#1a1a1a",
                      fontSize: "12.5px",
                      fontWeight: 700,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista editable de items (sliders de gramos) */}
            <div
              className="bg-white rounded-[20px]"
              style={{
                padding: "20px 16px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                border: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#1a1a1a",
                  marginBottom: "6px",
                }}
              >
                Ajusta las cantidades
              </div>
              <div
                style={{
                  fontSize: "12.5px",
                  color: "#757575",
                  marginBottom: "18px",
                }}
              >
                Mueve los sliders para corregir el peso de cada alimento.
              </div>

              <div className="flex flex-col" style={{ gap: "16px" }}>
                {items.map((it, idx) => (
                  <div key={idx}>
                    <div
                      className="flex justify-between items-center"
                      style={{ marginBottom: "6px" }}
                    >
                      <div
                        className="flex items-center"
                        style={{ gap: "6px", minWidth: 0, flex: 1 }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#1a1a1a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {it.name}
                        </div>
                      </div>
                      <div
                        className="flex items-center"
                        style={{ gap: "10px" }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#1a1a1a",
                            fontVariantNumeric: "tabular-nums",
                            minWidth: "70px",
                            textAlign: "right",
                          }}
                        >
                          {it.grams} g
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            aria-label={`Quitar ${it.name}`}
                            className="btn-mockup cursor-pointer border-0 rounded-full flex items-center justify-center"
                            style={{
                              width: "24px",
                              height: "24px",
                              background: "#f5f5f5",
                              color: "#a0a0a0",
                            }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                            >
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={Math.max(5, Math.round(it.grams * 0.25))}
                      max={Math.round(it.grams * 3)}
                      value={it.grams}
                      onChange={(e) =>
                        rescale(idx, Number(e.target.value))
                      }
                      className="slider-mockup"
                      style={{ margin: 0 }}
                      aria-label={`${it.name} (gramos)`}
                    />
                  </div>
                ))}
                {items.length === 0 && (
                  <div
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#757575",
                      fontSize: "13px",
                    }}
                  >
                    Todos los alimentos eliminados. Cierra sin guardar.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="absolute left-0 right-0 bottom-0 footer-gradient"
            style={{ padding: "16px 24px 34px", zIndex: 10 }}
          >
            <PrimaryButton
              onClick={handleSave}
              ariaLabel="Guardar comida"
              className="disabled:opacity-50"
              variant={items.length > 0 ? "primary" : "tinted"}
            >
              {isEdit ? "Guardar cambios" : "Registrar comida"}
            </PrimaryButton>
            <div
              className="text-center"
              style={{
                fontSize: "11.5px",
                color: "#a0a0a0",
                marginTop: "8px",
              }}
            >
              {mealTypeLabel(mealType)} · {Math.round(totals.kcal)} kcal
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({
  label,
  value,
  unit,
  pct,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  pct: number;
  color: string;
}) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ gap: "4px", textAlign: "center" }}
    >
      <div style={{ fontSize: "12px", color: "#1a1a1a" }}>{label}</div>
      <div
        style={{
          fontSize: "22px",
          fontWeight: 800,
          color: "#1a1a1a",
        }}
      >
        {value}{" "}
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#a0a0a0",
          }}
        >
          {unit}
        </span>
      </div>
      <div
        className="flex items-center"
        style={{ gap: "6px", marginTop: "2px" }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: color,
          }}
        />
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#757575" }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
// components/meals/MealDetail.tsx — sub-vista detalle de comida registrada (read)
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";
import ScreenHeader from "@/components/shared/ScreenHeader";
import IconButton from "@/components/ui/IconButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useApp, type StoredMeal } from "@/lib/store";
import { MEAL_DETAIL_IMAGE } from "@/data/meals";
import { fmtMealTime, mealTypeLabel } from "@/lib/meal-utils";

interface MealDetailProps {
  open: boolean;
  onClose: () => void;
  meal: StoredMeal | null;
  onEdit?: () => void;
}

const TARGET_KCAL = 2200;
const TARGET_PRO = 140;
const TARGET_CAR = 240;
const TARGET_FAT = 70;

export default function MealDetail({ open, onClose, meal, onEdit }: MealDetailProps) {
  const { deleteMeal } = useApp();
  const isDataUrl = meal?.photo_base64?.startsWith("data:image/");
  const photoSrc = isDataUrl
    ? meal!.photo_base64!
    : meal?.photo_base64 || MEAL_DETAIL_IMAGE;

  const totals = useMemo(() => {
    if (!meal) return { kcal: 0, pro: 0, car: 0, fat: 0 };
    return {
      kcal: meal.kcal,
      pro: meal.p,
      car: meal.h,
      fat: meal.f,
    };
  }, [meal]);

  const pctCal = Math.round((totals.kcal / TARGET_KCAL) * 100);
  const pctPro = Math.round((totals.pro / TARGET_PRO) * 100);
  const pctCar = Math.round((totals.car / TARGET_CAR) * 100);
  const pctFat = Math.round((totals.fat / TARGET_FAT) * 100);

  if (!meal) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex flex-col"
          style={{ background: "#fafafa", zIndex: 100 }}
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
                ariaLabel="Cerrar detalle de comida"
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
            right={
              <div className="flex items-center" style={{ gap: "8px" }}>
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    aria-label="Editar comida"
                    className="btn-mockup border-0 cursor-pointer"
                    style={{
                      background: "#f0f7f2",
                      color: "#1e7b3d",
                      padding: "6px 12px",
                      borderRadius: "100px",
                      fontSize: "13px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("¿Borrar esta comida?")) {
                      deleteMeal(meal.id!).then(() => onClose());
                    }
                  }}
                  aria-label="Borrar comida"
                  className="btn-mockup border-0 cursor-pointer rounded-full flex items-center justify-center"
                  style={{
                    background: "transparent",
                    color: "#e81e3a",
                    width: "32px",
                    height: "32px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            }
          />

          <div
            className="flex-1 overflow-y-auto scrollbar-none flex flex-col"
            style={{ padding: "0 24px 120px", gap: "16px" }}
          >
            <div
              className="flex justify-between items-end"
              style={{ marginBottom: "8px" }}
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
                  {meal.items[0]?.name ?? "Comida"}
                </div>
                <div style={{ fontSize: "14px", color: "#757575" }}>
                  {mealTypeLabel(meal.meal)}, {fmtMealTime(meal.created_at)}
                </div>
              </div>
            </div>

            {/* Foto grande */}
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: "100%",
                height: "210px",
                borderRadius: "20px",
                background: "#e0e0e0",
                boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                border: "1px solid #f0f0f0",
              }}
            >
              {isDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoSrc}
                  alt={meal.items[0]?.name ?? "Comida"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Image
                  src={photoSrc}
                  alt={meal.items[0]?.name ?? "Comida"}
                  width={700}
                  height={500}
                  className="object-cover w-full h-full"
                />
              )}
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
                <MacroStat
                  label="Calorías"
                  value={totals.kcal}
                  unit="kcal"
                  pct={pctCal}
                  color="#e81e3a"
                />
                <MacroStat
                  label="Proteínas"
                  value={totals.pro}
                  unit="g"
                  pct={pctPro}
                  color="#28a745"
                />
                <MacroStat
                  label="Hidratos"
                  value={totals.car}
                  unit="g"
                  pct={pctCar}
                  color="#2d9cdb"
                />
                <MacroStat
                  label="Grasas"
                  value={totals.fat}
                  unit="g"
                  pct={pctFat}
                  color="#f39c12"
                />
              </div>
            </div>

            {/* Desglose del plato */}
            {meal.items.length > 0 && (
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
                    marginBottom: "16px",
                  }}
                >
                  Desglose del plato
                </div>

                {meal.items.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center"
                    style={{
                      padding: "14px 0",
                      borderBottom:
                        i === meal.items.length - 1
                          ? "none"
                          : "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      className="shrink-0 overflow-hidden"
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "#f5f5f5",
                        marginRight: "14px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ingFallbackImg(ing.name)}
                        alt={ing.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div className="flex-1" style={{ paddingRight: "10px" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#1a1a1a",
                          marginBottom: "2px",
                        }}
                      >
                        {ing.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12.5px",
                          color: "#757575",
                        }}
                      >
                        {ing.grams} g
                      </div>
                    </div>
                    <div
                      className="flex items-center"
                      style={{ gap: "8px" }}
                    >
                      <div
                        style={{
                          fontSize: "14.5px",
                          fontWeight: 800,
                          color: "#1a1a1a",
                        }}
                      >
                        {ing.kcal}{" "}
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#a0a0a0",
                          }}
                        >
                          kcal
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="absolute left-0 right-0 bottom-0 footer-gradient"
            style={{ padding: "16px 24px 34px", zIndex: 10 }}
          >
            <PrimaryButton onClick={onClose} ariaLabel="Cerrar detalle">
              Cerrar
            </PrimaryButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Genera una miniatura placeholder para ingredientes sin foto persistida.
 * Usa un color derivado del hash del nombre (estabilidad visual).
 */
function ingFallbackImg(name: string): string {
  // Picsum estable por seed = id (semilla determinística)
  const seed = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `https://picsum.photos/seed/ing-${seed}/100/100`;
}

function MacroStat({
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
// components/history/HistoryDetail.tsx — sub-vista detalle del historial (reactivo)
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";
import ScreenHeader from "@/components/shared/ScreenHeader";
import IconButton from "@/components/ui/IconButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScannedMealDetail from "@/components/meals/ScannedMealDetail";
import {
  useApp,
  selectMealsByDate,
  selectTotalsByDate,
  type StoredMeal,
} from "@/lib/store";
import { useState } from "react";
import { fmtLongDate, mealTypeLabel } from "@/lib/meal-utils";
import type { HistoryScale } from "@/types";

interface HistoryDetailProps {
  open: boolean;
  onClose: () => void;
  date: string;
  scale: HistoryScale;
}

export default function HistoryDetail({
  open,
  onClose,
  date,
  scale,
}: HistoryDetailProps) {
  const { meals } = useApp();
  const [editMeal, setEditMeal] = useState<StoredMeal | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const dayMeals = useMemo(() => selectMealsByDate(meals, date), [meals, date]);
  const totals = useMemo(() => selectTotalsByDate(meals, date), [meals, date]);

  const avgKcal =
    dayMeals.length > 0 ? Math.round(totals.kcal / dayMeals.length) : 0;

  const scaleLabels: Record<HistoryScale, string> = {
    days: "día",
    weeks: "semana",
    months: "mes",
    years: "año",
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 flex flex-col"
            style={{ background: "#fafafa", zIndex: 105 }}
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
                  ariaLabel="Cerrar detalle del historial"
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
              title={`Detalle del ${scaleLabels[scale]}`}
            />

            <div
              className="flex-1 overflow-y-auto scrollbar-none flex flex-col"
              style={{ padding: "0 24px 120px", gap: "16px" }}
            >
              <div>
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "#1a1a1a",
                    letterSpacing: "-0.5px",
                    marginBottom: "4px",
                    lineHeight: 1.2,
                  }}
                >
                  {fmtLongDate(date)}
                </div>
                <div style={{ fontSize: "14px", color: "#757575" }}>
                  {dayMeals.length} {dayMeals.length === 1 ? "comida registrada" : "comidas registradas"}
                </div>
              </div>

              {dayMeals.length === 0 ? (
                <div
                  className="bg-white rounded-[20px]"
                  style={{
                    padding: "32px 20px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                    border: "1px solid #f0f0f0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#757575",
                      lineHeight: 1.5,
                    }}
                  >
                    No hay comidas registradas para este día
                  </div>
                </div>
              ) : (
                <>
                  {/* Tarjeta resumen nutricional */}
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
                        marginBottom: "18px",
                      }}
                    >
                      Resumen nutricional
                    </div>

                    <div className="text-center" style={{ marginBottom: "18px" }}>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: 800,
                          color: "#1a1a1a",
                          letterSpacing: "-1px",
                          lineHeight: 1,
                        }}
                      >
                        {totals.kcal}{" "}
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#a0a0a0",
                          }}
                        >
                          kcal totales
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12.5px",
                          color: "#757575",
                          marginTop: "6px",
                        }}
                      >
                        Promedio por comida ≈ {avgKcal} kcal
                      </div>
                    </div>

                    <div
                      style={{
                        height: "1px",
                        background: "#f0f0f0",
                        width: "100%",
                        marginBottom: "16px",
                      }}
                    />

                    <div className="grid grid-cols-3" style={{ gap: "12px" }}>
                      <MacroPill color="#28a745" label="Proteínas" value={Math.round(totals.p)} />
                      <MacroPill color="#2d9cdb" label="Hidratos" value={Math.round(totals.h)} />
                      <MacroPill color="#f39c12" label="Grasas" value={Math.round(totals.f)} />
                    </div>
                  </div>

                  {/* Tarjeta comidas registradas */}
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
                        marginBottom: "14px",
                      }}
                    >
                      Comidas registradas
                    </div>

                    {dayMeals.map((m, i) => (
                      <button
                        key={m.id}
                        type="button"
                        aria-label={`Editar ${m.items[0]?.name ?? "comida"}`}
                        onClick={() => {
                          setEditMeal(m);
                          setEditOpen(true);
                        }}
                        className="btn-mockup flex items-center w-full text-left bg-transparent border-0 cursor-pointer"
                        style={{
                          padding: "12px 0",
                          borderBottom:
                            i === dayMeals.length - 1 ? "none" : "1px solid #f0f0f0",
                          font: "inherit",
                          color: "inherit",
                        }}
                      >
                        <div
                          className="shrink-0 overflow-hidden"
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: "#f5f5f5",
                            marginRight: "14px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                          }}
                        >
                          {m.photo_base64?.startsWith("data:image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.photo_base64}
                              alt={m.items[0]?.name ?? "Comida"}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Image
                              src={
                                m.photo_base64 ||
                                "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=100&h=100&fit=crop"
                              }
                              alt={m.items[0]?.name ?? "Comida"}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0" style={{ paddingRight: "10px" }}>
                          <div
                            className="flex items-center"
                            style={{ gap: "6px", marginBottom: "3px" }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#757575",
                              }}
                            >
                              {mealTypeLabel(m.meal)}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#a0a0a0",
                              }}
                            >
                              ·
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#757575",
                              }}
                            >
                              {fmtTime(m.created_at)}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#1a1a1a",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {m.items[0]?.name ?? "Comida"}
                          </div>
                        </div>
                        <div
                          className="flex flex-col items-end shrink-0"
                        >
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#1a1a1a",
                            }}
                          >
                            {m.kcal}{" "}
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                color: "#a0a0a0",
                              }}
                            >
                              kcal
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#757575",
                              marginTop: "2px",
                            }}
                          >
                            {Math.round(m.p)}P · {Math.round(m.h)}C · {Math.round(m.f)}G
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div
              className="absolute left-0 right-0 bottom-0 footer-gradient"
              style={{ padding: "16px 24px 34px", zIndex: 10 }}
            >
              <PrimaryButton onClick={onClose} ariaLabel="Cerrar">
                Cerrar
              </PrimaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScannedMealDetail
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditMeal(null);
        }}
        meal={editMeal}
      />
    </>
  );
}

function MacroPill({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ gap: "4px", textAlign: "center" }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: color,
        }}
      />
      <div style={{ fontSize: "11px", color: "#757575", fontWeight: 600 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 800,
          color: "#1a1a1a",
        }}
      >
        {value}{" "}
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#a0a0a0" }}>
          g
        </span>
      </div>
    </div>
  );
}

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
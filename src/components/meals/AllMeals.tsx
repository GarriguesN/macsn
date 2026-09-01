// components/meals/AllMeals.tsx — sub-vista "Ver todas" las comidas del día
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useMemo, useState } from "react";
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
import { todayISO } from "@/lib/date";
import { fmtLongDate, mealTypeLabel } from "@/lib/meal-utils";

interface AllMealsProps {
  open: boolean;
  onClose: () => void;
}

export default function AllMeals({ open, onClose }: AllMealsProps) {
  const { meals, deleteMeal } = useApp();
  const [editMeal, setEditMeal] = useState<StoredMeal | null>(null);
  const [scannedOpen, setScannedOpen] = useState(false);

  const today = todayISO();
  const todayMeals = useMemo(
    () => selectMealsByDate(meals, today),
    [meals, today]
  );
  const totals = useMemo(
    () => selectTotalsByDate(meals, today),
    [meals, today]
  );

  const handleDelete = async (id: number) => {
    if (confirm("¿Borrar esta comida?")) {
      await deleteMeal(id);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 flex flex-col"
            style={{ background: "#fafafa", zIndex: 102 }}
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
                  ariaLabel="Cerrar lista de comidas"
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
              title="Todas las comidas"
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
                  Comidas de hoy
                </div>
                <div style={{ fontSize: "14px", color: "#757575" }}>
                  {fmtLongDate(today)}
                </div>
              </div>

              {todayMeals.length === 0 ? (
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
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                    }}
                  >
                    Aún no hay comidas
                  </div>
                  <div style={{ fontSize: "13px", color: "#757575" }}>
                    Escanea tu primera comida del día
                  </div>
                </div>
              ) : (
                <>
                  {/* Tarjeta total */}
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
                      Total del día
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
                          kcal
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12.5px",
                          color: "#757575",
                          marginTop: "6px",
                        }}
                      >
                        en {todayMeals.length}{" "}
                        {todayMeals.length === 1 ? "comida registrada" : "comidas registradas"}
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

                    <div
                      className="grid grid-cols-3"
                      style={{ gap: "12px" }}
                    >
                      <Pill color="#28a745" label="Proteínas" value={Math.round(totals.p)} />
                      <Pill color="#2d9cdb" label="Hidratos" value={Math.round(totals.h)} />
                      <Pill color="#f39c12" label="Grasas" value={Math.round(totals.f)} />
                    </div>
                  </div>

                  {/* Lista detalle */}
                  <div
                    className="bg-white rounded-[20px]"
                    style={{
                      padding: "0 16px",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 0 12px",
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "#1a1a1a",
                      }}
                    >
                      Detalle por comida
                    </div>

                    {todayMeals.map((m, i) => (
                      <div
                        key={m.id}
                        className="flex items-center"
                        style={{
                          padding: "14px 0",
                          borderBottom:
                            i === todayMeals.length - 1
                              ? "none"
                              : "1px solid #f0f0f0",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditMeal(m);
                            setScannedOpen(true);
                          }}
                          aria-label={`Editar ${m.items[0]?.name ?? "comida"}`}
                          className="btn-mockup flex items-center flex-1 min-w-0 text-left bg-transparent border-0 cursor-pointer"
                          style={{ padding: 0 }}
                        >
                          <div
                            className="shrink-0 overflow-hidden"
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "12px",
                              background: "#f5f5f5",
                              marginRight: "14px",
                            }}
                          >
                            {m.photo_base64?.startsWith("data:image/") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.photo_base64}
                                alt={m.items[0]?.name ?? "Comida"}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Image
                                src={
                                  m.photo_base64 ||
                                  "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=200&h=200&fit=crop"
                                }
                                alt={m.items[0]?.name ?? "Comida"}
                                width={56}
                                height={56}
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div
                            className="flex-1 min-w-0"
                            style={{ paddingRight: "10px" }}
                          >
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
                                  fontWeight: 600,
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
                                fontSize: "14.5px",
                                fontWeight: 800,
                                color: "#1a1a1a",
                                lineHeight: 1.3,
                                marginBottom: "4px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {m.items[0]?.name ?? "Comida"}
                            </div>
                            <div
                              className="flex items-center"
                              style={{
                                gap: "8px",
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#757575",
                              }}
                            >
                              <span>{m.kcal} kcal</span>
                              <Chip color="#28a745">{m.p}P</Chip>
                              <Chip color="#2d9cdb">{m.h}H</Chip>
                              <Chip color="#f39c12">{m.f}G</Chip>
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => m.id && handleDelete(m.id)}
                          aria-label="Borrar comida"
                          className="btn-mockup cursor-pointer border-0 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            width: "32px",
                            height: "32px",
                            background: "transparent",
                            color: "#e81e3a",
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
        open={scannedOpen}
        onClose={() => {
          setScannedOpen(false);
          setEditMeal(null);
        }}
        meal={editMeal}
      />
    </>
  );
}

function Pill({
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

function Chip({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center" style={{ gap: "4px" }}>
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
        }}
      />
      {children}
    </span>
  );
}

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
// components/stats/FoodDetail.tsx — sub-vista detalle de alimento frecuente
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import ScreenHeader from "@/components/shared/ScreenHeader";
import IconButton from "@/components/ui/IconButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import type { FrequentFood } from "@/data/frequentFoods";

interface FoodDetailProps {
  open: boolean;
  onClose: () => void;
  food?: FrequentFood;
}

export default function FoodDetail({ open, onClose, food }: FoodDetailProps) {
  // Defaults seguros
  const name = food?.name ?? "Alimento";
  const img =
    food?.img ?? "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=700&h=400&fit=crop";
  const kcal = food?.kcal ?? 0;
  const times = food?.times ?? 0;

  // Estimaciones de macros (mock si no hay datos reales)
  const pro = Math.round(kcal * 0.3);
  const car = Math.round(kcal * 0.4);
  const fat = Math.round(kcal * 0.3);

  const isDataUrl = img.startsWith("data:image/");

  return (
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
                ariaLabel="Cerrar detalle del alimento"
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
            title="Alimento frecuente"
          />

          <div
            className="flex-1 overflow-y-auto scrollbar-none flex flex-col"
            style={{ padding: "0 24px 120px", gap: "16px" }}
          >
            <div>
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: "100%",
                  height: "200px",
                  borderRadius: "20px",
                  background: "#e0e0e0",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                  border: "1px solid #f0f0f0",
                  marginBottom: "18px",
                }}
              >
                {isDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Image
                    src={img}
                    alt={name}
                    width={700}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#1a1a1a",
                  letterSpacing: "-0.5px",
                  marginBottom: "6px",
                  lineHeight: 1.2,
                }}
              >
                {name}
              </div>
              <div
                className="flex items-center"
                style={{ gap: "6px", marginBottom: "4px" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1e7b3d"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="M4.93 4.93l2.83 2.83" />
                  <path d="M16.24 16.24l2.83 2.83" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                  <path d="M4.93 19.07l2.83-2.83" />
                  <path d="M16.24 7.76l2.83-2.83" />
                </svg>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#1e7b3d",
                    fontWeight: 600,
                  }}
                >
                  Registrado {times} {times === 1 ? "vez" : "veces"} en tu historial
                </div>
              </div>
            </div>

            {/* Tarjeta kcal por ración */}
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
                Promedio por ración
              </div>

              <div className="text-center" style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    color: "#1a1a1a",
                    letterSpacing: "-1px",
                    lineHeight: 1,
                  }}
                >
                  {kcal}{" "}
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
                  Estimado en base a tus registros
                </div>
              </div>

              <div
                style={{
                  height: "1px",
                  background: "#f0f0f0",
                  width: "100%",
                  margin: "16px 0",
                }}
              />

              <div className="grid grid-cols-3" style={{ gap: "12px" }}>
                <Pill color="#28a745" label="Proteínas" value={pro} />
                <Pill color="#2d9cdb" label="Hidratos" value={car} />
                <Pill color="#f39c12" label="Grasas" value={fat} />
              </div>
            </div>

            {/* Nota informativa */}
            <div
              className="rounded-2xl flex items-start"
              style={{
                background: "#f0f7f2",
                padding: "14px 16px",
                gap: "10px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1e7b3d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: "2px" }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <div
                style={{
                  fontSize: "12.5px",
                  color: "#1e7b3d",
                  lineHeight: 1.5,
                }}
              >
                Los macros son estimaciones basadas en una distribución estándar.
                Podrás ajustarlos al editar la comida una vez registrada.
              </div>
            </div>
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
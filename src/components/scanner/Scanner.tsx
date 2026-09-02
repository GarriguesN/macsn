// components/scanner/Scanner.tsx — vista completa del escáner (mock AI)
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ScannerControls from "@/components/scanner/ScannerControls";
import ScannerHelp from "@/components/scanner/ScannerHelp";
import type { MealType, ScanResult } from "@/types";
import { mockScan } from "@/lib/scan-mock";
import { api } from "@/lib/api-client";
import type { ScannerMode } from "@/types";

interface ScannerProps {
  open: boolean;
  onClose: () => void;
  /** Tipo de comida preseleccionado en el detalle (breakfast/lunch/dinner/snack) */
  defaultMealType?: MealType;
  /** Se invoca con el resultado del análisis (no devuelve el meal: el padre lo gestiona) */
  onCaptured?: (scan: ScanResult, mealType: MealType) => void;
}

export default function Scanner({
  open,
  onClose,
  onCaptured,
  defaultMealType = "lunch",
}: ScannerProps) {
  const [mode, setMode] = useState<ScannerMode>("comida");
  const [flash, setFlash] = useState(false);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const takePhoto = async () => {
    if (takingPhoto) return;
    setTakingPhoto(true);
    try {
      // Llama a /api/scan real. Si no hay foto (placeholder ""), backend
      // devolverá 400 — el caller decidirá cómo manejarlo.
      const scan = await api.scanImage("", defaultMealType);
      onCaptured?.(scan, defaultMealType);
    } catch {
      // abortado o error: cerramos el spinner y seguimos
    } finally {
      setTakingPhoto(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex flex-col"
          style={{
            background: "#ffffff",
            zIndex: 200,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Cabecera */}
          <div
            className="flex justify-between items-center shrink-0"
            style={{ padding: "50px 24px 16px", background: "#ffffff" }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar escáner"
              className="btn-mockup bg-transparent border-0 cursor-pointer"
              style={{ padding: 0, color: "#1a1a1a" }}
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="text-center">
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#1a1a1a",
                }}
              >
                Toma una foto
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#757575",
                  marginTop: "2px",
                }}
              >
                Enfoca bien el plato
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Ayuda"
              className="btn-mockup bg-transparent border-0 cursor-pointer"
              style={{ padding: 0, color: "#1a1a1a" }}
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
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          </div>

          {/* Visor: simulamos cámara con placeholder visual */}
          <div
            className="flex-1 relative flex flex-col items-center justify-center"
            style={{ background: "#1a1a1a", overflow: "hidden" }}
          >
            {/* Patrón sutil para evocar un visor (sin imagen externa) */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 50%, #2a2a2a 0%, #0d0d0d 100%)",
              }}
            />

            <AnimatePresence>
              {flash && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "rgba(255, 248, 220, 0.55)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {takingPhoto && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.92)", zIndex: 5 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col items-center" style={{ gap: "14px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        border: "4px solid #f0f0f0",
                        borderTopColor: "#1e7b3d",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#757575",
                      }}
                    >
                      Analizando con IA…
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Marco de enfoque */}
            <FocusCorner pos="tl" />
            <FocusCorner pos="tr" />
            <FocusCorner pos="bl" />
            <FocusCorner pos="br" />

            <div
              className="absolute"
              style={{
                bottom: "8%",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(8px)",
                padding: "12px 24px",
                borderRadius: "100px",
                textAlign: "center",
                width: "70%",
              }}
            >
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 500,
                  color: "#ffffff",
                  lineHeight: 1.4,
                }}
              >
                Asegúrate de que toda la comida quede dentro del marco
              </div>
            </div>
          </div>

          {/* Controles */}
          <div
            className="flex flex-col items-center"
            style={{
              padding: "24px",
              background: "#fafafa",
              borderRadius: "32px 32px 0 0",
              marginTop: "-24px",
              position: "relative",
              zIndex: 10,
              boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
              gap: "30px",
            }}
          >
            <ScannerControls
              mode={mode}
              onModeChange={setMode}
              flash={flash}
              onToggleFlash={() => setFlash((f) => !f)}
              onTakePhoto={takePhoto}
            />
          </div>

          <ScannerHelp
            open={helpOpen}
            onClose={() => setHelpOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Esquina del marco de enfoque
function FocusCorner({
  pos,
}: {
  pos: "tl" | "tr" | "bl" | "br";
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: "40px",
    height: "40px",
  };
  const styles: Record<typeof pos, React.CSSProperties> = {
    tl: {
      top: "15%",
      left: "10%",
      borderTop: "4px solid #ffffff",
      borderLeft: "4px solid #ffffff",
      borderTopLeftRadius: "20px",
    },
    tr: {
      top: "15%",
      right: "10%",
      borderTop: "4px solid #ffffff",
      borderRight: "4px solid #ffffff",
      borderTopRightRadius: "20px",
    },
    bl: {
      bottom: "25%",
      left: "10%",
      borderBottom: "4px solid #ffffff",
      borderLeft: "4px solid #ffffff",
      borderBottomLeftRadius: "20px",
    },
    br: {
      bottom: "25%",
      right: "10%",
      borderBottom: "4px solid #ffffff",
      borderRight: "4px solid #ffffff",
      borderBottomRightRadius: "20px",
    },
  };
  return <div style={{ ...base, ...styles[pos] }} />;
}
// components/scanner/ScannerControls.tsx — selector de modo + galería / disparador / linterna
"use client";

import type { ScannerMode } from "@/types";

interface ScannerControlsProps {
  mode: ScannerMode;
  onModeChange: (mode: ScannerMode) => void;
  flash: boolean;
  onToggleFlash: () => void;
  onTakePhoto: () => void;
}

const MODES: { key: ScannerMode; label: string }[] = [
  { key: "comida", label: "Comida" },
  { key: "codigo", label: "Código" },
];

export default function ScannerControls({
  mode,
  onModeChange,
  flash,
  onToggleFlash,
  onTakePhoto,
}: ScannerControlsProps) {
  return (
    <>
      {/* Selector de modo */}
      <div
        className="flex bg-white rounded-full"
        style={{
          border: "1px solid #e0e0e0",
          padding: "4px",
          gap: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        {MODES.map((m) => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onModeChange(m.key)}
              aria-label={`Modo escáner: ${m.label.toLowerCase()}`}
              className="btn-mockup border-0 cursor-pointer flex items-center rounded-full"
              style={{
                gap: "6px",
                padding: "8px 16px",
                background: active
                  ? m.key === "comida"
                    ? "#e8f3ec"
                    : "#f0f0f0"
                  : "transparent",
                color:
                  m.key === "comida"
                    ? active
                      ? "#1e7b3d"
                      : "#757575"
                    : active
                    ? "#1a1a1a"
                    : "#757575",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {m.key === "comida" ? (
                  <>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </>
                ) : (
                  <>
                    <path d="M4 5v14" />
                    <path d="M8 5v14" />
                    <path d="M12 5v14" />
                    <path d="M16 5v14" />
                    <path d="M20 5v14" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </>
                )}
              </svg>
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Botones de acción */}
      <div
        className="flex justify-between items-center w-full"
        style={{ padding: "0 10px" }}
      >
        {/* Galería */}
        <button
          type="button"
          onClick={() => undefined}
          aria-label="Abrir galería"
          className="btn-mockup bg-transparent border-0 cursor-pointer flex flex-col items-center"
          style={{ gap: "8px" }}
        >
          <GalleryBtn />
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: "#757575",
            }}
          >
            Galería
          </div>
        </button>

        {/* Disparador */}
        <button
          type="button"
          onClick={onTakePhoto}
          aria-label="Tomar foto"
          className="btn-mockup cursor-pointer bg-transparent border-0 flex items-center justify-center"
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "4px solid #e0e0e0",
          }}
        >
          <div
            style={{
              width: "62px",
              height: "62px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          />
        </button>

        {/* Linterna */}
        <button
          type="button"
          onClick={onToggleFlash}
          aria-label="Alternar linterna"
          className="btn-mockup bg-transparent border-0 cursor-pointer flex flex-col items-center"
          style={{ gap: "8px" }}
        >
          <FlashBtn flash={flash} />
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: flash ? "#f39c12" : "#757575",
            }}
          >
            Linterna
          </div>
        </button>
      </div>
    </>
  );
}

function GalleryBtn() {
  return (
    <div
      className="rounded-full flex items-center justify-center bg-white"
      style={{
        width: "48px",
        height: "48px",
        border: "1px solid #e0e0e0",
        color: "#1a1a1a",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

function FlashBtn({ flash }: { flash: boolean }) {
  return (
    <div
      className="rounded-full flex items-center justify-center"
      style={{
        width: "48px",
        height: "48px",
        background: flash ? "#fef5e7" : "#ffffff",
        border: "1px solid #e0e0e0",
        color: flash ? "#f39c12" : "#1a1a1a",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="9" y1="18" x2="15" y2="18" />
        <line x1="10" y1="22" x2="14" y2="22" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.45.62 2.84 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
      </svg>
    </div>
  );
}
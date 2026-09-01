// components/nav/BottomNav.tsx — barra de navegación inferior (4 tabs + FAB central)
"use client";

import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
  Réplica exacta del mockup:
  - Floating pill: left/right 16px, bottom 30px, height 72px, radius 24px
  - 4 tabs + FAB central (56x56 verde) elevado 4px
  - Detección de tab activo por path
*/
export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href === "/" && pathname === "/");

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: "fixed",
        left: "16px",
        right: "16px",
        bottom: "30px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "#ffffff",
        borderRadius: "24px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        zIndex: 50,
        animation: "fadeUp 0.6s ease-out both",
      }}
    >
      {/* Inicio */}
      <NavTab
        label="Inicio"
        active={isActive("/")}
        onClick={() => router.push("/")}
        icon={
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        }
      />

      {/* Diario */}
      <NavTab
        label="Diario"
        active={isActive("/historial")}
        onClick={() => router.push("/historial")}
        icon={
          <>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </>
        }
      />

      {/* FAB central (escáner) */}
      <button
        type="button"
        onClick={() => router.push("/scanner")}
        aria-label="Escanear comida"
        className="btn-mockup border-0 bg-transparent cursor-pointer flex items-center justify-center"
        style={{ transform: "translateY(-4px)" }}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: "56px",
            height: "56px",
            background: "#1e7b3d",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="30"
            height="30"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </button>

      {/* Estadísticas */}
      <NavTab
        label="Estadísticas"
        active={isActive("/estadisticas")}
        onClick={() => router.push("/estadisticas")}
        icon={
          <>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </>
        }
      />

      {/* Ajustes */}
      <NavTab
        label="Ajustes"
        active={isActive("/ajustes")}
        onClick={() => router.push("/ajustes")}
        icon={
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        }
      />
    </nav>
  );
}

// ============================================================================
// Sub-componente: tab inerte (sin router, ya lo gestiona el padre)
// ============================================================================

interface NavTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
}

function NavTab({ label, active, onClick, icon }: NavTabProps) {
  const color = active ? "#1e7b3d" : "#757575";
  const fill = label === "Inicio" && active ? "#1e7b3d" : "none";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="btn-mockup border-0 bg-transparent cursor-pointer flex flex-col items-center"
      style={{ width: "60px", gap: "4px" }}
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill={fill}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </svg>
      <div
        style={{
          fontSize: "11px",
          fontWeight: active ? 700 : 500,
          color,
        }}
      >
        {label}
      </div>
    </button>
  );
}
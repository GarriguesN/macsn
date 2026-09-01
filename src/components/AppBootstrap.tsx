// components/AppBootstrap.tsx — splash + gate de hidratación
"use client";

import type { ReactNode } from "react";
import { useApp } from "@/lib/store";
import MascotLogo from "@/components/shared/MascotLogo";

/**
 * Mientras `hydrated` sea false, mostramos un splash a pantalla completa
 * con el logo "M." Evita el flash de "no hay datos" en la primera carga.
 */
export default function AppBootstrap({ children }: { children: ReactNode }) {
  const { hydrated } = useApp();

  if (!hydrated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#fafafa" }}
      >
        <div className="anim-fade-up">
          <MascotLogo size={72} />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
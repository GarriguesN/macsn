// components/PlaceholderPage.tsx — pantalla "Próximamente" (Historial / Ajustes)
"use client";

import { Clock, Settings, type LucideIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const ICONS: Record<string, LucideIcon> = {
  clock: Clock,
  settings: Settings,
};

interface PlaceholderPageProps {
  /** clave del icono (función no serializable: no pasar el componente desde server) */
  icon: "clock" | "settings";
  title: string;
  subtitle: string;
}

export default function PlaceholderPage({
  icon,
  title,
  subtitle,
}: PlaceholderPageProps) {
  const Icon = ICONS[icon];
  return (
    <main className="flex min-h-screen flex-col bg-system-bg pb-44 text-label">
      <header className="px-4 pt-6">
        <h1 className="text-large-title font-semibold text-label">{title}</h1>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-grouped-bg">
          <Icon className="h-10 w-10 text-label-tertiary" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-headline font-semibold text-label">
            Próximamente
          </h2>
          <p className="mt-1 text-subhead text-label-secondary">{subtitle}</p>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
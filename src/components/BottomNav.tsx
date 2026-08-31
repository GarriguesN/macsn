// components/BottomNav.tsx — 3 tabs sticky (Hoy / Historial / Ajustes)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Home, Settings, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Hoy", icon: Home },
  { href: "/historial", label: "Historial", icon: Clock },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-separator bg-surface/85 pb-safe backdrop-blur-xl"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex h-[50px] max-w-md items-stretch">
        {TABS.map((t) => {
          const active = pathname === t.href;
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <Icon
                className={
                  active ? "h-6 w-6 text-primary" : "h-6 w-6 text-label-secondary"
                }
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={`text-caption-2 ${
                  active
                    ? "font-semibold text-primary"
                    : "text-label-secondary"
                }`}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
// components/ui/TabBar.tsx — segmented pills (Historial / Estadísticas)
"use client";

import clsx from "clsx";

export interface TabItem<T extends string> {
  key: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  ariaLabel: string;
  /** Padding del contenedor (mockup usa 4px) */
  padding?: number;
}

export default function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  padding = 4,
}: TabBarProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex bg-[#eaeaea] rounded-[12px]"
      style={{ padding }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Filtrar por ${t.label}`}
            onClick={() => onChange(t.key)}
            className={clsx(
              "btn-mockup flex-1 cursor-pointer border-0 rounded-[10px]",
              "transition-all duration-200"
            )}
            style={{
              padding: "10px 0",
              background: isActive ? "#ffffff" : "transparent",
              fontSize: "13.5px",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#1a1a1a" : "#757575",
              boxShadow: isActive
                ? "0 2px 6px rgba(0,0,0,0.04)"
                : "none",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
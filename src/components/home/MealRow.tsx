// components/home/MealRow.tsx — fila de comida (mockup, foto redonda + macros)
"use client";

import Image from "next/image";

export interface MealRowData {
  id: number;
  type: string;
  title: string;
  time: string;
  kcal: number;
  pro: number;
  car: number;
  fat: number;
  /** URL absoluta o data:image/... */
  img: string;
  border?: string;
}

interface MealRowProps {
  meal: MealRowData;
  isLast?: boolean;
  onClick?: () => void;
}

export default function MealRow({ meal, isLast, onClick }: MealRowProps) {
  const isDataUrl = meal.img.startsWith("data:image/");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalle de ${meal.title}`}
      className="btn-mockup flex items-center w-full text-left bg-transparent border-0 cursor-pointer"
      style={{
        padding: "18px 0",
        borderBottom: isLast ? "none" : "1px solid #f0f0f0",
      }}
    >
      <div
        className="shrink-0 overflow-hidden"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "12px",
          background: "#e0e0e0",
          marginRight: "14px",
        }}
      >
        {isDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meal.img}
            alt={meal.title}
            className="object-cover"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Image
            src={meal.img}
            alt={meal.title}
            width={56}
            height={56}
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1" style={{ paddingRight: "10px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "#a0a0a0",
            marginBottom: "2px",
          }}
        >
          {meal.type}
        </div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "#1a1a1a",
            marginBottom: "2px",
            lineHeight: 1.3,
          }}
        >
          {meal.title}
        </div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#757575",
            marginBottom: "6px",
          }}
        >
          {meal.time}
        </div>
        <div
          className="flex items-center gap-2"
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#757575",
          }}
        >
          <div>{meal.kcal} kcal</div>
          <Macro color="#28a745">{meal.pro}P</Macro>
          <Macro color="#2d9cdb">{meal.car}H</Macro>
          <Macro color="#f39c12">{meal.fat}G</Macro>
        </div>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d0d0d0"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function Macro({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
        }}
      />
      {children}
    </div>
  );
}
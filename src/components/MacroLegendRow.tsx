// components/MacroLegendRow.tsx — fila de leyenda lateral del ring

interface MacroLegendRowProps {
  color: string;
  label: string;
  /** "1.650 kcal" / "122 g" */
  value: string;
  /** "/ 2.200 kcal · 75%" */
  sub: string;
}

export default function MacroLegendRow({
  color,
  label,
  value,
  sub,
}: MacroLegendRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-subhead text-label">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-headline font-semibold leading-tight text-label">
          {value}
        </div>
        <div className="text-caption-1 text-label-secondary">{sub}</div>
      </div>
    </div>
  );
}
// components/Sparkline.tsx — minigráfico SVG de tendencia (7 puntos)

interface SparklineProps {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}

export default function Sparkline({
  values,
  color,
  width = 110,
  height = 40,
}: SparklineProps) {
  const n = values.length;
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = n <= 1 ? 0 : (i / (n - 1)) * width;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return { x, y };
  });
  const poly = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={poly}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <circle cx={last.x} cy={last.y} r={2.5} fill={color} />
      )}
    </svg>
  );
}
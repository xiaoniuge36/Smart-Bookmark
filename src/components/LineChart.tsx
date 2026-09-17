import { useT } from "@/lib/i18n";

interface Point {
  label: string;
  count: number;
}

export default function LineChart({
  data,
  height = 120,
}: {
  data: Point[];
  height?: number;
}) {
  const t = useT();
  if (data.length === 0) {
    return <div className="text-xs text-muted-foreground">{t("common.noData")}</div>;
  }
  const width = 440;
  const padding = { left: 28, right: 12, top: 8, bottom: 22 };
  const iw = width - padding.left - padding.right;
  const ih = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.count), 1);
  const stepX = iw / Math.max(1, data.length - 1);
  const coords = data.map((d, i) => {
    const x = padding.left + stepX * i;
    const y = padding.top + ih - (d.count / max) * ih;
    return { x, y, ...d };
  });
  const pathD = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const areaD =
    pathD +
    ` L${coords[coords.length - 1].x.toFixed(1)},${padding.top + ih} L${coords[0].x.toFixed(1)},${padding.top + ih} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
    >
      <defs>
        <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const y = padding.top + ih * r;
        return (
          <line
            key={i}
            x1={padding.left}
            x2={width - padding.right}
            y1={y}
            y2={y}
            className="stroke-muted-foreground/20"
            strokeDasharray="2 3"
          />
        );
      })}
      {coords.map((c, i) => (
        <text
          key={`x-${i}`}
          x={c.x}
          y={height - 6}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {c.label}
        </text>
      ))}
      <path
        d={areaD}
        fill="url(#lc-grad)"
        className="text-primary"
        stroke="none"
      />
      <path
        d={pathD}
        fill="none"
        className="stroke-primary"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {coords.map((c) => (
        <circle
          key={`d-${c.label}`}
          cx={c.x}
          cy={c.y}
          r={3}
          className="fill-background stroke-primary"
          strokeWidth={2}
        >
          <title>{`${c.label}: ${c.count}`}</title>
        </circle>
      ))}
      <text
        x={padding.left - 6}
        y={padding.top + 6}
        textAnchor="end"
        className="fill-muted-foreground text-[10px]"
      >
        {max}
      </text>
    </svg>
  );
}

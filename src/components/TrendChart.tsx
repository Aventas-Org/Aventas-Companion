import type { TrendPoint } from '../services/matchStats';

interface TrendChartProps {
  points: TrendPoint[];
  /** Chart height in pixels. */
  height?: number;
  /** Chart width. Use 100% for responsive container. */
  width?: string | number;
}

const CHART_HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 28, left: 8 };

/**
 * Lightweight SVG line/bar chart for performance trends.
 * No external charting dependency is used.
 */
export function TrendChart({ points, height = CHART_HEIGHT, width = '100%' }: TrendChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-ink-muted" style={{ height }}>
        No data to chart.
      </div>
    );
  }

  // Determine value range for scaling.
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    if (p.value < min) min = p.value;
    if (p.value > max) max = p.value;
  }

  // Avoid flat-line division by zero.
  if (min === max) {
    min = min - 1;
    max = max + 1;
  }

  const innerWidth = 480; // viewBox width for scaling
  const innerHeight = height;
  const plotWidth = innerWidth - PADDING.left - PADDING.right;
  const plotHeight = innerHeight - PADDING.top - PADDING.bottom;

  const xStep = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const yScale = (value: number) =>
    PADDING.top + plotHeight - ((value - min) / (max - min)) * plotHeight;

  const coords = points.map((p, i) => ({
    x: PADDING.left + i * xStep,
    y: yScale(p.value),
  }));

  // Build an SVG path string for the line.
  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  // Build an area path under the line.
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(innerHeight - PADDING.bottom).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(innerHeight - PADDING.bottom).toFixed(1)} Z`;

  // Y-axis guide lines (3 lines).
  const yGuides = [0, 0.5, 1].map((t) => {
    const y = PADDING.top + plotHeight * t;
    const value = max - (max - min) * t;
    return { y, value };
  });

  return (
    <svg
      viewBox={`0 0 ${innerWidth} ${innerHeight}`}
      width={width}
      height={height}
      role="img"
      aria-label="Performance trend chart"
      className="overflow-visible"
    >
      {/* Grid lines */}
      {yGuides.map((g, i) => (
        <g key={i}>
          <line
            x1={PADDING.left}
            y1={g.y}
            x2={innerWidth - PADDING.right}
            y2={g.y}
            style={{ stroke: 'rgb(var(--color-ink) / 0.10)' }}
            strokeWidth="1"
          />
          <text
            x={PADDING.left - 4}
            y={g.y + 3}
            textAnchor="end"
            style={{ fill: 'rgb(var(--color-ink-muted))' }}
            fontSize="10"
            fontFamily="ui-sans-serif, system-ui"
          >
            {Math.round(g.value)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#trendGrad)" opacity="0.25" />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'rgb(var(--color-accent))' }} />
          <stop offset="100%" style={{ stopColor: 'rgb(var(--color-accent))' }} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        style={{ stroke: 'rgb(var(--color-accent))' }}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {coords.map((c, i) => {
        const point = points[i];
        const color = point.result === 'victory' ? '#34d399' : '#f87171';
        return (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r="3.5"
              fill={color}
              style={{ stroke: 'rgb(var(--color-panel))' }}
              strokeWidth="1.5"
            >
              <title>{`${point.label}: ${point.value} (${point.result ?? 'n/a'})`}</title>
            </circle>
          </g>
        );
      })}

      {/* X-axis labels (show up to 10 labels to avoid crowding) */}
      {points.map((p, i) => {
        const c = coords[i];
        const showLabel = points.length <= 10 || i % Math.ceil(points.length / 10) === 0;
        if (!showLabel) return null;
        return (
          <text
            key={i}
            x={c.x}
            y={innerHeight - PADDING.bottom + 14}
            textAnchor="middle"
            style={{ fill: 'rgb(var(--color-ink-muted))' }}
            fontSize="9"
            fontFamily="ui-sans-serif, system-ui"
          >
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}

import type { FirstDuelCell } from '../services/analysisStats';
import { getMapLayout } from '../services/mapLayouts';

/** Which opening duels to plot. */
export type HeatMode = 'bloods' | 'deaths' | 'both';

const BLOOD_COLOR = '#34d399';
const DEATH_COLOR = '#f87171';

/**
 * Zone fills read from the palette variables so the schematic follows the
 * active theme instead of staying charcoal on a light preset. They have to be
 * applied as inline styles: `var()` inside an SVG presentation attribute is not
 * resolved, while the same value in `style` is.
 */
const ZONE_STYLES: Record<string, { fill: string; stroke: string }> = {
  site: {
    fill: 'rgb(var(--color-accent) / 0.10)',
    stroke: 'rgb(var(--color-accent) / 0.28)',
  },
  lane: { fill: 'rgb(var(--color-line) / 0.6)', stroke: 'rgb(var(--color-line))' },
  spawn: { fill: 'rgb(var(--color-panel))', stroke: 'rgb(var(--color-line))' },
};

interface MapHeatmapProps {
  map: string;
  cells: FirstDuelCell[];
  mode: HeatMode;
}

function isVisible(cell: FirstDuelCell, mode: HeatMode): boolean {
  if (mode === 'both') return true;
  return mode === 'bloods' ? cell.kind === 'first-blood' : cell.kind === 'first-death';
}

/**
 * Plots opening-duel coordinates onto a schematic top-down layout.
 *
 * Coordinates are normalized 0..1 in the same space the Riot API reports kill
 * positions, so swapping the schematic for real map art is a rendering change
 * only. Dense overlap reads as "hot" because each duel draws a soft radial blob
 * plus a crisp core marker.
 */
export function MapHeatmap({ map, cells, mode }: MapHeatmapProps) {
  const layout = getMapLayout(map);
  const visible = cells.filter((cell) => isVisible(cell, mode));
  const bloods = visible.filter((cell) => cell.kind === 'first-blood').length;
  const deaths = visible.length - bloods;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative w-full overflow-hidden rounded-lg border border-line bg-app"
        style={{ aspectRatio: '4 / 3' }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Opening duel heatmap for ${map}`}
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <filter id="aventas-heat-blur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.4" />
            </filter>
          </defs>

          {/* Schematic zones */}
          {layout.zones.map((zone) => {
            const style = ZONE_STYLES[zone.kind] ?? ZONE_STYLES.lane;
            return (
              <g key={zone.id}>
                <rect
                  x={zone.x * 100}
                  y={zone.y * 100}
                  width={zone.w * 100}
                  height={zone.h * 100}
                  rx={1.4}
                  style={{ fill: style.fill, stroke: style.stroke }}
                  strokeWidth={0.35}
                />
                <text
                  x={(zone.x + zone.w / 2) * 100}
                  y={(zone.y + zone.h / 2) * 100}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fill: 'rgb(var(--color-ink-muted))', letterSpacing: '0.02em' }}
                  fontSize={2.7}
                  fontFamily="ui-sans-serif, system-ui"
                >
                  {zone.label}
                </text>
              </g>
            );
          })}

          {/* Heat layer */}
          <g filter="url(#aventas-heat-blur)">
            {visible.map((cell, index) => (
              <circle
                key={`blur-${index}`}
                cx={cell.point.x * 100}
                cy={cell.point.y * 100}
                r={7}
                fill={cell.kind === 'first-blood' ? BLOOD_COLOR : DEATH_COLOR}
                opacity={0.32}
              />
            ))}
          </g>

          {/* Core markers */}
          {visible.map((cell, index) => (
            <g key={`core-${index}`}>
              <circle
                cx={cell.point.x * 100}
                cy={cell.point.y * 100}
                r={1.5}
                fill={cell.kind === 'first-blood' ? BLOOD_COLOR : DEATH_COLOR}
                style={{ stroke: 'rgb(var(--color-panel))' }}
                strokeWidth={0.35}
              >
                <title>
                  {`Round ${cell.round} · ${cell.zone} · ${cell.kind === 'first-blood' ? 'First blood' : 'First death'} · round ${cell.result}`}
                </title>
              </circle>
            </g>
          ))}

          {visible.length === 0 && (
            <text
              x={50}
              y={50}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fill: 'rgb(var(--color-ink-muted))' }}
              fontSize={3.4}
              fontFamily="ui-sans-serif, system-ui"
            >
              No opening duels recorded for this view
            </text>
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
        {(mode === 'both' || mode === 'bloods') && (
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: BLOOD_COLOR }}
              aria-hidden="true"
            />
            First bloods ({bloods})
          </span>
        )}
        {(mode === 'both' || mode === 'deaths') && (
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: DEATH_COLOR }}
              aria-hidden="true"
            />
            First deaths ({deaths})
          </span>
        )}
        <span className="text-ink-muted">
          {layout.zones.filter((zone) => zone.kind === 'site').length} sites · schematic layout
        </span>
      </div>
    </div>
  );
}

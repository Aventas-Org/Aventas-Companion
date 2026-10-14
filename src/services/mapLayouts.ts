import type { MapLayout, MapZone, SiteId } from '../types/analysis';

/**
 * Simplified top-down schematics for the maps in the demo dataset.
 *
 * These are intentionally schematic (normalized 0..1 rectangles, defenders at
 * the top) rather than pixel-accurate art: they give first-duel coordinates
 * spatial context without shipping copyrighted map imagery. A production build
 * would swap the zone rectangles for real top-down map renderings while keeping
 * the same normalized coordinate space the Riot API reports kills in.
 */
const LAYOUTS: MapLayout[] = [
  {
    map: 'Ascent',
    zones: [
      {
        id: 'defender-spawn',
        label: 'Def Spawn',
        x: 0.38,
        y: 0.04,
        w: 0.24,
        h: 0.09,
        kind: 'spawn',
      },
      { id: 'a-site', label: 'A Site', x: 0.7, y: 0.18, w: 0.24, h: 0.22, kind: 'site' },
      { id: 'a-heaven', label: 'A Heaven', x: 0.86, y: 0.02, w: 0.12, h: 0.12, kind: 'lane' },
      { id: 'catwalk', label: 'Catwalk', x: 0.42, y: 0.24, w: 0.14, h: 0.1, kind: 'lane' },
      { id: 'mid', label: 'Mid', x: 0.34, y: 0.4, w: 0.24, h: 0.2, kind: 'lane' },
      { id: 'a-main', label: 'A Main', x: 0.72, y: 0.62, w: 0.22, h: 0.16, kind: 'lane' },
      { id: 'b-site', label: 'B Site', x: 0.06, y: 0.2, w: 0.24, h: 0.22, kind: 'site' },
      { id: 'b-main', label: 'B Main', x: 0.06, y: 0.6, w: 0.22, h: 0.18, kind: 'lane' },
      {
        id: 'attacker-spawn',
        label: 'Atk Spawn',
        x: 0.36,
        y: 0.84,
        w: 0.26,
        h: 0.11,
        kind: 'spawn',
      },
    ],
    siteAnchor: { A: 'a-site', B: 'b-site', Mid: 'mid' },
  },
  {
    map: 'Bind',
    zones: [
      {
        id: 'defender-spawn',
        label: 'Def Spawn',
        x: 0.4,
        y: 0.04,
        w: 0.22,
        h: 0.09,
        kind: 'spawn',
      },
      { id: 'a-site', label: 'A Site', x: 0.62, y: 0.2, w: 0.26, h: 0.24, kind: 'site' },
      { id: 'a-short', label: 'A Short', x: 0.6, y: 0.52, w: 0.16, h: 0.16, kind: 'lane' },
      { id: 'baths', label: 'Baths', x: 0.82, y: 0.06, w: 0.14, h: 0.14, kind: 'lane' },
      { id: 'b-site', label: 'B Site', x: 0.08, y: 0.22, w: 0.26, h: 0.24, kind: 'site' },
      { id: 'hookah', label: 'Hookah', x: 0.26, y: 0.34, w: 0.16, h: 0.16, kind: 'lane' },
      { id: 'b-long', label: 'B Long', x: 0.04, y: 0.56, w: 0.18, h: 0.2, kind: 'lane' },
      { id: 'teleporter', label: 'Teleporter', x: 0.32, y: 0.62, w: 0.12, h: 0.12, kind: 'lane' },
      {
        id: 'attacker-spawn',
        label: 'Atk Spawn',
        x: 0.38,
        y: 0.82,
        w: 0.24,
        h: 0.11,
        kind: 'spawn',
      },
    ],
    siteAnchor: { A: 'a-site', B: 'b-site', Mid: 'hookah' },
  },
  {
    map: 'Icebox',
    zones: [
      {
        id: 'defender-spawn',
        label: 'Def Spawn',
        x: 0.38,
        y: 0.04,
        w: 0.24,
        h: 0.09,
        kind: 'spawn',
      },
      { id: 'a-site', label: 'A Site', x: 0.6, y: 0.16, w: 0.28, h: 0.24, kind: 'site' },
      { id: 'a-nest', label: 'A Nest', x: 0.82, y: 0.42, w: 0.14, h: 0.12, kind: 'lane' },
      { id: 'mid', label: 'Mid', x: 0.34, y: 0.42, w: 0.22, h: 0.2, kind: 'lane' },
      { id: 'b-site', label: 'B Site', x: 0.06, y: 0.18, w: 0.24, h: 0.24, kind: 'site' },
      { id: 'b-kitchen', label: 'Kitchen', x: 0.06, y: 0.46, w: 0.18, h: 0.16, kind: 'lane' },
      { id: 'tube', label: 'Tube', x: 0.38, y: 0.66, w: 0.14, h: 0.12, kind: 'lane' },
      { id: 'snowman', label: 'Snowman', x: 0.66, y: 0.62, w: 0.16, h: 0.14, kind: 'lane' },
      {
        id: 'attacker-spawn',
        label: 'Atk Spawn',
        x: 0.34,
        y: 0.84,
        w: 0.26,
        h: 0.11,
        kind: 'spawn',
      },
    ],
    siteAnchor: { A: 'a-site', B: 'b-site', Mid: 'mid' },
  },
  {
    map: 'Lotus',
    zones: [
      {
        id: 'defender-spawn',
        label: 'Def Spawn',
        x: 0.4,
        y: 0.04,
        w: 0.22,
        h: 0.08,
        kind: 'spawn',
      },
      { id: 'a-site', label: 'A Site', x: 0.72, y: 0.18, w: 0.24, h: 0.22, kind: 'site' },
      { id: 'b-site', label: 'B Site', x: 0.38, y: 0.16, w: 0.22, h: 0.2, kind: 'site' },
      { id: 'c-site', label: 'C Site', x: 0.06, y: 0.18, w: 0.24, h: 0.22, kind: 'site' },
      { id: 'a-main', label: 'A Main', x: 0.74, y: 0.6, w: 0.2, h: 0.16, kind: 'lane' },
      { id: 'mid', label: 'Mid', x: 0.38, y: 0.44, w: 0.22, h: 0.16, kind: 'lane' },
      { id: 'tree', label: 'Tree', x: 0.36, y: 0.66, w: 0.14, h: 0.12, kind: 'lane' },
      { id: 'c-main', label: 'C Main', x: 0.06, y: 0.58, w: 0.2, h: 0.16, kind: 'lane' },
      {
        id: 'attacker-spawn',
        label: 'Atk Spawn',
        x: 0.38,
        y: 0.84,
        w: 0.24,
        h: 0.1,
        kind: 'spawn',
      },
    ],
    siteAnchor: { A: 'a-site', B: 'b-site', C: 'c-site', Mid: 'mid' },
  },
  {
    map: 'Haven',
    zones: [
      {
        id: 'defender-spawn',
        label: 'Def Spawn',
        x: 0.4,
        y: 0.04,
        w: 0.22,
        h: 0.08,
        kind: 'spawn',
      },
      { id: 'a-site', label: 'A Site', x: 0.72, y: 0.2, w: 0.24, h: 0.22, kind: 'site' },
      { id: 'b-site', label: 'B Site', x: 0.38, y: 0.18, w: 0.22, h: 0.2, kind: 'site' },
      { id: 'c-site', label: 'C Site', x: 0.06, y: 0.2, w: 0.24, h: 0.22, kind: 'site' },
      { id: 'a-long', label: 'A Long', x: 0.76, y: 0.62, w: 0.18, h: 0.16, kind: 'lane' },
      { id: 'mid', label: 'Mid', x: 0.38, y: 0.46, w: 0.2, h: 0.14, kind: 'lane' },
      { id: 'garage', label: 'Garage', x: 0.28, y: 0.52, w: 0.14, h: 0.12, kind: 'lane' },
      { id: 'c-long', label: 'C Long', x: 0.06, y: 0.6, w: 0.18, h: 0.16, kind: 'lane' },
      {
        id: 'attacker-spawn',
        label: 'Atk Spawn',
        x: 0.38,
        y: 0.84,
        w: 0.24,
        h: 0.1,
        kind: 'spawn',
      },
    ],
    siteAnchor: { A: 'a-site', B: 'b-site', C: 'c-site', Mid: 'mid' },
  },
];

const BY_NAME = new Map(LAYOUTS.map((layout) => [layout.map, layout]));

/** All available schematic layouts. */
export const MAP_LAYOUTS: MapLayout[] = LAYOUTS;

/**
 * Returns the schematic layout for a map, falling back to Ascent's layout when
 * an unknown map is requested so the UI never renders an empty canvas.
 */
export function getMapLayout(map: string): MapLayout {
  return BY_NAME.get(map) ?? LAYOUTS[0];
}

/** Every map name that has a schematic layout. */
export function getLayoutMaps(): string[] {
  return LAYOUTS.map((layout) => layout.map);
}

/** Resolves the zone id an opening duel should be biased toward for a site. */
export function getSiteAnchor(layout: MapLayout, site: SiteId): MapZone | undefined {
  const anchorId = layout.siteAnchor[site];
  if (!anchorId) return undefined;
  return layout.zones.find((zone) => zone.id === anchorId);
}

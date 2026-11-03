export type NavId =
  | 'overview'
  | 'live'
  | 'directory'
  | 'performance'
  | 'benchmark'
  | 'insights'
  | 'matches'
  | 'tournaments'
  | 'utilities'
  | 'profile'
  | 'statistics'
  | 'settings';

export interface NavItem {
  id: NavId;
  label: string;
  /** Whether the section is implemented. Disabled items are shown but not actionable. */
  enabled: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', enabled: true },
  { id: 'live', label: 'Live Tracker', enabled: true },
  { id: 'directory', label: 'Player Directory', enabled: true },
  { id: 'performance', label: 'Demo: Round Analysis', enabled: true },
  { id: 'benchmark', label: 'Demo: Benchmark', enabled: true },
  { id: 'insights', label: 'Demo: Insights', enabled: true },
  { id: 'matches', label: 'Demo: Matches', enabled: true },
  { id: 'tournaments', label: 'Tournaments', enabled: true },
  { id: 'utilities', label: 'Gaming Utilities', enabled: true },
  { id: 'profile', label: 'Riot ID Preview', enabled: true },
  { id: 'statistics', label: 'Demo: Statistics', enabled: true },
  { id: 'settings', label: 'Settings', enabled: true },
];

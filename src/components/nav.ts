export type NavId =
  | 'overview'
  | 'performance'
  | 'benchmark'
  | 'insights'
  | 'matches'
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
  { id: 'performance', label: 'Round Analysis', enabled: true },
  { id: 'benchmark', label: 'Rank Benchmark', enabled: true },
  { id: 'insights', label: 'Insights', enabled: true },
  { id: 'matches', label: 'Matches', enabled: true },
  { id: 'profile', label: 'Profile', enabled: true },
  { id: 'statistics', label: 'Statistics', enabled: true },
  { id: 'settings', label: 'Settings', enabled: true },
];

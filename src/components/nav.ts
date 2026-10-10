export type NavId = 'overview' | 'matches' | 'profile' | 'statistics' | 'settings';

export interface NavItem {
  id: NavId;
  label: string;
  /** Whether the section is implemented. Disabled items are shown but not actionable. */
  enabled: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', enabled: true },
  { id: 'profile', label: 'Profile', enabled: true },
  { id: 'matches', label: 'Matches', enabled: true },
  { id: 'statistics', label: 'Statistics', enabled: false },
  { id: 'settings', label: 'Settings', enabled: false },
];

export interface MomentumMap {
  id: number;
  name: string;
  gamemode: string;
  tier: number | null;
  authors: string[];
  thumbnail: string;
  description: string;
  isLinear: boolean | null;
  releaseDate: string | null;
  dashboardUrl: string;
}

export type GameModeFilter =
  | 'All'
  | 'Surf'
  | 'Bhop'
  | 'KZ'
  | 'Rocket Jump'
  | 'Sticky Jump'
  | 'Ahop'
  | 'Parkour'
  | 'Conc'
  | 'Defrag'
  | 'Other';

export type TierFilter = 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7+';

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'tier-asc'
  | 'tier-desc'
  | 'newest';

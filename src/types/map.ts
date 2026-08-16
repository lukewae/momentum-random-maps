export interface MapBonus {
  bonusNum: number;
  tier: number | null;
  isRanked: boolean;
}

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
  isRanked: boolean;
  bonuses: MapBonus[];
}

export type GameModeFilter =
  | 'All'
  | 'Surf'
  | 'Bhop'
  | '1.6 KZ'
  | 'KZT'
  | 'Rocket Jump'
  | 'Sticky Jump'
  | 'Ahop'
  | 'Conc'
  | 'Defrag'
  | 'Tricks'
  | 'Other';

export type TrackTypeFilter = 'main' | 'all' | 'bonus_only';
export type RankedFilter = 'all' | 'ranked' | 'unranked';
export type SortOption = 'name-asc' | 'name-desc' | 'tier-asc' | 'tier-desc' | 'newest';

export interface RollableItem {
  map: MomentumMap;
  isBonus: boolean;
  bonusNum?: number;
  effectiveTier: number | null;
  effectiveRanked: boolean;
  displayName: string;
}

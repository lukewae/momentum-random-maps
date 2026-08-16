import { GameModeFilter } from '@/types/map';

export const GAMEMODE_LIST: GameModeFilter[] = [
  'All',
  'Surf',
  'Bhop',
  '1.6 KZ',
  'KZT',
  'Rocket Jump',
  'Sticky Jump',
  'Ahop',
  'Conc',
  'Defrag',
  'Tricks',
];

export function getGamemodeBadgeStyle(_mode: string): { bg: string; text: string; border: string } {
  return {
    bg: 'bg-neutral-900',
    text: 'text-neutral-200',
    border: 'border-neutral-700',
  };
}

export function getTierBadgeStyle(tier: number | null): { label: string; color: string; border: string; bg: string } {
  if (tier === null) {
    return {
      label: 'Unranked',
      color: 'text-neutral-400',
      border: 'border-neutral-800',
      bg: 'bg-neutral-950',
    };
  }
  return {
    label: `Tier ${tier}`,
    color: 'text-white',
    border: 'border-neutral-700',
    bg: 'bg-neutral-900',
  };
}

import { MomentumMap } from './map';

export interface CompletedChallengeMap {
  map: MomentumMap;
  durationSeconds: number;
  completedAt: string;
}

export interface TimedChallengeState {
  isActive: boolean;
  isPaused: boolean;
  durationMinutes: number;
  timeRemainingSeconds: number;
  completedMaps: CompletedChallengeMap[];
  skippedCount: number;
  currentMapStartTime: number;
}

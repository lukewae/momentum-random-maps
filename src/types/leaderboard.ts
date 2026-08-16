export interface LeaderboardEntry {
  id: string;
  runnerName: string;
  durationMinutes: number;
  mapsBeaten: number;
  skippedCount: number;
  createdAt: string;
  maps: Array<{
    name: string;
    mode: string;
    tier: number | null;
    timeSeconds: number;
  }>;
}

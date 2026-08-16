import fs from 'fs';
import path from 'path';

interface ApiMapCredit {
  type: number;
  description?: string | null;
  user?: {
    alias: string;
    avatarURL?: string;
  };
}

interface ApiLeaderboard {
  gamemode: number;
  trackType: number; // 0 = Main, 1 = Stage, 2 = Bonus
  trackNum: number;
  tier?: number | null;
  linear?: boolean | null;
  type?: number; // 0 = Ranked, 1 = Unranked, 2 = Hidden
}

interface ApiMapItem {
  id: number;
  name: string;
  status: number;
  info?: {
    description?: string;
    creationDate?: string;
    approvedDate?: string;
  };
  thumbnail?: {
    small?: string;
    medium?: string;
    large?: string;
    xl?: string;
  };
  images?: Array<{
    small?: string;
    medium?: string;
    large?: string;
  }>;
  credits?: ApiMapCredit[];
  leaderboards?: ApiLeaderboard[];
  createdAt?: string;
}

const GAMEMODE_NAMES: Record<number, string> = {
  1: 'Surf',
  2: 'Bhop',
  3: 'KZ',
  4: 'Rocket Jump',
  5: 'Sticky Jump',
  6: 'Ahop',
  7: 'Parkour',
  8: 'Conc',
  9: 'Defrag',
  10: 'Tricks',
};

function inferGamemode(name: string, apiGamemode?: number): string {
  if (apiGamemode && GAMEMODE_NAMES[apiGamemode]) {
    return GAMEMODE_NAMES[apiGamemode];
  }
  const lower = name.toLowerCase();
  if (lower.startsWith('surf_')) return 'Surf';
  if (lower.startsWith('bhop_')) return 'Bhop';
  if (lower.startsWith('kz_') || lower.startsWith('xc_') || lower.startsWith('bkz_') || lower.startsWith('kzpro_')) return 'KZ';
  if (lower.startsWith('rj_') || lower.startsWith('jump_')) return 'Rocket Jump';
  if (lower.startsWith('sj_')) return 'Sticky Jump';
  if (lower.startsWith('ahop_')) return 'Ahop';
  if (lower.startsWith('pk_') || lower.startsWith('tr_')) return 'Parkour';
  if (lower.startsWith('conc_')) return 'Conc';
  if (lower.startsWith('df_') || lower.startsWith('cpm')) return 'Defrag';
  return 'Other';
}

export interface MapBonus {
  bonusNum: number;
  tier: number | null;
  isRanked: boolean;
}

export interface CleanMap {
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

async function syncMaps() {
  console.log('🚀 Starting Momentum Mod map sync with Bonus tracks & Ranked flags...');
  const baseUrl = 'https://api.momentum-mod.org/v1/maps';
  const take = 100;
  let skip = 0;
  let totalCount = Infinity;
  const allMaps: CleanMap[] = [];

  while (skip < totalCount) {
    const url = `${baseUrl}?take=${take}&skip=${skip}&expand=info,credits,leaderboards`;
    console.log(`Fetching batch: skip=${skip}...`);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'MomentumRandomizerSync/1.0',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      totalCount = json.totalCount || 0;
      const data: ApiMapItem[] = json.data || [];

      if (data.length === 0) break;

      for (const item of data) {
        const primaryLb =
          item.leaderboards?.find((l) => l.trackType === 0 && l.trackNum === 1 && l.tier != null) ||
          item.leaderboards?.find((l) => l.trackType === 0) ||
          item.leaderboards?.[0];

        const gamemode = inferGamemode(item.name, primaryLb?.gamemode);
        const tier = primaryLb?.tier != null ? primaryLb.tier : null;
        
        // Ranked status of main track
        const isRanked = item.leaderboards?.some((l) => l.trackType === 0 && l.type === 0) ?? false;

        // Parse Bonus tracks (trackType === 2)
        const bonusMap = new Map<number, MapBonus>();
        if (item.leaderboards && Array.isArray(item.leaderboards)) {
          for (const lb of item.leaderboards) {
            if (lb.trackType === 2 && lb.trackNum > 0) {
              const existing = bonusMap.get(lb.trackNum);
              // Prefer bonus record matching the primary gamemode or with non-null tier
              if (!existing || (existing.tier == null && lb.tier != null)) {
                bonusMap.set(lb.trackNum, {
                  bonusNum: lb.trackNum,
                  tier: lb.tier != null ? lb.tier : null,
                  isRanked: lb.type === 0,
                });
              }
            }
          }
        }

        const bonuses = Array.from(bonusMap.values()).sort((a, b) => a.bonusNum - b.bonusNum);

        // Authors from credits
        const authors: string[] = [];
        if (item.credits && Array.isArray(item.credits)) {
          for (const c of item.credits) {
            if (c.user?.alias && !authors.includes(c.user.alias)) {
              authors.push(c.user.alias);
            }
          }
        }

        const thumb =
          item.thumbnail?.large ||
          item.thumbnail?.medium ||
          item.thumbnail?.small ||
          item.images?.[0]?.large ||
          item.images?.[0]?.medium ||
          item.images?.[0]?.small ||
          '';

        const clean: CleanMap = {
          id: item.id,
          name: item.name,
          gamemode,
          tier,
          authors: authors.length > 0 ? authors : ['Unknown'],
          thumbnail: thumb,
          description: item.info?.description?.trim() || '',
          isLinear: primaryLb?.linear ?? null,
          releaseDate: item.info?.approvedDate || item.info?.creationDate || item.createdAt || null,
          dashboardUrl: `https://dashboard.momentum-mod.org/maps/${item.id}`,
          isRanked,
          bonuses,
        };

        allMaps.push(clean);
      }

      skip += take;
    } catch (err: any) {
      console.error(`Error during sync batch: ${err.message}`);
      break;
    }
  }

  console.log(`✅ Fetched ${allMaps.length} maps total!`);

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outPath = path.join(dataDir, 'maps.json');
  fs.writeFileSync(outPath, JSON.stringify(allMaps, null, 2), 'utf-8');
  console.log(`💾 Saved updated map database with bonuses to: ${outPath}`);
}

syncMaps().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});

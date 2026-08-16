'use client';

import React, { useState, useEffect } from 'react';
import rawMapsData from '@/data/maps.json';
import { MomentumMap } from '@/types/map';
import { Header } from '@/components/Header';
import { HeroRandomizer } from '@/components/HeroRandomizer';
import { MapList } from '@/components/MapList';

const mapsData = rawMapsData as MomentumMap[];

const fallbackMap: MomentumMap = {
  id: 0,
  name: 'surf_beginner',
  gamemode: 'Surf',
  tier: 1,
  authors: ['Momentum Team'],
  thumbnail: '',
  description: 'Welcome to Momentum Mod map picker.',
  isLinear: false,
  releaseDate: null,
  dashboardUrl: 'https://dashboard.momentum-mod.org/maps',
  isRanked: true,
  bonuses: [],
};

export default function Home() {
  // Deterministic initial state for SSR/client match
  const [selectedMap, setSelectedMap] = useState<MomentumMap>(mapsData[0] || fallbackMap);

  // Pick a random featured map on initial client mount without hydration mismatch
  useEffect(() => {
    if (mapsData.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(mapsData.length, 50));
      setSelectedMap(mapsData[randomIndex]);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-neutral-100 selection:bg-white selection:text-black">
      {/* Top Navigation */}
      <Header totalMaps={mapsData.length} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Hero Randomizer Section */}
        <HeroRandomizer
          allMaps={mapsData}
          selectedMap={selectedMap}
          onSelectMap={setSelectedMap}
        />

        {/* Map Explorer Section */}
        <MapList
          maps={mapsData}
          selectedMap={selectedMap}
          onSelectMap={setSelectedMap}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-[#080808] py-6 px-4 sm:px-6 lg:px-8 text-xs font-mono text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>Momentum Mod Map Picker — </span>
            <a
              href="https://momentum-mod.org"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-white underline"
            >
              momentum-mod.org
            </a>
          </div>

          <div className="text-neutral-600">
            Local database • {mapsData.length.toLocaleString()} maps
          </div>
        </div>
      </footer>
    </div>
  );
}

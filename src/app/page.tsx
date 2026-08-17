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
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-neutral-900 border border-neutral-800 text-neutral-400">
              Unofficial
            </span>
            <span>Momentum Mod Map Picker</span>
            <span className="text-neutral-700">•</span>
            <span>by</span>
            <a
              href="https://github.com/lukewae"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white font-semibold transition-colors group"
            >
              <span>lukewae</span>
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-400 group-hover:text-white transition-colors inline-block"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
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

'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { soundFx } from '@/lib/audio';

interface HeaderProps {
  totalMaps: number;
}

export function Header({ totalMaps }: HeaderProps) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(soundFx.isMuted());
  }, []);

  const handleToggleMute = () => {
    const isMuted = soundFx.toggleMute();
    setMuted(isMuted);
  };

  return (
    <header className="border-b border-neutral-800 bg-[#0a0a0a] sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Text Only */}
        <div>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-white font-mono uppercase">
            Momentum Mod <span className="text-neutral-400 font-normal">/ Map Picker</span>
          </h1>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Map Counter */}
          <div className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-400">
            <span className="text-white font-semibold">{totalMaps.toLocaleString()}</span> maps
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            title={muted ? 'Enable sound' : 'Mute sound'}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-mono text-neutral-300 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-neutral-500" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
            <span className="hidden sm:inline">{muted ? 'SFX: OFF' : 'SFX: ON'}</span>
          </button>

          {/* Dashboard Link */}
          <a
            href="https://dashboard.momentum-mod.org/maps"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
          >
            <span>Dashboard</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>
        </div>
      </div>
    </header>
  );
}

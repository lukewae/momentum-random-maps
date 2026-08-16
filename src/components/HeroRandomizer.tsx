'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
  Terminal,
  User,
} from 'lucide-react';
import { MomentumMap, GameModeFilter } from '@/types/map';
import { GAMEMODE_LIST, getGamemodeBadgeStyle, getTierBadgeStyle } from '@/lib/constants';
import { soundFx } from '@/lib/audio';
import { TierRangeSlider } from '@/components/TierRangeSlider';

interface HeroRandomizerProps {
  allMaps: MomentumMap[];
  selectedMap: MomentumMap | null;
  onSelectMap: (map: MomentumMap) => void;
}

export function HeroRandomizer({ allMaps, selectedMap, onSelectMap }: HeroRandomizerProps) {
  const [selectedModes, setSelectedModes] = useState<string[]>(['All']);
  const [tierRange, setTierRange] = useState<[number, number]>([1, 10]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingDisplayMap, setRollingDisplayMap] = useState<MomentumMap | null>(selectedMap);
  const [copiedConsole, setCopiedConsole] = useState(false);
  const [copiedName, setCopiedName] = useState(false);
  const [rollCount, setRollCount] = useState(0);

  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync display map when selectedMap changes
  useEffect(() => {
    if (!isRolling && selectedMap) {
      setRollingDisplayMap(selectedMap);
    }
  }, [selectedMap, isRolling]);

  const isAllModes = selectedModes.includes('All') || selectedModes.length === 0;

  // Toggle gamemode in multi-select
  const handleToggleMode = (mode: GameModeFilter) => {
    soundFx.playBlip(500, 0.03, 'sine');
    if (mode === 'All') {
      setSelectedModes(['All']);
      return;
    }

    if (isAllModes) {
      setSelectedModes([mode]);
      return;
    }

    if (selectedModes.includes(mode)) {
      const updated = selectedModes.filter((m) => m !== mode);
      if (updated.length === 0) {
        setSelectedModes(['All']);
      } else {
        setSelectedModes(updated);
      }
    } else {
      setSelectedModes([...selectedModes, mode]);
    }
  };

  // Filter pool based on roll criteria
  const getFilteredPool = useCallback(() => {
    const isAll = selectedModes.includes('All') || selectedModes.length === 0;
    const [minT, maxT] = tierRange;

    return allMaps.filter((m) => {
      if (!isAll) {
        const matchesMode = selectedModes.some(
          (sm) => sm.toLowerCase() === m.gamemode.toLowerCase()
        );
        if (!matchesMode) return false;
      }

      // Check Tier Range
      if (m.tier !== null) {
        if (m.tier < minT || m.tier > maxT) return false;
      }

      return true;
    });
  }, [allMaps, selectedModes, tierRange]);

  // Roll execution
  const handleRoll = useCallback(() => {
    if (isRolling || allMaps.length === 0) return;

    const pool = getFilteredPool();
    if (pool.length === 0) {
      const modeLabel = isAllModes ? 'all modes' : selectedModes.join(' / ');
      alert(`No maps found for [${modeLabel}] in Tier ${tierRange[0]}–${tierRange[1]}. Try broadening your range!`);
      return;
    }

    setIsRolling(true);
    soundFx.playBlip(320, 0.05, 'triangle');

    const chosenIndex = Math.floor(Math.random() * pool.length);
    const chosenMap = pool[chosenIndex];

    const totalTicks = 14;
    let currentTick = 0;
    const intervalDuration = 60;

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

    rollIntervalRef.current = setInterval(() => {
      currentTick++;
      const tempMap = pool[Math.floor(Math.random() * pool.length)];
      setRollingDisplayMap(tempMap);
      soundFx.playTick(1 + currentTick * 0.05);

      if (currentTick >= totalTicks) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        setRollingDisplayMap(chosenMap);
        onSelectMap(chosenMap);
        setIsRolling(false);
        setRollCount((prev) => prev + 1);
        soundFx.playLockWinner((chosenMap.tier ?? 0) >= 5);
      }
    }, intervalDuration);
  }, [isRolling, allMaps, getFilteredPool, isAllModes, selectedModes, tierRange, onSelectMap]);

  // Keyboard shortcut listener (Space or R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.code === 'Space' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRoll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRoll]);

  const copyConsoleCommand = (mapName: string) => {
    const cmd = `map ${mapName}`;
    navigator.clipboard.writeText(cmd);
    soundFx.playCopySound();
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  const copyMapNameOnly = (mapName: string) => {
    navigator.clipboard.writeText(mapName);
    soundFx.playCopySound();
    setCopiedName(true);
    setTimeout(() => setCopiedName(false), 2000);
  };

  const activeMap = rollingDisplayMap || allMaps[0];
  const gamemodeBadge = activeMap ? getGamemodeBadgeStyle(activeMap.gamemode) : null;
  const tierBadge = activeMap ? getTierBadgeStyle(activeMap.tier) : null;
  const filteredPoolCount = getFilteredPool().length;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      {/* Control Deck: Gamemode & Tier Selection */}
      <div className="mb-6 p-4 bg-[#111111] border border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          
          {/* Multi-Select Game Mode Filters */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                <span>Filter Modes (Multi-Select)</span>
              </div>
              {!isAllModes && (
                <button
                  onClick={() => handleToggleMode('All')}
                  className="text-[11px] font-mono text-neutral-500 hover:text-white underline cursor-pointer"
                >
                  Reset to All
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {GAMEMODE_LIST.map((mode) => {
                const isSelected = mode === 'All' ? isAllModes : selectedModes.includes(mode);
                return (
                  <button
                    key={mode}
                    onClick={() => handleToggleMode(mode)}
                    className={`px-3 py-1.5 text-xs font-mono font-medium transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Black & White Dual Drag Tier Range Slider */}
          <div className="lg:w-80 flex flex-col pt-1">
            <TierRangeSlider
              minTier={tierRange[0]}
              maxTier={tierRange[1]}
              minLimit={1}
              maxLimit={10}
              onChange={setTierRange}
              label="Tier Range"
            />
          </div>
        </div>
      </div>

      {/* Main Roll Action Button Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <button
          onClick={handleRoll}
          disabled={isRolling}
          className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-mono text-sm sm:text-base font-bold tracking-widest uppercase transition-colors cursor-pointer border ${
            isRolling
              ? 'bg-neutral-800 text-neutral-300 border-neutral-600'
              : 'bg-white hover:bg-neutral-200 text-black border-white active:bg-neutral-300'
          }`}
        >
          <span>{isRolling ? 'ROLLING...' : 'ROLL RANDOM MAP'}</span>
          <span className="hidden md:inline-block px-2 py-0.5 text-xs font-mono font-normal tracking-normal border border-black/20 bg-black/5 text-black">
            [SPACE] or [R]
          </span>
        </button>

        {/* Status Counter */}
        <div className="flex items-center justify-between sm:justify-start gap-3 text-xs font-mono text-neutral-400 px-4 py-4 bg-[#111111] border border-neutral-800 whitespace-nowrap">
          <div>
            <span className="text-white font-semibold">{filteredPoolCount.toLocaleString()}</span> maps in pool
          </div>
          {rollCount > 0 && (
            <>
              <span className="text-neutral-700">|</span>
              <span className="text-neutral-300">{rollCount} rolled</span>
            </>
          )}
        </div>
      </div>

      {/* Featured / Selected Map Card */}
      {activeMap && (
        <div className="border border-neutral-800 bg-[#111111]">
          {/* Banner with Map Preview Image */}
          <div className="relative w-full h-64 sm:h-80 md:h-96 bg-black overflow-hidden">
            {activeMap.thumbnail ? (
              <Image
                src={activeMap.thumbnail}
                alt={activeMap.name}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className={`object-cover object-center transition-opacity duration-300 ${
                  isRolling ? 'opacity-40' : 'opacity-80'
                }`}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                No preview image available
              </div>
            )}

            {/* Dark gradient vignettes */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/80 via-transparent to-[#111111]/80" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Gamemode */}
                {gamemodeBadge && (
                  <span className="px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-black/80 border border-neutral-700 text-white">
                    {activeMap.gamemode}
                  </span>
                )}

                {/* Tier */}
                {tierBadge && (
                  <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-black/80 border border-neutral-700 text-neutral-200">
                    {tierBadge.label}
                  </span>
                )}

                {/* Linear/Staged */}
                {activeMap.isLinear !== null && (
                  <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-mono bg-black/80 border border-neutral-700 text-neutral-300">
                    {activeMap.isLinear ? 'Linear' : 'Staged'}
                  </span>
                )}
              </div>

              {/* Map ID */}
              <div>
                <span className="text-xs font-mono text-neutral-400 bg-black/80 px-2 py-1 border border-neutral-800">
                  #{activeMap.id}
                </span>
              </div>
            </div>

            {/* Map Title & Author (Inside Image Bottom) */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h2
                    onClick={() => copyMapNameOnly(activeMap.name)}
                    title="Click to copy map name"
                    className="text-2xl sm:text-4xl md:text-5xl font-bold font-mono tracking-tight text-white hover:text-neutral-300 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {activeMap.name}
                    <button
                      aria-label="Copy map name"
                      className="text-neutral-400 hover:text-white transition-colors p-1"
                    >
                      {copiedName ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Copy className="w-5 h-5 opacity-60 hover:opacity-100" />
                      )}
                    </button>
                  </h2>
                </div>

                {activeMap.authors && activeMap.authors.length > 0 && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-neutral-300">
                    <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="text-neutral-500">By</span>
                    <span className="text-white font-medium truncate">
                      {activeMap.authors.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details & Actions Footer */}
          <div className="p-4 sm:p-5 bg-[#0a0a0a] border-t border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Description */}
            <div className="flex-1 text-xs sm:text-sm text-neutral-400 line-clamp-2 max-w-2xl font-mono">
              {activeMap.description ? (
                <p>{activeMap.description}</p>
              ) : (
                <p className="text-neutral-500">
                  Ready to play. Use the console command to launch directly in Momentum Mod.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              
              {/* Copy Console Command */}
              <button
                onClick={() => copyConsoleCommand(activeMap.name)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wide transition-colors cursor-pointer border ${
                  copiedConsole
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-700 hover:border-neutral-500'
                }`}
                title="Copy launch command to clipboard"
              >
                {copiedConsole ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>COPIED `map {activeMap.name}`</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                    <span>COPY COMMAND (`map {activeMap.name}`)</span>
                  </>
                )}
              </button>

              {/* View Dashboard */}
              <a
                href={activeMap.dashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-xs font-mono text-neutral-300 hover:text-white transition-colors"
                title="View on Momentum Mod Dashboard"
              >
                <span>Dashboard</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </a>

              {/* Reroll */}
              <button
                onClick={handleRoll}
                disabled={isRolling}
                className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Roll another"
                aria-label="Roll another"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

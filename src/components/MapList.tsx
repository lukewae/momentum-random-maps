'use client';

import React, { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Search,
  X,
  User,
  ExternalLink,
  Terminal,
  Check,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { MomentumMap, GameModeFilter, SortOption } from '@/types/map';
import { GAMEMODE_LIST } from '@/lib/constants';
import { soundFx } from '@/lib/audio';
import { TierRangeSlider } from '@/components/TierRangeSlider';

interface MapListProps {
  maps: MomentumMap[];
  selectedMap: MomentumMap | null;
  onSelectMap: (map: MomentumMap) => void;
}

const ITEMS_PER_PAGE = 24;

export function MapList({ maps, selectedMap, onSelectMap }: MapListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModes, setSelectedModes] = useState<string[]>(['All']);
  const [tierRange, setTierRange] = useState<[number, number]>([1, 10]);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [copiedMapId, setCopiedMapId] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAllModes = selectedModes.includes('All') || selectedModes.length === 0;

  // Toggle gamemode multi-select
  const handleToggleMode = (mode: GameModeFilter) => {
    soundFx.playBlip(540, 0.03, 'sine');
    setVisibleCount(ITEMS_PER_PAGE);

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

  // Gamemode counts
  const modeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: maps.length };
    for (const m of maps) {
      counts[m.gamemode] = (counts[m.gamemode] || 0) + 1;
    }
    return counts;
  }, [maps]);

  // Filtered & Sorted Maps
  const filteredMaps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const isAll = selectedModes.includes('All') || selectedModes.length === 0;
    const [minT, maxT] = tierRange;

    return maps
      .filter((map) => {
        if (query) {
          const matchName = map.name.toLowerCase().includes(query);
          const matchAuthor = map.authors.some((a) => a.toLowerCase().includes(query));
          const matchGamemode = map.gamemode.toLowerCase().includes(query);
          if (!matchName && !matchAuthor && !matchGamemode) return false;
        }

        if (!isAll) {
          const matchesMode = selectedModes.some(
            (sm) => sm.toLowerCase() === map.gamemode.toLowerCase()
          );
          if (!matchesMode) return false;
        }

        // Check Tier Range
        if (map.tier !== null) {
          if (map.tier < minT || map.tier > maxT) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'tier-asc') return (a.tier ?? 99) - (b.tier ?? 99);
        if (sortBy === 'tier-desc') return (b.tier ?? -1) - (a.tier ?? -1);
        if (sortBy === 'newest') {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA;
        }
        return 0;
      });
  }, [maps, searchQuery, selectedModes, tierRange, sortBy]);

  const handleCopyCommand = (e: React.MouseEvent, map: MomentumMap) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`map ${map.name}`);
    soundFx.playCopySound();
    setCopiedMapId(map.id);
    setTimeout(() => setCopiedMapId(null), 1800);
  };

  const handleSelectCard = (map: MomentumMap) => {
    onSelectMap(map);
    soundFx.playBlip(600, 0.04, 'sine');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayedMaps = filteredMaps.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMaps.length;

  return (
    <section id="map-explorer" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Explorer Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
        <div>
          <div className="text-neutral-500 font-mono text-xs uppercase tracking-widest mb-1">
            Map Database
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase tracking-tight text-white">
            Browse All Maps
          </h2>
        </div>

        {/* Counter */}
        <div className="text-xs font-mono text-neutral-400">
          Showing <span className="text-white font-bold">{filteredMaps.length.toLocaleString()}</span> of{' '}
          <span className="text-neutral-500">{maps.length.toLocaleString()}</span> maps
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-col gap-4 mb-6">
        
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              placeholder="Search by map name (e.g. surf_..., bhop_...) or mapper..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#111111] border border-neutral-800 focus:border-white text-xs sm:text-sm text-white placeholder-neutral-500 font-mono outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative min-w-[200px]">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#111111] border border-neutral-800 text-xs font-mono text-neutral-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  soundFx.playBlip(520, 0.03, 'sine');
                }}
                className="w-full bg-transparent text-white outline-none cursor-pointer pr-4"
              >
                <option value="name-asc" className="bg-neutral-900 text-white">Name (A → Z)</option>
                <option value="name-desc" className="bg-neutral-900 text-white">Name (Z → A)</option>
                <option value="tier-asc" className="bg-neutral-900 text-white">Tier (Lowest First)</option>
                <option value="tier-desc" className="bg-neutral-900 text-white">Tier (Highest First)</option>
                <option value="newest" className="bg-neutral-900 text-white">Release Date (Newest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Filters Row: Gamemode Chips + Tier Range Slider */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 bg-[#111111] border border-neutral-800">
          {/* Gamemode Chips (Multi-Select) */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                Filter Modes
              </span>
              {!isAllModes && (
                <button
                  onClick={() => handleToggleMode('All')}
                  className="text-[11px] font-mono text-neutral-500 hover:text-white underline cursor-pointer"
                >
                  Reset Modes
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {GAMEMODE_LIST.map((mode) => {
                const isSelected = mode === 'All' ? isAllModes : selectedModes.includes(mode);
                const count = modeCounts[mode] || 0;
                return (
                  <button
                    key={mode}
                    onClick={() => handleToggleMode(mode)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span>{mode}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tier Range Slider */}
          <div className="w-full xl:w-72 flex flex-col flex-shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 xl:border-l border-neutral-800 xl:pl-4">
            <TierRangeSlider
              minTier={tierRange[0]}
              maxTier={tierRange[1]}
              minLimit={1}
              maxLimit={10}
              onChange={(newRange) => {
                setTierRange(newRange);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              label="Tier Range"
            />
          </div>
        </div>
      </div>

      {/* Map Grid */}
      {filteredMaps.length === 0 ? (
        <div className="py-16 text-center border border-neutral-800 bg-[#111111]">
          <h3 className="text-base font-bold text-white font-mono mb-1">No maps match your filter</h3>
          <p className="text-xs text-neutral-400 mb-4 font-mono">
            Try adjusting your search keywords, selected modes, or tier drag range.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedModes(['All']);
              setTierRange([1, 10]);
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {displayedMaps.map((map) => {
            const isCurrentlySelected = selectedMap?.id === map.id;
            const isCopied = copiedMapId === map.id;

            return (
              <div
                key={map.id}
                onClick={() => handleSelectCard(map)}
                className={`group border transition-colors cursor-pointer flex flex-col bg-[#111111] ${
                  isCurrentlySelected
                    ? 'border-white ring-1 ring-white'
                    : 'border-neutral-800 hover:border-neutral-600 hover:bg-[#161616]'
                }`}
              >
                {/* Thumbnail Header */}
                <div className="relative w-full h-36 bg-black overflow-hidden">
                  {map.thumbnail ? (
                    <Image
                      src={map.thumbnail}
                      alt={map.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center group-hover:scale-102 transition-transform duration-200 opacity-75 group-hover:opacity-90"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                      No Preview
                    </div>
                  )}

                  {/* Gradient mask */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/60" />

                  {/* Badges in Thumbnail */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-black/80 border border-neutral-700 text-white">
                      {map.gamemode}
                    </span>

                    {map.tier !== null && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-black/80 border border-neutral-700 text-neutral-300">
                        T{map.tier}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    {/* Map Title */}
                    <h3 className="text-xs sm:text-sm font-bold font-mono tracking-tight text-white group-hover:text-neutral-300 truncate">
                      {map.name}
                    </h3>

                    {/* Author */}
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-1 truncate font-mono">
                      <User className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                      <span className="truncate">{map.authors.join(', ')}</span>
                    </div>
                  </div>

                  {/* Bottom Action Strip */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[10px] font-mono">
                    <div className="text-neutral-500">
                      {map.isLinear !== null && (
                        <span>{map.isLinear ? 'Linear' : 'Staged'}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Copy Command */}
                      <button
                        onClick={(e) => handleCopyCommand(e, map)}
                        className={`px-2 py-1 text-[10px] font-mono font-semibold transition-colors flex items-center gap-1 cursor-pointer border ${
                          isCopied
                            ? 'bg-white text-black border-white'
                            : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                        }`}
                        title="Copy `map <mapname>`"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <Terminal className="w-3 h-3 text-neutral-400" />
                            <span>COPY</span>
                          </>
                        )}
                      </button>

                      {/* Direct Dashboard Link */}
                      <a
                        href={map.dashboardUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-neutral-500 hover:text-white transition-colors"
                        title="View on Dashboard"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setVisibleCount((prev) => prev + ITEMS_PER_PAGE * 2);
              soundFx.playBlip(480, 0.03, 'sine');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] hover:bg-[#181818] border border-neutral-800 hover:border-neutral-600 text-xs font-mono font-bold text-white transition-colors cursor-pointer"
          >
            <span>LOAD MORE ({filteredMaps.length - visibleCount} REMAINING)</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      )}
    </section>
  );
}

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
  Timer,
  Play,
  Pause,
  SkipForward,
  Trophy,
  X,
  Sparkles,
  Award,
} from 'lucide-react';
import { MomentumMap, GameModeFilter, TrackTypeFilter, RankedFilter, RollableItem } from '@/types/map';
import { CompletedChallengeMap, TimedChallengeState } from '@/types/challenge';
import { GAMEMODE_LIST, getGamemodeBadgeStyle, getTierBadgeStyle } from '@/lib/constants';
import { soundFx } from '@/lib/audio';
import { TierRangeSlider } from '@/components/TierRangeSlider';
import { LeaderboardModal } from '@/components/LeaderboardModal';

interface HeroRandomizerProps {
  allMaps: MomentumMap[];
  selectedMap: MomentumMap | null;
  onSelectMap: (map: MomentumMap) => void;
  isLeaderboardOpen?: boolean;
  onCloseLeaderboard?: () => void;
  onOpenLeaderboard?: () => void;
}

const STORAGE_KEY = 'mm_timed_challenge_state';
const DURATION_OPTIONS = [15, 30, 45, 60] as const;

export function HeroRandomizer({
  allMaps,
  selectedMap,
  onSelectMap,
  isLeaderboardOpen = false,
  onCloseLeaderboard,
  onOpenLeaderboard,
}: HeroRandomizerProps) {
  const [selectedModes, setSelectedModes] = useState<string[]>(['All']);
  const [tierRange, setTierRange] = useState<[number, number]>([1, 10]);
  const [trackTypeFilter, setTrackTypeFilter] = useState<TrackTypeFilter>('main');
  const [rankedFilter, setRankedFilter] = useState<RankedFilter>('all');

  const [isRolling, setIsRolling] = useState(false);
  const [rollingDisplayItem, setRollingDisplayItem] = useState<RollableItem | null>(null);
  const [selectedBonusNum, setSelectedBonusNum] = useState<number | null>(null);

  const [copiedConsole, setCopiedConsole] = useState(false);
  const [copiedName, setCopiedName] = useState(false);
  const [rollCount, setRollCount] = useState(0);

  // Timed Challenge State
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [challengeState, setChallengeState] = useState<TimedChallengeState>({
    isActive: false,
    isPaused: false,
    durationMinutes: 30,
    timeRemainingSeconds: 30 * 60,
    completedMaps: [],
    skippedCount: 0,
    currentMapStartTime: Date.now(),
  });
  const [showSummary, setShowSummary] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Leaderboard submission state
  const [runnerName, setRunnerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; rank?: number } | null>(null);
  const [internalLeaderboardOpen, setInternalLeaderboardOpen] = useState(false);

  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync display item when selectedMap changes
  useEffect(() => {
    if (!isRolling && selectedMap) {
      setRollingDisplayItem({
        map: selectedMap,
        isBonus: selectedBonusNum !== null,
        bonusNum: selectedBonusNum ?? undefined,
        effectiveTier:
          selectedBonusNum !== null
            ? selectedMap.bonuses?.find((b) => b.bonusNum === selectedBonusNum)?.tier ?? selectedMap.tier
            : selectedMap.tier,
        effectiveRanked:
          selectedBonusNum !== null
            ? selectedMap.bonuses?.find((b) => b.bonusNum === selectedBonusNum)?.isRanked ?? selectedMap.isRanked
            : selectedMap.isRanked,
        displayName:
          selectedBonusNum !== null
            ? `${selectedMap.name} (Bonus ${selectedBonusNum})`
            : selectedMap.name,
      });
    }
  }, [selectedMap, selectedBonusNum, isRolling]);

  // Restore state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: TimedChallengeState = JSON.parse(saved);
        if (parsed.isActive) {
          setChallengeState(parsed);
        }
      }
      const savedRunner = localStorage.getItem('mm_runner_name');
      if (savedRunner) setRunnerName(savedRunner);
    } catch {}
  }, []);

  // Save challenge state to localStorage
  useEffect(() => {
    try {
      if (challengeState.isActive) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(challengeState));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [challengeState]);

  // Timer interval for Challenge Mode
  useEffect(() => {
    if (challengeState.isActive && !challengeState.isPaused) {
      timerRef.current = setInterval(() => {
        setChallengeState((prev) => {
          if (prev.timeRemainingSeconds <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            soundFx.playLockWinner(true);
            setShowSummary(true);
            return {
              ...prev,
              isActive: false,
              timeRemainingSeconds: 0,
            };
          }
          return {
            ...prev,
            timeRemainingSeconds: prev.timeRemainingSeconds - 1,
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [challengeState.isActive, challengeState.isPaused]);

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

  // Build full pool of rollable items based on mode, tier, track type, and ranked filter
  const getFilteredPool = useCallback((): RollableItem[] => {
    const isAll = selectedModes.includes('All') || selectedModes.length === 0;
    const [minT, maxT] = tierRange;
    const pool: RollableItem[] = [];

    for (const m of allMaps) {
      // 1. Gamemode match
      if (!isAll) {
        const matchesMode = selectedModes.some(
          (sm) => sm.toLowerCase() === m.gamemode.toLowerCase()
        );
        if (!matchesMode) continue;
      }

      // 2. Main Track (if trackTypeFilter !== 'bonus_only')
      if (trackTypeFilter !== 'bonus_only') {
        const tierMatch = m.tier === null || (m.tier >= minT && m.tier <= maxT);
        const rankedMatch =
          rankedFilter === 'all' ||
          (rankedFilter === 'ranked' && m.isRanked) ||
          (rankedFilter === 'unranked' && !m.isRanked);

        if (tierMatch && rankedMatch) {
          pool.push({
            map: m,
            isBonus: false,
            effectiveTier: m.tier,
            effectiveRanked: m.isRanked,
            displayName: m.name,
          });
        }
      }

      // 3. Bonus Tracks (if trackTypeFilter !== 'main')
      if (trackTypeFilter !== 'main' && m.bonuses && m.bonuses.length > 0) {
        for (const b of m.bonuses) {
          const tier = b.tier ?? m.tier;
          const tierMatch = tier === null || (tier >= minT && tier <= maxT);
          const rankedMatch =
            rankedFilter === 'all' ||
            (rankedFilter === 'ranked' && b.isRanked) ||
            (rankedFilter === 'unranked' && !b.isRanked);

          if (tierMatch && rankedMatch) {
            pool.push({
              map: m,
              isBonus: true,
              bonusNum: b.bonusNum,
              effectiveTier: tier,
              effectiveRanked: b.isRanked,
              displayName: `${m.name} (Bonus ${b.bonusNum})`,
            });
          }
        }
      }
    }

    return pool;
  }, [allMaps, selectedModes, tierRange, trackTypeFilter, rankedFilter]);

  // Roll execution
  const handleRoll = useCallback(() => {
    if (isRolling || allMaps.length === 0) return;

    const pool = getFilteredPool();
    if (pool.length === 0) {
      alert(`No tracks found matching current filters. Try broadening modes, tiers, or track types.`);
      return;
    }

    setIsRolling(true);

    const chosenIndex = Math.floor(Math.random() * pool.length);
    const chosenItem = pool[chosenIndex];

    const totalTicks = 14;
    let currentTick = 0;
    const intervalDuration = 60;

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

    rollIntervalRef.current = setInterval(() => {
      currentTick++;
      const tempItem = pool[Math.floor(Math.random() * pool.length)];
      setRollingDisplayItem(tempItem);
      soundFx.playTick(1 + currentTick * 0.05);

      if (currentTick >= totalTicks) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        setRollingDisplayItem(chosenItem);
        setSelectedBonusNum(chosenItem.isBonus && chosenItem.bonusNum ? chosenItem.bonusNum : null);
        onSelectMap(chosenItem.map);
        setIsRolling(false);
        setRollCount((prev) => prev + 1);
        soundFx.playLockWinner((chosenItem.effectiveTier ?? 0) >= 5);
      }
    }, intervalDuration);
  }, [isRolling, allMaps, getFilteredPool, onSelectMap]);

  // Keyboard shortcut listener (Space or R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.code === 'Space' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (challengeState.isActive) {
          handleCompleteMap();
        } else {
          handleRoll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRoll, challengeState.isActive]);

  const copyConsoleCommand = (mapName: string, bonusNum?: number | null) => {
    const cmd = `map ${mapName}`;
    navigator.clipboard.writeText(cmd);
    soundFx.playCopySound();
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  const copyMapName = (mapName: string) => {
    navigator.clipboard.writeText(mapName);
    soundFx.playCopySound();
    setCopiedName(true);
    setTimeout(() => setCopiedName(false), 2000);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Start Challenge
  const handleStartChallenge = () => {
    const totalSeconds = selectedDuration * 60;
    setChallengeState({
      isActive: true,
      isPaused: false,
      durationMinutes: selectedDuration,
      timeRemainingSeconds: totalSeconds,
      completedMaps: [],
      skippedCount: 0,
      currentMapStartTime: Date.now(),
    });
    setShowSummary(false);
    setSubmitResult(null);
    handleRoll();
  };

  // Complete current map & roll next
  const handleCompleteMap = () => {
    const currentItem = rollingDisplayItem || (selectedMap ? {
      map: selectedMap,
      isBonus: false,
      effectiveTier: selectedMap.tier,
      effectiveRanked: selectedMap.isRanked,
      displayName: selectedMap.name,
    } : null);

    if (!currentItem) return;

    soundFx.playLockWinner(true);
    const now = Date.now();
    const duration = Math.max(1, Math.round((now - challengeState.currentMapStartTime) / 1000));

    const completedEntry: CompletedChallengeMap = {
      map: currentItem.map,
      durationSeconds: duration,
      completedAt: new Date().toISOString(),
    };

    setChallengeState((prev) => ({
      ...prev,
      completedMaps: [...prev.completedMaps, completedEntry],
      currentMapStartTime: Date.now(),
    }));

    handleRoll();
  };

  // Skip current map & roll next
  const handleSkipMap = () => {
    soundFx.playBlip(400, 0.04, 'sine');
    setChallengeState((prev) => ({
      ...prev,
      skippedCount: prev.skippedCount + 1,
      currentMapStartTime: Date.now(),
    }));
    handleRoll();
  };

  // End challenge
  const handleEndChallenge = () => {
    soundFx.playBlip(450, 0.03, 'sine');
    setShowSummary(true);
    setChallengeState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
    }));
  };

  // Reset challenge
  const handleResetChallenge = () => {
    soundFx.playBlip(400, 0.03, 'sine');
    setChallengeState({
      isActive: false,
      isPaused: false,
      durationMinutes: selectedDuration,
      timeRemainingSeconds: selectedDuration * 60,
      completedMaps: [],
      skippedCount: 0,
      currentMapStartTime: Date.now(),
    });
    setShowSummary(false);
    setSubmitResult(null);
  };

  // Submit score to Leaderboard
  const handleSubmitScore = async () => {
    if (!runnerName.trim()) return;
    setIsSubmitting(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mm_runner_name', runnerName.trim());
      }
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runnerName: runnerName.trim(),
          durationMinutes: challengeState.durationMinutes,
          skippedCount: challengeState.skippedCount,
          maps: challengeState.completedMaps.map((c) => ({
            name: c.map.name,
            mode: c.map.gamemode,
            tier: c.map.tier,
            timeSeconds: c.durationSeconds,
          })),
        }),
      });
      const data = await res.json();
      setSubmitResult({ success: true, rank: data.rank });
      soundFx.playLockWinner(true);
    } catch {}
    setIsSubmitting(false);
  };

  const handleCopySummary = () => {
    const timeSpent = challengeState.durationMinutes * 60 - challengeState.timeRemainingSeconds;
    const minutesSpent = Math.max(1, Math.round(timeSpent / 60));

    const mapListText = challengeState.completedMaps
      .map(
        (entry, idx) =>
          `  ${idx + 1}. ${entry.map.name} (${entry.map.gamemode}${
            entry.map.tier ? ` T${entry.map.tier}` : ''
          }) - ${formatTime(entry.durationSeconds)}`
      )
      .join('\n');

    const summary = `⚡ Momentum Mod ${challengeState.durationMinutes}m Challenge:
🏁 Maps Beaten: ${challengeState.completedMaps.length} in ${minutesSpent} min
⏭ Skipped: ${challengeState.skippedCount}
🗺️ Log:
${mapListText || '  (None)'}`;

    navigator.clipboard.writeText(summary);
    soundFx.playCopySound();
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const activeDisplayItem: RollableItem = rollingDisplayItem || {
    map: selectedMap || allMaps[0],
    isBonus: false,
    effectiveTier: (selectedMap || allMaps[0])?.tier ?? null,
    effectiveRanked: (selectedMap || allMaps[0])?.isRanked ?? true,
    displayName: (selectedMap || allMaps[0])?.name ?? 'Map',
  };

  const activeMap = activeDisplayItem.map;
  const gamemodeBadge = activeMap ? getGamemodeBadgeStyle(activeMap.gamemode) : null;
  const tierBadge = getTierBadgeStyle(activeDisplayItem.effectiveTier);
  const filteredPoolCount = getFilteredPool().length;

  const showLeaderboard = isLeaderboardOpen || internalLeaderboardOpen;
  const closeLeaderboard = () => {
    if (onCloseLeaderboard) onCloseLeaderboard();
    setInternalLeaderboardOpen(false);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      {/* Control Deck: Gamemode, Tier, Track Type, and Ranked Selection */}
      <div className="mb-4 p-4 bg-[#111111] border border-neutral-800 flex flex-col gap-4">
        
        {/* Top Row: Gamemode Multi-Select & Tier Range Slider */}
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

        {/* Bottom Row: Track Type (Main vs Bonuses) & Ranked / Unranked Toggles */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
          {/* Track Type Filter Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">Tracks:</span>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 border border-neutral-800">
              <button
                onClick={() => {
                  soundFx.playBlip(500, 0.02, 'sine');
                  setTrackTypeFilter('main');
                }}
                className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                  trackTypeFilter === 'main'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Main Only
              </button>
              <button
                onClick={() => {
                  soundFx.playBlip(500, 0.02, 'sine');
                  setTrackTypeFilter('all');
                }}
                className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                  trackTypeFilter === 'all'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>Include Bonuses</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playBlip(500, 0.02, 'sine');
                  setTrackTypeFilter('bonus_only');
                }}
                className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                  trackTypeFilter === 'bonus_only'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Bonuses Only</span>
              </button>
            </div>
          </div>

          {/* Ranked / Unranked Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">Status:</span>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 border border-neutral-800">
              <button
                onClick={() => {
                  soundFx.playBlip(500, 0.02, 'sine');
                  setRankedFilter('all');
                }}
                className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                  rankedFilter === 'all'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  soundFx.playBlip(500, 0.02, 'sine');
                  setRankedFilter('ranked');
                }}
                className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                  rankedFilter === 'ranked'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Award className="w-3 h-3" />
                <span>Ranked</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playBlip(500, 0.02, 'sine');
                  setRankedFilter('unranked');
                }}
                className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                  rankedFilter === 'unranked'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Unranked
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UNIFIED ACTION DECK: Normal Mode vs. Timed Challenge Mode */}
      <div className="mb-6">
        {!challengeState.isActive ? (
          /* Normal State: Roll Button + Challenge Launcher Bar */
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Main Roll Button */}
              <button
                onClick={handleRoll}
                disabled={isRolling}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-mono text-sm sm:text-base font-bold tracking-widest uppercase transition-colors cursor-pointer border ${
                  isRolling
                    ? 'bg-neutral-800 text-neutral-300 border-neutral-600'
                    : 'bg-white hover:bg-neutral-200 text-black border-white active:bg-neutral-300'
                }`}
              >
                <span>
                  {isRolling
                    ? 'ROLLING...'
                    : trackTypeFilter === 'bonus_only'
                    ? 'ROLL RANDOM BONUS'
                    : 'ROLL RANDOM MAP'}
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-xs font-mono font-normal tracking-normal border border-black/20 bg-black/5 text-black">
                  [SPACE] or [R]
                </span>
              </button>

              {/* Status Counter (Locked Width) */}
              <div className="w-full sm:w-64 flex-shrink-0 flex items-center justify-between sm:justify-center gap-3 text-xs font-mono text-neutral-400 px-4 py-4 bg-[#111111] border border-neutral-800 tabular-nums">
                <div>
                  <span className="text-white font-semibold">{filteredPoolCount.toLocaleString()}</span>{' '}
                  {trackTypeFilter === 'bonus_only' ? 'bonuses in pool' : 'tracks in pool'}
                </div>
                {rollCount > 0 && (
                  <>
                    <span className="text-neutral-700">|</span>
                    <span className="text-neutral-300">{rollCount} rolled</span>
                  </>
                )}
              </div>
            </div>

            {/* Seamless Challenge Launcher Strip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2.5 bg-[#0f0f0f] border border-neutral-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-neutral-400">
                <Timer className="w-4 h-4 text-neutral-400" />
                <span className="uppercase text-neutral-300 font-bold">Timed Challenge:</span>
                <span className="text-neutral-500 hidden md:inline">Beat as many rolled maps as possible in:</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-neutral-950 p-0.5 border border-neutral-800">
                  {DURATION_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setSelectedDuration(mins);
                        soundFx.playBlip(520, 0.02, 'sine');
                      }}
                      className={`px-2 py-0.5 text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                        selectedDuration === mins
                          ? 'bg-white text-black font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleStartChallenge}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Start {selectedDuration}m Challenge</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Challenge Mode */
          <div className="flex flex-col gap-2 p-3 bg-neutral-950 border border-white">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Left: Live Countdown Timer & Status */}
              <div className="flex items-center gap-3 bg-[#111111] p-3 border border-neutral-800">
                <div className="flex flex-col">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                    Challenge Clock ({challengeState.durationMinutes}m)
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-widest">
                    {formatTime(challengeState.timeRemainingSeconds)}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-auto sm:ml-2">
                  <button
                    onClick={() => {
                      soundFx.playBlip(500, 0.03, 'sine');
                      setChallengeState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
                    }}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white cursor-pointer"
                    title={challengeState.isPaused ? 'Resume Run' : 'Pause Run'}
                  >
                    {challengeState.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Center: Primary Action */}
              <button
                onClick={handleCompleteMap}
                disabled={isRolling}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-neutral-200 text-black font-mono text-sm sm:text-base font-bold tracking-widest uppercase transition-colors cursor-pointer border border-white active:bg-neutral-300"
              >
                <Check className="w-5 h-5" />
                <span>{isRolling ? 'ROLLING NEXT...' : 'MAP BEATEN → ROLL NEXT'}</span>
                <span className="hidden md:inline-block px-2 py-0.5 text-xs font-mono font-normal border border-black/20 bg-black/5 text-black">
                  [SPACE]
                </span>
              </button>

              {/* Right: Score & Skip / End Controls */}
              <div className="flex items-center justify-between lg:justify-end gap-2">
                <div className="px-3 py-3 bg-[#111111] border border-neutral-800 text-xs font-mono text-neutral-400">
                  <span>BEATEN: <strong className="text-white text-sm">{challengeState.completedMaps.length}</strong></span>
                  <span className="text-neutral-700 mx-1.5">|</span>
                  <span>SKIPPED: <span className="text-neutral-300">{challengeState.skippedCount}</span></span>
                </div>

                <button
                  onClick={handleSkipMap}
                  disabled={isRolling}
                  className="flex items-center gap-1 px-3 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Skip without adding to score"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>SKIP</span>
                </button>

                <button
                  onClick={handleEndChallenge}
                  className="px-3 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Finish run & see summary"
                >
                  END
                </button>
              </div>
            </div>
          </div>
        )}
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

                {/* Bonus Badge (if currently focused on a bonus) */}
                {activeDisplayItem.isBonus && activeDisplayItem.bonusNum && (
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-white text-black border border-white">
                    BONUS {activeDisplayItem.bonusNum}
                  </span>
                )}

                {/* Ranked / Unranked Badge */}
                <span
                  className={`px-2 py-1 text-xs font-mono font-semibold border ${
                    activeDisplayItem.effectiveRanked
                      ? 'bg-black/80 text-neutral-200 border-neutral-700'
                      : 'bg-black/80 text-neutral-500 border-neutral-800'
                  }`}
                >
                  {activeDisplayItem.effectiveRanked ? 'Ranked' : 'Unranked'}
                </span>

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
                    onClick={() => copyMapName(activeDisplayItem.displayName)}
                    title="Click to copy name"
                    className="text-2xl sm:text-4xl md:text-5xl font-bold font-mono tracking-tight text-white hover:text-neutral-300 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {activeDisplayItem.displayName}
                    <button
                      aria-label="Copy name"
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

          {/* Bonus Tracks Selector Strip (if map has bonuses) */}
          {activeMap.bonuses && activeMap.bonuses.length > 0 && (
            <div className="p-3 bg-[#0d0d0d] border-t border-neutral-800/80 flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-neutral-500 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-neutral-400" />
                <span>Track Selector:</span>
              </span>

              {/* Main Track Option */}
              <button
                onClick={() => {
                  soundFx.playBlip(500, 0.02, 'sine');
                  setSelectedBonusNum(null);
                }}
                className={`px-2.5 py-1 transition-colors cursor-pointer border ${
                  selectedBonusNum === null
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                }`}
              >
                Main Track {activeMap.tier ? `(T${activeMap.tier})` : ''}
              </button>

              {/* Individual Bonus Tracks */}
              {activeMap.bonuses.map((b) => (
                <button
                  key={b.bonusNum}
                  onClick={() => {
                    soundFx.playBlip(540, 0.02, 'sine');
                    setSelectedBonusNum(b.bonusNum);
                  }}
                  className={`px-2.5 py-1 transition-colors cursor-pointer border ${
                    selectedBonusNum === b.bonusNum
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                  }`}
                >
                  Bonus {b.bonusNum} {b.tier ? `(T${b.tier})` : ''}
                </button>
              ))}
            </div>
          )}

          {/* Details & Actions Footer */}
          <div className="p-4 sm:p-5 bg-[#0a0a0a] border-t border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Description */}
            <div className="flex-1 text-xs sm:text-sm text-neutral-400 line-clamp-2 max-w-2xl font-mono">
              {activeMap.description ? (
                <p>{activeMap.description}</p>
              ) : (
                <p className="text-neutral-500">
                  Ready to play. Copy the map name to search and download in-game.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              
              {/* Copy Map Name Button */}
              <button
                onClick={() => copyMapName(activeMap.name)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wide transition-colors cursor-pointer border ${
                  copiedName
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-700 hover:border-neutral-500'
                }`}
                title="Copy map name to paste in-game"
              >
                {copiedName ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>COPIED `{activeMap.name}`</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>COPY MAP NAME (`{activeMap.name}`)</span>
                  </>
                )}
              </button>

              {/* Open in Momentum (Steam Protocol) */}
              <a
                href={`steam://run/669270//+map%20${activeMap.name}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-xs font-mono text-neutral-300 hover:text-white transition-colors"
                title="Launch directly in Momentum Mod if map is already installed"
              >
                <Terminal className="w-3 h-3 text-neutral-400" />
                <span>Open in Game</span>
              </a>

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

              {/* Normal Roll Again Button (when not in challenge) */}
              {!challengeState.isActive && (
                <button
                  onClick={handleRoll}
                  disabled={isRolling}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Roll another"
                  aria-label="Roll another"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Challenge Completion Summary Modal with Simple Score Submit */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
          <div className="w-full max-w-lg bg-[#111111] border border-neutral-700 p-6 flex flex-col gap-5 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-base uppercase">
                <Trophy className="w-5 h-5 text-white" />
                <span>Challenge Summary</span>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="text-neutral-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-3 bg-neutral-950 border border-neutral-800">
                <div className="text-2xl font-bold text-white">
                  {challengeState.completedMaps.length}
                </div>
                <div className="text-[10px] text-neutral-500 uppercase">Maps Beaten</div>
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800">
                <div className="text-2xl font-bold text-white">
                  {challengeState.skippedCount}
                </div>
                <div className="text-[10px] text-neutral-500 uppercase">Skipped</div>
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800">
                <div className="text-2xl font-bold text-white">
                  {challengeState.durationMinutes}m
                </div>
                <div className="text-[10px] text-neutral-500 uppercase">Total Time</div>
              </div>
            </div>

            {/* List of Beaten Maps */}
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              <div className="text-[11px] font-mono uppercase text-neutral-400">
                Completed Map Log:
              </div>
              {challengeState.completedMaps.length === 0 ? (
                <div className="text-xs font-mono text-neutral-600 italic py-2">
                  No maps completed in this session.
                </div>
              ) : (
                challengeState.completedMaps.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-neutral-950 border border-neutral-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-neutral-500">{idx + 1}.</span>
                      <span className="text-white font-semibold truncate">
                        {entry.map.name}
                      </span>
                      <span className="text-neutral-500 text-[10px]">
                        ({entry.map.gamemode}
                        {entry.map.tier ? ` • T${entry.map.tier}` : ''})
                      </span>
                    </div>
                    <span className="text-neutral-400 ml-2">
                      {formatTime(entry.durationSeconds)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Simple Leaderboard Submit Form */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 flex flex-col gap-2 font-mono">
              <div className="text-xs font-bold text-white uppercase">Submit to Leaderboard</div>
              {submitResult?.success ? (
                <div className="text-xs text-white flex items-center justify-between">
                  <span>✓ Submitted! Ranked #{submitResult.rank} on {challengeState.durationMinutes}m board.</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenLeaderboard) onOpenLeaderboard();
                      else setInternalLeaderboardOpen(true);
                    }}
                    className="underline text-neutral-300 hover:text-white cursor-pointer"
                  >
                    View Board
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={runnerName}
                    onChange={(e) => setRunnerName(e.target.value)}
                    placeholder="Enter your name..."
                    maxLength={20}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-1.5 bg-[#111111] border border-neutral-800 focus:border-white text-xs text-white placeholder-neutral-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSubmitScore}
                    disabled={isSubmitting || challengeState.completedMaps.length === 0}
                    className="px-3 py-1.5 bg-white hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-black text-xs font-bold uppercase transition-colors cursor-pointer border border-white disabled:border-neutral-800"
                  >
                    {isSubmitting ? 'Saving...' : 'Submit'}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>COPIED TO CLIPBOARD!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY RESULTS</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetChallenge}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold uppercase transition-colors cursor-pointer border border-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>NEW RUN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Viewer Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={closeLeaderboard}
        initialDuration={challengeState.durationMinutes}
      />
    </section>
  );
}

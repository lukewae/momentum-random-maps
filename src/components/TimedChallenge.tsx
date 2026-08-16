'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Check,
  SkipForward,
  Trophy,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MomentumMap } from '@/types/map';
import { CompletedChallengeMap, TimedChallengeState } from '@/types/challenge';
import { soundFx } from '@/lib/audio';

interface TimedChallengeProps {
  currentMap: MomentumMap | null;
  onRollNext: () => void;
}

const STORAGE_KEY = 'mm_timed_challenge_state';

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

export function TimedChallenge({ currentMap, onRollNext }: TimedChallengeProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore active challenge from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: TimedChallengeState = JSON.parse(saved);
        if (parsed.isActive) {
          setChallengeState(parsed);
          setIsOpen(true);
        }
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  // Save challenge state to localStorage
  useEffect(() => {
    try {
      if (challengeState.isActive) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(challengeState));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage error
    }
  }, [challengeState]);

  // Timer tick interval
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

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Start new challenge
  const handleStartChallenge = () => {
    soundFx.playBlip(600, 0.05, 'triangle');
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
    setIsOpen(true);
    setShowSummary(false);
  };

  // Pause / Resume
  const handleTogglePause = () => {
    soundFx.playBlip(500, 0.03, 'sine');
    setChallengeState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  // Mark current map completed & roll next
  const handleCompleteMap = () => {
    if (!currentMap) return;

    soundFx.playLockWinner(true);

    const now = Date.now();
    const duration = Math.max(1, Math.round((now - challengeState.currentMapStartTime) / 1000));

    const completedEntry: CompletedChallengeMap = {
      map: currentMap,
      durationSeconds: duration,
      completedAt: new Date().toISOString(),
    };

    setChallengeState((prev) => ({
      ...prev,
      completedMaps: [...prev.completedMaps, completedEntry],
      currentMapStartTime: Date.now(),
    }));

    onRollNext();
  };

  // Skip current map & roll next
  const handleSkipMap = () => {
    soundFx.playBlip(400, 0.04, 'sine');
    setChallengeState((prev) => ({
      ...prev,
      skippedCount: prev.skippedCount + 1,
      currentMapStartTime: Date.now(),
    }));
    onRollNext();
  };

  // End challenge early
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
  };

  // Copy Summary text for Discord/Community
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

    const summary = `⚡ Momentum Mod ${challengeState.durationMinutes}m Challenge Result:
🏁 Maps Beaten: ${challengeState.completedMaps.length} in ${minutesSpent} min
⏭ Skipped: ${challengeState.skippedCount}
🗺️ Completed:
${mapListText || '  (None)'}
🔗 https://dashboard.momentum-mod.org`;

    navigator.clipboard.writeText(summary);
    soundFx.playCopySound();
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
      {/* Challenge Drawer Container */}
      <div className="border border-neutral-800 bg-[#0d0d0d]">
        {/* Header Strip */}
        <div className="flex items-center justify-between p-3 border-b border-neutral-800/80">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-white hover:text-neutral-300 transition-colors uppercase cursor-pointer"
          >
            <Timer className="w-3.5 h-3.5 text-neutral-400" />
            <span>Timed Challenge Mode</span>
            {challengeState.isActive && (
              <span className="px-1.5 py-0.2 text-[10px] bg-white text-black font-bold">
                ACTIVE • {formatTime(challengeState.timeRemainingSeconds)}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            {challengeState.isActive && (
              <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
                Beaten: <strong className="text-white">{challengeState.completedMaps.length}</strong>
              </span>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle Timed Challenge"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Challenge Deck */}
        {isOpen && (
          <div className="p-4 bg-[#111111] border-t border-neutral-900">
            {!challengeState.isActive ? (
              /* Setup Screen */
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-mono font-bold text-white uppercase">
                    Start a Speedrun Rush
                  </div>
                  <div className="text-xs font-mono text-neutral-400 max-w-md">
                    Set a time limit. Complete each rolled map in Momentum Mod, then hit &quot;Complete &amp; Roll Next&quot; to see how many you can beat!
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {/* Duration Selector */}
                  <div className="flex items-center gap-1 bg-neutral-950 p-1 border border-neutral-800">
                    {DURATION_OPTIONS.map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          setSelectedDuration(mins);
                          soundFx.playBlip(520, 0.02, 'sine');
                        }}
                        className={`px-2.5 py-1 text-xs font-mono font-semibold transition-colors cursor-pointer ${
                          selectedDuration === mins
                            ? 'bg-white text-black font-bold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={handleStartChallenge}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border border-white"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Start {selectedDuration}m Run</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Challenge HUD */
              <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3 bg-neutral-950 border border-neutral-800">
                  
                  {/* Digital Countdown Timer */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                        Time Remaining
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-widest">
                        {formatTime(challengeState.timeRemainingSeconds)}
                      </div>
                    </div>

                    {challengeState.isPaused && (
                      <span className="px-2 py-0.5 text-xs font-mono font-bold bg-neutral-800 text-white border border-neutral-600 animate-pulse">
                        PAUSED
                      </span>
                    )}
                  </div>

                  {/* Scoreboard Readout */}
                  <div className="flex items-center gap-4 font-mono text-xs border-y lg:border-y-0 lg:border-x border-neutral-800 py-2 lg:py-0 lg:px-4">
                    <div>
                      <span className="text-neutral-500">BEATEN: </span>
                      <strong className="text-white text-base">
                        {challengeState.completedMaps.length}
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-500">SKIPPED: </span>
                      <span className="text-neutral-400">
                        {challengeState.skippedCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">TARGET: </span>
                      <span className="text-neutral-300">
                        {challengeState.durationMinutes}m
                      </span>
                    </div>
                  </div>

                  {/* Challenge Action Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Complete & Roll Next */}
                    <button
                      onClick={handleCompleteMap}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer border border-white"
                      title="Mark current map finished and roll next"
                    >
                      <Check className="w-4 h-4" />
                      <span>COMPLETE &amp; ROLL NEXT</span>
                    </button>

                    {/* Skip */}
                    <button
                      onClick={handleSkipMap}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Skip this map without counting as beaten"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>SKIP</span>
                    </button>

                    {/* Pause / Resume */}
                    <button
                      onClick={handleTogglePause}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title={challengeState.isPaused ? 'Resume Challenge' : 'Pause Challenge'}
                    >
                      {challengeState.isPaused ? (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Pause className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* End Run */}
                    <button
                      onClick={handleEndChallenge}
                      className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Finish and review run summary"
                    >
                      END RUN
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Challenge Completion Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
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
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
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

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
              <button
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
    </div>
  );
}

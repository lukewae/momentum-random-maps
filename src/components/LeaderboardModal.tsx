'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, X, ChevronDown, ChevronUp, RefreshCw, Layers } from 'lucide-react';
import { LeaderboardEntry } from '@/types/leaderboard';
import { soundFx } from '@/lib/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDuration?: number;
}

const DURATIONS = [15, 30, 45, 60] as const;

export function LeaderboardModal({
  isOpen,
  onClose,
  initialDuration = 30,
}: LeaderboardModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<number>(initialDuration);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialDuration) {
      setSelectedDuration(initialDuration);
    }
  }, [initialDuration]);

  const fetchLeaderboard = async (duration: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?duration=${duration}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard(selectedDuration);
    }
  }, [isOpen, selectedDuration]);

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-[#111111] border border-neutral-700 flex flex-col shadow-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold font-mono uppercase tracking-wider text-white">
              Challenge Leaderboard
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playBlip(520, 0.02, 'sine');
                fetchLeaderboard(selectedDuration);
              }}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Duration Tabs */}
        <div className="flex items-center gap-1 p-3 bg-neutral-950 border-b border-neutral-800">
          {DURATIONS.map((dur) => {
            const isSelected = selectedDuration === dur;
            return (
              <button
                key={dur}
                onClick={() => {
                  soundFx.playBlip(540, 0.02, 'sine');
                  setSelectedDuration(dur);
                }}
                className={`flex-1 py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {dur}M RUNS
              </button>
            );
          })}
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              Loading records...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              No entries recorded for {selectedDuration}m runs yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                const isExpanded = expandedId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className="border border-neutral-800 bg-[#0d0d0d] flex flex-col transition-colors"
                  >
                    {/* Entry Row */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-900/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 flex items-center justify-center font-mono font-bold text-xs border ${
                            rank === 1
                              ? 'bg-white text-black border-white'
                              : rank === 2
                              ? 'bg-neutral-200 text-black border-neutral-300'
                              : rank === 3
                              ? 'bg-neutral-400 text-black border-neutral-400'
                              : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                          }`}
                        >
                          #{rank}
                        </div>

                        <div>
                          <div className="font-mono font-bold text-sm text-white">
                            {entry.runnerName}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500">
                            {formatDate(entry.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="text-right">
                          <div className="font-bold text-white text-sm">
                            {entry.mapsBeaten} {entry.mapsBeaten === 1 ? 'map' : 'maps'}
                          </div>
                          {entry.skippedCount > 0 && (
                            <div className="text-[10px] text-neutral-500">
                              {entry.skippedCount} skipped
                            </div>
                          )}
                        </div>

                        <button className="text-neutral-500 hover:text-white p-1">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Run Map Breakdown */}
                    {isExpanded && entry.maps && (
                      <div className="p-3 bg-neutral-950 border-t border-neutral-900 flex flex-col gap-1.5 text-xs font-mono">
                        <div className="flex items-center gap-1 text-[10px] uppercase text-neutral-500 mb-1">
                          <Layers className="w-3 h-3" />
                          <span>Run Log ({entry.maps.length} maps)</span>
                        </div>
                        {entry.maps.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="flex items-center justify-between py-1 border-b border-neutral-900 last:border-0 text-neutral-300 text-[11px]"
                          >
                            <span className="truncate">
                              {mIdx + 1}. <strong className="text-white">{m.name}</strong>{' '}
                              <span className="text-neutral-500">
                                ({m.mode}
                                {m.tier ? ` • T${m.tier}` : ''})
                              </span>
                            </span>
                            <span className="text-neutral-400 font-mono ml-2">
                              {formatSeconds(m.timeSeconds)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

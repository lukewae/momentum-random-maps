'use client';

import React, { useCallback, useRef } from 'react';
import { soundFx } from '@/lib/audio';

interface TierRangeSliderProps {
  minTier: number;
  maxTier: number;
  minLimit?: number;
  maxLimit?: number;
  onChange: (range: [number, number]) => void;
  label?: string;
}

export function TierRangeSlider({
  minTier,
  maxTier,
  minLimit = 1,
  maxLimit = 10,
  onChange,
  label = 'Tier Range',
}: TierRangeSliderProps) {
  const minValRef = useRef<HTMLInputElement>(null);
  const maxValRef = useRef<HTMLInputElement>(null);

  const getPercent = useCallback(
    (value: number) => Math.round(((value - minLimit) / (maxLimit - minLimit)) * 100),
    [minLimit, maxLimit]
  );

  const minPercent = getPercent(minTier);
  const maxPercent = getPercent(maxTier);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxTier);
    soundFx.playBlip(500 + value * 20, 0.02, 'sine');
    onChange([value, maxTier]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minTier);
    soundFx.playBlip(500 + value * 20, 0.02, 'sine');
    onChange([minTier, value]);
  };

  const ticks = Array.from({ length: maxLimit - minLimit + 1 }, (_, i) => minLimit + i);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label */}
      <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
        {label}
      </div>

      {/* Dual Slider Track Container */}
      <div className="relative w-full h-7 flex items-center select-none px-1">
        {/* Base Track */}
        <div className="absolute left-2 right-2 h-1.5 bg-neutral-900 border border-neutral-800 z-0" />

        {/* Active Range Highlight */}
        <div
          className="absolute h-1.5 bg-white z-0 transition-all duration-75"
          style={{
            left: `calc(8px + (100% - 16px) * ${minPercent / 100})`,
            width: `calc((100% - 16px) * ${(maxPercent - minPercent) / 100})`,
          }}
        />

        {/* Min Range Input */}
        <input
          ref={minValRef}
          type="range"
          min={minLimit}
          max={maxLimit}
          value={minTier}
          onChange={handleMinChange}
          aria-label="Minimum Tier"
          className="absolute left-0 right-0 w-full h-2 pointer-events-none appearance-none bg-transparent z-20 
            [&::-webkit-slider-thumb]:pointer-events-auto 
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-3.5 
            [&::-webkit-slider-thumb]:h-5 
            [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:border 
            [&::-webkit-slider-thumb]:border-black 
            [&::-webkit-slider-thumb]:rounded-none 
            [&::-webkit-slider-thumb]:cursor-pointer 
            [&::-moz-range-thumb]:pointer-events-auto 
            [&::-moz-range-thumb]:w-3.5 
            [&::-moz-range-thumb]:h-5 
            [&::-moz-range-thumb]:bg-white 
            [&::-moz-range-thumb]:border 
            [&::-moz-range-thumb]:border-black 
            [&::-moz-range-thumb]:rounded-none 
            [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Max Range Input */}
        <input
          ref={maxValRef}
          type="range"
          min={minLimit}
          max={maxLimit}
          value={maxTier}
          onChange={handleMaxChange}
          aria-label="Maximum Tier"
          className="absolute left-0 right-0 w-full h-2 pointer-events-none appearance-none bg-transparent z-20 
            [&::-webkit-slider-thumb]:pointer-events-auto 
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-3.5 
            [&::-webkit-slider-thumb]:h-5 
            [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:border 
            [&::-webkit-slider-thumb]:border-black 
            [&::-webkit-slider-thumb]:rounded-none 
            [&::-webkit-slider-thumb]:cursor-pointer 
            [&::-moz-range-thumb]:pointer-events-auto 
            [&::-moz-range-thumb]:w-3.5 
            [&::-moz-range-thumb]:h-5 
            [&::-moz-range-thumb]:bg-white 
            [&::-moz-range-thumb]:border 
            [&::-moz-range-thumb]:border-black 
            [&::-moz-range-thumb]:rounded-none 
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* Individual 1..10 Ticks with Numbers */}
      <div className="flex items-center justify-between w-full text-[10px] font-mono px-1 select-none">
        {ticks.map((t) => {
          const inRange = t >= minTier && t <= maxTier;
          return (
            <div
              key={t}
              onClick={() => {
                soundFx.playBlip(500 + t * 20, 0.02, 'sine');
                if (t < minTier) {
                  onChange([t, maxTier]);
                } else if (t > maxTier) {
                  onChange([minTier, t]);
                } else {
                  onChange([t, t]);
                }
              }}
              className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
                inRange ? 'text-white font-bold' : 'text-neutral-600 hover:text-neutral-400'
              }`}
              title={`Tier ${t}`}
            >
              <div className={`w-[1px] h-1 ${inRange ? 'bg-white' : 'bg-neutral-800'}`} />
              <span>{t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

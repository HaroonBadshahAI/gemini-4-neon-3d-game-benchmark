'use client';

import React from 'react';
import type { PlayerInputState } from '@/lib/game/combatEngine';

interface TouchControlsProps {
  visible: boolean;
  kiReady: boolean;
  onInputChange: (key: keyof PlayerInputState, pressed: boolean) => void;
}

interface PadBtnProps {
  label: string;
  sublabel?: string;
  inputKey: keyof PlayerInputState;
  onInputChange: (key: keyof PlayerInputState, pressed: boolean) => void;
  className?: string;
  ariaLabel: string;
}

function PadButton({
  label,
  sublabel,
  inputKey,
  onInputChange,
  className = '',
  ariaLabel,
}: PadBtnProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        onInputChange(inputKey, true);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onInputChange(inputKey, false);
      }}
      onPointerCancel={() => onInputChange(inputKey, false)}
      onPointerLeave={(e) => {
        if (e.buttons === 0) onInputChange(inputKey, false);
      }}
      className={`touch-btn pointer-events-auto flex flex-col items-center justify-center rounded-full border-2 font-display font-extrabold select-none active:scale-95 transition-transform ${className}`}
    >
      <span className="leading-none">{label}</span>
      {sublabel && (
        <span className="text-[9px] font-sans font-semibold tracking-wider opacity-85 mt-0.5">
          {sublabel}
        </span>
      )}
    </button>
  );
}

export default function TouchControls({
  visible,
  kiReady,
  onInputChange,
}: TouchControlsProps) {
  if (!visible) return null;

  return (
    <div
      data-testid="touch-controls-overlay"
      className="fixed inset-x-0 bottom-0 z-30 pointer-events-none flex items-end justify-between px-4 pb-4 sm:px-7 sm:pb-6"
    >
      {/* Bottom-Left Ergonomic Arcade D-Pad + 3D Sidestep */}
      <div className="flex flex-col items-center gap-2">
        <PadButton
          label="STEP"
          inputKey="sidestep"
          ariaLabel="3D Sidestep"
          onInputChange={onInputChange}
          className="w-16 h-9 rounded-md bg-[#171422]/90 border-[#38bdf8]/60 text-[#bae6fd] text-xs tracking-wider"
        />

        <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-[150px] h-[150px]">
          <div />
          <PadButton
            label="▲"
            inputKey="up"
            ariaLabel="Jump"
            onInputChange={onInputChange}
            className="w-12 h-12 bg-[#16131f]/90 border-[#f59e0b]/50 text-[#faf5ee] text-lg"
          />
          <div />
          <PadButton
            label="◀"
            inputKey="left"
            ariaLabel="Move Left"
            onInputChange={onInputChange}
            className="w-12 h-12 bg-[#16131f]/90 border-[#f59e0b]/50 text-[#faf5ee] text-lg"
          />
          <PadButton
            label="BLK"
            inputKey="block"
            ariaLabel="Guard Block"
            onInputChange={onInputChange}
            className="w-12 h-12 bg-[#1e293b]/95 border-[#93c5fd]/65 text-[#e0f2fe] text-xs tracking-wider"
          />
          <PadButton
            label="▶"
            inputKey="right"
            ariaLabel="Move Right"
            onInputChange={onInputChange}
            className="w-12 h-12 bg-[#16131f]/90 border-[#f59e0b]/50 text-[#faf5ee] text-lg"
          />
          <div />
          <PadButton
            label="▼"
            inputKey="down"
            ariaLabel="Crouch"
            onInputChange={onInputChange}
            className="w-12 h-12 bg-[#16131f]/90 border-[#f59e0b]/50 text-[#faf5ee] text-lg"
          />
          <div />
        </div>
      </div>

      {/* Bottom-Right Classic Tekken 4-Limb Arcade Diamond + Special */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <PadButton
            label="THROW"
            inputKey="throwBtn"
            ariaLabel="Throw Grapple"
            onInputChange={onInputChange}
            className="w-16 h-9 rounded-md bg-[#1d1726]/90 border-[#d97706]/60 text-[#fde68a] text-xs tracking-wider"
          />
          <PadButton
            label="SP"
            sublabel={kiReady ? 'READY' : 'KI'}
            inputKey="special"
            ariaLabel="Special Move"
            onInputChange={onInputChange}
            className={`w-16 h-11 rounded-md text-sm tracking-wider ${
              kiReady
                ? 'bg-[#0284c7]/95 border-[#bae6fd] text-white shadow-[0_0_16px_rgba(56,189,248,0.6)]'
                : 'bg-[#171422]/85 border-white/25 text-[#94a3b8]'
            }`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <PadButton
            label="LP"
            sublabel="JAB"
            inputKey="lp"
            ariaLabel="Left Punch"
            onInputChange={onInputChange}
            className="w-14 h-14 bg-[#1c1926]/90 border-[#f59e0b]/70 text-[#fef3c7] text-base"
          />
          <PadButton
            label="RP"
            sublabel="CROSS"
            inputKey="rp"
            ariaLabel="Right Punch"
            onInputChange={onInputChange}
            className="w-14 h-14 bg-[#991b1b]/90 border-[#fca5a5]/70 text-white text-base"
          />
          <PadButton
            label="LK"
            sublabel="KICK"
            inputKey="lk"
            ariaLabel="Left Kick"
            onInputChange={onInputChange}
            className="w-14 h-14 bg-[#1c1926]/90 border-[#34d399]/70 text-[#d1fae5] text-base"
          />
          <PadButton
            label="RK"
            sublabel="SPIN"
            inputKey="rk"
            ariaLabel="Right Roundhouse Kick"
            onInputChange={onInputChange}
            className="w-14 h-14 bg-[#b45309]/90 border-[#fde68a]/75 text-white text-base"
          />
        </div>
      </div>
    </div>
  );
}

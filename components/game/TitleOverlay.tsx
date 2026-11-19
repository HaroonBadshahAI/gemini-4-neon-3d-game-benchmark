'use client';

import React from 'react';
import { Globe, Play, Swords, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

interface TitleOverlayProps {
  onQuickStart: () => void;
  onOpenRoster: () => void;
  onOpenOnline: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export default function TitleOverlay({
  onQuickStart,
  onOpenRoster,
  onOpenOnline,
  muted,
  onToggleMute,
}: TitleOverlayProps) {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 sm:p-10">
      {/* Measured left-side dark dusk scrim for calm negative-space contrast */}
      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-0 w-full sm:w-[56%] max-w-2xl pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(10,8,14,0.88) 0%, rgba(10,8,14,0.62) 60%, rgba(10,8,14,0) 100%)',
        }}
      />

      {/* Top-right compact audio button */}
      <div className="relative z-10 flex justify-end">
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
          className="pointer-events-auto flex items-center justify-center w-10 h-10 bg-[#14111b]/90 border border-[#f59e0b]/30 text-[#f5efe6] hover:border-[#f59e0b] hover:text-[#fbbf24] transition-colors rounded"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Asymmetric Left-Third Hero Lockup & Primary Actions */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md my-auto"
      >
        {/* Bespoke Inline SVG Title Emblem & Lockup */}
        <div className="mb-7">
          <svg
            viewBox="0 0 420 138"
            className="w-full max-w-[390px] h-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.85)]"
            role="img"
            aria-label="Kurogane III — Iron Fist Dojo"
          >
            <defs>
              <linearGradient id="kuroGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="52%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="kuroCrimson" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
            </defs>

            {/* Martial Torii / Crest Mark */}
            <g transform="translate(4, 14)">
              <polygon
                points="28,0 56,16 56,52 28,68 0,52 0,16"
                fill="#18121e"
                stroke="#f59e0b"
                strokeWidth="2.5"
              />
              <path
                d="M11 22 H45 M15 30 H41 M21 22 V52 M35 22 V52"
                stroke="#ef4444"
                strokeWidth="4.2"
                strokeLinecap="square"
              />
              <circle cx="28" cy="14" r="3" fill="#fde68a" />
            </g>

            {/* Primary Display Title */}
            <text
              x="74"
              y="62"
              fill="url(#kuroGold)"
              fontFamily="var(--font-display), Barlow Condensed, sans-serif"
              fontWeight="800"
              fontSize="64"
              letterSpacing="3"
              stroke="#0a080e"
              strokeWidth="4"
              paintOrder="stroke fill"
            >
              KUROGANE
            </text>

            {/* Classic Arcade Numeral III Plaque */}
            <polygon points="348,14 412,14 402,68 338,68" fill="url(#kuroCrimson)" stroke="#fde68a" strokeWidth="2" />
            <text
              x="375"
              y="58"
              textAnchor="middle"
              fill="#fef3c7"
              fontFamily="var(--font-display), Barlow Condensed, sans-serif"
              fontWeight="800"
              fontSize="44"
              letterSpacing="2"
            >
              III
            </text>

            {/* Crisp Horizon Slash & Subtitle */}
            <polygon points="74,78 402,78 394,83 74,83" fill="#dc2626" />
            <text
              x="75"
              y="107"
              fill="#e2d9cc"
              fontFamily="var(--font-sans), Plus Jakarta Sans, sans-serif"
              fontWeight="600"
              fontSize="14.5"
              letterSpacing="4.5"
            >
              IRON FIST 3D TOURNAMENT
            </text>
          </svg>
        </div>

        {/* 3 Clean Focused Arcade Menu Actions */}
        <div className="pointer-events-auto flex flex-col gap-3 w-full max-w-[330px]">
          <button
            type="button"
            data-start="true"
            onClick={onQuickStart}
            className="group flex items-center justify-between gap-4 px-5 py-3.5 bg-[#dc2626] hover:bg-[#ef4444] active:translate-y-[1px] text-[#fff8f0] font-display text-2xl font-bold tracking-wider uppercase border-2 border-[#fca5a5]/50 shadow-[0_6px_24px_rgba(220,38,38,0.45)] transition-all rounded-sm cursor-pointer whitespace-nowrap"
          >
            <span className="flex items-center gap-2.5">
              <Play className="w-5 h-5 fill-current" />
              Start Tournament
            </span>
            <span className="font-mono text-xs tracking-normal opacity-85">ENTER</span>
          </button>

          <button
            type="button"
            onClick={onOpenRoster}
            className="flex items-center justify-between gap-4 px-5 py-3 bg-[#171420]/95 hover:bg-[#231e30] text-[#f5efe6] font-display text-xl font-bold tracking-wider uppercase border border-[#f59e0b]/40 hover:border-[#f59e0b] transition-colors rounded-sm cursor-pointer whitespace-nowrap"
          >
            <span className="flex items-center gap-2.5">
              <Swords className="w-4 h-4 text-[#f59e0b]" />
              Versus &amp; Roster
            </span>
            <span className="text-xs font-sans font-medium text-[#c4b8a8] normal-case tracking-normal">
              1P / Local 2P
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenOnline}
            className="flex items-center justify-between gap-4 px-5 py-3 bg-[#171420]/95 hover:bg-[#231e30] text-[#f5efe6] font-display text-xl font-bold tracking-wider uppercase border border-[#38bdf8]/40 hover:border-[#38bdf8] transition-colors rounded-sm cursor-pointer whitespace-nowrap"
          >
            <span className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#38bdf8]" />
              Online &amp; Ranked
            </span>
            <span className="text-xs font-sans font-medium text-[#c4b8a8] normal-case tracking-normal">
              Matchmaking
            </span>
          </button>
        </div>
      </motion.div>

      {/* Single Flat Borderless Control-Hint Line in Bottom Safe Margin */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#d6cbbd]/85 font-medium tracking-wide">
        <p className="truncate">
          WASD Move · F/G Punch · H/R Kick · E Guard · Q Special · Shift Sidestep · Esc Pause
        </p>
        <p className="hidden md:block text-[#c4b8a8]/75">
          Local 2P: Arrows + J/K/L/U · Touch Controls Ready
        </p>
      </div>
    </div>
  );
}

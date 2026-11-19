'use client';

import React from 'react';
import { Gamepad2, Pause, Volume2, VolumeX } from 'lucide-react';
import { CHARACTERS } from '@/lib/game/characters';
import type { MatchState } from '@/lib/game/combatEngine';

export interface HudSnapshot {
  p1CharId: keyof typeof CHARACTERS;
  p2CharId: keyof typeof CHARACTERS;
  p1Name: string;
  p2Name: string;
  p1Hp: number;
  p1TrailHp: number;
  p1MaxHp: number;
  p1Ki: number;
  p1Rounds: number;
  p1Combo: number;
  p1ComboDmg: number;
  p2Hp: number;
  p2TrailHp: number;
  p2MaxHp: number;
  p2Ki: number;
  p2Rounds: number;
  p2Combo: number;
  p2ComboDmg: number;
  roundNumber: number;
  roundTimer: number;
  bannerText: string;
  bannerSubtext: string;
  bannerVisible: boolean;
  mode: MatchState['mode'];
  tournamentStage: number;
  pingMs: number | null;
}

interface CombatHudProps {
  hud: HudSnapshot;
  muted: boolean;
  showTouchPad: boolean;
  onToggleMute: () => void;
  onToggleTouchPad: () => void;
  onPause: () => void;
}

function FighterCrestSvg({ accent, initials }: { accent: string; initials: string }) {
  return (
    <svg viewBox="0 0 40 40" className="w-9 h-9 sm:w-11 sm:h-11 shrink-0">
      <polygon
        points="20,2 37,11 37,29 20,38 3,29 3,11"
        fill="#13101a"
        stroke={accent}
        strokeWidth="2.4"
      />
      <polygon
        points="20,6 33,13 33,27 20,34 7,27 7,13"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
      />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fill="#f8f2e8"
        fontFamily="var(--font-display), Barlow Condensed, sans-serif"
        fontWeight="800"
        fontSize="16"
        letterSpacing="1"
      >
        {initials}
      </text>
    </svg>
  );
}

function RoundOrbs({ won, align }: { won: number; align: 'left' | 'right' }) {
  return (
    <div
      className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}
      aria-label={`${won} of 2 rounds won`}
    >
      {[0, 1].map((idx) => {
        const filled = idx < won;
        return (
          <svg key={idx} viewBox="0 0 18 18" className="w-4 h-4">
            <circle
              cx="9"
              cy="9"
              r="7"
              fill={filled ? '#f59e0b' : '#14111c'}
              stroke={filled ? '#fef08a' : '#78716c'}
              strokeWidth="2"
            />
            {filled && <circle cx="7" cy="7" r="2.2" fill="#fffbeb" />}
          </svg>
        );
      })}
    </div>
  );
}

export default function CombatHud({
  hud,
  muted,
  showTouchPad,
  onToggleMute,
  onToggleTouchPad,
  onPause,
}: CombatHudProps) {
  const p1Spec = CHARACTERS[hud.p1CharId];
  const p2Spec = CHARACTERS[hud.p2CharId];

  const p1Pct = Math.max(0, Math.min(100, (hud.p1Hp / hud.p1MaxHp) * 100));
  const p1TrailPct = Math.max(p1Pct, Math.min(100, (hud.p1TrailHp / hud.p1MaxHp) * 100));
  const p2Pct = Math.max(0, Math.min(100, (hud.p2Hp / hud.p2MaxHp) * 100));
  const p2TrailPct = Math.max(p2Pct, Math.min(100, (hud.p2TrailHp / hud.p2MaxHp) * 100));

  const p1Initials = p1Spec.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  const p2Initials = p2Spec.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between">
      {/* Top Tekken-Style Health Bar & Timer Strip */}
      <div className="w-full px-2.5 sm:px-6 pt-2.5 sm:pt-4">
        {/* Mobile Compact Utility Row (above bars on narrow screens so bars stay full-width) */}
        <div className="flex sm:hidden items-center justify-between mb-1.5 px-0.5">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-[#fef08a] hud-text-stroke">
            {hud.mode === 'tournament'
              ? `STAGE ${hud.tournamentStage + 1}/4 · RD ${hud.roundNumber}`
              : `ROUND ${hud.roundNumber}`}
          </span>
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTouchPad();
              }}
              aria-label={showTouchPad ? 'Hide Touch Controls' : 'Show Touch Controls'}
              className={`flex items-center justify-center w-8 h-8 border rounded-sm transition-colors cursor-pointer ${
                showTouchPad
                  ? 'bg-[#f59e0b] text-[#0c0b10] border-[#fef08a]'
                  : 'bg-[#14111c]/90 text-[#f5efe6] border-white/25'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              className="flex items-center justify-center w-8 h-8 bg-[#14111c]/90 text-[#f5efe6] border border-white/25 rounded-sm cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pause Game"
              className="flex items-center justify-center w-8 h-8 bg-[#14111c]/90 text-[#f5efe6] border border-white/25 rounded-sm cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto flex items-start gap-2 sm:gap-4">
          {/* PLAYER 1 HEALTH CLUSTER */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="hidden sm:block">
                <FighterCrestSvg accent={p1Spec.palette.uiAccent} initials={p1Initials} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1.5">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-display text-base sm:text-2xl font-extrabold uppercase tracking-wide text-[#faf5ee] hud-text-stroke truncate">
                      {hud.p1Name}
                    </span>
                    <span className="hidden md:inline text-xs font-medium text-[#d6cbbd]/80 truncate">
                      {p1Spec.style}
                    </span>
                  </div>
                  <RoundOrbs won={hud.p1Rounds} align="left" />
                </div>

                {/* Angled Health Bar with Delayed Trailing Damage Ghost */}
                <div className="hud-skew-left relative h-5 sm:h-6 bg-[#13101a]/95 border-2 border-[#f59e0b]/70 overflow-hidden shadow-[0_3px_12px_rgba(0,0,0,0.75)]">
                  <div
                    className="absolute inset-y-0 right-0 bg-[#b91c1c] transition-[width] duration-100"
                    style={{ width: `${p1TrailPct}%` }}
                  />
                  <div
                    data-testid="p1-health-fill"
                    className="absolute inset-y-0 right-0 transition-[width] duration-75"
                    style={{
                      width: `${p1Pct}%`,
                      background:
                        p1Pct > 30
                          ? 'linear-gradient(90deg, #16a34a 0%, #84cc16 55%, #facc15 100%)'
                          : 'linear-gradient(90deg, #dc2626 0%, #f97316 100%)',
                    }}
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[10px] sm:text-[11px] font-bold tabular-nums text-[#0b0a0e] bg-[#fef3c7]/85 px-1 rounded-[2px]">
                    {Math.round(hud.p1Hp)}
                  </span>
                </div>

                {/* Ki / Special Gauge */}
                <div className="mt-1 flex items-center gap-1.5 sm:gap-2">
                  <div className="hud-skew-left flex-1 h-2 bg-[#14111c]/95 border border-white/20 overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-100"
                      style={{
                        width: `${Math.min(100, Math.round(hud.p1Ki))}%`,
                        backgroundColor: hud.p1Ki >= 50 ? '#38bdf8' : '#94a3b8',
                      }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-bold tracking-wider uppercase tabular-nums text-[#e2d9cc] whitespace-nowrap">
                    {hud.p1Ki >= 50 ? 'SP READY' : `${Math.round(hud.p1Ki)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER ROUND TIMER & ROUND LABEL */}
          <div className="flex flex-col items-center shrink-0 px-1 sm:px-2">
            <div className="px-2 sm:px-3.5 py-1 bg-[#120f19]/95 border-2 border-[#f59e0b]/80 shadow-[0_4px_16px_rgba(0,0,0,0.85)] rounded-sm">
              <div
                data-testid="round-timer"
                className="font-display text-2xl sm:text-5xl leading-none font-extrabold tabular-nums text-[#fef08a] text-center min-w-[2ch]"
              >
                {Math.ceil(hud.roundTimer).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="hidden sm:block mt-1 text-xs font-display font-bold tracking-widest uppercase text-[#f5efe6] hud-text-stroke whitespace-nowrap">
              {hud.mode === 'tournament'
                ? `STAGE ${hud.tournamentStage + 1}/4 · RD ${hud.roundNumber}`
                : `ROUND ${hud.roundNumber}`}
            </div>
            {hud.mode === 'online' && hud.pingMs !== null && (
              <div className="font-mono text-[10px] tabular-nums text-[#7dd3fc] hud-text-stroke">
                {hud.pingMs}ms
              </div>
            )}
          </div>

          {/* PLAYER 2 HEALTH CLUSTER */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-row-reverse gap-2 mb-1">
              <div className="hidden sm:block">
                <FighterCrestSvg accent={p2Spec.palette.uiAccent} initials={p2Initials} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between flex-row-reverse gap-1.5">
                  <div className="flex items-baseline flex-row-reverse gap-2 min-w-0">
                    <span className="font-display text-base sm:text-2xl font-extrabold uppercase tracking-wide text-[#faf5ee] hud-text-stroke truncate">
                      {hud.p2Name}
                    </span>
                    <span className="hidden md:inline text-xs font-medium text-[#d6cbbd]/80 truncate">
                      {p2Spec.style}
                    </span>
                  </div>
                  <RoundOrbs won={hud.p2Rounds} align="right" />
                </div>

                {/* Mirrored Angled Health Bar */}
                <div className="hud-skew-right relative h-5 sm:h-6 bg-[#13101a]/95 border-2 border-[#f59e0b]/70 overflow-hidden shadow-[0_3px_12px_rgba(0,0,0,0.75)]">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#b91c1c] transition-[width] duration-100"
                    style={{ width: `${p2TrailPct}%` }}
                  />
                  <div
                    data-testid="p2-health-fill"
                    className="absolute inset-y-0 left-0 transition-[width] duration-75"
                    style={{
                      width: `${p2Pct}%`,
                      background:
                        p2Pct > 30
                          ? 'linear-gradient(270deg, #16a34a 0%, #84cc16 55%, #facc15 100%)'
                          : 'linear-gradient(270deg, #dc2626 0%, #f97316 100%)',
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] sm:text-[11px] font-bold tabular-nums text-[#0b0a0e] bg-[#fef3c7]/85 px-1 rounded-[2px]">
                    {Math.round(hud.p2Hp)}
                  </span>
                </div>

                {/* Mirrored Ki Gauge */}
                <div className="mt-1 flex items-center flex-row-reverse gap-1.5 sm:gap-2">
                  <div className="hud-skew-right flex-1 h-2 bg-[#14111c]/95 border border-white/20 overflow-hidden flex justify-end">
                    <div
                      className="h-full transition-[width] duration-100"
                      style={{
                        width: `${Math.min(100, Math.round(hud.p2Ki))}%`,
                        backgroundColor: hud.p2Ki >= 50 ? '#f59e0b' : '#94a3b8',
                      }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-bold tracking-wider uppercase tabular-nums text-[#e2d9cc] whitespace-nowrap">
                    {hud.p2Ki >= 50 ? 'SP MAX' : `${Math.round(hud.p2Ki)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DESKTOP COMPACT TOP-RIGHT UTILITY BUTTONS */}
          <div className="hidden sm:flex pointer-events-auto items-center gap-1.5 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTouchPad();
              }}
              aria-label={showTouchPad ? 'Hide Touch Controls' : 'Show Touch Controls'}
              title="Toggle Touch Controls"
              className={`flex items-center justify-center w-9 h-9 border rounded-sm transition-colors cursor-pointer ${
                showTouchPad
                  ? 'bg-[#f59e0b] text-[#0c0b10] border-[#fef08a]'
                  : 'bg-[#14111c]/90 text-[#f5efe6] border-white/25 hover:border-[#f59e0b]'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              title="Mute [M]"
              className="flex items-center justify-center w-9 h-9 bg-[#14111c]/90 text-[#f5efe6] border border-white/25 hover:border-[#f59e0b] rounded-sm transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pause Game"
              title="Pause [Esc]"
              className="flex items-center justify-center w-9 h-9 bg-[#14111c]/90 text-[#f5efe6] border border-white/25 hover:border-[#f59e0b] rounded-sm transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FLOATING SIDE COMBO CALLOUTS (NEVER BLOCKING CENTER FIGHTERS) */}
        <div className="max-w-6xl mx-auto flex justify-between mt-3 px-2">
          <div>
            {hud.p1Combo >= 2 && (
              <div className="font-display uppercase tracking-wider text-left">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#fbbf24] hud-text-stroke tabular-nums leading-none">
                  {hud.p1Combo} HITS
                </div>
                <div className="text-xs font-mono font-bold text-[#fef3c7] hud-text-stroke tabular-nums">
                  {hud.p1ComboDmg} DMG
                </div>
              </div>
            )}
          </div>
          <div>
            {hud.p2Combo >= 2 && (
              <div className="font-display uppercase tracking-wider text-right">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#f87171] hud-text-stroke tabular-nums leading-none">
                  {hud.p2Combo} HITS
                </div>
                <div className="text-xs font-mono font-bold text-[#fee2e2] hud-text-stroke tabular-nums">
                  {hud.p2ComboDmg} DMG
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRANSIENT ARCADE ROUND / K.O. CALLOUT BANNER */}
      {hud.bannerVisible && hud.bannerText && (
        <div className="fixed inset-x-0 top-[34%] flex flex-col items-center justify-center pointer-events-none px-4">
          <div className="font-display text-6xl sm:text-8xl font-extrabold uppercase tracking-wider text-[#fef08a] hud-text-stroke text-center leading-none">
            {hud.bannerText}
          </div>
          {hud.bannerSubtext && (
            <div className="mt-2 font-display text-lg sm:text-2xl font-bold tracking-[0.2em] uppercase text-[#f5efe6] hud-text-stroke text-center">
              {hud.bannerSubtext}
            </div>
          )}
        </div>
      )}

      {/* Minimal Bottom Control Bar on Desktop (hidden when touch controls are shown) */}
      {!showTouchPad && (
        <div className="hidden md:flex justify-center pb-3 px-4">
          <p className="text-xs font-medium text-[#e2d9cc]/80 hud-text-stroke tracking-wide">
            {hud.mode === 'local_2p'
              ? 'P1: WASD + F/G/H/R (E Block · Q Special)  |  P2: Arrows + J/K/L/U (O Block · I Special)'
              : 'WASD Move · F Jab · G Cross · H Kick · R Roundhouse · E Guard · Q Special · Shift Sidestep'}
          </p>
        </div>
      )}
    </div>
  );
}

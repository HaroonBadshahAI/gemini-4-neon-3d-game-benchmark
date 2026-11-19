'use client';

import React from 'react';
import { Play, Swords, Trophy, Users, X } from 'lucide-react';
import {
  CHARACTER_LIST,
  CharacterId,
  STAGE_LIST,
  StageId,
} from '@/lib/game/characters';
import type { DifficultyLevel, GameMode } from '@/lib/game/combatEngine';

interface RosterModalProps {
  open: boolean;
  mode: GameMode;
  p1Character: CharacterId;
  p2Character: CharacterId;
  stageId: StageId;
  difficulty: DifficultyLevel;
  onChangeMode: (m: GameMode) => void;
  onSelectP1: (id: CharacterId) => void;
  onSelectP2: (id: CharacterId) => void;
  onSelectStage: (id: StageId) => void;
  onChangeDifficulty: (d: DifficultyLevel) => void;
  onStartMatch: () => void;
  onClose: () => void;
}

export default function RosterModal({
  open,
  mode,
  p1Character,
  p2Character,
  stageId,
  difficulty,
  onChangeMode,
  onSelectP1,
  onSelectP2,
  onSelectStage,
  onChangeDifficulty,
  onStartMatch,
  onClose,
}: RosterModalProps) {
  if (!open) return null;

  const selectedP1 = CHARACTER_LIST.find((c) => c.id === p1Character) ?? CHARACTER_LIST[0];
  const selectedP2 = CHARACTER_LIST.find((c) => c.id === p2Character) ?? CHARACTER_LIST[1];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Versus and Roster Selection"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-[#13101a] border-2 border-[#f59e0b]/45 shadow-[0_24px_70px_rgba(0,0,0,0.9)] rounded-sm overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#191522]">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-[#fef3c7] leading-none">
              Select Fighter &amp; Arena
            </h2>
            <p className="text-xs text-[#c4b8a8] mt-1">
              Best of 3 Rounds · 3D Sidestep · Unique Special Techniques
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Roster Selection"
            className="flex items-center justify-center w-9 h-9 text-[#d6cbbd] hover:text-white border border-white/15 hover:border-[#f59e0b] rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Mode Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#0c0a12] border border-white/10 rounded-sm">
              {(
                [
                  { id: 'tournament', label: 'Tournament', icon: Trophy },
                  { id: 'versus_cpu', label: '1P vs CPU', icon: Swords },
                  { id: 'local_2p', label: 'Local 2P', icon: Users },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChangeMode(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-sm transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#dc2626] text-white'
                        : 'text-[#c4b8a8] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {mode === 'versus_cpu' && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#c4b8a8] mr-1">CPU Tier</span>
                {(['rookie', 'fighter', 'master'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onChangeDifficulty(lvl)}
                    className={`px-2.5 py-1.5 text-xs font-semibold capitalize rounded-sm border transition-colors cursor-pointer ${
                      difficulty === lvl
                        ? 'bg-[#f59e0b] text-[#0c0b10] border-[#fef08a]'
                        : 'bg-[#1a1624] text-[#d6cbbd] border-white/15 hover:border-[#f59e0b]/60'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fighter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* P1 Selection Column */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-display text-lg font-bold uppercase tracking-wider text-[#fbbf24]">
                  Player 1 Fighter
                </span>
                <span className="text-xs text-[#c4b8a8]">
                  {selectedP1.style} · {selectedP1.origin}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CHARACTER_LIST.map((char) => {
                  const chosen = p1Character === char.id;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => onSelectP1(char.id)}
                      className={`text-left p-3 rounded-sm border transition-colors cursor-pointer ${
                        chosen
                          ? 'bg-[#241c2c] border-[#f59e0b] text-white'
                          : 'bg-[#171420] border-white/10 text-[#d6cbbd] hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-lg font-extrabold uppercase tracking-wide leading-tight">
                          {char.name}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: char.palette.uiAccent }}
                        />
                      </div>
                      <div className="text-xs text-[#c4b8a8] mt-0.5 truncate">
                        {char.style}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected P1 Stats & Special Readout */}
              <div className="mt-3 p-3.5 bg-[#0e0c14] border border-white/10 rounded-sm">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#fbbf24] uppercase tracking-wider">
                    Special · {selectedP1.specialName}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[#c4b8a8]">
                    HP {selectedP1.maxHp}
                  </span>
                </div>
                <p className="text-xs text-[#d6cbbd]/85 mb-2.5">{selectedP1.specialDesc}</p>
                <div className="grid grid-cols-4 gap-2 text-[11px] font-mono tabular-nums">
                  {(['power', 'speed', 'reach', 'defense'] as const).map((stat) => (
                    <div key={stat}>
                      <div className="flex justify-between text-[#c4b8a8] uppercase">
                        <span>{stat.slice(0, 3)}</span>
                        <span>{selectedP1.stats[stat]}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#f59e0b]"
                          style={{ width: `${selectedP1.stats[stat] * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* P2 Selection or Tournament Ladder Preview */}
            <div>
              {mode === 'tournament' ? (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-display text-lg font-bold uppercase tracking-wider text-[#f87171]">
                      4-Stage Solo Ladder
                    </span>
                    <span className="text-xs text-[#c4b8a8]">Escalating AI · RP Rewards</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { stage: 'Stage 1 · Qualifier Bout', arena: 'Kyoto Sunset Shrine', tier: 'Rookie · +35 RP' },
                      { stage: 'Stage 2 · Semifinal Clash', arena: 'Shibuya Helipad', tier: 'Fighter · +55 RP' },
                      { stage: 'Stage 3 · Master Trial', arena: 'Okinawa Moonlit Pier', tier: 'Master · +80 RP' },
                      { stage: 'Stage 4 · Iron Fist Final', arena: 'Kyoto Sunset Shrine', tier: 'Boss · +130 RP' },
                    ].map((row, idx) => (
                      <div
                        key={row.stage}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-[#171420] border border-white/10 rounded-sm"
                      >
                        <div>
                          <div className="font-display text-base font-bold uppercase tracking-wide text-[#faf5ee]">
                            0{idx + 1}. {row.stage}
                          </div>
                          <div className="text-xs text-[#c4b8a8]">{row.arena}</div>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-[#fbbf24]">
                          {row.tier}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-display text-lg font-bold uppercase tracking-wider text-[#f87171]">
                      {mode === 'local_2p' ? 'Player 2 Fighter' : 'CPU Opponent'}
                    </span>
                    <span className="text-xs text-[#c4b8a8]">
                      {selectedP2.style} · {selectedP2.origin}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CHARACTER_LIST.map((char) => {
                      const chosen = p2Character === char.id;
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => onSelectP2(char.id)}
                          className={`text-left p-3 rounded-sm border transition-colors cursor-pointer ${
                            chosen
                              ? 'bg-[#2a191f] border-[#ef4444] text-white'
                              : 'bg-[#171420] border-white/10 text-[#d6cbbd] hover:border-white/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-lg font-extrabold uppercase tracking-wide leading-tight">
                              {char.name}
                            </span>
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: char.palette.uiAccent }}
                            />
                          </div>
                          <div className="text-xs text-[#c4b8a8] mt-0.5 truncate">
                            {char.style}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Stage Selector for Versus / Local 2P */}
                  <div className="mt-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#c4b8a8] mb-2">
                      3D Combat Stage
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {STAGE_LIST.map((st) => {
                        const chosen = stageId === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onSelectStage(st.id)}
                            className={`text-left p-2.5 rounded-sm border transition-colors cursor-pointer ${
                              chosen
                                ? 'bg-[#231d2d] border-[#f59e0b] text-white'
                                : 'bg-[#171420] border-white/10 text-[#c4b8a8] hover:border-white/30'
                            }`}
                          >
                            <div className="font-display text-sm font-bold uppercase tracking-wide leading-tight">
                              {st.name}
                            </div>
                            <div className="text-[11px] opacity-75 mt-0.5 truncate">
                              {st.location}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Local 2P Controls Reminder + Launch CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
            <p className="text-xs text-[#c4b8a8]">
              {mode === 'local_2p'
                ? 'P1: WASD + F/G/H/R/Q (E Block) · P2: Arrows + J/K/L/U/I (O Block)'
                : '3 Rounds · First to 2 Wins · Sidestep [Shift] dodges linear strikes'}
            </p>
            <button
              type="button"
              onClick={onStartMatch}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#dc2626] hover:bg-[#ef4444] text-white font-display text-xl font-extrabold uppercase tracking-wider rounded-sm border border-[#fca5a5]/50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              Enter Arena
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

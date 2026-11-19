'use client';

import React from 'react';
import { ChevronRight, Home, Play, RotateCcw, Trophy } from 'lucide-react';
import type { GameMode } from '@/lib/game/combatEngine';

export interface MatchEndSummary {
  winnerName: string;
  playerWon: boolean;
  mode: GameMode;
  tournamentStage: number;
  isTournamentChampion: boolean;
  p1Rounds: number;
  p2Rounds: number;
  damageDealt: number;
  maxCombo: number;
  rpDelta: number | null;
  newRp: number | null;
  newTier: string | null;
}

interface StatusModalProps {
  kind: 'paused' | 'gameover';
  summary: MatchEndSummary | null;
  onResume: () => void;
  onRestart: () => void;
  onNextTournamentStage: () => void;
  onReturnTitle: () => void;
  onOpenLeaderboard: () => void;
}

export default function StatusModal({
  kind,
  summary,
  onResume,
  onRestart,
  onNextTournamentStage,
  onReturnTitle,
  onOpenLeaderboard,
}: StatusModalProps) {
  if (kind === 'paused') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Game Paused"
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
      >
        <div className="w-full max-w-sm bg-[#13101a] border-2 border-[#f59e0b]/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] rounded-sm p-6 text-center">
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-wider text-[#fef08a]">
            Match Paused
          </h2>
          <p className="text-xs text-[#c4b8a8] mt-1 mb-6">
            Press Esc to resume combat immediately
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="flex items-center justify-center gap-2 py-3 bg-[#dc2626] hover:bg-[#ef4444] text-white font-display text-xl font-bold uppercase tracking-wider rounded-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Fight
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#1e1a29] hover:bg-[#2b253a] text-[#f5efe6] font-display text-lg font-bold uppercase tracking-wider border border-white/15 rounded-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Bout
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="flex items-center justify-center gap-2 py-2.5 bg-transparent hover:bg-white/5 text-[#c4b8a8] hover:text-white font-display text-lg font-bold uppercase tracking-wider border border-white/10 rounded-sm cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Title Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const canAdvanceTournament =
    summary.mode === 'tournament' &&
    summary.playerWon &&
    !summary.isTournamentChampion;

  const heading = summary.isTournamentChampion
    ? 'Iron Fist Champion'
    : summary.mode === 'local_2p'
      ? `${summary.winnerName} Wins`
      : summary.playerWon
        ? 'Victory'
        : 'Defeat';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Match Result"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="w-full max-w-md bg-[#13101a] border-2 border-[#f59e0b]/65 shadow-[0_24px_70px_rgba(0,0,0,0.92)] rounded-sm p-6">
        <div className="text-center mb-5">
          {summary.isTournamentChampion && (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b] text-[#fbbf24] mb-2">
              <Trophy className="w-6 h-6" />
            </div>
          )}
          <h2
            className={`font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-wider leading-none ${
              summary.playerWon || summary.mode === 'local_2p'
                ? 'text-[#fef08a]'
                : 'text-[#f87171]'
            }`}
          >
            {heading}
          </h2>
          <p className="text-xs text-[#c4b8a8] mt-1.5">
            {summary.mode === 'tournament'
              ? `Tournament Stage ${summary.tournamentStage + 1} of 4 · Final Score ${summary.p1Rounds} - ${summary.p2Rounds}`
              : `Final Rounds ${summary.p1Rounds} - ${summary.p2Rounds}`}
          </p>
        </div>

        {/* 3 Clean Tabular Mastery Stat Tiles */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="p-3 bg-[#0e0c14] border border-white/10 rounded-sm text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#c4b8a8]">Damage</div>
            <div className="font-mono text-xl font-bold tabular-nums text-white mt-0.5">
              {Math.round(summary.damageDealt)}
            </div>
          </div>
          <div className="p-3 bg-[#0e0c14] border border-white/10 rounded-sm text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#c4b8a8]">Max Combo</div>
            <div className="font-mono text-xl font-bold tabular-nums text-[#fbbf24] mt-0.5">
              {summary.maxCombo}
            </div>
          </div>
          <div className="p-3 bg-[#0e0c14] border border-white/10 rounded-sm text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#c4b8a8]">Ranked RP</div>
            <div className="font-mono text-xl font-bold tabular-nums text-[#38bdf8] mt-0.5">
              {summary.rpDelta !== null
                ? `${summary.rpDelta >= 0 ? '+' : ''}${summary.rpDelta}`
                : '—'}
            </div>
          </div>
        </div>

        {summary.newRp !== null && summary.newTier && (
          <div className="mb-5 px-3.5 py-2 bg-[#111c2c] border border-[#38bdf8]/35 rounded-sm flex items-center justify-between text-xs">
            <span className="text-[#bae6fd] font-medium">
              Updated Standing · {summary.newTier}
            </span>
            <span className="font-mono font-bold tabular-nums text-white">
              {summary.newRp} RP
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {canAdvanceTournament ? (
            <button
              type="button"
              data-start="true"
              onClick={onNextTournamentStage}
              className="flex items-center justify-center gap-2 py-3 bg-[#dc2626] hover:bg-[#ef4444] text-white font-display text-xl font-extrabold uppercase tracking-wider rounded-sm cursor-pointer"
            >
              Next Tournament Stage
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 py-3 bg-[#dc2626] hover:bg-[#ef4444] text-white font-display text-xl font-extrabold uppercase tracking-wider rounded-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {summary.playerWon ? 'Play Again' : 'Try Again'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#1c1826] hover:bg-[#272136] border border-[#38bdf8]/35 text-[#e0f2fe] font-display text-base font-bold uppercase tracking-wider rounded-sm cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-[#fbbf24]" />
              Standings
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#1c1826] hover:bg-[#272136] border border-white/15 text-[#d6cbbd] font-display text-base font-bold uppercase tracking-wider rounded-sm cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Title
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

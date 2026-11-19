'use client';

import React, { useState } from 'react';
import { Check, Copy, Globe, RefreshCw, Swords, Trophy, Wifi, X } from 'lucide-react';
import { CHARACTERS, CHARACTER_LIST, CharacterId } from '@/lib/game/characters';
import type { LeaderboardEntry } from '@/lib/game/ranking';
import type { OnlinePresence } from '@/lib/game/onlineClient';

interface OnlineModalProps {
  open: boolean;
  callsign: string;
  selectedChar: CharacterId;
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  pingMs: number | null;
  presence: OnlinePresence;
  inQueue: boolean;
  roomCode: string | null;
  roomError: string | null;
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  onChangeCallsign: (val: string) => void;
  onSelectChar: (id: CharacterId) => void;
  onFindMatch: () => void;
  onCancelQueue: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onRefreshLeaderboard: () => void;
  onClose: () => void;
}

export default function OnlineModal({
  open,
  callsign,
  selectedChar,
  wsStatus,
  pingMs,
  presence,
  inQueue,
  roomCode,
  roomError,
  leaderboard,
  leaderboardLoading,
  onChangeCallsign,
  onSelectChar,
  onFindMatch,
  onCancelQueue,
  onCreateRoom,
  onJoinRoom,
  onRefreshLeaderboard,
  onClose,
}: OnlineModalProps) {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Online Matchmaking and Ranked Leaderboards"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-5xl bg-[#13101a] border-2 border-[#38bdf8]/45 shadow-[0_24px_70px_rgba(0,0,0,0.9)] rounded-sm overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#191522]">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-[#f0f9ff] leading-none">
              Online Arena &amp; Ranked Standings
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#bae6fd]/85 mt-1">
              <span className="inline-flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" />
                {wsStatus === 'connected'
                  ? `Connected${pingMs ? ` · ${pingMs}ms RTT` : ''}`
                  : wsStatus === 'connecting'
                    ? 'Connecting to Match Server...'
                    : 'Offline'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{presence.onlineCount} Online</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{presence.queueCount} In Queue</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Online Arena"
            className="flex items-center justify-center w-9 h-9 text-[#d6cbbd] hover:text-white border border-white/15 hover:border-[#38bdf8] rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-h-[82vh] overflow-y-auto">
          {/* Left Column: Live WebSocket Matchmaking & Private Room Lobby */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label
                htmlFor="fighter-callsign-input"
                className="block text-xs font-semibold uppercase tracking-wider text-[#c4b8a8] mb-1.5"
              >
                Fighter Callsign
              </label>
              <input
                id="fighter-callsign-input"
                type="text"
                maxLength={18}
                value={callsign}
                onChange={(e) => onChangeCallsign(e.target.value)}
                placeholder="Enter callsign..."
                className="w-full px-3.5 py-2.5 bg-[#0c0a12] border border-white/20 focus:border-[#38bdf8] outline-none text-sm font-semibold text-white rounded-sm"
              />
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#c4b8a8] mb-1.5">
                Ranked Main Fighter
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {CHARACTER_LIST.map((c) => {
                  const active = selectedChar === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectChar(c.id)}
                      className={`px-3 py-2 text-left rounded-sm border text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#19283a] border-[#38bdf8] text-white'
                          : 'bg-[#171420] border-white/10 text-[#c4b8a8] hover:border-white/30'
                      }`}
                    >
                      <div className="font-display text-sm font-bold uppercase tracking-wide">
                        {c.name}
                      </div>
                      <div className="text-[11px] opacity-75 truncate">{c.style}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Ranked Queue Action */}
            <div className="p-4 bg-[#0f131d] border border-[#38bdf8]/30 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold uppercase tracking-wider text-[#e0f2fe]">
                  Quick Ranked Match
                </span>
                <Globe className="w-4 h-4 text-[#38bdf8]" />
              </div>
              {inQueue ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-[#bae6fd]">
                    Searching for a live opponent on WebSocket server. Open a second browser tab or
                    device to test head-to-head immediately.
                  </p>
                  <button
                    type="button"
                    onClick={onCancelQueue}
                    className="w-full py-2.5 bg-[#291b22] hover:bg-[#3b222c] border border-[#ef4444]/60 text-[#fecaca] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                  >
                    Cancel Search
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onFindMatch}
                  disabled={wsStatus !== 'connected'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0284c7] hover:bg-[#0ea5e9] disabled:opacity-50 text-white font-display text-lg font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  Find Ranked Opponent
                </button>
              )}
            </div>

            {/* Private 4-Char Room Code Lobby */}
            <div className="p-4 bg-[#171420] border border-white/15 rounded-sm space-y-3">
              <div className="font-display text-lg font-bold uppercase tracking-wider text-[#fef3c7]">
                Private Versus Room
              </div>

              {roomCode ? (
                <div className="p-3 bg-[#0c0a12] border border-[#f59e0b]/50 rounded-sm flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#c4b8a8]">
                      Share Room Code · Waiting for P2
                    </div>
                    <div
                      data-testid="active-room-code"
                      className="font-mono text-2xl font-bold tracking-[0.2em] text-[#fbbf24] tabular-nums"
                    >
                      {roomCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    aria-label="Copy Room Code"
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1a29] hover:bg-[#2a2438] border border-white/15 text-xs font-semibold text-white rounded-sm cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#34d399]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onCreateRoom}
                  disabled={wsStatus !== 'connected'}
                  className="w-full py-2 bg-[#231d2d] hover:bg-[#2f273d] disabled:opacity-50 border border-[#f59e0b]/50 text-[#fef3c7] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  Create Private Room
                </button>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (joinCodeInput.trim().length >= 4) {
                    onJoinRoom(joinCodeInput.trim().toUpperCase());
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  maxLength={6}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="Room code (e.g. K7X2)"
                  aria-label="Private Room Code"
                  className="flex-1 px-3 py-2 bg-[#0c0a12] border border-white/20 focus:border-[#f59e0b] outline-none font-mono text-xs uppercase tracking-widest text-white rounded-sm"
                />
                <button
                  type="submit"
                  disabled={wsStatus !== 'connected' || joinCodeInput.trim().length < 4}
                  className="px-4 py-2 bg-[#f59e0b] hover:bg-[#fbbf24] disabled:opacity-40 text-[#0c0b10] font-display text-sm font-extrabold uppercase tracking-wider rounded-sm cursor-pointer whitespace-nowrap"
                >
                  Join
                </button>
              </form>

              {roomError && (
                <p role="alert" className="text-xs text-[#fca5a5] font-medium">
                  {roomError}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Live Ranked Leaderboard */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#f59e0b]" />
                <h3 className="font-display text-xl font-extrabold uppercase tracking-wider text-[#fef3c7]">
                  Global Ranked Leaderboard
                </h3>
              </div>
              <button
                type="button"
                onClick={onRefreshLeaderboard}
                aria-label="Refresh Ranked Leaderboard"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1624] hover:bg-[#252034] border border-white/15 text-xs font-medium text-[#d6cbbd] rounded-sm cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${leaderboardLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="flex-1 bg-[#0e0c14] border border-white/10 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#171420] text-[11px] font-semibold uppercase tracking-wider text-[#c4b8a8]">
                      <th className="py-2.5 px-3 w-12">#</th>
                      <th className="py-2.5 px-3">Fighter</th>
                      <th className="py-2.5 px-3">Main Style</th>
                      <th className="py-2.5 px-3">Tier</th>
                      <th className="py-2.5 px-3 text-right">W - L</th>
                      <th className="py-2.5 px-3 text-right">RP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {leaderboard.map((entry, idx) => {
                      const charSpec = CHARACTERS[entry.mainCharacter] ?? CHARACTERS.kenji;
                      const isSelf =
                        entry.callsign.toLowerCase() === callsign.trim().toLowerCase();
                      return (
                        <tr
                          key={entry.id}
                          className={
                            isSelf
                              ? 'bg-[#1e293b]/65 text-white'
                              : 'text-[#e2d9cc] hover:bg-white/[0.03]'
                          }
                        >
                          <td className="py-2.5 px-3 font-mono font-bold tabular-nums text-[#fbbf24]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                            {entry.callsign}
                          </td>
                          <td className="py-2.5 px-3 text-[#c4b8a8] whitespace-nowrap">
                            {charSpec.name}
                          </td>
                          <td className="py-2.5 px-3 font-medium whitespace-nowrap text-[#fde68a]">
                            {entry.tier}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#c4b8a8]">
                            {entry.wins}-{entry.losses}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-[#38bdf8]">
                            {entry.rp}
                          </td>
                        </tr>
                      );
                    })}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#c4b8a8]">
                          {leaderboardLoading
                            ? 'Loading ranked fighters...'
                            : 'No ranked records yet. Complete a match to claim #1.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-[#c4b8a8]/80 mt-2">
              Tournament clears and Online Ranked wins automatically update your live RP standing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

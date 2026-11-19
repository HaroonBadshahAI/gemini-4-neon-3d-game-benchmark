import type { CharacterId } from './characters';

export type RankTier =
  | 'Initiate'
  | 'Brawler'
  | 'Warrior'
  | 'Shihan'
  | 'Grandmaster'
  | 'Iron Fist';

export interface LeaderboardEntry {
  id: string;
  callsign: string;
  mainCharacter: CharacterId;
  rp: number;
  tier: RankTier;
  wins: number;
  losses: number;
  winStreak: number;
  updatedAt: string;
}

export function getRankTier(rp: number): RankTier {
  if (rp >= 2200) return 'Iron Fist';
  if (rp >= 1850) return 'Grandmaster';
  if (rp >= 1550) return 'Shihan';
  if (rp >= 1250) return 'Warrior';
  if (rp >= 1000) return 'Brawler';
  return 'Initiate';
}

export function calculateRpDelta(
  playerRp: number,
  opponentRp: number,
  didWin: boolean,
  perfectRounds = 0,
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRp - playerRp) / 400));
  const kFactor = 36;
  const rawDelta = Math.round(kFactor * ((didWin ? 1 : 0) - expected));
  const bonus = didWin ? perfectRounds * 6 : 0;
  if (didWin) {
    return Math.max(12, rawDelta + bonus);
  }
  return Math.min(-8, rawDelta);
}

export function sanitizeCallsign(input: string): string {
  const trimmed = input.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').slice(0, 18);
  return trimmed.length >= 2 ? trimmed : 'DojoFighter';
}

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.rp !== a.rp) return b.rp - a.rp;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.callsign.localeCompare(b.callsign);
  });
}

export const INITIAL_SEED_LEADERBOARD: LeaderboardEntry[] = sortLeaderboard([
  {
    id: 'seed-kazuya-jin',
    callsign: 'KuroDragon',
    mainCharacter: 'kenji',
    rp: 2340,
    tier: getRankTier(2340),
    wins: 68,
    losses: 11,
    winStreak: 9,
    updatedAt: '2026-11-18T12:00:00.000Z',
  },
  {
    id: 'seed-seoul-kick',
    callsign: 'CrimsonTalon',
    mainCharacter: 'hwojin',
    rp: 2115,
    tier: getRankTier(2115),
    wins: 54,
    losses: 15,
    winStreak: 5,
    updatedAt: '2026-11-18T11:30:00.000Z',
  },
  {
    id: 'seed-jade-palm',
    callsign: 'LotusStep',
    mainCharacter: 'lingmei',
    rp: 1940,
    tier: getRankTier(1940),
    wins: 47,
    losses: 16,
    winStreak: 3,
    updatedAt: '2026-11-18T10:15:00.000Z',
  },
  {
    id: 'seed-iron-v',
    callsign: 'AnvilKing',
    mainCharacter: 'gaius',
    rp: 1780,
    tier: getRankTier(1780),
    wins: 39,
    losses: 18,
    winStreak: 4,
    updatedAt: '2026-11-18T09:45:00.000Z',
  },
  {
    id: 'seed-kyoto-98',
    callsign: 'ShrineGhost',
    mainCharacter: 'kenji',
    rp: 1610,
    tier: getRankTier(1610),
    wins: 32,
    losses: 19,
    winStreak: 2,
    updatedAt: '2026-11-18T08:00:00.000Z',
  },
  {
    id: 'seed-tae-storm',
    callsign: 'HurricaneTKD',
    mainCharacter: 'hwojin',
    rp: 1465,
    tier: getRankTier(1465),
    wins: 28,
    losses: 21,
    winStreak: 1,
    updatedAt: '2026-11-18T07:10:00.000Z',
  },
  {
    id: 'seed-palm-wind',
    callsign: 'BaguaMist',
    mainCharacter: 'lingmei',
    rp: 1320,
    tier: getRankTier(1320),
    wins: 21,
    losses: 17,
    winStreak: 2,
    updatedAt: '2026-11-18T06:00:00.000Z',
  },
  {
    id: 'seed-iron-rookie',
    callsign: 'DojoRonin',
    mainCharacter: 'gaius',
    rp: 1140,
    tier: getRankTier(1140),
    wins: 14,
    losses: 15,
    winStreak: 0,
    updatedAt: '2026-11-18T05:00:00.000Z',
  },
]);

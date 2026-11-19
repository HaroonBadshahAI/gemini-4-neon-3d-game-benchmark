import fs from 'node:fs';
import path from 'node:path';
import type { CharacterId } from '../game/characters';
import {
  INITIAL_SEED_LEADERBOARD,
  LeaderboardEntry,
  calculateRpDelta,
  getRankTier,
  sanitizeCallsign,
  sortLeaderboard,
} from '../game/ranking';

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'leaderboard.json');

let memoryCache: LeaderboardEntry[] | null = null;

function loadFromDisk(): LeaderboardEntry[] {
  if (memoryCache) return memoryCache;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache = sortLeaderboard(parsed);
        return memoryCache;
      }
    }
  } catch {
    // Fall back to seed data if file is missing or unreadable
  }
  memoryCache = sortLeaderboard([...INITIAL_SEED_LEADERBOARD]);
  persistToDisk(memoryCache);
  return memoryCache;
}

function persistToDisk(entries: LeaderboardEntry[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(entries, null, 2), 'utf8');
  } catch {
    // Keep in-memory store functional even if filesystem is read-only
  }
}

export function getLeaderboard(limit = 25): LeaderboardEntry[] {
  return sortLeaderboard(loadFromDisk()).slice(0, limit);
}

export function recordMatchResult(params: {
  callsign: string;
  characterId: CharacterId;
  didWin: boolean;
  opponentRp?: number;
  perfectRounds?: number;
  bonusRp?: number;
}): {
  entry: LeaderboardEntry;
  rpDelta: number;
  rank: number;
  leaderboard: LeaderboardEntry[];
} {
  const entries = [...loadFromDisk()];
  const cleanName = sanitizeCallsign(params.callsign);
  const normalizedKey = cleanName.toLowerCase();

  let existing = entries.find((e) => e.callsign.toLowerCase() === normalizedKey);
  if (!existing) {
    existing = {
      id: `player-${normalizedKey.replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
      callsign: cleanName,
      mainCharacter: params.characterId,
      rp: 1050,
      tier: getRankTier(1050),
      wins: 0,
      losses: 0,
      winStreak: 0,
      updatedAt: new Date().toISOString(),
    };
    entries.push(existing);
  }

  const oppRp = params.opponentRp ?? 1250;
  const computedDelta =
    params.bonusRp !== undefined
      ? params.bonusRp
      : calculateRpDelta(existing.rp, oppRp, params.didWin, params.perfectRounds ?? 0);

  existing.rp = Math.max(400, existing.rp + computedDelta);
  existing.tier = getRankTier(existing.rp);
  existing.mainCharacter = params.characterId;
  if (params.didWin) {
    existing.wins += 1;
    existing.winStreak += 1;
  } else {
    existing.losses += 1;
    existing.winStreak = 0;
  }
  existing.updatedAt = new Date().toISOString();

  const sorted = sortLeaderboard(entries);
  memoryCache = sorted;
  persistToDisk(sorted);

  const rank = sorted.findIndex((e) => e.id === existing!.id) + 1;
  return {
    entry: existing,
    rpDelta: computedDelta,
    rank,
    leaderboard: sorted.slice(0, 25),
  };
}

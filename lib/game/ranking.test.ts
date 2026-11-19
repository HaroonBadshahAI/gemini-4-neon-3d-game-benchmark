import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_SEED_LEADERBOARD,
  calculateRpDelta,
  getRankTier,
  sanitizeCallsign,
  sortLeaderboard,
} from './ranking';

test('rank tier thresholds map accurately across all martial tiers', () => {
  assert.equal(getRankTier(900), 'Initiate');
  assert.equal(getRankTier(1000), 'Brawler');
  assert.equal(getRankTier(1250), 'Warrior');
  assert.equal(getRankTier(1600), 'Shihan');
  assert.equal(getRankTier(1900), 'Grandmaster');
  assert.equal(getRankTier(2250), 'Iron Fist');
});

test('RP calculation rewards upsets more and grants perfect-round bonus', () => {
  const normalWin = calculateRpDelta(1200, 1200, true, 0);
  const upsetWin = calculateRpDelta(1200, 1700, true, 0);
  const perfectWin = calculateRpDelta(1200, 1200, true, 2);
  const loss = calculateRpDelta(1200, 1200, false, 0);

  assert.ok(upsetWin > normalWin, 'upset win should grant more RP');
  assert.equal(perfectWin, normalWin + 12, 'each perfect round adds +6 RP');
  assert.ok(loss <= -8, 'loss should deduct RP');
});

test('callsign sanitization strips invalid characters and falls back safely', () => {
  assert.equal(sanitizeCallsign('  Kenji_98!!  '), 'Kenji_98');
  assert.equal(sanitizeCallsign('!'), 'DojoFighter');
});

test('leaderboard sorts strictly by RP descending', () => {
  const sorted = sortLeaderboard(INITIAL_SEED_LEADERBOARD);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i - 1].rp >= sorted[i].rp);
  }
});

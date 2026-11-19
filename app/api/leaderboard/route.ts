import { NextRequest, NextResponse } from 'next/server';
import { CHARACTERS, CharacterId } from '@/lib/game/characters';
import { getLeaderboard, recordMatchResult } from '@/lib/server/leaderboardStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const leaderboard = getLeaderboard(25);
  return NextResponse.json({
    leaderboard,
    totalRanked: leaderboard.length,
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callsign = typeof body.callsign === 'string' ? body.callsign : 'DojoFighter';
    const characterId: CharacterId =
      typeof body.characterId === 'string' && body.characterId in CHARACTERS
        ? (body.characterId as CharacterId)
        : 'kenji';
    const didWin = Boolean(body.didWin);
    const opponentRp =
      typeof body.opponentRp === 'number' && Number.isFinite(body.opponentRp)
        ? body.opponentRp
        : 1250;
    const perfectRounds =
      typeof body.perfectRounds === 'number' && Number.isFinite(body.perfectRounds)
        ? Math.max(0, Math.min(2, Math.floor(body.perfectRounds)))
        : 0;
    const bonusRp =
      typeof body.bonusRp === 'number' && Number.isFinite(body.bonusRp)
        ? Math.round(body.bonusRp)
        : undefined;

    const result = recordMatchResult({
      callsign,
      characterId,
      didWin,
      opponentRp,
      perfectRounds,
      bonusRp,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Invalid ranked match submission payload.' },
      { status: 400 },
    );
  }
}

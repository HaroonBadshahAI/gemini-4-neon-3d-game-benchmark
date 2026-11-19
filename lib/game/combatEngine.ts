import {
  CHARACTERS,
  CharacterId,
  MoveSpec,
  MoveType,
  StageId,
} from './characters';

export type GameMode = 'tournament' | 'versus_cpu' | 'local_2p' | 'online';
export type DifficultyLevel = 'rookie' | 'fighter' | 'master' | 'boss';

export type FighterAction =
  | 'idle'
  | 'walk_fwd'
  | 'walk_back'
  | 'dash_fwd'
  | 'dash_back'
  | 'sidestep'
  | 'crouch'
  | 'jump'
  | 'block'
  | 'attack'
  | 'hitstun'
  | 'blockstun'
  | 'launched'
  | 'knockdown'
  | 'ko'
  | 'victory';

export type MatchPhase =
  | 'title'
  | 'intro'
  | 'fighting'
  | 'round_ko'
  | 'match_over';

export interface PlayerInputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  block: boolean;
  sidestep: boolean;
  lp: boolean;
  rp: boolean;
  lk: boolean;
  rk: boolean;
  special: boolean;
  throwBtn: boolean;
}

export interface CombatEvent {
  type:
    | 'swing'
    | 'hit'
    | 'heavy_hit'
    | 'block'
    | 'special'
    | 'ko'
    | 'round_start'
    | 'fight_call'
    | 'jump'
    | 'land'
    | 'dash'
    | 'victory';
  attackerIndex?: 0 | 1;
  x: number;
  y: number;
  z: number;
  colorHex?: string;
  damage?: number;
}

export interface FighterState {
  index: 0 | 1;
  characterId: CharacterId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  facing: 1 | -1; // 1 = facing +X (right), -1 = facing -X (left)
  hp: number;
  trailHp: number;
  maxHp: number;
  ki: number; // 0..100
  action: FighterAction;
  actionTime: number;
  currentMove: MoveType | null;
  moveHitConnected: boolean;
  comboStep: number; // 0, 1, 2 for 3-hit dial-a-combo
  comboWindow: number;
  comboDisplayCount: number;
  comboDisplayDamage: number;
  comboDisplayTimer: number;
  stunTimer: number;
  hitFlash: number;
  sidestepDir: 1 | -1;
  sidestepTimer: number;
  dashTimer: number;
  grounded: boolean;
  crouching: boolean;
  roundsWon: number;
  totalDamageDealt: number;
  maxCombo: number;
  perfectRounds: number;
  bufferedMove: MoveType | null;
  bufferTimer: number;
  lastMoveInput: MoveType | null;
  prevInput: PlayerInputState;
  aiThinkTimer: number;
  aiDesiredRange: number;
  aiCurrentIntent: 'approach' | 'retreat' | 'strafe' | 'guard' | 'pressure';
  aiIntentTimer: number;
}

export interface MatchState {
  mode: GameMode;
  stageId: StageId;
  difficulty: DifficultyLevel;
  tournamentStage: number;
  phase: MatchPhase;
  phaseTimer: number;
  roundNumber: number;
  roundTimer: number;
  maxRoundTime: number;
  hitstopTimer: number;
  slowMoTimer: number;
  cameraShake: number;
  bannerText: string;
  bannerSubtext: string;
  bannerTimer: number;
  winnerIndex: 0 | 1 | null;
  fighters: [FighterState, FighterState];
  elapsedTime: number;
  isOnlineHost: boolean;
}

export const ARENA_HALF_WIDTH = 5.4;
export const ARENA_HALF_DEPTH = 2.0;
export const GRAVITY = 23.0;
export const MIN_FIGHTER_SEPARATION = 0.88;
export const ROUNDS_TO_WIN = 2;

export function createEmptyInput(): PlayerInputState {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    block: false,
    sidestep: false,
    lp: false,
    rp: false,
    lk: false,
    rk: false,
    special: false,
    throwBtn: false,
  };
}

export function createFighterState(
  index: 0 | 1,
  characterId: CharacterId,
): FighterState {
  const spec = CHARACTERS[characterId];
  return {
    index,
    characterId,
    x: index === 0 ? -2.0 : 2.0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    facing: index === 0 ? 1 : -1,
    hp: spec.maxHp,
    trailHp: spec.maxHp,
    maxHp: spec.maxHp,
    ki: 25,
    action: 'idle',
    actionTime: 0,
    currentMove: null,
    moveHitConnected: false,
    comboStep: 0,
    comboWindow: 0,
    comboDisplayCount: 0,
    comboDisplayDamage: 0,
    comboDisplayTimer: 0,
    stunTimer: 0,
    hitFlash: 0,
    sidestepDir: 1,
    sidestepTimer: 0,
    dashTimer: 0,
    grounded: true,
    crouching: false,
    roundsWon: 0,
    totalDamageDealt: 0,
    maxCombo: 0,
    perfectRounds: 0,
    bufferedMove: null,
    bufferTimer: 0,
    lastMoveInput: null,
    prevInput: createEmptyInput(),
    aiThinkTimer: 0.25,
    aiDesiredRange: 1.7,
    aiCurrentIntent: 'approach',
    aiIntentTimer: 0.5,
  };
}

export function createMatchState(opts: {
  p1Character: CharacterId;
  p2Character: CharacterId;
  stageId: StageId;
  mode: GameMode;
  difficulty?: DifficultyLevel;
  tournamentStage?: number;
  startInTitle?: boolean;
  isOnlineHost?: boolean;
}): MatchState {
  const f1 = createFighterState(0, opts.p1Character);
  const f2 = createFighterState(1, opts.p2Character);
  const startInTitle = opts.startInTitle ?? false;

  return {
    mode: opts.mode,
    stageId: opts.stageId,
    difficulty: opts.difficulty ?? 'fighter',
    tournamentStage: opts.tournamentStage ?? 0,
    phase: startInTitle ? 'title' : 'intro',
    phaseTimer: startInTitle ? 0 : 1.05,
    roundNumber: 1,
    roundTimer: 99,
    maxRoundTime: 99,
    hitstopTimer: 0,
    slowMoTimer: 0,
    cameraShake: 0,
    bannerText: startInTitle ? '' : 'ROUND 1',
    bannerSubtext: startInTitle ? '' : 'GET READY FOR THE NEXT BATTLE',
    bannerTimer: startInTitle ? 0 : 1.05,
    winnerIndex: null,
    fighters: [f1, f2],
    elapsedTime: 0,
    isOnlineHost: opts.isOnlineHost ?? true,
  };
}

export function resetForNextRound(state: MatchState, events: CombatEvent[]): void {
  state.roundNumber += 1;
  state.phase = 'intro';
  state.phaseTimer = 1.05;
  state.roundTimer = state.maxRoundTime;
  state.hitstopTimer = 0;
  state.slowMoTimer = 0;
  state.cameraShake = 0;

  const isFinal =
    state.fighters[0].roundsWon === ROUNDS_TO_WIN - 1 &&
    state.fighters[1].roundsWon === ROUNDS_TO_WIN - 1;
  state.bannerText = isFinal ? 'FINAL ROUND' : `ROUND ${state.roundNumber}`;
  state.bannerSubtext = 'READY...';
  state.bannerTimer = 1.05;

  for (const f of state.fighters) {
    const spec = CHARACTERS[f.characterId];
    f.x = f.index === 0 ? -2.0 : 2.0;
    f.y = 0;
    f.z = 0;
    f.vx = 0;
    f.vy = 0;
    f.vz = 0;
    f.facing = f.index === 0 ? 1 : -1;
    f.hp = spec.maxHp;
    f.trailHp = spec.maxHp;
    f.ki = Math.max(25, Math.min(100, f.ki + 15)); // carry over some Ki between rounds
    f.action = 'idle';
    f.actionTime = 0;
    f.currentMove = null;
    f.moveHitConnected = false;
    f.comboStep = 0;
    f.comboWindow = 0;
    f.comboDisplayCount = 0;
    f.comboDisplayDamage = 0;
    f.comboDisplayTimer = 0;
    f.stunTimer = 0;
    f.hitFlash = 0;
    f.sidestepTimer = 0;
    f.dashTimer = 0;
    f.grounded = true;
    f.crouching = false;
    f.bufferedMove = null;
    f.bufferTimer = 0;
  }

  events.push({ type: 'round_start', x: 0, y: 1.2, z: 0 });
}

function getMoveSpec(fighter: FighterState, move: MoveType): MoveSpec {
  return CHARACTERS[fighter.characterId].moves[move];
}

function resolveRequestedMove(
  fighter: FighterState,
  input: PlayerInputState,
): MoveType | null {
  const prev = fighter.prevInput;
  const justSpecial = input.special && !prev.special;
  const justThrow = input.throwBtn && !prev.throwBtn;
  const justLP = input.lp && !prev.lp;
  const justRP = input.rp && !prev.rp;
  const justLK = input.lk && !prev.lk;
  const justRK = input.rk && !prev.rk;

  if (justSpecial) {
    if (fighter.ki >= 50) return 'special';
    return 'uppercut';
  }
  if (justThrow || (input.lp && input.lk && (!prev.lp || !prev.lk))) {
    return 'throw';
  }
  if (justRK) {
    return input.down ? 'low_sweep' : 'rk';
  }
  if (justLK) {
    return input.down ? 'low_sweep' : 'lk';
  }
  if (justRP) {
    return input.down ? 'uppercut' : 'rp';
  }
  if (justLP) {
    return 'lp';
  }
  return null;
}

function canStartAttack(f: FighterState): boolean {
  if (
    f.action === 'hitstun' ||
    f.action === 'blockstun' ||
    f.action === 'launched' ||
    f.action === 'knockdown' ||
    f.action === 'ko' ||
    f.action === 'victory'
  ) {
    return false;
  }
  if (f.action === 'attack') {
    // Allow 3-hit dial-a-combo cancel during early recovery if previous attack connected
    if (f.currentMove && f.comboWindow > 0 && f.comboStep < 2) {
      const spec = getMoveSpec(f, f.currentMove);
      if (f.actionTime >= spec.windup + spec.active * 0.7) {
        return true;
      }
    }
    return false;
  }
  return true;
}

function triggerAttack(
  f: FighterState,
  move: MoveType,
  events: CombatEvent[],
): void {
  const moveSpec = getMoveSpec(f, move);
  if (move === 'special' && f.ki < moveSpec.kiCost) {
    move = 'uppercut';
  }
  const activeSpec = getMoveSpec(f, move);
  if (move === 'special') {
    f.ki = Math.max(0, f.ki - activeSpec.kiCost);
  }

  const isComboChain = f.action === 'attack' && f.comboWindow > 0;
  f.comboStep = isComboChain ? Math.min(2, f.comboStep + 1) : 0;
  f.comboWindow = 0;
  f.action = 'attack';
  f.actionTime = 0;
  f.currentMove = move;
  f.moveHitConnected = false;
  f.crouching = move === 'low_sweep';
  f.bufferedMove = null;
  f.bufferTimer = 0;

  if (move === 'special') {
    events.push({
      type: 'special',
      attackerIndex: f.index,
      x: f.x,
      y: f.y + 1.1,
      z: f.z,
      colorHex: CHARACTERS[f.characterId].palette.sparkHex,
    });
  } else {
    events.push({
      type: 'swing',
      attackerIndex: f.index,
      x: f.x + f.facing * 0.6,
      y: f.y + 1.1,
      z: f.z,
    });
  }
}

function isDefenderBlocking(
  defender: FighterState,
  input: PlayerInputState,
  hitHeight: MoveSpec['height'],
): boolean {
  if (hitHeight === 'unblockable') return false;
  if (
    defender.action === 'attack' ||
    defender.action === 'hitstun' ||
    defender.action === 'launched' ||
    defender.action === 'knockdown' ||
    defender.action === 'ko' ||
    !defender.grounded
  ) {
    return false;
  }

  const holdingBack =
    (defender.facing === 1 && input.left) ||
    (defender.facing === -1 && input.right);
  const guardPressed = input.block || holdingBack;

  if (!guardPressed) return false;
  if (hitHeight === 'low') {
    return input.down || defender.crouching;
  }
  return true;
}

function checkAndResolveHit(
  attacker: FighterState,
  defender: FighterState,
  defenderInput: PlayerInputState,
  state: MatchState,
  events: CombatEvent[],
): void {
  if (attacker.action !== 'attack' || !attacker.currentMove || attacker.moveHitConnected) {
    return;
  }
  if (defender.action === 'ko' || defender.action === 'knockdown') {
    return;
  }

  const spec = getMoveSpec(attacker, attacker.currentMove);
  if (
    attacker.actionTime < spec.windup ||
    attacker.actionTime > spec.windup + spec.active
  ) {
    return;
  }

  const dx = (defender.x - attacker.x) * attacker.facing;
  const dz = Math.abs(defender.z - attacker.z);
  const dy = Math.abs(defender.y - attacker.y);

  // Horizontal range check (must be in front of attacker)
  if (dx < -0.25 || dx > spec.range) return;
  // Vertical clearance check
  if (dy > 1.45 && spec.height !== 'high') return;
  // 3D Sidestep evasion check (non-tracking moves whiff if opponent sidestepped out of Z plane)
  const zTolerance = spec.tracking ? 1.45 : 0.68;
  if (dz > zTolerance) return;

  // High attacks whiff cleanly over crouching opponents (classic Tekken duck-and-punish!)
  if (spec.height === 'high' && defender.crouching && defender.grounded) {
    return;
  }

  attacker.moveHitConnected = true;
  attacker.comboWindow = 0.28;

  const impactX = (attacker.x + defender.x) * 0.5;
  const impactY =
    spec.height === 'low' ? 0.35 : spec.height === 'high' ? 1.48 : 1.05;
  const impactZ = (attacker.z + defender.z) * 0.5;

  const blocked = isDefenderBlocking(defender, defenderInput, spec.height);

  if (blocked) {
    const chip = spec.chipDamage;
    defender.hp = Math.max(1, defender.hp - chip); // chip damage never KOs
    defender.action = 'blockstun';
    defender.actionTime = 0;
    defender.stunTimer = spec.blockStun;
    defender.vx = attacker.facing * spec.knockbackX * 2.2;
    attacker.ki = Math.min(100, attacker.ki + Math.round(spec.kiGain * 0.45));
    defender.ki = Math.min(100, defender.ki + 5);
    state.hitstopTimer = Math.max(state.hitstopTimer, spec.hitstop * 0.55);

    events.push({
      type: 'block',
      attackerIndex: attacker.index,
      x: impactX,
      y: impactY,
      z: impactZ,
      colorHex: '#93c5fd',
    });
    return;
  }

  // Clean hit! Scale damage slightly on combo chains & counter-hits
  const isCounterHit = defender.action === 'attack';
  const comboScaling = Math.max(0.65, 1 - attacker.comboStep * 0.12);
  const counterMult = isCounterHit ? 1.2 : 1.0;
  const finalDamage = Math.max(1, Math.round(spec.damage * comboScaling * counterMult));

  defender.hp = Math.max(0, defender.hp - finalDamage);
  defender.hitFlash = 0.085;
  attacker.totalDamageDealt += finalDamage;

  attacker.ki = Math.min(100, attacker.ki + spec.kiGain);
  defender.ki = Math.min(100, defender.ki + Math.round(finalDamage * 0.65));

  // Track combo counter on attacker
  if (
    defender.action === 'hitstun' ||
    defender.action === 'launched' ||
    attacker.comboDisplayTimer > 0
  ) {
    attacker.comboDisplayCount += 1;
    attacker.comboDisplayDamage += finalDamage;
  } else {
    attacker.comboDisplayCount = 1;
    attacker.comboDisplayDamage = finalDamage;
  }
  attacker.comboDisplayTimer = 1.6;
  if (attacker.comboDisplayCount > attacker.maxCombo) {
    attacker.maxCombo = attacker.comboDisplayCount;
  }

  // Apply knockback & state
  defender.vx = attacker.facing * (spec.knockbackX * 3.4);
  if (defender.hp <= 0) {
    defender.action = 'ko';
    defender.actionTime = 0;
    defender.vy = Math.max(4.6, spec.launchY);
    defender.vx = attacker.facing * 5.2;
    defender.grounded = false;
    state.hitstopTimer = 0.095;
    state.slowMoTimer = 0.65;
    state.cameraShake = 0.9;
    events.push({
      type: 'ko',
      attackerIndex: attacker.index,
      x: impactX,
      y: impactY,
      z: impactZ,
      colorHex: CHARACTERS[attacker.characterId].palette.sparkHex,
      damage: finalDamage,
    });
  } else if (spec.launchY >= 3.0) {
    defender.action = 'launched';
    defender.actionTime = 0;
    defender.vy = spec.launchY;
    defender.grounded = false;
    defender.stunTimer = spec.hitStun;
    state.hitstopTimer = Math.max(state.hitstopTimer, spec.hitstop);
    state.cameraShake = Math.max(state.cameraShake, 0.55);
    events.push({
      type: 'heavy_hit',
      attackerIndex: attacker.index,
      x: impactX,
      y: impactY,
      z: impactZ,
      colorHex: CHARACTERS[attacker.characterId].palette.sparkHex,
      damage: finalDamage,
    });
  } else {
    defender.action = 'hitstun';
    defender.actionTime = 0;
    defender.stunTimer = spec.hitStun;
    if (spec.launchY > 0.5 && defender.grounded) {
      defender.vy = spec.launchY;
      defender.grounded = false;
    }
    state.hitstopTimer = Math.max(state.hitstopTimer, spec.hitstop);
    state.cameraShake = Math.max(state.cameraShake, spec.isHeavy ? 0.36 : 0.14);
    events.push({
      type: spec.isHeavy ? 'heavy_hit' : 'hit',
      attackerIndex: attacker.index,
      x: impactX,
      y: impactY,
      z: impactZ,
      colorHex: CHARACTERS[attacker.characterId].palette.sparkHex,
      damage: finalDamage,
    });
  }
}

export function computeAiInput(
  ai: FighterState,
  opponent: FighterState,
  difficulty: DifficultyLevel,
  dt: number,
  seedPhase: number,
): PlayerInputState {
  const input = createEmptyInput();
  const spec = CHARACTERS[ai.characterId];
  const dist = Math.abs(opponent.x - ai.x);
  const toOpponent = opponent.x >= ai.x ? 1 : -1;

  // Pseudo-deterministic oscillation mixed with live state so AI is lively and varied
  const wave = Math.abs(Math.sin(seedPhase * 13.37 + ai.actionTime * 7.1 + dist * 3.7));
  const wave2 = Math.abs(Math.cos(seedPhase * 7.91 + opponent.actionTime * 11.3));

  const aggressionMap: Record<DifficultyLevel, number> = {
    rookie: 0.38,
    fighter: 0.58,
    master: 0.76,
    boss: 0.88,
  };
  const guardChanceMap: Record<DifficultyLevel, number> = {
    rookie: 0.22,
    fighter: 0.45,
    master: 0.66,
    boss: 0.78,
  };
  const thinkRateMap: Record<DifficultyLevel, number> = {
    rookie: 0.36,
    fighter: 0.24,
    master: 0.16,
    boss: 0.11,
  };

  const aggression = aggressionMap[difficulty];
  const guardChance = guardChanceMap[difficulty];

  ai.aiThinkTimer -= dt;
  ai.aiIntentTimer -= dt;

  // Defensive reaction when opponent is actively attacking nearby
  if (
    opponent.action === 'attack' &&
    dist < 2.35 &&
    wave < guardChance
  ) {
    if (spec.aiPolicy === 'evader' && wave2 > 0.55 && ai.sidestepTimer <= 0) {
      input.sidestep = true;
    } else {
      input.block = true;
      if (opponent.currentMove === 'low_sweep') {
        input.down = true;
      }
    }
    return input;
  }

  // Update strategic intent based on fighter archetype policy
  if (ai.aiIntentTimer <= 0) {
    ai.aiIntentTimer = 0.35 + wave * 0.55;
    if (spec.aiPolicy === 'kicker') {
      ai.aiDesiredRange = 2.05;
    } else if (spec.aiPolicy === 'grappler') {
      ai.aiDesiredRange = 1.35;
    } else if (spec.aiPolicy === 'evader') {
      ai.aiDesiredRange = 1.65;
    } else {
      ai.aiDesiredRange = 1.6;
    }

    if (dist > ai.aiDesiredRange + 0.4) {
      ai.aiCurrentIntent = 'approach';
    } else if (wave < 0.24 && dist < 1.5) {
      ai.aiCurrentIntent = 'retreat';
    } else if (spec.aiPolicy === 'evader' && wave > 0.65) {
      ai.aiCurrentIntent = 'strafe';
    } else {
      ai.aiCurrentIntent = 'pressure';
    }
  }

  // Movement execution
  if (ai.aiCurrentIntent === 'approach' && dist > ai.aiDesiredRange - 0.15) {
    if (toOpponent === 1) input.right = true;
    else input.left = true;
  } else if (ai.aiCurrentIntent === 'retreat' && dist < 2.6) {
    if (toOpponent === 1) input.left = true;
    else input.right = true;
  } else if (ai.aiCurrentIntent === 'strafe') {
    input.sidestep = true;
  }

  // Attack selection on think ticks
  if (ai.aiThinkTimer <= 0 && dist < 2.45) {
    ai.aiThinkTimer = thinkRateMap[difficulty] * (0.75 + wave * 0.6);

    if (wave < aggression) {
      // Special move when meter ready
      if (ai.ki >= 50 && dist < 2.35 && wave2 > 0.62) {
        input.special = true;
        return input;
      }

      if (spec.aiPolicy === 'grappler' && dist < 1.45 && wave2 < 0.45) {
        input.throwBtn = true;
      } else if (spec.aiPolicy === 'kicker') {
        if (dist > 1.75) {
          if (wave2 > 0.45) input.rk = true;
          else input.lk = true;
        } else {
          input.lk = true;
        }
      } else if (spec.aiPolicy === 'evader') {
        if (wave2 < 0.35) {
          input.down = true;
          input.lk = true;
        } else if (wave2 < 0.72) {
          input.lp = true;
        } else {
          input.rk = true;
        }
      } else {
        // Mishima striker: jab -> cross -> roundhouse / uppercut pressure
        if (dist < 1.65 && wave2 < 0.4) {
          input.lp = true;
        } else if (wave2 < 0.72) {
          input.rp = true;
        } else {
          input.down = true;
          input.rp = true; // uppercut launcher
        }
      }
    }
  }

  return input;
}

function stepFighter(
  f: FighterState,
  opponent: FighterState,
  input: PlayerInputState,
  simDt: number,
  canControl: boolean,
  events: CombatEvent[],
): void {
  const spec = CHARACTERS[f.characterId];
  f.actionTime += simDt;
  if (f.hitFlash > 0) f.hitFlash = Math.max(0, f.hitFlash - simDt);
  if (f.comboWindow > 0) f.comboWindow = Math.max(0, f.comboWindow - simDt);
  if (f.comboDisplayTimer > 0) {
    f.comboDisplayTimer = Math.max(0, f.comboDisplayTimer - simDt);
    if (f.comboDisplayTimer === 0) {
      f.comboDisplayCount = 0;
      f.comboDisplayDamage = 0;
    }
  }
  if (f.bufferTimer > 0) {
    f.bufferTimer = Math.max(0, f.bufferTimer - simDt);
    if (f.bufferTimer === 0) f.bufferedMove = null;
  }

  // Smooth trailing damage ghost bar (delays slightly, then drains smoothly)
  if (f.trailHp > f.hp) {
    const drainSpeed = f.action === 'hitstun' || f.action === 'launched' ? 14 : 46;
    f.trailHp = Math.max(f.hp, f.trailHp - drainSpeed * simDt);
  } else {
    f.trailHp = f.hp;
  }

  // Auto-face opponent when neutral / moving
  if (
    f.grounded &&
    (f.action === 'idle' ||
      f.action === 'walk_fwd' ||
      f.action === 'walk_back' ||
      f.action === 'crouch' ||
      f.action === 'block')
  ) {
    if (Math.abs(opponent.x - f.x) > 0.12) {
      f.facing = opponent.x >= f.x ? 1 : -1;
    }
  }

  // Stun / Launched / KO / Victory states
  if (f.action === 'ko') {
    f.vx *= Math.exp(-3.5 * simDt);
    f.vz *= Math.exp(-5.0 * simDt);
  } else if (f.action === 'victory') {
    f.vx *= Math.exp(-8 * simDt);
    f.vz *= Math.exp(-8 * simDt);
  } else if (f.action === 'hitstun' || f.action === 'blockstun') {
    f.stunTimer -= simDt;
    f.vx *= Math.exp(-9 * simDt);
    if (f.stunTimer <= 0 && f.grounded) {
      f.action = 'idle';
      f.actionTime = 0;
    }
  } else if (f.action === 'launched') {
    f.vx *= Math.exp(-2.2 * simDt);
    if (f.grounded && f.actionTime > 0.14) {
      f.action = 'knockdown';
      f.actionTime = 0;
      f.stunTimer = 0.42;
      events.push({ type: 'land', x: f.x, y: 0.05, z: f.z });
    }
  } else if (f.action === 'knockdown') {
    f.stunTimer -= simDt;
    f.vx *= Math.exp(-10 * simDt);
    if (f.stunTimer <= 0) {
      f.action = 'idle';
      f.actionTime = 0;
    }
  } else if (canControl) {
    // Capture attack input into buffer (0.14s input buffering for crisp combos!)
    const requestedMove = resolveRequestedMove(f, input);
    if (requestedMove) {
      f.bufferedMove = requestedMove;
      f.bufferTimer = 0.14;
    }

    // Fire buffered move as soon as fighter can act or combo-cancel
    if (f.bufferedMove && canStartAttack(f)) {
      triggerAttack(f, f.bufferedMove, events);
    }

    if (f.action === 'attack' && f.currentMove) {
      const mSpec = getMoveSpec(f, f.currentMove);
      const totalDuration = mSpec.windup + mSpec.active + mSpec.recovery;
      if (f.actionTime < mSpec.windup + mSpec.active * 0.5) {
        f.vx = f.facing * mSpec.lungeSpeed;
      } else {
        f.vx *= Math.exp(-11 * simDt);
      }
      if (f.actionTime >= totalDuration) {
        f.action = 'idle';
        f.actionTime = 0;
        f.currentMove = null;
        f.crouching = false;
      }
    } else if (f.sidestepTimer > 0) {
      f.sidestepTimer -= simDt;
      f.vz = f.sidestepDir * spec.sidestepSpeed;
      f.vx *= Math.exp(-8 * simDt);
      if (f.sidestepTimer <= 0) {
        f.action = 'idle';
        f.vz = 0;
      }
    } else {
      // Neutral movement, jump, crouch, sidestep, block
      const moveAxis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const forward = moveAxis * f.facing > 0;
      const backward = moveAxis * f.facing < 0;

      // 3D Sidestep trigger
      if (input.sidestep && !f.prevInput.sidestep && f.grounded) {
        f.sidestepDir = f.z > 0.35 ? -1 : f.z < -0.35 ? 1 : f.sidestepDir === 1 ? -1 : 1;
        f.sidestepTimer = 0.26;
        f.action = 'sidestep';
        f.actionTime = 0;
        f.crouching = false;
        events.push({ type: 'dash', x: f.x, y: 0.1, z: f.z });
      } else if (input.up && !f.prevInput.up && f.grounded) {
        f.vy = spec.jumpForce;
        f.vx = moveAxis * spec.walkSpeed * 0.9;
        f.grounded = false;
        f.crouching = false;
        f.action = 'jump';
        f.actionTime = 0;
        events.push({ type: 'jump', x: f.x, y: 0.1, z: f.z });
      } else if (!f.grounded) {
        f.action = 'jump';
      } else if (input.block) {
        f.vx *= Math.exp(-14 * simDt);
        f.crouching = input.down;
        f.action = 'block';
      } else if (input.down) {
        f.vx *= Math.exp(-14 * simDt);
        f.crouching = true;
        f.action = 'crouch';
      } else if (moveAxis !== 0) {
        f.crouching = false;
        const speed = forward ? spec.walkSpeed : spec.walkSpeed * 0.78;
        f.vx = moveAxis * speed;
        f.action = forward ? 'walk_fwd' : 'walk_back';
        // Slowly realign Z toward opponent when walking forward/back
        const zDiff = opponent.z - f.z;
        f.vz = Math.sign(zDiff) * Math.min(Math.abs(zDiff) * 3.0, 2.2);
      } else {
        f.crouching = false;
        f.vx *= Math.exp(-14 * simDt);
        f.vz *= Math.exp(-10 * simDt);
        f.action = 'idle';
      }
    }
  } else {
    // Intro or non-controllable phase: settle into idle stance
    f.vx *= Math.exp(-10 * simDt);
    f.vz *= Math.exp(-10 * simDt);
    f.action = 'idle';
  }

  // Integrate physics
  f.x += f.vx * simDt;
  f.z += f.vz * simDt;
  if (!f.grounded || f.vy !== 0) {
    f.vy -= GRAVITY * simDt;
    f.y += f.vy * simDt;
    if (f.y <= 0) {
      f.y = 0;
      f.vy = 0;
      if (!f.grounded) {
        f.grounded = true;
        if (f.action === 'jump') {
          f.action = 'idle';
          f.actionTime = 0;
        }
        events.push({ type: 'land', x: f.x, y: 0.05, z: f.z });
      }
    }
  }

  // Arena bounds clamping
  f.x = Math.max(-ARENA_HALF_WIDTH, Math.min(ARENA_HALF_WIDTH, f.x));
  f.z = Math.max(-ARENA_HALF_DEPTH, Math.min(ARENA_HALF_DEPTH, f.z));

  f.prevInput = { ...input };
}

function resolveFighterPushbox(f1: FighterState, f2: FighterState): void {
  if (Math.abs(f1.z - f2.z) > 0.75) return;
  if (Math.abs(f1.y - f2.y) > 1.3) return;
  const dx = f2.x - f1.x;
  const absDx = Math.abs(dx);
  if (absDx < MIN_FIGHTER_SEPARATION) {
    const overlap = (MIN_FIGHTER_SEPARATION - absDx) * 0.5;
    const dir = dx >= 0 ? 1 : -1;
    f1.x = Math.max(-ARENA_HALF_WIDTH, Math.min(ARENA_HALF_WIDTH, f1.x - dir * overlap));
    f2.x = Math.max(-ARENA_HALF_WIDTH, Math.min(ARENA_HALF_WIDTH, f2.x + dir * overlap));
  }
}

function finishRound(
  state: MatchState,
  roundWinner: 0 | 1 | 'draw',
  reason: 'ko' | 'time',
  events: CombatEvent[],
): void {
  state.phase = 'round_ko';
  state.phaseTimer = 2.35;

  if (roundWinner === 'draw') {
    state.bannerText = reason === 'ko' ? 'DOUBLE K.O.' : 'DRAW';
    state.bannerSubtext = 'NO CONTEST';
  } else {
    const winner = state.fighters[roundWinner];
    const loser = state.fighters[roundWinner === 0 ? 1 : 0];
    winner.roundsWon += 1;
    const isPerfect = winner.hp === winner.maxHp;
    if (isPerfect) winner.perfectRounds += 1;

    winner.action = 'victory';
    winner.actionTime = 0;
    if (loser.action !== 'ko') {
      loser.action = 'knockdown';
      loser.actionTime = 0;
    }

    state.bannerText = reason === 'time' ? 'TIME OVER' : isPerfect ? 'PERFECT K.O.!' : 'K.O.!';
    state.bannerSubtext = `${CHARACTERS[winner.characterId].name.toUpperCase()} TAKES ROUND ${state.roundNumber}`;

    if (winner.roundsWon >= ROUNDS_TO_WIN) {
      state.winnerIndex = roundWinner;
      events.push({ type: 'victory', attackerIndex: roundWinner, x: winner.x, y: 1.5, z: winner.z });
    }
  }
  state.bannerTimer = 2.35;
}

export function stepMatch(
  state: MatchState,
  rawDt: number,
  p1Input: PlayerInputState,
  p2InputRaw: PlayerInputState | null,
): CombatEvent[] {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  const events: CombatEvent[] = [];

  state.elapsedTime += dt;

  // Decay camera shake and banners in real time
  if (state.cameraShake > 0) {
    state.cameraShake = Math.max(0, state.cameraShake - dt * 2.4);
  }
  if (state.bannerTimer > 0) {
    state.bannerTimer = Math.max(0, state.bannerTimer - dt);
  }

  // Title screen: idle breathing fighters, zero combat logic
  if (state.phase === 'title') {
    for (const f of state.fighters) {
      f.action = 'idle';
      f.actionTime += dt;
    }
    return events;
  }

  // Sim-level hitstop: pause combat physics while hit flashes & camera shake run
  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    for (const f of state.fighters) {
      if (f.hitFlash > 0) f.hitFlash = Math.max(0, f.hitFlash - dt);
    }
    return events;
  }

  // Dramatic slow-motion on K.O.
  let timeScale = 1.0;
  if (state.slowMoTimer > 0) {
    state.slowMoTimer = Math.max(0, state.slowMoTimer - dt);
    timeScale = 0.34;
  }
  const simDt = dt * timeScale;

  // Phase transitions
  if (state.phase === 'intro') {
    state.phaseTimer -= dt;
    if (state.phaseTimer <= 0.45 && state.bannerText !== 'FIGHT!') {
      state.bannerText = 'FIGHT!';
      state.bannerSubtext = '';
      state.bannerTimer = 0.7;
      events.push({ type: 'fight_call', x: 0, y: 1.4, z: 0 });
    }
    if (state.phaseTimer <= 0) {
      state.phase = 'fighting';
    }
  } else if (state.phase === 'round_ko') {
    state.phaseTimer -= dt;
    if (state.phaseTimer <= 0) {
      if (state.winnerIndex !== null) {
        state.phase = 'match_over';
      } else {
        resetForNextRound(state, events);
      }
    }
  }

  const canControl = state.phase === 'fighting';
  const [f1, f2] = state.fighters;

  // Determine P2 input (Human Local 2P / Online Remote vs Smart AI)
  const p2Input: PlayerInputState =
    state.mode === 'local_2p' || state.mode === 'online'
      ? p2InputRaw ?? createEmptyInput()
      : canControl
        ? computeAiInput(f2, f1, state.difficulty, simDt, state.elapsedTime)
        : createEmptyInput();

  stepFighter(f1, f2, p1Input, simDt, canControl, events);
  stepFighter(f2, f1, p2Input, simDt, canControl, events);
  resolveFighterPushbox(f1, f2);

  if (canControl) {
    checkAndResolveHit(f1, f2, p2Input, state, events);
    checkAndResolveHit(f2, f1, p1Input, state, events);

    // Check KO condition
    if (f1.hp <= 0 && f2.hp <= 0) {
      finishRound(state, 'draw', 'ko', events);
    } else if (f2.hp <= 0) {
      finishRound(state, 0, 'ko', events);
    } else if (f1.hp <= 0) {
      finishRound(state, 1, 'ko', events);
    } else {
      // Round countdown timer
      state.roundTimer = Math.max(0, state.roundTimer - simDt);
      if (state.roundTimer <= 0) {
        const p1Ratio = f1.hp / f1.maxHp;
        const p2Ratio = f2.hp / f2.maxHp;
        if (Math.abs(p1Ratio - p2Ratio) < 0.001) {
          finishRound(state, 'draw', 'time', events);
        } else {
          finishRound(state, p1Ratio > p2Ratio ? 0 : 1, 'time', events);
        }
      }
    }
  }

  return events;
}

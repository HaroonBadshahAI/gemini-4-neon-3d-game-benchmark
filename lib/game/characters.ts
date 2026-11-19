export type CharacterId = 'kenji' | 'hwojin' | 'lingmei' | 'gaius';
export type StageId = 'kyoto_shrine' | 'shibuya_rooftop' | 'okinawa_beach';
export type MoveType =
  | 'lp'
  | 'rp'
  | 'lk'
  | 'rk'
  | 'low_sweep'
  | 'uppercut'
  | 'throw'
  | 'special';

export type HitHeight = 'high' | 'mid' | 'low' | 'unblockable';

export interface MoveSpec {
  id: MoveType;
  name: string;
  windup: number; // seconds before hitbox activates
  active: number; // seconds hitbox is active
  recovery: number; // seconds after active before neutral
  damage: number;
  chipDamage: number;
  range: number; // meters along X axis
  tracking: boolean; // true = tracks 3D sidestepping opponents
  height: HitHeight;
  knockbackX: number;
  launchY: number;
  hitStun: number;
  blockStun: number;
  kiGain: number;
  kiCost: number;
  isHeavy: boolean;
  hitstop: number; // seconds
  lungeSpeed: number; // forward momentum during windup/active
}

export interface CharacterPalette {
  skin: number;
  giPrimary: number;
  giSecondary: number;
  belt: number;
  accent: number;
  hair: number;
  sparkHex: string;
  sparkColor: number;
  uiAccent: string;
}

export interface CharacterSpec {
  id: CharacterId;
  name: string;
  title: string;
  style: string;
  origin: string;
  specialName: string;
  specialDesc: string;
  stats: {
    power: number; // 1-10
    speed: number; // 1-10
    reach: number; // 1-10
    defense: number; // 1-10
  };
  maxHp: number;
  walkSpeed: number;
  dashSpeed: number;
  jumpForce: number;
  sidestepSpeed: number;
  heightScale: number;
  buildScale: number;
  hairStyle: 'spiked' | 'headband' | 'buns' | 'cropped';
  sleeveless: boolean;
  hasShoulderGuard: boolean;
  aiPolicy: 'striker' | 'kicker' | 'evader' | 'grappler';
  palette: CharacterPalette;
  moves: Record<MoveType, MoveSpec>;
}

export interface StageSpec {
  id: StageId;
  name: string;
  subtitle: string;
  location: string;
  skyTop: string;
  skyBottom: string;
  fogColor: number;
  accentColor: string;
}

export interface TournamentStageEntry {
  stageIndex: number;
  opponentId: CharacterId;
  stageId: StageId;
  title: string;
  difficulty: 'rookie' | 'fighter' | 'master' | 'boss';
  rpReward: number;
}

function buildMoveSet(overrides: Partial<Record<MoveType, Partial<MoveSpec>>>): Record<MoveType, MoveSpec> {
  const base: Record<MoveType, MoveSpec> = {
    lp: {
      id: 'lp',
      name: 'Flash Jab',
      windup: 0.11,
      active: 0.08,
      recovery: 0.16,
      damage: 8,
      chipDamage: 0,
      range: 1.55,
      tracking: false,
      height: 'high',
      knockbackX: 0.42,
      launchY: 0,
      hitStun: 0.24,
      blockStun: 0.14,
      kiGain: 7,
      kiCost: 0,
      isHeavy: false,
      hitstop: 0.032,
      lungeSpeed: 1.4,
    },
    rp: {
      id: 'rp',
      name: 'Iron Cross',
      windup: 0.17,
      active: 0.10,
      recovery: 0.24,
      damage: 14,
      chipDamage: 1,
      range: 1.72,
      tracking: false,
      height: 'mid',
      knockbackX: 0.85,
      launchY: 0.6,
      hitStun: 0.34,
      blockStun: 0.2,
      kiGain: 12,
      kiCost: 0,
      isHeavy: true,
      hitstop: 0.048,
      lungeSpeed: 2.3,
    },
    lk: {
      id: 'lk',
      name: 'Snap Kick',
      windup: 0.14,
      active: 0.09,
      recovery: 0.2,
      damage: 11,
      chipDamage: 0,
      range: 1.92,
      tracking: false,
      height: 'mid',
      knockbackX: 0.65,
      launchY: 0,
      hitStun: 0.28,
      blockStun: 0.16,
      kiGain: 9,
      kiCost: 0,
      isHeavy: false,
      hitstop: 0.038,
      lungeSpeed: 1.7,
    },
    rk: {
      id: 'rk',
      name: 'Spinning Roundhouse',
      windup: 0.22,
      active: 0.11,
      recovery: 0.3,
      damage: 18,
      chipDamage: 2,
      range: 2.15,
      tracking: true, // homing circular kick catches 3D sidesteps
      height: 'high',
      knockbackX: 1.35,
      launchY: 1.8,
      hitStun: 0.44,
      blockStun: 0.24,
      kiGain: 15,
      kiCost: 0,
      isHeavy: true,
      hitstop: 0.058,
      lungeSpeed: 2.4,
    },
    low_sweep: {
      id: 'low_sweep',
      name: 'Dragon Sweep',
      windup: 0.19,
      active: 0.10,
      recovery: 0.29,
      damage: 13,
      chipDamage: 0,
      range: 1.95,
      tracking: true,
      height: 'low',
      knockbackX: 0.75,
      launchY: 1.2,
      hitStun: 0.42,
      blockStun: 0.22,
      kiGain: 11,
      kiCost: 0,
      isHeavy: true,
      hitstop: 0.045,
      lungeSpeed: 2.1,
    },
    uppercut: {
      id: 'uppercut',
      name: 'Rising Dragon',
      windup: 0.18,
      active: 0.12,
      recovery: 0.32,
      damage: 16,
      chipDamage: 2,
      range: 1.65,
      tracking: false,
      height: 'mid',
      knockbackX: 0.9,
      launchY: 4.4,
      hitStun: 0.52,
      blockStun: 0.24,
      kiGain: 14,
      kiCost: 0,
      isHeavy: true,
      hitstop: 0.058,
      lungeSpeed: 2.6,
    },
    throw: {
      id: 'throw',
      name: 'Shoulder Throw',
      windup: 0.16,
      active: 0.1,
      recovery: 0.34,
      damage: 19,
      chipDamage: 0,
      range: 1.38,
      tracking: false,
      height: 'unblockable',
      knockbackX: 2.1,
      launchY: 3.1,
      hitStun: 0.56,
      blockStun: 0,
      kiGain: 16,
      kiCost: 0,
      isHeavy: true,
      hitstop: 0.068,
      lungeSpeed: 2.8,
    },
    special: {
      id: 'special',
      name: 'Secret Technique',
      windup: 0.21,
      active: 0.15,
      recovery: 0.34,
      damage: 28,
      chipDamage: 5,
      range: 2.35,
      tracking: true,
      height: 'mid',
      knockbackX: 2.35,
      launchY: 4.9,
      hitStun: 0.68,
      blockStun: 0.3,
      kiGain: 0,
      kiCost: 50,
      isHeavy: true,
      hitstop: 0.075,
      lungeSpeed: 4.6,
    },
  };

  const result = { ...base };
  for (const key of Object.keys(overrides) as MoveType[]) {
    const patch = overrides[key];
    if (patch) {
      result[key] = { ...base[key], ...patch };
    }
  }
  return result;
}

export const CHARACTERS: Record<CharacterId, CharacterSpec> = {
  kenji: {
    id: 'kenji',
    name: 'Kenji Kazama',
    title: 'Lightning of Kyoto',
    style: 'Mishima Karate',
    origin: 'Kyoto, Japan',
    specialName: 'Electric Wind God Fist',
    specialDesc: 'Crackling rising uppercut that launches foes skyward.',
    stats: { power: 9, speed: 8, reach: 7, defense: 8 },
    maxHp: 120,
    walkSpeed: 4.1,
    dashSpeed: 8.4,
    jumpForce: 8.6,
    sidestepSpeed: 6.2,
    heightScale: 1.0,
    buildScale: 1.0,
    hairStyle: 'spiked',
    sleeveless: true,
    hasShoulderGuard: false,
    aiPolicy: 'striker',
    palette: {
      skin: 0xd9a786,
      giPrimary: 0x1b1d26,
      giSecondary: 0xb91c1c,
      belt: 0x111114,
      accent: 0xef4444,
      hair: 0x14141a,
      sparkHex: '#38bdf8',
      sparkColor: 0x38bdf8,
      uiAccent: '#ef4444',
    },
    moves: buildMoveSet({
      rp: { name: 'Demon Straight', damage: 15, knockbackX: 1.0 },
      special: {
        name: 'Electric Wind God Fist',
        damage: 30,
        launchY: 5.4,
        range: 2.25,
        lungeSpeed: 5.2,
      },
    }),
  },
  hwojin: {
    id: 'hwojin',
    name: 'Hwo-Jin Baek',
    title: 'Blood Talon',
    style: 'Taekwondo',
    origin: 'Seoul, Korea',
    specialName: 'Sky Fang Hurricane',
    specialDesc: 'High-velocity spinning triple roundhouse with wide tracking.',
    stats: { power: 7, speed: 10, reach: 9, defense: 6 },
    maxHp: 112,
    walkSpeed: 4.65,
    dashSpeed: 9.2,
    jumpForce: 9.2,
    sidestepSpeed: 6.9,
    heightScale: 1.01,
    buildScale: 0.94,
    hairStyle: 'headband',
    sleeveless: false,
    hasShoulderGuard: false,
    aiPolicy: 'kicker',
    palette: {
      skin: 0xe0b494,
      giPrimary: 0xf1f5f9,
      giSecondary: 0x1d4ed8,
      belt: 0x111318,
      accent: 0xdc2626,
      hair: 0x9a3412,
      sparkHex: '#f59e0b',
      sparkColor: 0xf59e0b,
      uiAccent: '#3b82f6',
    },
    moves: buildMoveSet({
      lk: { name: 'Flamingo Snap', windup: 0.12, range: 2.15, damage: 12 },
      rk: { name: 'Plasma Axe Kick', windup: 0.19, range: 2.38, damage: 19 },
      special: {
        name: 'Sky Fang Hurricane',
        damage: 27,
        range: 2.65,
        windup: 0.18,
        lungeSpeed: 5.6,
      },
    }),
  },
  lingmei: {
    id: 'lingmei',
    name: 'Ling Mei',
    title: 'Jade Phoenix',
    style: 'Baguazhang Kung Fu',
    origin: 'Chengdu, China',
    specialName: 'Phoenix Palm Cyclone',
    specialDesc: 'Low-profile lunging palm strike that pierces linear counters.',
    stats: { power: 7, speed: 9, reach: 7, defense: 8 },
    maxHp: 110,
    walkSpeed: 4.75,
    dashSpeed: 9.4,
    jumpForce: 9.4,
    sidestepSpeed: 7.5,
    heightScale: 0.93,
    buildScale: 0.88,
    hairStyle: 'buns',
    sleeveless: true,
    hasShoulderGuard: false,
    aiPolicy: 'evader',
    palette: {
      skin: 0xe7bfa1,
      giPrimary: 0xd97706,
      giSecondary: 0x059669,
      belt: 0xfef3c7,
      accent: 0x10b981,
      hair: 0x18151d,
      sparkHex: '#34d399',
      sparkColor: 0x34d399,
      uiAccent: '#f59e0b',
    },
    moves: buildMoveSet({
      lp: { name: 'Twin Phoenix Jab', windup: 0.09, recovery: 0.14, damage: 8 },
      low_sweep: { name: 'Lotus Low Sweep', windup: 0.15, range: 2.05, damage: 14 },
      special: {
        name: 'Phoenix Palm Cyclone',
        damage: 26,
        windup: 0.17,
        range: 2.45,
        lungeSpeed: 6.1,
      },
    }),
  },
  gaius: {
    id: 'gaius',
    name: 'Gaius Vance',
    title: 'Iron Mountain',
    style: 'Kyokushin & Catch',
    origin: 'Detroit, USA',
    specialName: 'Seismic Tiger Driver',
    specialDesc: 'Devastating armored haymaker that shakes the arena floor.',
    stats: { power: 10, speed: 6, reach: 8, defense: 10 },
    maxHp: 136,
    walkSpeed: 3.6,
    dashSpeed: 7.6,
    jumpForce: 7.8,
    sidestepSpeed: 5.4,
    heightScale: 1.08,
    buildScale: 1.16,
    hairStyle: 'cropped',
    sleeveless: true,
    hasShoulderGuard: true,
    aiPolicy: 'grappler',
    palette: {
      skin: 0x8c5b3e,
      giPrimary: 0x1e293b,
      giSecondary: 0xd97706,
      belt: 0xb45309,
      accent: 0xfbbf24,
      hair: 0x1c1917,
      sparkHex: '#fb923c',
      sparkColor: 0xfb923c,
      uiAccent: '#eab308',
    },
    moves: buildMoveSet({
      rp: { name: 'Anvil Hammer', windup: 0.2, damage: 18, knockbackX: 1.4 },
      throw: { name: 'Titan Powerbomb', damage: 24, range: 1.56, knockbackX: 2.5 },
      special: {
        name: 'Seismic Tiger Driver',
        damage: 34,
        windup: 0.24,
        range: 2.3,
        knockbackX: 2.9,
        launchY: 5.0,
      },
    }),
  },
};

export const CHARACTER_LIST: CharacterSpec[] = [
  CHARACTERS.kenji,
  CHARACTERS.hwojin,
  CHARACTERS.lingmei,
  CHARACTERS.gaius,
];

export const STAGES: Record<StageId, StageSpec> = {
  kyoto_shrine: {
    id: 'kyoto_shrine',
    name: 'Kyoto Sunset Shrine',
    subtitle: 'Crimson Torii Courtyard',
    location: 'Kyoto, Japan',
    skyTop: '#1a1430',
    skyBottom: '#d96b38',
    fogColor: 0x3b2234,
    accentColor: '#f59e0b',
  },
  shibuya_rooftop: {
    id: 'shibuya_rooftop',
    name: 'Shibuya Helipad',
    subtitle: 'Twilight Tower Arena',
    location: 'Tokyo, Japan',
    skyTop: '#0d1426',
    skyBottom: '#334e7b',
    fogColor: 0x17243d,
    accentColor: '#38bdf8',
  },
  okinawa_beach: {
    id: 'okinawa_beach',
    name: 'Okinawa Moonlit Pier',
    subtitle: 'Tidal Dojo Deck',
    location: 'Okinawa, Japan',
    skyTop: '#081224',
    skyBottom: '#1c3b5a',
    fogColor: 0x0f243a,
    accentColor: '#34d399',
  },
};

export const STAGE_LIST: StageSpec[] = [
  STAGES.kyoto_shrine,
  STAGES.shibuya_rooftop,
  STAGES.okinawa_beach,
];

export function buildTournamentLadder(playerId: CharacterId): TournamentStageEntry[] {
  const others = CHARACTER_LIST.filter((c) => c.id !== playerId).map((c) => c.id);
  return [
    {
      stageIndex: 0,
      opponentId: others[0],
      stageId: 'kyoto_shrine',
      title: 'Qualifier Bout',
      difficulty: 'rookie',
      rpReward: 35,
    },
    {
      stageIndex: 1,
      opponentId: others[1],
      stageId: 'shibuya_rooftop',
      title: 'Semifinal Clash',
      difficulty: 'fighter',
      rpReward: 55,
    },
    {
      stageIndex: 2,
      opponentId: others[2],
      stageId: 'okinawa_beach',
      title: 'Master Trial',
      difficulty: 'master',
      rpReward: 80,
    },
    {
      stageIndex: 3,
      opponentId: playerId === 'kenji' ? 'gaius' : 'kenji',
      stageId: 'kyoto_shrine',
      title: 'Iron Fist Championship',
      difficulty: 'boss',
      rpReward: 130,
    },
  ];
}

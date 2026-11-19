'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CHARACTERS,
  CharacterId,
  StageId,
  buildTournamentLadder,
} from '@/lib/game/characters';
import {
  DifficultyLevel,
  GameMode,
  MatchState,
  PlayerInputState,
  createEmptyInput,
  createMatchState,
  stepMatch,
} from '@/lib/game/combatEngine';
import { audioSynth } from '@/lib/game/audioSynth';
import {
  OnlineMatchClient,
  OnlineMatchFoundPayload,
  OnlinePresence,
  OnlineStateSync,
} from '@/lib/game/onlineClient';
import { INITIAL_SEED_LEADERBOARD, LeaderboardEntry } from '@/lib/game/ranking';
import { ArenaRenderer } from '@/lib/three/ArenaRenderer';
import TitleOverlay from './TitleOverlay';
import CombatHud, { HudSnapshot } from './CombatHud';
import TouchControls from './TouchControls';
import RosterModal from './RosterModal';
import OnlineModal from './OnlineModal';
import StatusModal, { MatchEndSummary } from './StatusModal';

type ShellState = 'title' | 'playing' | 'paused' | 'gameover';

function extractHudSnapshot(
  state: MatchState,
  p1Label: string,
  p2Label: string,
  pingMs: number | null,
): HudSnapshot {
  const [f1, f2] = state.fighters;
  return {
    p1CharId: f1.characterId,
    p2CharId: f2.characterId,
    p1Name: p1Label,
    p2Name: p2Label,
    p1Hp: f1.hp,
    p1TrailHp: f1.trailHp,
    p1MaxHp: f1.maxHp,
    p1Ki: f1.ki,
    p1Rounds: f1.roundsWon,
    p1Combo: f1.comboDisplayCount,
    p1ComboDmg: f1.comboDisplayDamage,
    p2Hp: f2.hp,
    p2TrailHp: f2.trailHp,
    p2MaxHp: f2.maxHp,
    p2Ki: f2.ki,
    p2Rounds: f2.roundsWon,
    p2Combo: f2.comboDisplayCount,
    p2ComboDmg: f2.comboDisplayDamage,
    roundNumber: state.roundNumber,
    roundTimer: state.roundTimer,
    bannerText: state.bannerText,
    bannerSubtext: state.bannerSubtext,
    bannerVisible: state.bannerTimer > 0,
    mode: state.mode,
    tournamentStage: state.tournamentStage,
    pingMs,
  };
}

export default function KuroganeGame() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<ArenaRenderer | null>(null);
  const onlineClientRef = useRef<OnlineMatchClient | null>(null);

  // Core game shell state (throttled HUD updates decoupled from 60Hz loop)
  const [shellState, setShellState] = useState<ShellState>('title');
  const shellStateRef = useRef<ShellState>('title');

  const [rosterOpen, setRosterOpen] = useState(false);
  const [onlineOpen, setOnlineOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showTouchPad, setShowTouchPad] = useState(false);

  // Match setup preferences
  const [selectedMode, setSelectedMode] = useState<GameMode>('tournament');
  const [p1Char, setP1Char] = useState<CharacterId>('kenji');
  const [p2Char, setP2Char] = useState<CharacterId>('hwojin');
  const [stageId, setStageId] = useState<StageId>('kyoto_shrine');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('fighter');

  // Online & Leaderboard state
  const [callsign, setCallsign] = useState('KyotoStriker');
  const callsignRef = useRef('KyotoStriker');
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [pingMs, setPingMs] = useState<number | null>(null);
  const pingMsRef = useRef<number | null>(null);
  const [presence, setPresence] = useState<OnlinePresence>({
    onlineCount: 1,
    queueCount: 0,
    openRooms: 0,
  });
  const [inQueue, setInQueue] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [onlineNotice, setOnlineNotice] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_SEED_LEADERBOARD);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [matchSummary, setMatchSummary] = useState<MatchEndSummary | null>(null);

  // Live simulation refs (never cause React re-renders per frame!)
  const matchRef = useRef<MatchState>(
    createMatchState({
      p1Character: 'kenji',
      p2Character: 'hwojin',
      stageId: 'kyoto_shrine',
      mode: 'tournament',
      difficulty: 'rookie',
      tournamentStage: 0,
      startInTitle: true,
    }),
  );
  const p1LabelRef = useRef(CHARACTERS.kenji.name);
  const p2LabelRef = useRef(CHARACTERS.hwojin.name);

  const p1KeyInputRef = useRef<PlayerInputState>(createEmptyInput());
  const p1TouchInputRef = useRef<PlayerInputState>(createEmptyInput());
  const p2KeyInputRef = useRef<PlayerInputState>(createEmptyInput());
  const remoteInputRef = useRef<PlayerInputState>(createEmptyInput());
  const onlineRoleRef = useRef<'host' | 'guest'>('host');
  const lastHudSyncRef = useRef(0);
  const lastNetSyncRef = useRef(0);
  const matchEndedReportedRef = useRef(false);

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    p1CharId: 'kenji',
    p2CharId: 'hwojin',
    p1Name: CHARACTERS.kenji.name,
    p2Name: CHARACTERS.hwojin.name,
    p1Hp: CHARACTERS.kenji.maxHp,
    p1TrailHp: CHARACTERS.kenji.maxHp,
    p1MaxHp: CHARACTERS.kenji.maxHp,
    p1Ki: 25,
    p1Rounds: 0,
    p1Combo: 0,
    p1ComboDmg: 0,
    p2Hp: CHARACTERS.hwojin.maxHp,
    p2TrailHp: CHARACTERS.hwojin.maxHp,
    p2MaxHp: CHARACTERS.hwojin.maxHp,
    p2Ki: 25,
    p2Rounds: 0,
    p2Combo: 0,
    p2ComboDmg: 0,
    roundNumber: 1,
    roundTimer: 99,
    bannerText: '',
    bannerSubtext: '',
    bannerVisible: false,
    mode: 'tournament',
    tournamentStage: 0,
    pingMs: null,
  }));

  // Sync shell state to document.body.dataset.state for accessibility & testing
  useEffect(() => {
    shellStateRef.current = shellState;
    document.body.dataset.state = shellState;
  }, [shellState]);

  useEffect(() => {
    callsignRef.current = callsign;
  }, [callsign]);

  // Auto-enable touch controls on coarse pointer / small mobile screens
  useEffect(() => {
    const checkTouch = () => {
      const isCoarse = window.matchMedia?.('(pointer: coarse)').matches;
      const isNarrow = window.innerWidth < 820;
      if (isCoarse || isNarrow) {
        setShowTouchPad(true);
      }
    };
    checkTouch();
  }, []);

  const clearAllInputs = useCallback(() => {
    p1KeyInputRef.current = createEmptyInput();
    p1TouchInputRef.current = createEmptyInput();
    p2KeyInputRef.current = createEmptyInput();
    remoteInputRef.current = createEmptyInput();
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      }
    } catch {
      // Keep current leaderboard data cleanly
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const startConfiguredMatch = useCallback(
    (opts: {
      mode: GameMode;
      p1: CharacterId;
      p2: CharacterId;
      stage: StageId;
      diff: DifficultyLevel;
      tournamentStage?: number;
      p1DisplayName?: string;
      p2DisplayName?: string;
      isOnlineHost?: boolean;
    }) => {
      audioSynth.unlock();
      audioSynth.playUiClick(740);
      clearAllInputs();
      matchEndedReportedRef.current = false;
      setMatchSummary(null);
      setRosterOpen(false);
      setOnlineOpen(false);
      setOnlineNotice(null);

      let resolvedP2 = opts.p2;
      let resolvedStage = opts.stage;
      let resolvedDiff = opts.diff;
      const tStage = opts.tournamentStage ?? 0;

      if (opts.mode === 'tournament') {
        const ladder = buildTournamentLadder(opts.p1);
        const entry = ladder[Math.min(tStage, ladder.length - 1)];
        resolvedP2 = entry.opponentId;
        resolvedStage = entry.stageId;
        resolvedDiff = entry.difficulty;
      }

      p1LabelRef.current = opts.p1DisplayName || CHARACTERS[opts.p1].name;
      p2LabelRef.current =
        opts.p2DisplayName ||
        (opts.mode === 'local_2p'
          ? `${CHARACTERS[resolvedP2].name} (P2)`
          : CHARACTERS[resolvedP2].name);

      const nextState = createMatchState({
        p1Character: opts.p1,
        p2Character: resolvedP2,
        stageId: resolvedStage,
        mode: opts.mode,
        difficulty: resolvedDiff,
        tournamentStage: tStage,
        startInTitle: false,
        isOnlineHost: opts.isOnlineHost ?? true,
      });
      matchRef.current = nextState;

      // Immediately update body state and HUD at t = 0ms
      document.body.dataset.state = 'playing';
      shellStateRef.current = 'playing';
      setShellState('playing');
      setHud(extractHudSnapshot(nextState, p1LabelRef.current, p2LabelRef.current, pingMsRef.current));
    },
    [clearAllInputs],
  );

  const handleQuickStart = useCallback(() => {
    startConfiguredMatch({
      mode: 'tournament',
      p1: p1Char,
      p2: p2Char,
      stage: stageId,
      diff: 'rookie',
      tournamentStage: 0,
    });
  }, [p1Char, p2Char, stageId, startConfiguredMatch]);

  const handleStartFromRoster = useCallback(() => {
    startConfiguredMatch({
      mode: selectedMode,
      p1: p1Char,
      p2: p2Char,
      stage: stageId,
      diff: difficulty,
      tournamentStage: 0,
    });
  }, [selectedMode, p1Char, p2Char, stageId, difficulty, startConfiguredMatch]);

  const handleRestartBout = useCallback(() => {
    const cur = matchRef.current;
    startConfiguredMatch({
      mode: cur.mode === 'online' ? 'versus_cpu' : cur.mode,
      p1: cur.fighters[0].characterId,
      p2: cur.fighters[1].characterId,
      stage: cur.stageId,
      diff: cur.difficulty,
      tournamentStage: cur.tournamentStage,
    });
  }, [startConfiguredMatch]);

  const handleNextTournamentStage = useCallback(() => {
    const cur = matchRef.current;
    startConfiguredMatch({
      mode: 'tournament',
      p1: cur.fighters[0].characterId,
      p2: cur.fighters[1].characterId,
      stage: cur.stageId,
      diff: cur.difficulty,
      tournamentStage: cur.tournamentStage + 1,
    });
  }, [startConfiguredMatch]);

  const handleReturnTitle = useCallback(() => {
    audioSynth.playUiClick(460);
    clearAllInputs();
    onlineClientRef.current?.leaveRoom();
    onlineClientRef.current?.leaveQueue();
    setInQueue(false);
    setRoomCode(null);
    setMatchSummary(null);

    const idleTitle = createMatchState({
      p1Character: p1Char,
      p2Character: p2Char,
      stageId: 'kyoto_shrine',
      mode: 'tournament',
      startInTitle: true,
    });
    matchRef.current = idleTitle;
    document.body.dataset.state = 'title';
    shellStateRef.current = 'title';
    setShellState('title');
  }, [clearAllInputs, p1Char, p2Char]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = audioSynth.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handlePauseToggle = useCallback(() => {
    if (shellStateRef.current === 'playing') {
      clearAllInputs();
      document.body.dataset.state = 'paused';
      shellStateRef.current = 'paused';
      setShellState('paused');
    } else if (shellStateRef.current === 'paused') {
      clearAllInputs();
      document.body.dataset.state = 'playing';
      shellStateRef.current = 'playing';
      setShellState('playing');
    }
  }, [clearAllInputs]);

  // Handle end-of-match snapshot + live Ranked Leaderboard submission
  const handleMatchCompleted = useCallback(async (finished: MatchState) => {
    const winnerIdx = finished.winnerIndex ?? 0;
    const isLocalHost = finished.mode !== 'online' || onlineRoleRef.current === 'host';
    const playerIdx: 0 | 1 = isLocalHost ? 0 : 1;
    const playerWon = winnerIdx === playerIdx;
    const playerFighter = finished.fighters[playerIdx];
    const isTournamentChampion =
      finished.mode === 'tournament' && playerWon && finished.tournamentStage >= 3;

    const baseSummary: MatchEndSummary = {
      winnerName:
        winnerIdx === 0 ? p1LabelRef.current : p2LabelRef.current,
      playerWon,
      mode: finished.mode,
      tournamentStage: finished.tournamentStage,
      isTournamentChampion,
      p1Rounds: finished.fighters[0].roundsWon,
      p2Rounds: finished.fighters[1].roundsWon,
      damageDealt: playerFighter.totalDamageDealt,
      maxCombo: playerFighter.maxCombo,
      rpDelta: null,
      newRp: null,
      newTier: null,
    };

    setMatchSummary(baseSummary);
    document.body.dataset.state = 'gameover';
    shellStateRef.current = 'gameover';
    setShellState('gameover');

    // Submit ranked RP update for Tournament, Online, or 1P vs CPU wins
    if (finished.mode !== 'local_2p') {
      try {
        const ladder = buildTournamentLadder(playerFighter.characterId);
        const bonusRp =
          finished.mode === 'tournament' && playerWon
            ? ladder[Math.min(finished.tournamentStage, ladder.length - 1)].rpReward
            : undefined;
        const res = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callsign: callsignRef.current,
            characterId: playerFighter.characterId,
            didWin: playerWon,
            perfectRounds: playerFighter.perfectRounds,
            bonusRp,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.leaderboard)) {
            setLeaderboard(data.leaderboard);
          }
          setMatchSummary((prev) =>
            prev
              ? {
                  ...prev,
                  rpDelta: typeof data.rpDelta === 'number' ? data.rpDelta : null,
                  newRp: data.entry?.rp ?? null,
                  newTier: data.entry?.tier ?? null,
                }
              : prev,
          );
        }
      } catch {
        // Non-blocking leaderboard error fallback
      }
    }
  }, []);

  // Initialize WebSocket Online Matchmaking Client & Fetch Leaderboard
  useEffect(() => {
    let active = true;
    fetch('/api/leaderboard', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(() => {});

    const client = new OnlineMatchClient();
    onlineClientRef.current = client;

    client.setHandlers({
      onStatusChange: (status) => setWsStatus(status),
      onPresence: (p) => setPresence(p),
      onPing: (ms) => {
        pingMsRef.current = ms;
        setPingMs(ms);
      },
      onQueueJoined: () => {
        setInQueue(true);
        setRoomError(null);
      },
      onRoomCreated: (code) => {
        setRoomCode(code);
        setRoomError(null);
      },
      onRoomError: (msg) => {
        setRoomError(msg);
      },
      onMatchFound: (payload: OnlineMatchFoundPayload) => {
        setInQueue(false);
        setRoomCode(null);
        setRoomError(null);
        onlineRoleRef.current = payload.role;
        const isHost = payload.role === 'host';
        const localChar = p1Char;
        const p1Fighter = isHost ? localChar : payload.opponentCharacter;
        const p2Fighter = isHost ? payload.opponentCharacter : localChar;
        const p1Name = isHost ? callsignRef.current : payload.opponentCallsign;
        const p2Name = isHost ? payload.opponentCallsign : callsignRef.current;

        startConfiguredMatch({
          mode: 'online',
          p1: p1Fighter,
          p2: p2Fighter,
          stage: payload.stageId,
          diff: 'fighter',
          p1DisplayName: p1Name,
          p2DisplayName: p2Name,
          isOnlineHost: isHost,
        });
      },
      onRemoteInput: (input) => {
        remoteInputRef.current = input;
      },
      onStateSync: (sync: OnlineStateSync) => {
        // Guest reconciles gently with authoritative host state
        if (onlineRoleRef.current !== 'guest') return;
        const st = matchRef.current;
        if (st.mode !== 'online') return;
        st.roundNumber = sync.roundNumber;
        st.roundTimer = sync.roundTimer;
        st.fighters[0].x = sync.f0.x;
        st.fighters[0].y = sync.f0.y;
        st.fighters[0].z = sync.f0.z;
        st.fighters[0].hp = sync.f0.hp;
        st.fighters[0].ki = sync.f0.ki;
        st.fighters[0].roundsWon = sync.f0.roundsWon;
        st.fighters[1].x = sync.f1.x;
        st.fighters[1].y = sync.f1.y;
        st.fighters[1].z = sync.f1.z;
        st.fighters[1].hp = sync.f1.hp;
        st.fighters[1].ki = sync.f1.ki;
        st.fighters[1].roundsWon = sync.f1.roundsWon;
      },
      onOpponentDisconnected: (reason) => {
        setOnlineNotice(reason);
        setInQueue(false);
        setRoomCode(null);
        if (matchRef.current.mode === 'online' && shellStateRef.current === 'playing') {
          handleReturnTitle();
        }
      },
    });

    client.connect();

    return () => {
      active = false;
      client.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Support ?autostart=1 query param for instant combat entry
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const id = window.setTimeout(() => {
        handleQuickStart();
      }, 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mount Three.js WebGLRenderer ONCE inside isolated sibling ref container
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const arena = new ArenaRenderer(container);
    rendererRef.current = arena;

    arena.start((dt) => {
      const state = matchRef.current;
      const currentShell = shellStateRef.current;

      // Combine keyboard + touch inputs for local player
      const k1 = p1KeyInputRef.current;
      const t1 = p1TouchInputRef.current;
      const mergedLocalP1: PlayerInputState = {
        left: k1.left || t1.left,
        right: k1.right || t1.right,
        up: k1.up || t1.up,
        down: k1.down || t1.down,
        block: k1.block || t1.block,
        sidestep: k1.sidestep || t1.sidestep,
        lp: k1.lp || t1.lp,
        rp: k1.rp || t1.rp,
        lk: k1.lk || t1.lk,
        rk: k1.rk || t1.rk,
        special: k1.special || t1.special,
        throwBtn: k1.throwBtn || t1.throwBtn,
      };

      let events: ReturnType<typeof stepMatch> = [];

      if (currentShell === 'title' || currentShell === 'playing') {
        let p1Input = mergedLocalP1;
        let p2Input: PlayerInputState | null = null;

        if (state.mode === 'local_2p') {
          p2Input = p2KeyInputRef.current;
        } else if (state.mode === 'online') {
          // Relay local input at ~30Hz+ over WebSocket
          const now = performance.now();
          if (now - lastNetSyncRef.current >= 32) {
            lastNetSyncRef.current = now;
            onlineClientRef.current?.sendInput(mergedLocalP1);
            if (onlineRoleRef.current === 'host') {
              const [f0, f1] = state.fighters;
              onlineClientRef.current?.sendStateSync({
                roundNumber: state.roundNumber,
                roundTimer: state.roundTimer,
                phase: state.phase,
                bannerText: state.bannerText,
                bannerSubtext: state.bannerSubtext,
                winnerIndex: state.winnerIndex,
                f0: {
                  x: f0.x,
                  y: f0.y,
                  z: f0.z,
                  facing: f0.facing,
                  hp: f0.hp,
                  ki: f0.ki,
                  action: f0.action,
                  currentMove: f0.currentMove,
                  roundsWon: f0.roundsWon,
                },
                f1: {
                  x: f1.x,
                  y: f1.y,
                  z: f1.z,
                  facing: f1.facing,
                  hp: f1.hp,
                  ki: f1.ki,
                  action: f1.action,
                  currentMove: f1.currentMove,
                  roundsWon: f1.roundsWon,
                },
              });
            }
          }

          if (onlineRoleRef.current === 'host') {
            p1Input = mergedLocalP1;
            p2Input = remoteInputRef.current;
          } else {
            p1Input = remoteInputRef.current;
            p2Input = mergedLocalP1;
          }
        }

        events = stepMatch(state, dt, p1Input, p2Input);

        for (const ev of events) {
          audioSynth.playEvent(ev);
        }

        // Trigger match-over modal once when best-of-3 concludes
        if (state.phase === 'match_over' && !matchEndedReportedRef.current) {
          matchEndedReportedRef.current = true;
          handleMatchCompleted(state);
        }

        // Throttle React HUD sync to <= 12Hz so React never slows down WebGL
        const nowMs = performance.now();
        if (currentShell === 'playing' && nowMs - lastHudSyncRef.current >= 85) {
          lastHudSyncRef.current = nowMs;
          setHud(
            extractHudSnapshot(
              state,
              p1LabelRef.current,
              p2LabelRef.current,
              pingMsRef.current,
            ),
          );
        }
      }

      return { state, events };
    });

    return () => {
      arena.dispose();
      rendererRef.current = null;
    };
  }, [handleMatchCompleted]);

  // Unified Window Keyboard Listener (P1 + P2 + Title Start + Pause + Mute)
  useEffect(() => {
    const mapP1Key = (code: string): keyof PlayerInputState | null => {
      switch (code) {
        case 'KeyA':
          return 'left';
        case 'KeyD':
          return 'right';
        case 'KeyW':
          return 'up';
        case 'KeyS':
          return 'down';
        case 'KeyE':
          return 'block';
        case 'ShiftLeft':
          return 'sidestep';
        case 'KeyF':
          return 'lp';
        case 'KeyG':
          return 'rp';
        case 'KeyH':
          return 'lk';
        case 'KeyR':
          return 'rk';
        case 'KeyQ':
          return 'special';
        case 'KeyT':
          return 'throwBtn';
        default:
          return null;
      }
    };

    const mapP2Key = (code: string): keyof PlayerInputState | null => {
      switch (code) {
        case 'ArrowLeft':
          return 'left';
        case 'ArrowRight':
          return 'right';
        case 'ArrowUp':
          return 'up';
        case 'ArrowDown':
          return 'down';
        case 'KeyO':
        case 'Numpad0':
          return 'block';
        case 'ShiftRight':
          return 'sidestep';
        case 'KeyJ':
        case 'Numpad1':
          return 'lp';
        case 'KeyK':
        case 'Numpad2':
          return 'rp';
        case 'KeyL':
        case 'Numpad3':
          return 'lk';
        case 'KeyU':
        case 'Numpad4':
          return 'rk';
        case 'KeyI':
        case 'Numpad5':
          return 'special';
        case 'KeyP':
        case 'Numpad6':
          return 'throwBtn';
        default:
          return null;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inTextInput =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (inTextInput) return;

      // Global shortcuts
      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }

      if (shellStateRef.current === 'title') {
        if (!rosterOpen && !onlineOpen && (e.code === 'Enter' || e.code === 'Space')) {
          e.preventDefault();
          handleQuickStart();
        }
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        if (shellStateRef.current === 'playing' || shellStateRef.current === 'paused') {
          handlePauseToggle();
        }
        return;
      }

      if (shellStateRef.current !== 'playing') return;

      const isLocal2P = matchRef.current.mode === 'local_2p';

      // In 1P modes, Arrow keys also control P1 movement for convenience!
      if (!isLocal2P) {
        if (e.code === 'ArrowLeft') {
          e.preventDefault();
          p1KeyInputRef.current.left = true;
          return;
        }
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          p1KeyInputRef.current.right = true;
          return;
        }
        if (e.code === 'ArrowUp') {
          e.preventDefault();
          p1KeyInputRef.current.up = true;
          return;
        }
        if (e.code === 'ArrowDown') {
          e.preventDefault();
          p1KeyInputRef.current.down = true;
          return;
        }
        if (e.code === 'Space') {
          e.preventDefault();
          p1KeyInputRef.current.rp = true;
          return;
        }
      }

      const p1Mapped = mapP1Key(e.code);
      if (p1Mapped) {
        e.preventDefault();
        p1KeyInputRef.current[p1Mapped] = true;
        return;
      }

      if (isLocal2P) {
        const p2Mapped = mapP2Key(e.code);
        if (p2Mapped) {
          e.preventDefault();
          p2KeyInputRef.current[p2Mapped] = true;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const isLocal2P = matchRef.current.mode === 'local_2p';
      if (!isLocal2P) {
        if (e.code === 'ArrowLeft') p1KeyInputRef.current.left = false;
        if (e.code === 'ArrowRight') p1KeyInputRef.current.right = false;
        if (e.code === 'ArrowUp') p1KeyInputRef.current.up = false;
        if (e.code === 'ArrowDown') p1KeyInputRef.current.down = false;
        if (e.code === 'Space') p1KeyInputRef.current.rp = false;
      }
      const p1Mapped = mapP1Key(e.code);
      if (p1Mapped) p1KeyInputRef.current[p1Mapped] = false;

      const p2Mapped = mapP2Key(e.code);
      if (p2Mapped) p2KeyInputRef.current[p2Mapped] = false;
    };

    // Release held keys cleanly on blur/visibilitychange (without auto-pausing)
    const onBlur = () => clearAllInputs();
    const onVisibility = () => {
      if (document.hidden) clearAllInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [clearAllInputs, handlePauseToggle, handleQuickStart, handleToggleMute, onlineOpen, rosterOpen]);

  const handleTouchInput = useCallback((key: keyof PlayerInputState, pressed: boolean) => {
    audioSynth.unlock();
    p1TouchInputRef.current[key] = pressed;
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0c0b10]">
      {/* Isolated Full-Viewport WebGL Mount Container (never re-rendered by HUD state) */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 w-full h-full z-0"
        style={{
          background:
            'radial-gradient(ellipse at 65% 45%, #4a2335 0%, #1c1324 55%, #0c0b10 100%)',
        }}
        aria-label="3D Martial Arts Arena"
      />

      {/* Online Disconnect Notice Banner (transient if peer disconnects) */}
      {onlineNotice && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#1c1522] border border-[#f59e0b]/60 text-xs font-semibold text-[#fef3c7] rounded-sm flex items-center gap-3"
        >
          <span>{onlineNotice}</span>
          <button
            type="button"
            onClick={() => setOnlineNotice(null)}
            className="text-[#fbbf24] hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Title Screen Shell */}
      {shellState === 'title' && (
        <TitleOverlay
          onQuickStart={handleQuickStart}
          onOpenRoster={() => {
            audioSynth.playUiClick(580);
            setRosterOpen(true);
          }}
          onOpenOnline={() => {
            audioSynth.playUiClick(640);
            fetchLeaderboard();
            setOnlineOpen(true);
          }}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Live Combat HUD & Responsive Mobile Touch Pad */}
      {shellState === 'playing' && (
        <>
          <CombatHud
            hud={hud}
            muted={muted}
            showTouchPad={showTouchPad}
            onToggleMute={handleToggleMute}
            onToggleTouchPad={() => setShowTouchPad((v) => !v)}
            onPause={handlePauseToggle}
          />
          <TouchControls
            visible={showTouchPad}
            kiReady={hud.p1Ki >= 50}
            onInputChange={handleTouchInput}
          />
        </>
      )}

      {/* Pause & Match Outcome Status Modals */}
      {(shellState === 'paused' || shellState === 'gameover') && (
        <StatusModal
          kind={shellState}
          summary={matchSummary}
          onResume={handlePauseToggle}
          onRestart={handleRestartBout}
          onNextTournamentStage={handleNextTournamentStage}
          onReturnTitle={handleReturnTitle}
          onOpenLeaderboard={() => {
            fetchLeaderboard();
            setOnlineOpen(true);
          }}
        />
      )}

      {/* Modes, Characters & 3D Arena Selection Modal */}
      <RosterModal
        open={rosterOpen}
        mode={selectedMode}
        p1Character={p1Char}
        p2Character={p2Char}
        stageId={stageId}
        difficulty={difficulty}
        onChangeMode={setSelectedMode}
        onSelectP1={setP1Char}
        onSelectP2={setP2Char}
        onSelectStage={setStageId}
        onChangeDifficulty={setDifficulty}
        onStartMatch={handleStartFromRoster}
        onClose={() => setRosterOpen(false)}
      />

      {/* Real-Time WebSocket Online Matchmaking & Ranked Leaderboard Modal */}
      <OnlineModal
        open={onlineOpen}
        callsign={callsign}
        selectedChar={p1Char}
        wsStatus={wsStatus}
        pingMs={pingMs}
        presence={presence}
        inQueue={inQueue}
        roomCode={roomCode}
        roomError={roomError}
        leaderboard={leaderboard}
        leaderboardLoading={leaderboardLoading}
        onChangeCallsign={setCallsign}
        onSelectChar={setP1Char}
        onFindMatch={() => {
          audioSynth.playUiClick(680);
          onlineClientRef.current?.joinQueue(callsign, p1Char, stageId);
        }}
        onCancelQueue={() => {
          onlineClientRef.current?.leaveQueue();
          setInQueue(false);
        }}
        onCreateRoom={() => {
          audioSynth.playUiClick(680);
          onlineClientRef.current?.createRoom(callsign, p1Char, stageId);
        }}
        onJoinRoom={(code) => {
          audioSynth.playUiClick(720);
          setRoomError(null);
          onlineClientRef.current?.joinRoom(code, callsign, p1Char);
        }}
        onRefreshLeaderboard={fetchLeaderboard}
        onClose={() => setOnlineOpen(false)}
      />
    </main>
  );
}

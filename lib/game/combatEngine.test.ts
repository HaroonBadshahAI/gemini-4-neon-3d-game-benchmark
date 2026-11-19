import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyInput,
  createMatchState,
  stepMatch,
} from './combatEngine';
import { buildTournamentLadder } from './characters';

function advanceFrames(
  state: ReturnType<typeof createMatchState>,
  seconds: number,
  p1Input = createEmptyInput(),
  p2Input = createEmptyInput(),
) {
  const dt = 0.02;
  const steps = Math.ceil(seconds / dt);
  for (let i = 0; i < steps; i++) {
    stepMatch(state, dt, p1Input, p2Input);
  }
}

test('match starts in intro and transitions to fighting after intro timer', () => {
  const state = createMatchState({
    p1Character: 'kenji',
    p2Character: 'hwojin',
    stageId: 'kyoto_shrine',
    mode: 'local_2p',
  });
  assert.equal(state.phase, 'intro');
  advanceFrames(state, 1.7);
  assert.equal(state.phase, 'fighting');
  assert.equal(state.roundNumber, 1);
});

test('close-range punch connects, deals damage, builds ki, and registers combo', () => {
  const state = createMatchState({
    p1Character: 'kenji',
    p2Character: 'hwojin',
    stageId: 'kyoto_shrine',
    mode: 'local_2p',
  });
  advanceFrames(state, 1.7);
  state.fighters[0].x = -0.6;
  state.fighters[1].x = 0.6;
  const startHp = state.fighters[1].hp;
  const startKi = state.fighters[0].ki;

  const p1Attack = { ...createEmptyInput(), rp: true };
  stepMatch(state, 0.02, p1Attack, createEmptyInput());
  advanceFrames(state, 0.35, createEmptyInput(), createEmptyInput());

  assert.ok(state.fighters[1].hp < startHp, 'opponent HP should decrease on hit');
  assert.ok(state.fighters[0].ki > startKi, 'attacker Ki should increase on hit');
  assert.equal(state.fighters[0].comboDisplayCount, 1);
});

test('guard blocks mid attack with chip damage only, while throw breaks guard', () => {
  const state = createMatchState({
    p1Character: 'kenji',
    p2Character: 'gaius',
    stageId: 'kyoto_shrine',
    mode: 'local_2p',
  });
  advanceFrames(state, 1.7);
  state.fighters[0].x = -0.55;
  state.fighters[1].x = 0.55;
  const startHp = state.fighters[1].hp;

  // Defender holds block against RP (15 dmg, 1 chip)
  const p2Block = { ...createEmptyInput(), block: true };
  stepMatch(state, 0.02, { ...createEmptyInput(), rp: true }, p2Block);
  advanceFrames(state, 0.32, createEmptyInput(), p2Block);
  assert.equal(state.fighters[1].hp, startHp - 1, 'guard should reduce RP to 1 chip damage');

  // Let attacker return to idle
  advanceFrames(state, 0.4, createEmptyInput(), p2Block);
  state.fighters[0].x = -0.5;
  state.fighters[1].x = 0.5;
  const preThrowHp = state.fighters[1].hp;

  // Throw is unblockable
  stepMatch(state, 0.02, { ...createEmptyInput(), throwBtn: true }, p2Block);
  advanceFrames(state, 0.35, createEmptyInput(), p2Block);
  assert.ok(
    state.fighters[1].hp <= preThrowHp - 15,
    'unblockable throw should break blocking guard',
  );
});

test('3D sidestep evades linear punch and crouching ducks high jab', () => {
  const state = createMatchState({
    p1Character: 'kenji',
    p2Character: 'lingmei',
    stageId: 'kyoto_shrine',
    mode: 'local_2p',
  });
  advanceFrames(state, 1.7);
  state.fighters[0].x = -0.6;
  state.fighters[1].x = 0.6;
  const startHp = state.fighters[1].hp;

  // Crouching ducks High LP
  const p2Crouch = { ...createEmptyInput(), down: true };
  stepMatch(state, 0.02, { ...createEmptyInput(), lp: true }, p2Crouch);
  advanceFrames(state, 0.35, createEmptyInput(), p2Crouch);
  assert.equal(state.fighters[1].hp, startHp, 'high jab should whiff over crouching defender');

  // Offset defender in Z via 3D sidestep and throw linear RP
  state.fighters[1].z = 1.1;
  stepMatch(state, 0.02, { ...createEmptyInput(), rp: true }, createEmptyInput());
  advanceFrames(state, 0.4, createEmptyInput(), createEmptyInput());
  assert.equal(state.fighters[1].hp, startHp, 'linear RP should whiff against Z-sidestepped opponent');
});

test('special move consumes 50 Ki and deals heavy damage', () => {
  const state = createMatchState({
    p1Character: 'kenji',
    p2Character: 'hwojin',
    stageId: 'kyoto_shrine',
    mode: 'local_2p',
  });
  advanceFrames(state, 1.7);
  state.fighters[0].x = -0.7;
  state.fighters[1].x = 0.7;
  state.fighters[0].ki = 60;
  const startHp = state.fighters[1].hp;

  stepMatch(state, 0.02, { ...createEmptyInput(), special: true }, createEmptyInput());
  assert.equal(state.fighters[0].ki, 10, 'special move should spend 50 Ki');
  advanceFrames(state, 0.45);
  assert.ok(startHp - state.fighters[1].hp >= 25, 'special move should deal heavy damage');
});

test('best-of-3 round progression awards match winner at 2 round wins', () => {
  const state = createMatchState({
    p1Character: 'gaius',
    p2Character: 'lingmei',
    stageId: 'shibuya_rooftop',
    mode: 'local_2p',
  });
  advanceFrames(state, 1.7);

  // Round 1 KO
  state.fighters[0].x = -0.5;
  state.fighters[1].x = 0.5;
  state.fighters[1].hp = 5;
  stepMatch(state, 0.02, { ...createEmptyInput(), rp: true }, createEmptyInput());
  advanceFrames(state, 0.45);
  assert.equal(state.phase, 'round_ko');
  assert.equal(state.fighters[0].roundsWon, 1);

  // Transition to Round 2
  advanceFrames(state, 2.5);
  assert.equal(state.roundNumber, 2);
  assert.equal(state.phase, 'intro');
  advanceFrames(state, 1.7);
  assert.equal(state.phase, 'fighting');

  // Round 2 KO -> Match Over with P1 Winner
  state.fighters[0].x = -0.5;
  state.fighters[1].x = 0.5;
  state.fighters[1].hp = 5;
  stepMatch(state, 0.02, { ...createEmptyInput(), rp: true }, createEmptyInput());
  advanceFrames(state, 0.45);
  assert.equal(state.fighters[0].roundsWon, 2);
  assert.equal(state.winnerIndex, 0);

  advanceFrames(state, 2.5);
  assert.equal(state.phase, 'match_over');
});

test('tournament ladder builds 4 progressive stages with escalating difficulty', () => {
  const ladder = buildTournamentLadder('kenji');
  assert.equal(ladder.length, 4);
  assert.equal(ladder[0].difficulty, 'rookie');
  assert.equal(ladder[3].difficulty, 'boss');
  assert.ok(ladder[3].rpReward > ladder[0].rpReward);
});

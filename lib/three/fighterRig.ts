import * as THREE from 'three';
import { CHARACTERS, CharacterId } from '../game/characters';
import type { FighterState } from '../game/combatEngine';

export interface FighterRig {
  characterId: CharacterId;
  root: THREE.Group;
  bodyPivot: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  lShoulder: THREE.Group;
  lElbow: THREE.Group;
  rShoulder: THREE.Group;
  rElbow: THREE.Group;
  lHip: THREE.Group;
  lKnee: THREE.Group;
  rHip: THREE.Group;
  rKnee: THREE.Group;
  sashLeft: THREE.Mesh;
  sashRight: THREE.Mesh;
  headbandTailL: THREE.Mesh | null;
  headbandTailR: THREE.Mesh | null;
  auraRing: THREE.Mesh;
  contactShadow: THREE.Mesh;
  flashMaterials: THREE.MeshStandardMaterial[];
  baseEmissiveColors: number[];
  dispose: () => void;
}

export function buildFighterRig(
  characterId: CharacterId,
  contactShadowTex: THREE.CanvasTexture,
): FighterRig {
  const spec = CHARACTERS[characterId];
  const p = spec.palette;
  const hScale = spec.heightScale;
  const bScale = spec.buildScale;

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const flashMaterials: THREE.MeshStandardMaterial[] = [];
  const baseEmissiveColors: number[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    if (m instanceof THREE.MeshStandardMaterial) {
      flashMaterials.push(m);
      baseEmissiveColors.push(m.emissive.getHex());
    }
    return m;
  };

  // Calibrated PBR materials with >= 0.25 roughness spread across parts
  const skinMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: p.skin,
      roughness: 0.58,
      metalness: 0.04,
    }),
  );
  const giPrimaryMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: p.giPrimary,
      roughness: 0.86,
      metalness: 0.05,
    }),
  );
  const giSecondaryMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: p.giSecondary,
      roughness: 0.62,
      metalness: 0.12,
    }),
  );
  const beltMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: p.belt,
      roughness: 0.42,
      metalness: 0.18,
    }),
  );
  const accentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: p.accent,
      roughness: 0.34,
      metalness: 0.32,
    }),
  );
  const metalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd4a64a,
      roughness: 0.24,
      metalness: 0.88,
    }),
  );
  const hairMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: p.hair,
      roughness: 0.48,
      metalness: 0.12,
    }),
  );

  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // Soft grounded contact shadow disc (never floating!)
  const shadowGeo = trackGeo(new THREE.CircleGeometry(0.68 * bScale, 24));
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  materials.push(shadowMat);
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.016;
  root.add(contactShadow);

  // Subtle Ki Aura ground ring (visible when Special charged or active)
  const auraGeo = trackGeo(new THREE.RingGeometry(0.48, 0.66, 28));
  const auraMat = new THREE.MeshBasicMaterial({
    color: p.sparkColor,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  materials.push(auraMat);
  const auraRing = new THREE.Mesh(auraGeo, auraMat);
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.028;
  root.add(auraRing);

  // HIPS / PELVIS (center of gravity at y = 0.94 * hScale)
  const hips = new THREE.Group();
  hips.position.y = 0.94 * hScale;
  bodyPivot.add(hips);

  const pelvisMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.18 * bScale, 0.16 * bScale, 0.19, 12)),
    giPrimaryMat,
  );
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  // Martial Arts Obi Belt + Knot + Flowing Tails
  const beltMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.195 * bScale, 0.195 * bScale, 0.085, 14)),
    beltMat,
  );
  beltMesh.position.y = 0.07;
  beltMesh.castShadow = true;
  hips.add(beltMesh);

  const knotMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.09, 0.08, 0.08)),
    beltMat,
  );
  knotMesh.position.set(0.19 * bScale, 0.06, 0.03);
  hips.add(knotMesh);

  const sashGeo = trackGeo(new THREE.BoxGeometry(0.035, 0.28, 0.065));
  sashGeo.translate(0, -0.14, 0);
  const sashLeft = new THREE.Mesh(sashGeo, beltMat);
  sashLeft.position.set(0.19 * bScale, 0.04, 0.055);
  hips.add(sashLeft);

  const sashRight = new THREE.Mesh(sashGeo, beltMat);
  sashRight.position.set(0.19 * bScale, 0.04, -0.025);
  hips.add(sashRight);

  // TORSO (anatomical tapered upper chest + V-lapel gi trim)
  const torso = new THREE.Group();
  torso.position.y = 0.1;
  hips.add(torso);

  const waistMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.21 * bScale, 0.165 * bScale, 0.22, 12)),
    characterId === 'kenji' ? skinMat : giPrimaryMat,
  );
  waistMesh.position.y = 0.12;
  waistMesh.castShadow = true;
  torso.add(waistMesh);

  const chestMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24 * bScale, 0.195 * bScale, 0.30, 12)),
    characterId === 'kenji' ? skinMat : giPrimaryMat,
  );
  chestMesh.scale.set(0.84, 1, 1.15);
  chestMesh.position.y = 0.34;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Gi Vest / Collar Trim
  const lapelGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.34, 0.08));
  const lapelL = new THREE.Mesh(lapelGeo, giSecondaryMat);
  lapelL.position.set(0.17 * bScale, 0.33, 0.11 * bScale);
  lapelL.rotation.x = 0.28;
  torso.add(lapelL);

  const lapelR = new THREE.Mesh(lapelGeo, giSecondaryMat);
  lapelR.position.set(0.17 * bScale, 0.33, -0.11 * bScale);
  lapelR.rotation.x = -0.28;
  torso.add(lapelR);

  // Metallic shoulder guard for Gaius Vance
  if (spec.hasShoulderGuard) {
    const pauldron = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.16 * bScale, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6)),
      metalMat,
    );
    pauldron.position.set(0, 0.49, 0.29 * bScale);
    pauldron.rotation.x = 0.35;
    pauldron.castShadow = true;
    torso.add(pauldron);
  }

  // HEAD & CHARACTER HAIR / HEADBAND
  const head = new THREE.Group();
  head.position.y = 0.54;
  torso.add(head);

  const neckMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.068 * bScale, 0.082 * bScale, 0.11, 10)),
    skinMat,
  );
  neckMesh.position.y = 0.03;
  head.add(neckMesh);

  const skullMesh = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.135, 14, 12)),
    skinMat,
  );
  skullMesh.scale.set(1.02, 1.12, 0.92);
  skullMesh.position.y = 0.18;
  skullMesh.castShadow = true;
  head.add(skullMesh);

  // Defined brow / visor shadow for strong readable facing direction
  const browMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.06, 0.025, 0.14)),
    hairMat,
  );
  browMesh.position.set(0.115, 0.21, 0);
  head.add(browMesh);

  let headbandTailL: THREE.Mesh | null = null;
  let headbandTailR: THREE.Mesh | null = null;

  if (spec.hairStyle === 'spiked') {
    // Classic Tekken Mishima swept spiked hair
    const spikeGeo = trackGeo(new THREE.ConeGeometry(0.055, 0.19, 6));
    const offsets: [number, number, number, number][] = [
      [-0.02, 0.33, 0, -0.35],
      [-0.07, 0.31, 0.06, -0.55],
      [-0.07, 0.31, -0.06, -0.55],
      [0.03, 0.32, 0.05, -0.15],
      [0.03, 0.32, -0.05, -0.15],
    ];
    for (const [ox, oy, oz, rotZ] of offsets) {
      const spike = new THREE.Mesh(spikeGeo, hairMat);
      spike.position.set(ox, oy, oz);
      spike.rotation.z = rotZ;
      head.add(spike);
    }
    const hairCap = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52)),
      hairMat,
    );
    hairCap.position.y = 0.20;
    head.add(hairCap);
  } else if (spec.hairStyle === 'headband') {
    const hairCap = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.142, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.56)),
      hairMat,
    );
    hairCap.position.y = 0.20;
    head.add(hairCap);

    const band = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.132, 0.024, 8, 18)),
      accentMat,
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.23;
    head.add(band);

    const tailGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.028, 0.045));
    tailGeo.translate(-0.12, 0, 0);
    headbandTailL = new THREE.Mesh(tailGeo, accentMat);
    headbandTailL.position.set(-0.13, 0.23, 0.035);
    head.add(headbandTailL);

    headbandTailR = new THREE.Mesh(tailGeo, accentMat);
    headbandTailR.position.set(-0.13, 0.23, -0.035);
    head.add(headbandTailR);
  } else if (spec.hairStyle === 'buns') {
    const hairCap = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58)),
      hairMat,
    );
    hairCap.position.y = 0.195;
    head.add(hairCap);

    const bunGeo = trackGeo(new THREE.SphereGeometry(0.068, 10, 10));
    const ringGeo = trackGeo(new THREE.TorusGeometry(0.065, 0.015, 8, 14));
    for (const side of [1, -1]) {
      const bun = new THREE.Mesh(bunGeo, hairMat);
      bun.position.set(-0.03, 0.30, side * 0.13);
      head.add(bun);
      const ornament = new THREE.Mesh(ringGeo, metalMat);
      ornament.position.set(-0.03, 0.30, side * 0.12);
      ornament.rotation.y = Math.PI / 2;
      head.add(ornament);
    }
  } else {
    const hairCap = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.132, 0.138, 0.09, 12)),
      hairMat,
    );
    hairCap.position.y = 0.265;
    head.add(hairCap);
  }

  // HELPER TO BUILD ARTICULATED ARMS
  const upperArmGeo = trackGeo(new THREE.CylinderGeometry(0.066 * bScale, 0.056 * bScale, 0.29, 10));
  upperArmGeo.translate(0, -0.145, 0);
  const forearmGeo = trackGeo(new THREE.CylinderGeometry(0.054 * bScale, 0.044 * bScale, 0.27, 10));
  forearmGeo.translate(0, -0.135, 0);
  const gloveGeo = trackGeo(new THREE.BoxGeometry(0.105 * bScale, 0.11 * bScale, 0.095 * bScale));
  const deltoidGeo = trackGeo(new THREE.SphereGeometry(0.085 * bScale, 10, 10));

  const buildArm = (side: 1 | -1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.45, side * 0.27 * bScale);
    torso.add(shoulder);

    const deltoid = new THREE.Mesh(deltoidGeo, spec.sleeveless ? skinMat : giPrimaryMat);
    deltoid.castShadow = true;
    shoulder.add(deltoid);

    const upperArm = new THREE.Mesh(upperArmGeo, spec.sleeveless ? skinMat : giPrimaryMat);
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.29;
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.castShadow = true;
    elbow.add(forearm);

    // Karate wrist guard + padded martial glove
    const bracer = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.052 * bScale, 0.050 * bScale, 0.09, 10)),
      accentMat,
    );
    bracer.position.y = -0.21;
    elbow.add(bracer);

    const fist = new THREE.Mesh(gloveGeo, accentMat);
    fist.position.y = -0.295;
    fist.castShadow = true;
    elbow.add(fist);

    return { shoulder, elbow };
  };

  const leftArm = buildArm(1);
  const rightArm = buildArm(-1);

  // HELPER TO BUILD ARTICULATED LEGS
  const thighGeo = trackGeo(new THREE.CylinderGeometry(0.098 * bScale, 0.082 * bScale, 0.43 * hScale, 10));
  thighGeo.translate(0, -0.215 * hScale, 0);
  const shinGeo = trackGeo(new THREE.CylinderGeometry(0.078 * bScale, 0.056 * bScale, 0.42 * hScale, 10));
  shinGeo.translate(0, -0.21 * hScale, 0);
  const footGeo = trackGeo(new THREE.BoxGeometry(0.22 * bScale, 0.075, 0.105 * bScale));

  const buildLeg = (side: 1 | -1) => {
    const hip = new THREE.Group();
    hip.position.set(0, -0.05, side * 0.125 * bScale);
    hips.add(hip);

    const thigh = new THREE.Mesh(thighGeo, giPrimaryMat);
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.43 * hScale;
    hip.add(knee);

    const shin = new THREE.Mesh(shinGeo, giPrimaryMat);
    shin.castShadow = true;
    knee.add(shin);

    const shinTrim = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.068 * bScale, 0.062 * bScale, 0.08, 10)),
      giSecondaryMat,
    );
    shinTrim.position.y = -0.34 * hScale;
    knee.add(shinTrim);

    const foot = new THREE.Mesh(footGeo, characterId === 'lingmei' ? accentMat : skinMat);
    foot.position.set(0.05, -0.44 * hScale, 0);
    foot.castShadow = true;
    knee.add(foot);

    return { hip, knee };
  };

  const leftLeg = buildLeg(1);
  const rightLeg = buildLeg(-1);

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    characterId,
    root,
    bodyPivot,
    hips,
    torso,
    head,
    lShoulder: leftArm.shoulder,
    lElbow: leftArm.elbow,
    rShoulder: rightArm.shoulder,
    rElbow: rightArm.elbow,
    lHip: leftLeg.hip,
    lKnee: leftLeg.knee,
    rHip: rightLeg.hip,
    rKnee: rightLeg.knee,
    sashLeft,
    sashRight,
    headbandTailL,
    headbandTailR,
    auraRing,
    contactShadow,
    flashMaterials,
    baseEmissiveColors,
    dispose,
  };
}

interface PoseTarget {
  hipY: number;
  bodyRotZ: number;
  bodyRotY: number;
  torsoRotY: number;
  torsoRotZ: number;
  lShZ: number;
  lShX: number;
  lElZ: number;
  rShZ: number;
  rShX: number;
  rElZ: number;
  lHipZ: number;
  lHipX: number;
  lKneeZ: number;
  rHipZ: number;
  rHipX: number;
  rKneeZ: number;
}

const _pose: PoseTarget = {
  hipY: 0.94,
  bodyRotZ: 0,
  bodyRotY: 0,
  torsoRotY: 0,
  torsoRotZ: 0,
  lShZ: 0,
  lShX: 0,
  lElZ: 0,
  rShZ: 0,
  rShX: 0,
  rElZ: 0,
  lHipZ: 0,
  lHipX: 0,
  lKneeZ: 0,
  rHipZ: 0,
  rHipX: 0,
  rKneeZ: 0,
};

export function updateFighterPose(
  rig: FighterRig,
  f: FighterState,
  dt: number,
  elapsed: number,
): void {
  const spec = CHARACTERS[f.characterId];
  const hScale = spec.heightScale;

  // Position fighter root flush on arena floor (y >= 0)
  rig.root.position.set(f.x, f.y, f.z);

  // Facing rotation (local +X is forward!)
  const targetFaceRotY = f.facing === 1 ? 0 : Math.PI;
  rig.bodyPivot.rotation.y = THREE.MathUtils.damp(
    rig.bodyPivot.rotation.y,
    targetFaceRotY,
    18,
    dt,
  );

  // Contact shadow remains grounded on floor even when jumping
  rig.contactShadow.position.y = -f.y + 0.016;
  const shadowScale = Math.max(0.45, 1 - f.y * 0.16);
  rig.contactShadow.scale.setScalar(shadowScale);

  // Aura ring lights up when Special is ready (Ki >= 50) or executing Special
  const auraMat = rig.auraRing.material as THREE.MeshBasicMaterial;
  const isSpecial = f.action === 'attack' && f.currentMove === 'special';
  const targetAuraOpacity = isSpecial ? 0.85 : f.ki >= 50 ? 0.34 + Math.sin(elapsed * 7) * 0.1 : 0;
  auraMat.opacity = THREE.MathUtils.damp(auraMat.opacity, targetAuraOpacity, 12, dt);
  rig.auraRing.position.y = -f.y + 0.028;
  rig.auraRing.rotation.z = elapsed * (isSpecial ? 8 : 2.2);
  const auraScale = isSpecial ? 1.55 : 1.0 + Math.sin(elapsed * 5) * 0.05;
  rig.auraRing.scale.setScalar(auraScale);

  // White/emissive impact hit-flash
  const flashing = f.hitFlash > 0;
  for (let i = 0; i < rig.flashMaterials.length; i++) {
    const mat = rig.flashMaterials[i];
    if (flashing) {
      mat.emissive.setHex(0xffffff);
      mat.emissiveIntensity = 0.72;
    } else if (isSpecial) {
      mat.emissive.setHex(spec.palette.sparkColor);
      mat.emissiveIntensity = 0.25;
    } else {
      mat.emissive.setHex(rig.baseEmissiveColors[i]);
      mat.emissiveIntensity = 0;
    }
  }

  // Default authentic karate/Tekken fighting stance
  const breath = Math.sin(elapsed * 5.2 + f.index * 1.9);
  _pose.hipY = (0.91 + breath * 0.025) * hScale;
  _pose.bodyRotZ = 0;
  _pose.bodyRotY = 0;
  _pose.torsoRotY = -0.35;
  _pose.torsoRotZ = -0.06;
  // Lead left arm forward guard, rear right arm cocked by cheek
  _pose.lShZ = 0.85 + breath * 0.05;
  _pose.lShX = -0.22;
  _pose.lElZ = 1.45;
  _pose.rShZ = 0.55 - breath * 0.04;
  _pose.rShX = 0.26;
  _pose.rElZ = 1.85;
  // Wide martial arts horse/fighting leg stance
  _pose.lHipZ = 0.38;
  _pose.lHipX = -0.08;
  _pose.lKneeZ = -0.46;
  _pose.rHipZ = -0.34;
  _pose.rHipX = 0.08;
  _pose.rKneeZ = -0.32;

  let dampSpeed = 16;

  if (f.action === 'walk_fwd' || f.action === 'walk_back') {
    const dir = f.action === 'walk_fwd' ? 1 : -1;
    const stride = Math.sin(elapsed * 12.5 * dir);
    _pose.hipY = (0.89 + Math.abs(stride) * 0.04) * hScale;
    _pose.torsoRotZ = -0.1 * dir;
    _pose.lHipZ = 0.15 + stride * 0.52;
    _pose.lKneeZ = -0.35 - Math.max(0, -stride) * 0.45;
    _pose.rHipZ = -0.15 - stride * 0.52;
    _pose.rKneeZ = -0.35 - Math.max(0, stride) * 0.45;
  } else if (f.action === 'sidestep') {
    _pose.hipY = 0.83 * hScale;
    _pose.torsoRotY = f.sidestepDir * 0.45;
    _pose.lHipZ = 0.45;
    _pose.rHipZ = -0.45;
    _pose.lKneeZ = -0.62;
    _pose.rKneeZ = -0.62;
  } else if (f.action === 'crouch') {
    _pose.hipY = 0.58 * hScale;
    _pose.torsoRotZ = -0.22;
    _pose.lHipZ = 1.05;
    _pose.lKneeZ = -1.65;
    _pose.rHipZ = 0.85;
    _pose.rKneeZ = -1.55;
    _pose.lShZ = 0.95;
    _pose.lElZ = 1.65;
  } else if (f.action === 'jump') {
    _pose.hipY = 0.96 * hScale;
    _pose.torsoRotZ = -0.16;
    _pose.lHipZ = 0.85;
    _pose.lKneeZ = -1.35;
    _pose.rHipZ = 0.45;
    _pose.rKneeZ = -0.95;
    _pose.lShZ = 1.25;
    _pose.rShZ = 1.05;
  } else if (f.action === 'block' || f.action === 'blockstun') {
    const recoil = f.action === 'blockstun' ? 0.16 : 0;
    _pose.hipY = (f.crouching ? 0.6 : 0.86) * hScale;
    _pose.torsoRotY = 0.15;
    _pose.torsoRotZ = 0.12 + recoil;
    _pose.lShZ = 1.35;
    _pose.lShX = -0.45;
    _pose.lElZ = 2.05;
    _pose.rShZ = 1.3;
    _pose.rShX = 0.45;
    _pose.rElZ = 2.05;
    dampSpeed = 24;
  } else if (f.action === 'hitstun') {
    _pose.hipY = 0.86 * hScale;
    _pose.torsoRotZ = 0.46;
    _pose.torsoRotY = 0.25;
    _pose.lShZ = 0.35;
    _pose.lElZ = 0.6;
    _pose.rShZ = -0.45;
    _pose.rElZ = 0.4;
    dampSpeed = 24;
  } else if (f.action === 'launched') {
    _pose.hipY = 0.95 * hScale;
    _pose.bodyRotZ = 1.05 + Math.sin(f.actionTime * 7) * 0.25;
    _pose.lShZ = 2.2;
    _pose.rShZ = 1.9;
    _pose.lHipZ = 0.5;
    _pose.rHipZ = -0.35;
  } else if (f.action === 'knockdown' || f.action === 'ko') {
    _pose.hipY = 0.22;
    _pose.bodyRotZ = 1.52;
    _pose.torsoRotZ = 0.1;
    _pose.lShZ = 0.6;
    _pose.lElZ = 0.3;
    _pose.rShZ = -0.4;
    _pose.rElZ = 0.25;
    _pose.lHipZ = 0.15;
    _pose.lKneeZ = -0.25;
    _pose.rHipZ = -0.1;
    _pose.rKneeZ = -0.15;
    dampSpeed = f.action === 'ko' ? 9 : 14;
  } else if (f.action === 'victory') {
    const lift = Math.min(1, f.actionTime * 2.5);
    _pose.hipY = 0.96 * hScale;
    _pose.torsoRotY = 0.25;
    _pose.rShZ = 0.55 + lift * 2.45;
    _pose.rElZ = 1.85 - lift * 1.65;
    _pose.lShZ = 0.45;
    _pose.lElZ = 1.3;
  } else if (f.action === 'attack' && f.currentMove) {
    const mSpec = spec.moves[f.currentMove];
    const t = f.actionTime;
    const isWindup = t < mSpec.windup;
    const isActive = t >= mSpec.windup && t <= mSpec.windup + mSpec.active;
    const strikeAmp = isWindup ? -0.35 : isActive ? 1.0 : 0.45;
    dampSpeed = 28;

    switch (f.currentMove) {
      case 'lp': {
        // Crisp lead karate jab
        _pose.torsoRotY = -0.35 - strikeAmp * 0.55;
        _pose.torsoRotZ = -0.12 * strikeAmp;
        _pose.lShZ = 0.85 + strikeAmp * 0.82;
        _pose.lElZ = 1.45 - strikeAmp * 1.35;
        _pose.rShZ = 0.35;
        _pose.rElZ = 1.95;
        break;
      }
      case 'rp': {
        // Heavy rear-hand karate straight cross
        _pose.hipY = 0.86 * hScale;
        _pose.torsoRotY = 0.65 * strikeAmp;
        _pose.torsoRotZ = -0.2 * strikeAmp;
        _pose.rShZ = 0.55 + strikeAmp * 1.15;
        _pose.rElZ = 1.85 - strikeAmp * 1.75;
        _pose.lShZ = 0.25;
        _pose.lElZ = 1.85;
        _pose.lHipZ = 0.55;
        _pose.rHipZ = -0.55;
        break;
      }
      case 'lk': {
        // Mid snap front kick
        _pose.torsoRotZ = 0.22 * strikeAmp;
        _pose.lHipZ = 0.38 + strikeAmp * 1.25;
        _pose.lKneeZ = isWindup ? -1.45 : isActive ? -0.1 : -0.65;
        _pose.rHipZ = -0.18;
        _pose.rKneeZ = -0.16;
        break;
      }
      case 'rk': {
        // High spinning Tekken roundhouse kick!
        const spin = Math.min(1, t / (mSpec.windup + mSpec.active));
        _pose.bodyRotY = spin * Math.PI * 2;
        _pose.torsoRotZ = 0.36 * strikeAmp;
        _pose.rHipZ = 0.2 + strikeAmp * 1.65;
        _pose.rHipX = 0.45 * strikeAmp;
        _pose.rKneeZ = isActive ? -0.06 : -0.95;
        _pose.lHipZ = -0.1;
        _pose.lKneeZ = -0.14;
        break;
      }
      case 'low_sweep': {
        // Low spinning dragon sweep kick
        _pose.hipY = 0.44 * hScale;
        _pose.torsoRotZ = 0.42;
        _pose.torsoRotY = 0.85 * strikeAmp;
        _pose.rHipZ = 1.45 * strikeAmp;
        _pose.rKneeZ = -0.08;
        _pose.lHipZ = 0.95;
        _pose.lKneeZ = -1.75;
        break;
      }
      case 'uppercut': {
        // Rising dragon uppercut launcher
        _pose.hipY = (isWindup ? 0.68 : 1.02) * hScale;
        _pose.torsoRotZ = isWindup ? -0.35 : 0.22;
        _pose.torsoRotY = 0.72 * strikeAmp;
        _pose.rShZ = isWindup ? 0.15 : 2.55;
        _pose.rElZ = isWindup ? 1.8 : 0.45;
        break;
      }
      case 'throw': {
        // Double-arm martial grapple lunge
        _pose.hipY = 0.82 * hScale;
        _pose.torsoRotZ = -0.28 * strikeAmp;
        _pose.lShZ = 1.55;
        _pose.lElZ = 0.55;
        _pose.rShZ = 1.55;
        _pose.rElZ = 0.55;
        break;
      }
      case 'special': {
        // Signature Character Special Animation!
        if (f.characterId === 'kenji') {
          // Electric Wind God Fist (crouch dash -> soaring lightning uppercut)
          _pose.hipY = (isWindup ? 0.62 : 1.08) * hScale;
          _pose.torsoRotY = 0.95 * strikeAmp;
          _pose.torsoRotZ = isWindup ? -0.42 : 0.25;
          _pose.rShZ = isWindup ? 0.1 : 2.85;
          _pose.rElZ = isWindup ? 1.95 : 0.25;
          _pose.lShZ = -0.35;
        } else if (f.characterId === 'hwojin') {
          // Sky Fang Hurricane (high velocity double tornado kick)
          const spin = Math.min(1, t / (mSpec.windup + mSpec.active));
          _pose.bodyRotY = spin * Math.PI * 4;
          _pose.hipY = 1.15 * hScale;
          _pose.torsoRotZ = 0.45;
          _pose.rHipZ = 1.85;
          _pose.rKneeZ = -0.05;
          _pose.lHipZ = 0.85;
          _pose.lKneeZ = -1.2;
        } else if (f.characterId === 'lingmei') {
          // Phoenix Palm Cyclone (low lunging twin-palm vortex)
          _pose.hipY = 0.68 * hScale;
          _pose.torsoRotZ = -0.38;
          _pose.torsoRotY = -0.75 * strikeAmp;
          _pose.lShZ = 1.75;
          _pose.lElZ = 0.12;
          _pose.rShZ = 1.65;
          _pose.rElZ = 0.22;
        } else {
          // Seismic Tiger Driver (colossal haymaker slam)
          _pose.hipY = 0.84 * hScale;
          _pose.torsoRotY = 1.15 * strikeAmp;
          _pose.torsoRotZ = -0.35 * strikeAmp;
          _pose.rShZ = isWindup ? -0.85 : 1.95;
          _pose.rElZ = isWindup ? 1.4 : 0.18;
        }
        break;
      }
    }
  }

  // Smooth exponential damping for fluid 60fps martial kinematics
  rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, _pose.hipY, dampSpeed, dt);
  rig.hips.rotation.z = THREE.MathUtils.damp(rig.hips.rotation.z, _pose.bodyRotZ, dampSpeed, dt);
  rig.hips.rotation.y = THREE.MathUtils.damp(rig.hips.rotation.y, _pose.bodyRotY, dampSpeed, dt);

  rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, _pose.torsoRotY, dampSpeed, dt);
  rig.torso.rotation.z = THREE.MathUtils.damp(rig.torso.rotation.z, _pose.torsoRotZ, dampSpeed, dt);

  rig.lShoulder.rotation.z = THREE.MathUtils.damp(rig.lShoulder.rotation.z, _pose.lShZ, dampSpeed, dt);
  rig.lShoulder.rotation.x = THREE.MathUtils.damp(rig.lShoulder.rotation.x, _pose.lShX, dampSpeed, dt);
  rig.lElbow.rotation.z = THREE.MathUtils.damp(rig.lElbow.rotation.z, _pose.lElZ, dampSpeed, dt);

  rig.rShoulder.rotation.z = THREE.MathUtils.damp(rig.rShoulder.rotation.z, _pose.rShZ, dampSpeed, dt);
  rig.rShoulder.rotation.x = THREE.MathUtils.damp(rig.rShoulder.rotation.x, _pose.rShX, dampSpeed, dt);
  rig.rElbow.rotation.z = THREE.MathUtils.damp(rig.rElbow.rotation.z, _pose.rElZ, dampSpeed, dt);

  rig.lHip.rotation.z = THREE.MathUtils.damp(rig.lHip.rotation.z, _pose.lHipZ, dampSpeed, dt);
  rig.lHip.rotation.x = THREE.MathUtils.damp(rig.lHip.rotation.x, _pose.lHipX, dampSpeed, dt);
  rig.lKnee.rotation.z = THREE.MathUtils.damp(rig.lKnee.rotation.z, _pose.lKneeZ, dampSpeed, dt);

  rig.rHip.rotation.z = THREE.MathUtils.damp(rig.rHip.rotation.z, _pose.rHipZ, dampSpeed, dt);
  rig.rHip.rotation.x = THREE.MathUtils.damp(rig.rHip.rotation.x, _pose.rHipX, dampSpeed, dt);
  rig.rKnee.rotation.z = THREE.MathUtils.damp(rig.rKnee.rotation.z, _pose.rKneeZ, dampSpeed, dt);

  // Secondary cloth physics on obi belt tails & headband tails
  const clothFlutter = Math.sin(elapsed * 9.5 + f.x * 1.4) * 0.14 - f.vx * 0.06 * f.facing;
  rig.sashLeft.rotation.z = clothFlutter + 0.12;
  rig.sashRight.rotation.z = clothFlutter * 0.85 - 0.08;
  if (rig.headbandTailL && rig.headbandTailR) {
    rig.headbandTailL.rotation.z = Math.sin(elapsed * 11.2) * 0.22 - 0.18;
    rig.headbandTailR.rotation.z = Math.cos(elapsed * 10.4) * 0.22 - 0.25;
  }
}

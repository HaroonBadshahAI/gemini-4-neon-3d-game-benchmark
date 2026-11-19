import * as THREE from 'three';
import { STAGES, StageId } from '../game/characters';
import {
  createDojoFloorTextures,
  createSkyDomeTexture,
} from './proceduralTextures';

export interface StageHandle {
  group: THREE.Group;
  update: (dt: number, elapsed: number) => void;
  dispose: () => void;
}

const _dummy = new THREE.Object3D();

export function buildStageScene(
  stageId: StageId,
  scene: THREE.Scene,
  maxAnisotropy: number,
): StageHandle {
  const stageSpec = STAGES[stageId];
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };
  const trackTex = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };

  scene.background = new THREE.Color(stageSpec.fogColor);
  scene.fog = new THREE.FogExp2(stageSpec.fogColor, 0.0175);

  // Atmospheric Sky Dome
  const skyTex = trackTex(createSkyDomeTexture(stageId));
  const skyDome = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(78, 24, 16)),
    trackMat(
      new THREE.MeshBasicMaterial({
        map: skyTex,
        side: THREE.BackSide,
        fog: false,
      }),
    ),
  );
  group.add(skyDome);

  // Main Fighting Arena Deck (top flush at y = 0!)
  const floorTex = createDojoFloorTextures(stageId, maxAnisotropy);
  trackTex(floorTex.map);
  trackTex(floorTex.bumpMap);

  const deckGeo = trackGeo(new THREE.CylinderGeometry(7.2, 7.65, 0.72, 8));
  deckGeo.rotateY(Math.PI / 8);
  const deckMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: floorTex.map,
      bumpMap: floorTex.bumpMap,
      bumpScale: 0.03,
      roughness: stageId === 'shibuya_rooftop' ? 0.45 : 0.74,
      metalness: stageId === 'shibuya_rooftop' ? 0.16 : 0.06,
    }),
  );
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.y = -0.36;
  deck.receiveShadow = true;
  group.add(deck);

  // Beveled stone/steel foundation rim under arena
  const rimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: stageId === 'kyoto_shrine' ? 0x4b4642 : stageId === 'shibuya_rooftop' ? 0x1e2532 : 0x3b332b,
      roughness: 0.82,
      metalness: stageId === 'shibuya_rooftop' ? 0.55 : 0.08,
    }),
  );
  const rimGeo = trackGeo(new THREE.CylinderGeometry(7.7, 8.2, 0.45, 8));
  rimGeo.rotateY(Math.PI / 8);
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = -0.94;
  rim.receiveShadow = true;
  group.add(rim);

  // Ambient drifting particles (sakura petals / city sparks / sea mist)
  const ambientCount = 80;
  const ambientGeo = trackGeo(
    stageId === 'kyoto_shrine'
      ? new THREE.PlaneGeometry(0.14, 0.09)
      : new THREE.BoxGeometry(0.06, 0.06, 0.06),
  );
  const ambientMat = trackMat(
    new THREE.MeshBasicMaterial({
      color:
        stageId === 'kyoto_shrine'
          ? 0xffb7c5
          : stageId === 'shibuya_rooftop'
            ? 0x7dd3fc
            : 0xfde68a,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    }),
  );
  const ambientParticles = new THREE.InstancedMesh(ambientGeo, ambientMat, ambientCount);
  ambientParticles.frustumCulled = false;
  const ambientSeeds = Array.from({ length: ambientCount }, (_, i) => ({
    x: ((i * 73.1) % 24) - 12,
    y: 0.6 + ((i * 41.7) % 7),
    z: ((i * 59.3) % 16) - 9,
    speed: 0.55 + ((i * 17) % 10) * 0.08,
    phase: i * 1.13,
  }));
  group.add(ambientParticles);

  let oceanMesh: THREE.Mesh | null = null;
  let beaconMesh: THREE.Mesh | null = null;
  const fireMeshes: THREE.Mesh[] = [];

  if (stageId === 'kyoto_shrine') {
    // Extended warm stone-and-moss hillside courtyard beyond arena (no void box!)
    const groundMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x3b2c2a,
        roughness: 0.92,
        metalness: 0.04,
      }),
    );
    const ground = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(66, 32)),
      groundMat,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.16;
    ground.receiveShadow = true;
    group.add(ground);

    // Temple stone entrance path leading toward the Torii gate
    const pathMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x5c5048,
        roughness: 0.86,
        metalness: 0.05,
      }),
    );
    const stonePath = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(5.4, 0.08, 18)),
      pathMat,
    );
    stonePath.position.set(0, -1.11, -13.5);
    stonePath.receiveShadow = true;
    group.add(stonePath);

    // Warm glowing lantern point lights (within <= 4 active PointLight budget)
    const lanternLightL = new THREE.PointLight(0xff9c42, 4.5, 16, 1.8);
    lanternLightL.position.set(-6.8, 1.35, -5.2);
    group.add(lanternLightL);
    const lanternLightR = new THREE.PointLight(0xff9c42, 4.5, 16, 1.8);
    lanternLightR.position.set(6.8, 1.35, -5.2);
    group.add(lanternLightR);

    // Iconic Vermilion Torii Gate Landmark framed in rear vista
    const vermilionMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xb92b22,
        roughness: 0.44,
        metalness: 0.12,
      }),
    );
    const darkRoofMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x1e1c24,
        roughness: 0.62,
        metalness: 0.22,
      }),
    );
    const torii = new THREE.Group();
    torii.position.set(0, -1.16, -12.5);

    const pillarGeo = trackGeo(new THREE.CylinderGeometry(0.32, 0.38, 8.6, 12));
    const baseGeo = trackGeo(new THREE.CylinderGeometry(0.46, 0.52, 0.9, 12));
    for (const sx of [-3.4, 3.4]) {
      const pillar = new THREE.Mesh(pillarGeo, vermilionMat);
      pillar.position.set(sx, 4.3, 0);
      torii.add(pillar);
      const base = new THREE.Mesh(baseGeo, darkRoofMat);
      base.position.set(sx, 0.45, 0);
      torii.add(base);
    }
    const kasagiTop = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(10.6, 0.58, 0.85)),
      darkRoofMat,
    );
    kasagiTop.position.set(0, 8.6, 0);
    torii.add(kasagiTop);

    const kasagiSub = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(9.8, 0.45, 0.68)),
      vermilionMat,
    );
    kasagiSub.position.set(0, 8.12, 0);
    torii.add(kasagiSub);

    const nukiBeam = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(8.6, 0.38, 0.48)),
      vermilionMat,
    );
    nukiBeam.position.set(0, 6.7, 0);
    torii.add(nukiBeam);

    const plaque = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.95, 1.35, 0.25)),
      darkRoofMat,
    );
    plaque.position.set(0, 7.42, 0.1);
    torii.add(plaque);
    group.add(torii);

    // 4 Carved Stone Toro Lanterns with glowing warm lantern cores
    const stoneMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x7b756e,
        roughness: 0.88,
        metalness: 0.04,
      }),
    );
    const lanternGlowMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffe4a8,
        emissive: 0xff9b32,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      }),
    );
    const lanternPositions: [number, number][] = [
      [-6.8, -5.2],
      [6.8, -5.2],
      [-7.9, 1.8],
      [7.9, 1.8],
    ];
    for (const [lx, lz] of lanternPositions) {
      const lantern = new THREE.Group();
      lantern.position.set(lx, -1.16, lz);
      const ped = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.56, 0.5, 6)), stoneMat);
      ped.position.y = 0.25;
      lantern.add(ped);
      const col = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.26, 1.5, 6)), stoneMat);
      col.position.y = 1.25;
      lantern.add(col);
      const fireBox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.48, 0.52, 0.48)), lanternGlowMat);
      fireBox.position.y = 2.25;
      lantern.add(fireBox);
      const roof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.75, 0.55, 6)), stoneMat);
      roof.position.y = 2.75;
      lantern.add(roof);
      group.add(lantern);
    }

    // Sculpted Composite Sakura Trees flanking the shrine
    const trunkMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x3b261d, roughness: 0.92 }),
    );
    const blossomMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf49bb4,
        roughness: 0.72,
        emissive: 0x4a1628,
        emissiveIntensity: 0.25,
      }),
    );
    const treeCoords: [number, number, number][] = [
      [-11.2, -7.4, 1.15],
      [11.0, -7.2, 1.22],
      [-13.5, -1.5, 0.95],
      [13.4, -1.8, 1.05],
      [-7.6, -15.5, 1.35],
      [8.2, -15.0, 1.28],
    ];
    for (const [tx, tz, sc] of treeCoords) {
      const tree = new THREE.Group();
      tree.position.set(tx, -1.16, tz);
      tree.scale.setScalar(sc);
      const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.28, 0.44, 3.8, 8)), trunkMat);
      trunk.position.y = 1.9;
      trunk.rotation.z = tx < 0 ? -0.14 : 0.14;
      tree.add(trunk);

      const canopyOffsets: [number, number, number, number][] = [
        [0, 4.1, 0, 1.9],
        [-1.25, 3.65, 0.55, 1.35],
        [1.2, 3.8, -0.45, 1.45],
        [0.15, 4.95, 0.2, 1.25],
      ];
      for (const [cx, cy, cz, r] of canopyOffsets) {
        const puff = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(r, 1)), blossomMat);
        puff.position.set(cx, cy, cz);
        puff.scale.set(1.25, 0.72, 1.15);
        tree.add(puff);
      }
      group.add(tree);
    }

    // Distant Layered Mountain Silhouettes around horizon
    const mountainMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x261a36,
        roughness: 0.95,
        metalness: 0.02,
      }),
    );
    for (let m = 0; m < 10; m++) {
      const angle = (m / 10) * Math.PI * 2;
      const dist = 42 + (m % 3) * 6;
      const h = 11 + (m % 4) * 4.5;
      const peak = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(14 + (m % 3) * 3, h, 7)), mountainMat);
      peak.position.set(Math.cos(angle) * dist, h * 0.42 - 2.0, Math.sin(angle) * dist);
      group.add(peak);
    }
  } else if (stageId === 'shibuya_rooftop') {
    // Rooftop perimeter steel railings & yellow caution posts
    const steelMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.38, metalness: 0.75 }),
    );
    const neonAmberMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.6,
        roughness: 0.25,
      }),
    );
    const neonCyanMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.8,
        roughness: 0.22,
      }),
    );

    // Lower rooftop deck slab
    const roofSlab = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(26, 2.2, 20)),
      trackMat(new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.85 })),
    );
    roofSlab.position.y = -2.25;
    group.add(roofSlab);

    // Corner rooftop beacon & antenna tower
    const tower = new THREE.Group();
    tower.position.set(-9.5, -1.15, -7.2);
    const mast = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.42, 11, 6)), steelMat);
    mast.position.y = 5.5;
    tower.add(mast);
    beaconMesh = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.32, 10, 10)), neonAmberMat);
    beaconMesh.position.y = 11.1;
    tower.add(beaconMesh);
    group.add(tower);

    // Surrounding Shibuya Twilight Skyscraper Ring
    const bldgMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x131b2c, roughness: 0.68, metalness: 0.35 }),
    );
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const radius = 26 + (i % 3) * 7;
      const bw = 5 + (i % 3) * 2.2;
      const bh = 18 + (i % 5) * 7;
      const bldg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(bw, bh, bw)), bldgMat);
      bldg.position.set(Math.cos(ang) * radius, bh * 0.38 - 10, Math.sin(ang) * radius);
      group.add(bldg);

      // Glowing rooftop accent trim bar
      const trim = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(bw * 0.9, 0.38, bw * 0.9)),
        i % 2 === 0 ? neonCyanMat : neonAmberMat,
      );
      trim.position.set(bldg.position.x, bldg.position.y + bh * 0.5 + 0.15, bldg.position.z);
      group.add(trim);
    }
  } else {
    // Okinawa Moonlit Ocean & Basalt Sea Stacks
    const waterMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0e3354,
        roughness: 0.18,
        metalness: 0.65,
      }),
    );
    oceanMesh = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(72, 36)), waterMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.y = -1.25;
    group.add(oceanMesh);

    // Heavy timber pier pilings descending into water
    const pilingMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x3a2e25, roughness: 0.9 }),
    );
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const piling = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.28, 0.32, 2.2, 10)),
        pilingMat,
      );
      piling.position.set(Math.cos(ang) * 7.2, -0.85, Math.sin(ang) * 7.2);
      group.add(piling);
    }

    // 4 Tiki Fire Braziers flanking the pier
    const flameMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xff6b21,
        emissiveIntensity: 2.6,
        roughness: 0.15,
      }),
    );
    const brazierPos: [number, number][] = [
      [-6.5, -4.6],
      [6.5, -4.6],
      [-7.2, 1.4],
      [7.2, 1.4],
    ];
    for (const [bx, bz] of brazierPos) {
      const post = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.18, 2.2, 8)), pilingMat);
      post.position.set(bx, 0.05, bz);
      group.add(post);
      const bowl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.42, 0.22, 0.35, 8)), rimMat);
      bowl.position.set(bx, 1.2, bz);
      group.add(bowl);
      const flame = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.28, 0.72, 7)), flameMat);
      flame.position.set(bx, 1.62, bz);
      group.add(flame);
      fireMeshes.push(flame);
    }

    // Coastal Basalt Sea Stacks around horizon
    const rockMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x1f2836, roughness: 0.88 }),
    );
    const rockCoords: [number, number, number, number][] = [
      [-15, -16, 4.5, 9],
      [16, -15, 5.2, 11],
      [-24, -4, 6.0, 8],
      [25, -6, 5.5, 9],
      [0, -24, 6.5, 13],
    ];
    for (const [rx, rz, rw, rh] of rockCoords) {
      const rock = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(rw, 1)), rockMat);
      rock.scale.set(1.1, rh / rw, 0.85);
      rock.position.set(rx, rh * 0.2 - 1.5, rz);
      group.add(rock);
    }
  }

  scene.add(group);

  const update = (dt: number, elapsed: number) => {
    // Animate ambient particles (Zero GC!)
    for (let i = 0; i < ambientCount; i++) {
      const s = ambientSeeds[i];
      if (stageId === 'kyoto_shrine') {
        s.y -= s.speed * dt * 0.85;
        s.x += Math.sin(elapsed * 1.4 + s.phase) * dt * 0.8;
        if (s.y < 0.05) s.y = 7.4;
      } else {
        s.y += s.speed * dt * 0.55;
        if (s.y > 8.0) s.y = 0.25;
      }
      _dummy.position.set(s.x, s.y, s.z);
      _dummy.rotation.set(elapsed + s.phase, elapsed * 1.3 + s.phase, s.phase);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      ambientParticles.setMatrixAt(i, _dummy.matrix);
    }
    ambientParticles.instanceMatrix.needsUpdate = true;

    if (oceanMesh) {
      oceanMesh.position.y = -1.25 + Math.sin(elapsed * 1.6) * 0.08;
    }
    if (beaconMesh) {
      const pulse = 1.0 + Math.sin(elapsed * 6) * 0.35;
      beaconMesh.scale.setScalar(pulse);
    }
    for (let i = 0; i < fireMeshes.length; i++) {
      const f = fireMeshes[i];
      f.scale.set(
        1 + Math.sin(elapsed * 14 + i) * 0.14,
        1 + Math.cos(elapsed * 18 + i * 2) * 0.22,
        1 + Math.sin(elapsed * 14 + i) * 0.14,
      );
    }
  };

  const dispose = () => {
    scene.remove(group);
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  };

  return { group, update, dispose };
}

// ZERO-GC POOLED 3D HIT SPARK & DUST PARTICLE SYSTEM
interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
}

export class CombatParticlePool {
  private readonly capacity = 160;
  private readonly mesh: THREE.InstancedMesh;
  private readonly slots: ParticleSlot[] = [];
  private readonly colorScratch = new THREE.Color();
  private cursor = 0;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.OctahedronGeometry(0.11, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.capacity);
    this.mesh.frustumCulled = false;

    for (let i = 0; i < this.capacity; i++) {
      this.slots.push({
        active: false,
        x: 0,
        y: -50,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.3,
        scale: 0,
      });
      _dummy.position.set(0, -50, 0);
      _dummy.scale.setScalar(0);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
      this.mesh.setColorAt(i, this.colorScratch.setHex(0xffffff));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    scene.add(this.mesh);
  }

  public spawnBurst(
    x: number,
    y: number,
    z: number,
    count: number,
    colorHex: string,
    speed: number,
    baseScale = 1.0,
  ): void {
    this.colorScratch.set(colorHex);
    for (let i = 0; i < count; i++) {
      const slot = this.slots[this.cursor];
      this.cursor = (this.cursor + 1) % this.capacity;

      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.35) * Math.PI;
      const spd = speed * (0.45 + Math.random() * 0.85);

      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.z = z;
      slot.vx = Math.cos(theta) * Math.cos(phi) * spd;
      slot.vy = Math.sin(phi) * spd + 1.6;
      slot.vz = Math.sin(theta) * Math.cos(phi) * spd;
      slot.life = 0;
      slot.maxLife = 0.22 + Math.random() * 0.24;
      slot.scale = baseScale * (0.65 + Math.random() * 0.85);

      this.mesh.setColorAt(this.cursor === 0 ? this.capacity - 1 : this.cursor - 1, this.colorScratch);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public update(dt: number): void {
    let anyChanged = false;
    for (let i = 0; i < this.capacity; i++) {
      const s = this.slots[i];
      if (!s.active) continue;
      anyChanged = true;
      s.life += dt;
      if (s.life >= s.maxLife) {
        s.active = false;
        _dummy.position.set(0, -50, 0);
        _dummy.scale.setScalar(0);
        _dummy.updateMatrix();
        this.mesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      s.vy -= 11.5 * dt;
      s.x += s.vx * dt;
      s.y = Math.max(0.04, s.y + s.vy * dt);
      s.z += s.vz * dt;
      const t = 1 - s.life / s.maxLife;
      _dummy.position.set(s.x, s.y, s.z);
      _dummy.rotation.set(s.life * 10, s.life * 8, 0);
      _dummy.scale.setScalar(s.scale * t);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
    }
    if (anyChanged) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

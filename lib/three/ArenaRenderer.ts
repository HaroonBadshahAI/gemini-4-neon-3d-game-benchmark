import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CharacterId, StageId } from '../game/characters';
import type { CombatEvent, MatchState } from '../game/combatEngine';
import { buildFighterRig, FighterRig, updateFighterPose } from './fighterRig';
import { createContactShadowTexture } from './proceduralTextures';
import { buildStageScene, CombatParticlePool, StageHandle } from './stageBuilder';

const _camTarget = new THREE.Vector3();
const _camDesiredPos = new THREE.Vector3();
const _camCurrentLook = new THREE.Vector3(0, 1.15, 0);

function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class ArenaRenderer {
  public readonly isSoftwareGl: boolean;
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly envTexture: THREE.Texture;
  private readonly contactShadowTex: THREE.CanvasTexture;
  private readonly particles: CombatParticlePool;
  private readonly resizeObserver: ResizeObserver;

  private stage: StageHandle | null = null;
  private currentStageId: StageId | null = null;
  private rigs: [FighterRig | null, FighterRig | null] = [null, null];

  private frameId = 0;
  private running = false;
  private lastNow = 0;
  private contextLost = false;
  private onTickCallback: ((dt: number) => { state: MatchState; events: CombatEvent[] }) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const rect = container.getBoundingClientRect();
    const width = Math.max(320, rect.width || window.innerWidth);
    const height = Math.max(240, rect.height || window.innerHeight);
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.dataset.testid = 'arena-webgl-canvas';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.2, 160);
    this.camera.position.set(0, 2.35, 7.2);
    this.camera.lookAt(0, 1.15, 0);

    // Mandatory procedural RoomEnvironment PBR reflection map on all devices
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmremGenerator.dispose();

    // Balanced 3-Point Warm/Cool Studio + Outdoor Lighting Rig (1 shadow caster)
    const hemi = new THREE.HemisphereLight(0x8bb8ff, 0x3a251d, 0.85);
    hemi.position.set(0, 30, 0);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffcb8c, 1.95);
    keyLight.position.set(6.5, 11.5, 7.5);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 32;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6ea8ff, 0.85);
    rimLight.position.set(-7, 6.5, -8.5);
    this.scene.add(rimLight);

    this.contactShadowTex = createContactShadowTexture();
    this.particles = new CombatParticlePool(this.scene);

    // Handle WebGL context loss safely
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored, false);

    // Responsive ResizeObserver
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
  };

  private handleContextRestored = () => {
    this.contextLost = false;
  };

  private handleResize(): void {
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(240, rect.width);
    const h = Math.max(200, rect.height);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  public syncSceneActors(
    stageId: StageId,
    p1Char: CharacterId,
    p2Char: CharacterId,
  ): void {
    if (this.currentStageId !== stageId) {
      if (this.stage) this.stage.dispose();
      this.stage = buildStageScene(
        stageId,
        this.scene,
        this.renderer.capabilities.getMaxAnisotropy(),
      );
      this.currentStageId = stageId;
    }

    const desiredChars: [CharacterId, CharacterId] = [p1Char, p2Char];
    for (let i = 0; i < 2; i++) {
      const existing = this.rigs[i];
      if (!existing || existing.characterId !== desiredChars[i]) {
        if (existing) {
          this.scene.remove(existing.root);
          existing.dispose();
        }
        const rig = buildFighterRig(desiredChars[i], this.contactShadowTex);
        this.scene.add(rig.root);
        this.rigs[i] = rig;
      }
    }

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  public start(
    onTick: (dt: number) => { state: MatchState; events: CombatEvent[] },
  ): void {
    this.onTickCallback = onTick;
    if (this.running) return;
    this.running = true;
    this.lastNow = performance.now();
    this.tick();
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (!this.running) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (status === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private emitVisualParticles(events: CombatEvent[]): void {
    for (const ev of events) {
      if (ev.type === 'hit') {
        this.particles.spawnBurst(ev.x, ev.y, ev.z, 12, ev.colorHex || '#fbbf24', 5.5, 0.9);
      } else if (ev.type === 'heavy_hit' || ev.type === 'ko') {
        this.particles.spawnBurst(
          ev.x,
          ev.y,
          ev.z,
          ev.type === 'ko' ? 28 : 20,
          ev.colorHex || '#f97316',
          ev.type === 'ko' ? 8.5 : 6.8,
          ev.type === 'ko' ? 1.45 : 1.15,
        );
      } else if (ev.type === 'block') {
        this.particles.spawnBurst(ev.x, ev.y, ev.z, 10, '#93c5fd', 4.4, 0.8);
      } else if (ev.type === 'special') {
        this.particles.spawnBurst(ev.x, ev.y, ev.z, 22, ev.colorHex || '#38bdf8', 7.2, 1.3);
      } else if (ev.type === 'land' || ev.type === 'dash') {
        this.particles.spawnBurst(ev.x, 0.08, ev.z, 6, '#d6c7b2', 2.4, 0.65);
      }
    }
  }

  private updateCamera(state: MatchState, dt: number): void {
    const [f1, f2] = state.fighters;
    const vFovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const aspect = Math.max(0.4, this.camera.aspect);
    const halfTanH = Math.tan(vFovRad * 0.5) * aspect;

    if (state.phase === 'title') {
      // Live World Camera Tour: smooth atmospheric orbital sweep framing fighters & Torii landmark
      const t = state.elapsedTime * 0.24;
      const titleZ = Math.max(7.6, 3.2 / halfTanH);
      _camDesiredPos.set(
        -0.8 + Math.sin(t) * 1.9,
        2.45 + Math.cos(t * 0.8) * 0.22,
        titleZ + Math.cos(t) * 0.55,
      );
      _camTarget.set(-0.55, 1.25, -0.5);
    } else {
      // Dynamic Tekken 3D fighting camera: guarantees full horizontal framing on both 16:9 desktop & 9:16 mobile
      const midX = (f1.x + f2.x) * 0.5;
      const midZ = (f1.z + f2.z) * 0.5;
      const sep = Math.abs(f1.x - f2.x);
      const requiredHalfWidth = Math.max(2.65, sep * 0.5 + 1.45);
      const minFitDist = requiredHalfWidth / halfTanH;
      const zoomDist = THREE.MathUtils.clamp(
        Math.max(5.8 + sep * 0.45, minFitDist),
        5.8,
        15.8,
      );

      const shake = state.cameraShake * state.cameraShake;
      const sx = shake > 0 ? (Math.random() - 0.5) * shake * 0.52 : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * shake * 0.36 : 0;

      // Subtle 3D orbit tilt based on fighter Z sidestep offset
      const zTiltOffset = (f1.z - f2.z) * 0.42;
      const yOffset = aspect < 0.85 ? 2.55 : 2.08;
      _camDesiredPos.set(midX + zTiltOffset + sx, yOffset + sep * 0.06 + sy, midZ + zoomDist);
      _camTarget.set(midX, 1.05 + Math.max(f1.y, f2.y) * 0.25, midZ);
    }

    const alpha = 1 - Math.exp(-8.5 * dt);
    this.camera.position.lerp(_camDesiredPos, alpha);
    _camCurrentLook.lerp(_camTarget, alpha);
    this.camera.lookAt(_camCurrentLook);
  }

  private tick = (): void => {
    if (!this.running) return;
    const now = performance.now();
    const rawDt = Math.max(0.001, (now - this.lastNow) / 1000);
    this.lastNow = now;
    // Cap total frame delta to 0.24s and sub-step at <= 0.04s so physics never tunnels AND
    // 1 real second equals 1 game second even on lower-fps software WebGL!
    const totalDt = Math.min(rawDt, 0.24);
    const subSteps = Math.max(1, Math.ceil(totalDt / 0.04));
    const stepDt = totalDt / subSteps;

    if (this.onTickCallback && !this.contextLost) {
      let latestState: MatchState | null = null;
      for (let s = 0; s < subSteps; s++) {
        const res = this.onTickCallback(stepDt);
        latestState = res.state;
        this.emitVisualParticles(res.events);
      }

      if (latestState) {
        this.syncSceneActors(
          latestState.stageId,
          latestState.fighters[0].characterId,
          latestState.fighters[1].characterId,
        );

        if (this.rigs[0]) {
          updateFighterPose(this.rigs[0], latestState.fighters[0], totalDt, latestState.elapsedTime);
        }
        if (this.rigs[1]) {
          updateFighterPose(this.rigs[1], latestState.fighters[1], totalDt, latestState.elapsedTime);
        }

        this.particles.update(totalDt);
        if (this.stage) this.stage.update(totalDt, latestState.elapsedTime);
        this.updateCamera(latestState, totalDt);

        this.renderer.render(this.scene, this.camera);
      }
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.running = false;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    if (this.stage) this.stage.dispose();
    for (const rig of this.rigs) {
      if (rig) {
        this.scene.remove(rig.root);
        rig.dispose();
      }
    }
    this.particles.dispose(this.scene);
    this.contactShadowTex.dispose();
    this.envTexture.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

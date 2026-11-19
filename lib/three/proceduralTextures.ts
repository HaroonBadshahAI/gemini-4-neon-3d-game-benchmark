import * as THREE from 'three';
import type { StageId } from '../game/characters';

export interface FloorTextureBundle {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

export function createDojoFloorTextures(
  stageId: StageId,
  maxAnisotropy: number,
): FloorTextureBundle {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  if (stageId === 'kyoto_shrine') {
    // Aged cedar dojo planks with inlaid combat ring
    ctx.fillStyle = '#5c3c28';
    ctx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    const plankCount = 16;
    const plankH = size / plankCount;
    for (let i = 0; i < plankCount; i++) {
      const y = i * plankH;
      const shade = ((i * 37) % 19) - 9;
      ctx.fillStyle = `rgb(${94 + shade}, ${61 + Math.round(shade * 0.7)}, ${40 + Math.round(shade * 0.5)})`;
      ctx.fillRect(0, y + 1, size, plankH - 2);

      // Wood grain streaks
      ctx.fillStyle = 'rgba(38, 22, 12, 0.22)';
      bCtx.fillStyle = 'rgba(100, 100, 100, 0.45)';
      for (let g = 0; g < 6; g++) {
        const gy = y + 3 + ((g * 5.3 + i * 2) % (plankH - 5));
        ctx.fillRect(0, gy, size, 1.5);
        bCtx.fillRect(0, gy, size, 1.5);
      }

      // Plank groove seam
      ctx.fillStyle = '#2a180d';
      ctx.fillRect(0, y, size, 2);
      bCtx.fillStyle = '#202020';
      bCtx.fillRect(0, y, size, 2);

      // Vertical plank joints staggered
      const jointX = ((i * 173 + 90) % (size - 80)) + 40;
      ctx.fillRect(jointX, y, 2, plankH);
      bCtx.fillRect(jointX, y, 2, plankH);
    }

    // Traditional vermilion & gold martial octagon ring emblem
    const cx = size / 2;
    const cy = size / 2;
    ctx.strokeStyle = 'rgba(212, 152, 62, 0.78)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 185, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(185, 48, 36, 0.72)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 165, 0, Math.PI * 2);
    ctx.stroke();

    // Center dojo crest geometry
    ctx.strokeStyle = 'rgba(235, 190, 105, 0.52)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 88, cy);
    ctx.lineTo(cx + 88, cy);
    ctx.moveTo(cx, cy - 88);
    ctx.lineTo(cx, cy + 88);
    ctx.stroke();
  } else if (stageId === 'shibuya_rooftop') {
    // Twilight concrete helipad deck
    ctx.fillStyle = '#333b48';
    ctx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    // Subtle concrete aggregate noise
    for (let i = 0; i < 2400; i++) {
      const x = (i * 97) % size;
      const y = (i * 193) % size;
      const v = 42 + (i % 24);
      ctx.fillStyle = `rgb(${v}, ${v + 6}, ${v + 15})`;
      ctx.fillRect(x, y, 3, 3);
      const bv = 105 + (i % 45);
      bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bCtx.fillRect(x, y, 2, 2);
    }

    // Concrete slab expansion joints
    ctx.strokeStyle = '#1e2430';
    ctx.lineWidth = 3;
    bCtx.strokeStyle = '#353535';
    bCtx.lineWidth = 3;
    for (let p = 128; p < size; p += 128) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(p, 0);
      bCtx.lineTo(p, size);
      bCtx.moveTo(0, p);
      bCtx.lineTo(size, p);
      bCtx.stroke();
    }

    // Yellow helipad ring & bold 'H'
    const cx = size / 2;
    const cy = size / 2;
    ctx.strokeStyle = 'rgba(245, 184, 46, 0.85)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 178, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(245, 184, 46, 0.82)';
    ctx.fillRect(cx - 58, cy - 72, 22, 144);
    ctx.fillRect(cx + 36, cy - 72, 22, 144);
    ctx.fillRect(cx - 58, cy - 11, 116, 22);
  } else {
    // Okinawa moonlit timber pier with woven tatami battle mat
    ctx.fillStyle = '#47433c';
    ctx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#7e7e7e';
    bCtx.fillRect(0, 0, size, size);

    const plankCount = 14;
    const plankW = size / plankCount;
    for (let i = 0; i < plankCount; i++) {
      const x = i * plankW;
      const shade = ((i * 29) % 15) - 7;
      ctx.fillStyle = `rgb(${78 + shade}, ${72 + shade}, ${64 + shade})`;
      ctx.fillRect(x + 2, 0, plankW - 3, size);
      ctx.fillStyle = '#211f1c';
      ctx.fillRect(x, 0, 2, size);
      bCtx.fillStyle = '#2a2a2a';
      bCtx.fillRect(x, 0, 2, size);
    }

    // Woven center combat mat
    ctx.fillStyle = 'rgba(138, 128, 92, 0.85)';
    ctx.fillRect(96, 96, size - 192, size - 192);
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 10;
    ctx.strokeRect(96, 96, size - 192, size - 192);

    // Subtle weave lines
    ctx.fillStyle = 'rgba(65, 60, 42, 0.22)';
    for (let y = 104; y < size - 104; y += 6) {
      ctx.fillRect(102, y, size - 204, 2);
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(8, maxAnisotropy);
  map.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.anisotropy = Math.min(8, maxAnisotropy);
  bumpMap.needsUpdate = true;

  return { map, bumpMap };
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    6,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createSkyDomeTexture(stageId: StageId): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (stageId === 'kyoto_shrine') {
    grad.addColorStop(0.0, '#120d26');
    grad.addColorStop(0.35, '#3b1f3b');
    grad.addColorStop(0.62, '#a33c34');
    grad.addColorStop(0.78, '#e67e3e');
    grad.addColorStop(1.0, '#3b2234');
  } else if (stageId === 'shibuya_rooftop') {
    grad.addColorStop(0.0, '#070c18');
    grad.addColorStop(0.42, '#14213d');
    grad.addColorStop(0.72, '#2d4b7a');
    grad.addColorStop(0.84, '#5e6b92');
    grad.addColorStop(1.0, '#17243d');
  } else {
    grad.addColorStop(0.0, '#040a16');
    grad.addColorStop(0.45, '#0c1f3a');
    grad.addColorStop(0.76, '#1f496e');
    grad.addColorStop(1.0, '#0f243a');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle stars in upper sky dome
  ctx.fillStyle = 'rgba(255, 248, 232, 0.65)';
  for (let i = 0; i < 110; i++) {
    const sx = (i * 197 + 23) % w;
    const sy = (i * 53 + 11) % Math.floor(h * 0.42);
    const r = i % 5 === 0 ? 1.4 : 0.9;
    ctx.fillRect(sx, sy, r, r);
  }

  // Sun or Moon celestial disc near horizon
  if (stageId === 'kyoto_shrine') {
    const sunGrad = ctx.createRadialGradient(w * 0.5, h * 0.68, 4, w * 0.5, h * 0.68, 56);
    sunGrad.addColorStop(0, 'rgba(255, 238, 185, 0.95)');
    sunGrad.addColorStop(0.35, 'rgba(255, 152, 74, 0.55)');
    sunGrad.addColorStop(1, 'rgba(255, 110, 50, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);
  } else if (stageId === 'okinawa_beach') {
    const moonGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 4, w * 0.5, h * 0.48, 46);
    moonGrad.addColorStop(0, 'rgba(235, 248, 255, 0.98)');
    moonGrad.addColorStop(0.3, 'rgba(147, 210, 255, 0.42)');
    moonGrad.addColorStop(1, 'rgba(56, 130, 196, 0)');
    ctx.fillStyle = moonGrad;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

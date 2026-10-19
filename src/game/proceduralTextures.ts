import * as THREE from 'three';

/**
 * Procedural texture generators using HTML5 Canvas.
 * 100% self-contained, no external asset dependencies.
 */

// Procedural bloodshot monster eye texture
export function createEyeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Sclera base (yellowish bloodshot white)
  const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
  grad.addColorStop(0, '#fef9c3');
  grad.addColorStop(0.6, '#fde047');
  grad.addColorStop(0.85, '#fee2e2');
  grad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Bloodshot veins
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    let x = 256 + Math.cos(angle) * 80;
    let y = 256 + Math.sin(angle) * 80;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = 8 + Math.floor(Math.random() * 8);
    for (let s = 0; s < steps; s++) {
      const stepAngle = angle + (Math.random() - 0.5) * 0.8;
      const r = 80 + (s / steps) * 160;
      x = 256 + Math.cos(stepAngle) * r;
      y = 256 + Math.sin(stepAngle) * r;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Iris (amber orange with dark striations)
  const irisGrad = ctx.createRadialGradient(256, 256, 10, 256, 256, 110);
  irisGrad.addColorStop(0, '#ea580c');
  irisGrad.addColorStop(0.4, '#f97316');
  irisGrad.addColorStop(0.8, '#b45309');
  irisGrad.addColorStop(1, '#451a03');

  ctx.beginPath();
  ctx.arc(256, 256, 110, 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();

  // Iris fibers
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  for (let a = 0; a < 60; a++) {
    const angle = (a / 60) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(angle) * 25, 256 + Math.sin(angle) * 25);
    ctx.lineTo(256 + Math.cos(angle) * 105, 256 + Math.sin(angle) * 105);
    ctx.stroke();
  }

  // Slit pupil (predator / reptile style)
  ctx.fillStyle = '#050505';
  ctx.beginPath();
  ctx.ellipse(256, 256, 20, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  // Specular light glint
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.ellipse(280, 220, 16, 10, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural sci-fi metal laboratory wall texture
export function createLabWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base metallic panel
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  // Panel borders and bevels
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 504);

  // Sub-panels
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 226, 226);
  ctx.strokeRect(266, 20, 226, 226);
  ctx.strokeRect(20, 266, 226, 226);
  ctx.strokeRect(266, 266, 226, 226);

  // Industrial hazard stripes in bottom
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 470, 512, 42);
  ctx.clip();
  for (let x = -50; x < 600; x += 30) {
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(x, 470);
    ctx.lineTo(x + 16, 470);
    ctx.lineTo(x - 4, 512);
    ctx.lineTo(x - 20, 512);
    ctx.fill();
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(x + 16, 470);
    ctx.lineTo(x + 30, 470);
    ctx.lineTo(x + 10, 512);
    ctx.lineTo(x - 4, 512);
    ctx.fill();
  }
  ctx.restore();

  // Rivets / Bolts
  ctx.fillStyle = '#64748b';
  const boltPositions = [
    [10, 10], [502, 10], [10, 502], [502, 502],
    [256, 10], [256, 502], [10, 256], [502, 256]
  ];
  boltPositions.forEach(([bx, by]) => {
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Stains / Grunge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
  for (let i = 0; i < 30; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const rw = 20 + Math.random() * 60;
    const rh = 10 + Math.random() * 30;
    ctx.fillRect(rx, ry, rw, rh);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural metal floor grating
export function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 256);

  // Grid tiles
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 256, 256);

  // Perforated grating dots
  ctx.fillStyle = '#020617';
  for (let x = 16; x < 256; x += 32) {
    for (let y = 16; y < 256; y += 32) {
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cyan safety runic markings
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, 196, 196);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural element symbol texture (H, O, Cl, C, N, S)
export function createElementTexture(symbol: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Outer glowing ring
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 110, 0, Math.PI * 2);
  ctx.stroke();

  // Glass disc background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.arc(128, 128, 105, 0, Math.PI * 2);
  ctx.fill();

  // Symbol text
  ctx.font = 'bold 100px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fillText(symbol, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

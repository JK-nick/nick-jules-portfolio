/* ══════════════════════════════════════════════════════════
   TRON TEST — tron-test.js
   Phase 3: Static canvas + grid + beautiful bike + auto movement + trail
══════════════════════════════════════════════════════════ */

const canvas  = document.getElementById('c');
const ctx     = canvas.getContext('2d');
const phaseEl = document.getElementById('phase');
const fpsEl   = document.getElementById('fps');

/* ── Canvas sizing ─────────────────────────────────────── */
let W, H;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', () => { resize(); });

/* ══════════════════════════════════════════════════════════
   PHASE 1 — Background: dark field + purple grid
══════════════════════════════════════════════════════════ */
function drawBackground() {
  /* Solid dark base */
  ctx.fillStyle = '#07060f';
  ctx.fillRect(0, 0, W, H);

  /* Grid lines */
  const GRID = 60;
  ctx.save();
  ctx.strokeStyle = 'rgba(124, 92, 252, 0.07)';
  ctx.lineWidth   = 1;

  for (let x = 0; x <= W; x += GRID) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += GRID) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  /* Subtle radial glow at center */
  const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.65);
  grad.addColorStop(0,   'rgba(124, 92, 252, 0.06)');
  grad.addColorStop(0.5, 'rgba(124, 92, 252, 0.02)');
  grad.addColorStop(1,   'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

/* ══════════════════════════════════════════════════════════
   PHASE 2 — Static bike shape
   Draw at (cx, cy) facing angle (radians, 0 = right)
══════════════════════════════════════════════════════════ */
function drawBike(cx, cy, angle, glow) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  /* ── Outer glow pass ── */
  ctx.shadowColor = '#a07dff';
  ctx.shadowBlur  = 28 + glow * 18;

  /* ── Body — sleek horizontal slab ── */
  ctx.fillStyle = '#c8a8ff';
  ctx.beginPath();
  ctx.roundRect(-26, -5, 52, 11, 4);
  ctx.fill();

  /* ── Cockpit — angled wedge on top ── */
  ctx.fillStyle = '#e0d0ff';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(-4, -5);
  ctx.lineTo(14, -5);
  ctx.lineTo(10, -11);
  ctx.lineTo(-2, -11);
  ctx.closePath();
  ctx.fill();

  /* ── Cockpit glint — tiny bright stripe ── */
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.roundRect(0, -10, 8, 2, 1);
  ctx.fill();

  /* ── Front wheel ── */
  ctx.strokeStyle = '#c8a8ff';
  ctx.lineWidth   = 3;
  ctx.shadowColor = '#a07dff';
  ctx.shadowBlur  = 16 + glow * 10;
  ctx.beginPath();
  ctx.arc(18, 8, 9, 0, Math.PI * 2);
  ctx.stroke();

  /* Wheel inner rim dot */
  ctx.fillStyle = 'rgba(200, 168, 255, 0.5)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(18, 8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  /* ── Rear wheel ── */
  ctx.strokeStyle = '#c8a8ff';
  ctx.lineWidth   = 3;
  ctx.shadowBlur  = 16 + glow * 10;
  ctx.beginPath();
  ctx.arc(-18, 8, 9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(200, 168, 255, 0.5)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(-18, 8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  /* ── Engine glow strip — bottom edge ── */
  const engineGrad = ctx.createLinearGradient(-26, 6, 26, 6);
  engineGrad.addColorStop(0,   'transparent');
  engineGrad.addColorStop(0.3, 'rgba(124, 92, 252, 0.9)');
  engineGrad.addColorStop(0.7, 'rgba(160, 125, 255, 0.9)');
  engineGrad.addColorStop(1,   'transparent');
  ctx.fillStyle  = engineGrad;
  ctx.shadowColor = '#7c5cfc';
  ctx.shadowBlur  = 12;
  ctx.fillRect(-24, 5, 48, 2);

  ctx.restore();
}

/* ══════════════════════════════════════════════════════════
   PHASE 4 — Trail (stored positions, fading behind bike)
══════════════════════════════════════════════════════════ */
const TRAIL_MAX = 160;
const trail = [];

function addTrailPoint(x, y) {
  trail.push({ x, y });
  if (trail.length > TRAIL_MAX) trail.shift();
}

function drawTrail() {
  if (trail.length < 2) return;
  ctx.save();
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < trail.length; i++) {
    const age   = i / trail.length;           /* 0=oldest  1=newest */
    const alpha = age * age * 0.85;           /* quadratic fade */
    const width = 1 + age * 3.5;

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `hsl(270, 80%, ${55 + age * 20}%)`;
    ctx.lineWidth   = width;
    ctx.shadowColor = '#a07dff';
    ctx.shadowBlur  = 6 + age * 14;

    ctx.beginPath();
    ctx.moveTo(trail[i-1].x, trail[i-1].y);
    ctx.lineTo(trail[i].x,   trail[i].y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ══════════════════════════════════════════════════════════
   PHASE 3 — Auto movement state
   Bike rides a gentle sine wave across the screen,
   wraps when it exits right edge.
══════════════════════════════════════════════════════════ */
const bike = {
  x:     -60,
  y:     0,        /* set to H/2 on first frame */
  vx:    3.2,      /* px per frame */
  angle: 0,
  phase: 0,        /* sine wave phase */
  init:  false,
};

function updateBike(dt) {
  if (!bike.init) {
    bike.y    = H * 0.5;
    bike.init = true;
  }

  /* Advance horizontal position */
  bike.x += bike.vx * dt;

  /* Sine wave vertical drift */
  bike.phase += 0.032 * dt;
  const targetY = H * 0.5 + Math.sin(bike.phase) * (H * 0.18);
  const dy      = targetY - bike.y;
  bike.y       += dy * 0.08 * dt;

  /* Angle = direction of travel */
  bike.angle = Math.atan2(dy * 0.08, bike.vx) * 0.6;

  /* Wrap: exit right → re-enter from left */
  if (bike.x > W + 80) {
    bike.x    = -80;
    bike.y    = H * 0.5;
    bike.phase = 0;
    trail.length = 0;   /* clear trail on wrap */
  }

  addTrailPoint(bike.x, bike.y);
}

/* ══════════════════════════════════════════════════════════
   MAIN LOOP
══════════════════════════════════════════════════════════ */
let lastTs   = 0;
let frameCount = 0;
let fpsTimer   = 0;
let displayFps = 0;

function tick(ts) {
  requestAnimationFrame(tick);

  const raw = ts - lastTs;
  lastTs    = ts;
  const dt  = Math.min(raw / 16.667, 3); /* normalised, cap at 3× */

  /* FPS counter */
  frameCount++;
  fpsTimer += raw;
  if (fpsTimer >= 500) {
    displayFps = Math.round(frameCount / (fpsTimer / 1000));
    frameCount = 0;
    fpsTimer   = 0;
    fpsEl.textContent = displayFps + ' fps';
  }

  /* ── Draw ── */
  drawBackground();
  updateBike(dt);
  drawTrail();
  drawBike(bike.x, bike.y, bike.angle, 0.5);
}

requestAnimationFrame(tick);

/**
 * Fold progress → nested Z panel angles.
 * End pose locked from ?debug=1 tune on the React stage.
 */

export const FOLD_END = {
  top: 20,
  mid: 103,
  bot: -111,
  viewTip: -1,
};

export const FOLD_END_DEFAULTS = { ...FOLD_END };

export function setFoldEnd(partial) {
  Object.assign(FOLD_END, partial);
}

export function resetFoldEnd() {
  Object.assign(FOLD_END, FOLD_END_DEFAULTS);
}

export const SNAP_OPEN_THRESHOLD = 0.55;
export const SCROLL_GAIN = 0.00115;
export const SCROLL_IDLE_MS = 280;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function easeInOut(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function sequential(t, delay, span = 0.68) {
  return easeInOut((t - delay) / span);
}

export function panelAngles(foldProgress) {
  const t = clamp(foldProgress, 0, 1);
  if (t === 0) return { top: 0, mid: 0, bot: 0 };

  const botS = sequential(t, 0, 0.68);
  const midS = sequential(t, 0.16, 0.68);
  const topS = sequential(t, 0.32, 0.68);

  return {
    top: FOLD_END.top * topS,
    mid: FOLD_END.mid * midS,
    bot: FOLD_END.bot * botS,
  };
}

export function creaseAmount(foldProgress) {
  const a = panelAngles(foldProgress);
  const mag = Math.abs(a.top) + Math.abs(a.mid) + Math.abs(a.bot);
  return Math.min(1, mag / 200);
}

/** Face shade overlays (0..~0.22). Plain rgba — no blend on 3D ancestors. */
export function panelShadeFromAngles(angles) {
  return {
    top: Math.min(0.08, Math.abs(angles.top) / 500),
    mid: Math.min(0.2, Math.abs(angles.mid) / 400),
    bot: Math.min(0.1, Math.abs(angles.bot) / 480),
  };
}

export function panelShade(foldProgress) {
  return panelShadeFromAngles(panelAngles(foldProgress));
}

export function shouldSnapOpen(foldProgress) {
  return foldProgress >= SNAP_OPEN_THRESHOLD;
}

export function applyLag(current, target, alpha) {
  const a = clamp(alpha, 0, 1);
  return current + (target - current) * a;
}

/** Smooth cursor proximity — no step jumps at the card edge. */
export function cursorCardWeight(nx, ny, opts = {}) {
  const inner = opts.inner ?? 0.9;
  const outer = opts.outer ?? 1.32;
  const floor = opts.floor ?? 0.24;
  const dist = Math.max(Math.abs(nx), Math.abs(ny));
  if (dist <= inner) return 1;
  if (dist >= outer) return floor;
  const t = (dist - inner) / (outer - inner);
  const s = t * t * (3 - 2 * t);
  return 1 + (floor - 1) * s;
}

/** Click-flip: lift toward viewer, scale up, then rotateY to back. */
export const FLIP = {
  ms: 900,
  /** Peak extra Z (px) at mid-flip — reads as picking the card up. */
  liftZ: 140,
  /** Peak scale boost at mid-flip (1 + this). */
  scaleBoost: 0.14,
  /** Rotation ease-in/out window on 0..1 progress. */
  rotateStart: 0.12,
  rotateEnd: 0.88,
};

export const FLIP_DEFAULTS = { ...FLIP };

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** 0 = front flat, 1 = back flat. Lift peaks at 0.5. */
export function flipMotion(progress) {
  const p = clamp(progress, 0, 1);
  const lift = Math.sin(Math.PI * p);
  const rotP = smoothstep(FLIP.rotateStart, FLIP.rotateEnd, p);
  return {
    lift,
    liftZ: lift * FLIP.liftZ,
    scale: 1 + lift * FLIP.scaleBoost,
    rotateY: rotP * 180,
  };
}

/** Table-shadow footprint while flipping — avoids flanking plates at edge-on. */
export function flipShadowFootprint(progress) {
  const { lift, rotateY } = flipMotion(progress);
  const edge = Math.abs(Math.cos((rotateY * Math.PI) / 180));
  return {
    width: Math.max(0.06, edge),
    height: 0.35 + edge * 0.65,
    hide: lift,
    opacity: 1 - lift * 0.92,
  };
}

export function flipRotateY(progress) {
  return flipMotion(progress).rotateY;
}

export function setFlip(partial) {
  Object.assign(FLIP, partial);
}

export function resetFlip() {
  Object.assign(FLIP, FLIP_DEFAULTS);
}

/** Per-frame lag so a flip settles in `ms` (frame-rate independent). */
export function flipLagAlpha(ms = FLIP.ms, dtMs = 1000 / 60) {
  const t = clamp(Number(ms) || FLIP_DEFAULTS.ms, 120, 2400);
  const dt = Math.max(8, Number(dtMs) || 1000 / 60);
  return 1 - Math.pow(0.05, dt / t);
}

/** Cursor lean on at rest (front or back); off while folding or mid-flip. */
export function shouldEnableCursorLean(
  { foldDisplay, flipTarget, flipDisplay, foldPhase },
  opts = {},
) {
  const foldEps = opts.foldEps ?? 0.04;
  const flipEps = opts.flipEps ?? 0.02;
  if (foldPhase !== "idle") return false;
  if (foldDisplay > foldEps) return false;
  if (Math.abs(flipDisplay - flipTarget) > flipEps) return false;
  return true;
}

/**
 * Wheel on the back starts a return flip; fold waits until the front is settled.
 * @returns {{ kind: "flip-to-front" | "defer-fold" | "fold", flipTarget?: number, stashDelta: number }}
 */
export function resolveScrollOnCard({ flipTarget, flipDisplay, delta }, opts = {}) {
  const backThreshold = opts.backThreshold ?? 0.5;
  const flipEps = opts.flipEps ?? 0.02;
  const onBack = flipTarget > backThreshold && flipDisplay > backThreshold;
  const flipAnimating = Math.abs(flipDisplay - flipTarget) > flipEps;

  if (onBack) {
    if (Math.abs(delta) < 1e-6) return { kind: "fold", stashDelta: 0 };
    return { kind: "flip-to-front", flipTarget: 0, stashDelta: delta };
  }
  if (flipAnimating) {
    return { kind: "defer-fold", stashDelta: delta };
  }
  return { kind: "fold", stashDelta: 0 };
}

/** Locked opening tune from :4173 ?debug=1 (2026-09-01). */
export const HATCH_OPENING = {
  topPullPct: 0,
  heightScale: 1.5,
  extendBottomPct: 0.4,
  layerZ: 80,
  wellOpacity: 1,
};

export const HATCH_OPENING_DEFAULTS = { ...HATCH_OPENING };

export function setHatchOpening(partial) {
  Object.assign(HATCH_OPENING, partial);
}

export function resetHatchOpening() {
  Object.assign(HATCH_OPENING, HATCH_OPENING_DEFAULTS);
}

/** Crop of the looping clip inside the hatch well (lab: Y + zoom + format). */
export const HATCH_VIDEO_FORMATS = {
  mov: {
    id: "mov",
    label: "MOV · H.264",
    src: "assets/IMG_6909.MOV",
    type: "video/mp4",
  },
  mp4: {
    id: "mp4",
    label: "MP4 · H.264",
    src: "assets/hatch/IMG_6909.mp4",
    type: "video/mp4",
  },
  webm: {
    id: "webm",
    label: "WebM · VP9",
    src: "assets/hatch/IMG_6909.webm",
    type: "video/webm",
  },
};

export const HATCH_VIDEO = {
  offsetY: 50,
  zoom: 1,
  format: "webm",
  vignette: 0.85,
  vignetteSoft: 32,
  vignetteSize: 1.3,
};

export const HATCH_VIDEO_DEFAULTS = { ...HATCH_VIDEO };

export function setHatchVideo(partial) {
  Object.assign(HATCH_VIDEO, partial);
}

export function resetHatchVideo() {
  Object.assign(HATCH_VIDEO, HATCH_VIDEO_DEFAULTS);
}

export function hatchVideoSource(format = HATCH_VIDEO.format) {
  return HATCH_VIDEO_FORMATS[format] ?? HATCH_VIDEO_FORMATS[HATCH_VIDEO_DEFAULTS.format];
}

export function formatByteSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "—";
  const mb = n / (1024 * 1024);
  if (mb >= 0.1) return `${mb.toFixed(2)} MB`;
  const kb = n / 1024;
  if (kb >= 1) return `${kb.toFixed(1)} KB`;
  return `${Math.round(n)} B`;
}

export function hatchVideoVars(video = HATCH_VIDEO) {
  const offsetY = clamp(Number(video.offsetY) || 0, 0, 100);
  const zoom = clamp(Number(video.zoom) || 1, 0.5, 4);
  const vignette = clamp(Number(video.vignette) || 0, 0, 1);
  const vignetteSoft = clamp(Number(video.vignetteSoft) || 0, 0, 80);
  const sizeRaw = Number(video.vignetteSize);
  const vignetteSize = clamp(Number.isFinite(sizeRaw) ? sizeRaw : 1, 0.4, 2.5);
  return {
    "--hatch-video-y": `${offsetY}%`,
    "--hatch-video-zoom": String(zoom),
    "--hatch-vignette": String(vignette),
    "--hatch-vignette-soft": `${vignetteSoft}%`,
    "--hatch-vignette-size": String(vignetteSize),
  };
}

/** Vignette box = the uncovered slit below the folded card, not the full well. */
export function hatchApertureVars(peel = { topPct: 0, shiftPct: 1 }) {
  const topPct = clamp(Number(peel.topPct) || 0, 0, 1);
  const shiftRaw = Number(peel.shiftPct);
  const shiftPct = clamp(Number.isFinite(shiftRaw) ? shiftRaw : 1, 0, 1);
  const stackTop = clamp(Number(peel.stackTopPct) || 0, 0, 1);
  const stackHRaw = Number(peel.stackHeightPct);
  const stackH = clamp(Number.isFinite(stackHRaw) ? stackHRaw : 1, 0, 1);
  const cardBottom = Math.min(1, stackTop + stackH);
  const apertureTop = Math.max(topPct, 1 - shiftPct, cardBottom);
  return {
    "--hatch-aperture-top": `${+(apertureTop * 100).toFixed(4)}%`,
    "--hatch-aperture-height": `${+((1 - apertureTop) * 100).toFixed(4)}%`,
  };
}

export const SURFACE_PEEL = { shiftPct: 1 };

const THIRD = 1 / 3;
const DEG = Math.PI / 180;

function hatchSilhouetteFromAngles(angles) {
  const topSpan = THIRD * Math.abs(Math.cos(angles.top * DEG));
  const midSpan = THIRD * Math.abs(Math.cos(angles.mid * DEG));
  const botSpan = THIRD * Math.abs(Math.cos(angles.bot * DEG));
  const heightPct = Math.min(
    1,
    Math.max(THIRD * 0.9, topSpan + midSpan + botSpan),
  );
  const botBottom = 2 * THIRD + THIRD * Math.cos(angles.bot * DEG);
  const topPct = Math.max(0, Math.min(1 - heightPct, botBottom - heightPct));
  return { heightPct, topPct };
}

function hatchOpeningFromAngles(angles) {
  const stack = hatchSilhouetteFromAngles(angles);
  return {
    topPct: stack.topPct,
    heightPct: 1 - stack.topPct,
    stackTopPct: stack.topPct,
    stackHeightPct: stack.heightPct,
  };
}

function foldOpening(foldProgress) {
  const t = clamp(foldProgress, 0, 1);
  if (t === 0) {
    return { topPct: 1, heightPct: 0, stackTopPct: 0, stackHeightPct: 1 };
  }
  return hatchOpeningFromAngles(panelAngles(t));
}

/** Opening slot behind the card — reveal line, cover slide, full card width. */
export function surfacePeel(foldProgress) {
  const t = clamp(foldProgress, 0, 1);
  if (t === 0) {
    return {
      shiftPct: 0,
      rotateX: 0,
      heightPct: 0,
      topPct: 1,
      stackTopPct: 0,
      stackHeightPct: 1,
    };
  }
  const { heightPct, topPct, stackTopPct, stackHeightPct } = foldOpening(t);
  const s = sequential(t, 0, 0.68);
  return {
    shiftPct: SURFACE_PEEL.shiftPct * s,
    rotateX: 0,
    heightPct,
    topPct,
    stackTopPct,
    stackHeightPct,
  };
}

function extendOpeningDown(topPct, heightPct, extendBottomPct) {
  const maxH = 1 - topPct;
  return Math.min(maxH, heightPct + Math.max(0, extendBottomPct));
}

function applyHatchOpening(computed, hatch = HATCH_OPENING) {
  const topPct = Math.max(0, computed.topPct - hatch.topPullPct);
  let heightPct = Math.min(
    1 - topPct,
    computed.heightPct * hatch.heightScale,
  );
  heightPct = extendOpeningDown(topPct, heightPct, hatch.extendBottomPct);
  return { ...computed, topPct, heightPct };
}

/** Fold progress → opening geometry with locked visitor tune applied. */
export function resolveOpeningPeel(foldProgress) {
  return applyHatchOpening(surfacePeel(foldProgress));
}

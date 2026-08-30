/** Pull / snap / Z-fold / enter math. No DOM. */

export const SNAP_OPEN_THRESHOLD = 0.55;
export const ZOOM_START = 0.55;

export const WORLD_SCALE_REST = 0.92;
export const WORLD_SCALE_ENTER = 1.35;

export type FoldPhase =
  | "idle"
  | "hover"
  | "dragging"
  | "returning"
  | "opening"
  | "open"
  | "entering"
  | "entered";

export type CardPose = {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
};

export type PanelAngles = {
  top: number;
  mid: number;
  bot: number;
};

export function foldProgressFromDelta(deltaY: number, maxPullPx: number): number {
  if (!(maxPullPx > 0)) return 0;
  const up = Math.max(0, -deltaY);
  return Math.min(1, up / maxPullPx);
}

export function applyLag(current: number, target: number, alpha: number): number {
  const a = Math.min(1, Math.max(0, alpha));
  return current + (target - current) * a;
}

/**
 * Mild end resistance — still reachable to 1 with a normal upward drag.
 */
export function dampFoldDelta(deltaUpPx: number, currentFold: number): number {
  const p = Math.min(1, Math.max(0, currentFold));
  if (p <= 0.85) return deltaUpPx;
  const t = (p - 0.85) / 0.15;
  const factor = 1 - t * 0.35; // floor ~0.65
  return deltaUpPx * Math.max(0.65, factor);
}

export function shouldSnapOpen(foldProgress: number): boolean {
  return foldProgress >= SNAP_OPEN_THRESHOLD;
}

export function alignPose(
  foldProgress: number,
  pose: CardPose,
  step = 1,
): CardPose {
  const p = Math.min(1, Math.max(0, foldProgress));
  const strength = 0.12 + p * 0.72;
  const a = Math.min(1, strength * Math.max(0, step));
  return {
    rotateX: pose.rotateX + (0 - pose.rotateX) * a,
    rotateY: pose.rotateY + (0 - pose.rotateY) * a,
    rotateZ: pose.rotateZ + (0 - pose.rotateZ) * a,
  };
}

export function clampPose(pose: CardPose): CardPose {
  const lim = 8;
  return {
    rotateX: Math.max(-lim, Math.min(lim, pose.rotateX)),
    rotateY: Math.max(-lim, Math.min(lim, pose.rotateY)),
    rotateZ: Math.max(-4, Math.min(4, pose.rotateZ)),
  };
}

function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Stagger 0..1 so the fold ripples from the tab (bot) upward. */
function sequential(t: number, delay: number, span = 0.72): number {
  return easeInOut((t - delay) / span);
}

/** End-state peaks (fold = 1) — tuned via ?debug=1. */
export const FOLD_END = {
  top: 20,
  mid: 103,
  bot: -111,
  viewTip: -1,
} as const;

/**
 * Nested Z-fold — sequential upward (bot → mid → top).
 * 0 = flat closed; 1 = held end pose (FOLD_END).
 */
export function panelAngles(foldProgress: number): PanelAngles {
  const t = Math.min(1, Math.max(0, foldProgress));
  if (t === 0) return { top: 0, mid: 0, bot: 0 };

  // Stagger bottom → mid → top; span so all reach 1 at t=1
  const botS = sequential(t, 0, 0.68);
  const midS = sequential(t, 0.16, 0.68);
  const topS = sequential(t, 0.32, 0.68);

  return {
    top: FOLD_END.top * topS,
    mid: FOLD_END.mid * midS,
    bot: FOLD_END.bot * botS,
  };
}

/** Crease ink from real fold geometry — 0 flat, 1 at full Z. */
export function creaseAmount(foldProgress: number): number {
  const a = panelAngles(foldProgress);
  const mag = Math.abs(a.top) + Math.abs(a.mid) + Math.abs(a.bot);
  return Math.min(1, mag / 200);
}

/**
 * Face shade overlays (0..~0.22). Plain opacity — never filter/blend-mode
 * on 3D ancestors (those flatten nested preserve-3d).
 */
export function panelShade(foldProgress: number): PanelAngles {
  const a = panelAngles(foldProgress);
  return {
    top: Math.min(0.08, Math.abs(a.top) / 500),
    mid: Math.min(0.2, Math.abs(a.mid) / 400),
    bot: Math.min(0.1, Math.abs(a.bot) / 480),
  };
}

export function enterZoom(enterProgress: number): number {
  const p = Math.min(1, Math.max(0, enterProgress));
  if (p <= ZOOM_START) {
    const t = p / ZOOM_START;
    return WORLD_SCALE_REST + (1 - WORLD_SCALE_REST) * t * 0.35;
  }
  const t = (p - ZOOM_START) / (1 - ZOOM_START);
  const eased = t * t;
  const atZoomStart = WORLD_SCALE_REST + (1 - WORLD_SCALE_REST) * 0.35;
  return atZoomStart + (WORLD_SCALE_ENTER - atZoomStart) * eased;
}

/** Inside is readable once the accordion has opened past the valley. */
export function insideReveal(foldProgress: number): number {
  const p = Math.min(1, Math.max(0, foldProgress));
  if (p < 0.55) return 0;
  return Math.min(1, (p - 0.55) / 0.4);
}

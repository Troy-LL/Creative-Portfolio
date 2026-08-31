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
 * Wall hatch behind the card — slides up with the bot-led fold.
 * Sized to the folded card silhouette so the hole hugs the card
 * (bottom tracks the bot panel), not the flat footprint void.
 */
export const SURFACE_PEEL = {
  /** 1 = cover fully clears the well at fold = 1 */
  shiftPct: 1,
} as const;

export type SurfacePeel = {
  /** 0 covering well → 1 fully slid up */
  shiftPct: number;
  /** Always 0 — slide, not hinge */
  rotateX: number;
  /** Hatch height as fraction of flat card (1 flat → accordion silhouette) */
  heightPct: number;
  /** Hatch top edge in flat-card Y (0 = card top) */
  topPct: number;
};

/**
 * Nested Z-fold — sequential upward (bot → mid → top).
 * 0 = flat closed; 1 = held end pose (FOLD_END).
 */
export function panelAngles(foldProgress: number): PanelAngles {
  return panelAnglesAtEnd(foldProgress, FOLD_END);
}

/** Same stagger, but peaks come from a custom end pose (debug / tuning). */
export function panelAnglesAtEnd(
  foldProgress: number,
  end: PanelAngles,
): PanelAngles {
  const t = Math.min(1, Math.max(0, foldProgress));
  if (t === 0) return { top: 0, mid: 0, bot: 0 };

  const botS = sequential(t, 0, 0.68);
  const midS = sequential(t, 0.16, 0.68);
  const topS = sequential(t, 0.32, 0.68);

  return {
    top: end.top * topS,
    mid: end.mid * midS,
    bot: end.bot * botS,
  };
}

const THIRD = 1 / 3;
const DEG = Math.PI / 180;

/** Visible folded stack bounds (accordion height + top). */
export function hatchSilhouetteFromAngles(angles: PanelAngles): {
  heightPct: number;
  topPct: number;
} {
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

/**
 * Where the opening becomes visible — top edge in flat-card Y (0 = card top).
 * Full card width always; slot is clipped from this line down to card bottom.
 */
export function hatchOpeningFromAngles(angles: PanelAngles): {
  topPct: number;
  heightPct: number;
} {
  const stack = hatchSilhouetteFromAngles(angles);
  const topPct = stack.topPct;
  const heightPct = 1 - topPct;
  return { topPct, heightPct };
}

function foldOpening(foldProgress: number, end: PanelAngles = FOLD_END): {
  topPct: number;
  heightPct: number;
} {
  const t = Math.min(1, Math.max(0, foldProgress));
  if (t === 0) return { topPct: 1, heightPct: 0 };
  return hatchOpeningFromAngles(panelAnglesAtEnd(t, end));
}

/** Wall hatch — full card slot; cover slides up; well clipped from reveal line. */
export function surfacePeel(foldProgress: number): SurfacePeel {
  const t = Math.min(1, Math.max(0, foldProgress));
  if (t === 0) {
    return { shiftPct: 0, rotateX: 0, heightPct: 0, topPct: 1 };
  }
  const { heightPct, topPct } = foldOpening(t);
  const s = sequential(t, 0, 0.68);
  return {
    shiftPct: SURFACE_PEEL.shiftPct * s,
    rotateX: 0,
    heightPct,
    topPct,
  };
}

/** Same as surfacePeel but uses explicit panel angles at this fold step. */
export function surfacePeelFromAngles(
  foldProgress: number,
  angles: PanelAngles,
): SurfacePeel {
  const t = Math.min(1, Math.max(0, foldProgress));
  if (t === 0) {
    return { shiftPct: 0, rotateX: 0, heightPct: 0, topPct: 1 };
  }
  const { heightPct, topPct } = hatchOpeningFromAngles(angles);
  const s = sequential(t, 0, 0.68);
  return {
    shiftPct: SURFACE_PEEL.shiftPct * s,
    rotateX: 0,
    heightPct,
    topPct,
  };
}

export type HatchDebugState = {
  autoSilhouette: boolean;
  topPct: number;
  heightPct: number;
  shiftPct: number;
  /** Pull reveal line upward — enlarges opening (↓ only for extend) */
  topPullPct: number;
  /** Scale visible opening height */
  heightScale: number;
  extendBottomPct: number;
  depthPx: number;
  wellOpacity: number;
};

export const HATCH_DEBUG_DEFAULTS: HatchDebugState = {
  autoSilhouette: true,
  topPct: 0.2,
  heightPct: 0.8,
  shiftPct: 1,
  topPullPct: 0,
  heightScale: 1.5,
  extendBottomPct: 0.4,
  depthPx: 80,
  wellOpacity: 1,
};

function extendOpeningDown(
  topPct: number,
  heightPct: number,
  extendBottomPct: number,
): number {
  const maxH = 1 - topPct;
  return Math.min(maxH, heightPct + Math.max(0, extendBottomPct));
}

/** Apply manual hatch overrides + enlarge tweaks from the debug panel. */
export function applyHatchDebug(
  computed: SurfacePeel,
  hatch: HatchDebugState,
): SurfacePeel {
  const base = hatch.autoSilhouette
    ? computed
    : {
        shiftPct: hatch.shiftPct,
        rotateX: 0,
        heightPct: hatch.heightPct,
        topPct: hatch.topPct,
      };

  const topPct = Math.max(0, base.topPct - hatch.topPullPct);
  let heightPct = Math.min(1 - topPct, base.heightPct * hatch.heightScale);
  heightPct = extendOpeningDown(topPct, heightPct, hatch.extendBottomPct);

  return {
    ...base,
    topPct,
    heightPct,
  };
}

/** Crease ink from real fold geometry — 0 flat, 1 at full Z. */
export function creaseAmount(foldProgress: number): number {
  return creaseAmountFromAngles(panelAngles(foldProgress));
}

export function creaseAmountFromAngles(angles: PanelAngles): number {
  const mag = Math.abs(angles.top) + Math.abs(angles.mid) + Math.abs(angles.bot);
  return Math.min(1, mag / 200);
}

/**
 * Face shade overlays (0..~0.22). Plain opacity — never filter/blend-mode
 * on 3D ancestors (those flatten nested preserve-3d).
 */
export function panelShade(foldProgress: number): PanelAngles {
  return panelShadeFromAngles(panelAngles(foldProgress));
}

export function panelShadeFromAngles(angles: PanelAngles): PanelAngles {
  return {
    top: Math.min(0.08, Math.abs(angles.top) / 500),
    mid: Math.min(0.2, Math.abs(angles.mid) / 400),
    bot: Math.min(0.1, Math.abs(angles.bot) / 480),
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

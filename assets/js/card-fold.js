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

export function shouldSnapOpen(foldProgress) {
  return foldProgress >= SNAP_OPEN_THRESHOLD;
}

export function applyLag(current, target, alpha) {
  const a = clamp(alpha, 0, 1);
  return current + (target - current) * a;
}

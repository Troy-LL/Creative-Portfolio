/**
 * Site-nav ruler tick lean helpers (no DOM).
 * Keeps the land fan-out from crossing neighboring ticks,
 * and eases fan lean upright after reveal.
 */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/** Ease-out quint — most of the motion early, soft landing at the end. */
export function easeOutQuint(t) {
  const u = clamp(Number(t) || 0, 0, 1);
  return 1 - (1 - u) ** 5;
}

/**
 * Appear-wave radius 0…~1 during land reveal → straighten.
 * Keeps growing after reveal so edge ticks ease in instead of popping
 * the instant reveal hits 1.
 */
export function fanAppearRadius({ reveal = 0, straighten = 0 } = {}) {
  const r = clamp(Number(reveal) || 0, 0, 1);
  const s = clamp(Number(straighten) || 0, 0, 1);
  if (r < 1) return r * 0.58;
  return 0.58 + easeOutQuint(s) * 0.5;
}

/**
 * Tilt multiplier for ruler lean during land reveal → rest.
 * Reveal uses the fan tilt; straighten 0→1 eases that down to rest (often 0)
 * so ticks don't snap upright when the fan-out finishes.
 */
export function fanTiltAmount({
  reveal = 0,
  straighten = 0,
  fanTilt = 1.15,
  restTilt = 0,
} = {}) {
  const fan = Math.max(Number(fanTilt) || 0, Number(restTilt) || 0);
  const rest = Math.max(0, Number(restTilt) || 0);
  const r = clamp(Number(reveal) || 0, 0, 1);
  if (r < 1) return fan;
  const e = easeOutQuint(straighten);
  return fan + (rest - fan) * e;
}

/** Stations whose field needs light nav ink (black / dark grounds). */
const DARK_NAV_STATIONS = new Set(["02"]);

/** @returns {"light" | "dark"} */
export function navSurfaceForStation(stationId) {
  return DARK_NAV_STATIONS.has(String(stationId || "")) ? "dark" : "light";
}

/**
 * Contrast under the fixed top-center nav, from track pose + layout.
 * @returns {"light" | "dark"}
 */
export function navSurfaceFromPose(pose, staircase) {
  if (!pose || !staircase) return "light";
  const cols = Array.isArray(staircase.layout) ? staircase.layout : [];
  const vw = Math.max(1, Number(staircase.vw) || 0);
  const sx = Number(pose.x) + vw * 0.5;
  const sy = Number(pose.y) + 28;
  for (const col of cols) {
    if (!DARK_NAV_STATIONS.has(String(col.id))) continue;
    if (
      sx >= col.x &&
      sx < col.x + col.w &&
      sy >= col.y &&
      sy < col.y + col.h
    ) {
      return "dark";
    }
  }
  return "light";
}

/**
 * Max |Δlean| between neighbors so tips stay clear at the given spacing/height.
 * Transform-origin is top-center; tips swing ~height * sin(θ).
 */
export function maxLeanDeltaDeg(spacingPx, heightPx) {
  const spacing = Math.max(0, Number(spacingPx) || 0);
  const height = Math.max(1, Number(heightPx) || 1);
  if (!(spacing > 0)) return 8;
  // Stay under the geometric tip-clear angle with a little margin.
  return clamp((Math.atan(spacing / height) * 180) / Math.PI * 0.82, 2.5, 14);
}

/**
 * Forward + backward pass so no adjacent pair exceeds maxAbsDelta.
 * Returns a new array; input is not mutated.
 */
export function limitNeighborLean(leans, maxAbsDelta) {
  const n = leans.length;
  if (n < 2) return leans.map((v) => Number(v) || 0);
  const cap = Math.max(0, Number(maxAbsDelta) || 0);
  const out = leans.map((v) => Number(v) || 0);
  for (let i = 1; i < n; i++) {
    const d = out[i] - out[i - 1];
    if (Math.abs(d) > cap) {
      out[i] = out[i - 1] + Math.sign(d || 1) * cap;
    }
  }
  for (let i = n - 2; i >= 0; i--) {
    const d = out[i] - out[i + 1];
    if (Math.abs(d) > cap) {
      out[i] = out[i + 1] + Math.sign(d || 1) * cap;
    }
  }
  return out;
}

/** Tip of a tick with top-center origin at (x, 0), angle in degrees CW. */
export function tickTip(x, height, deg) {
  const rad = ((Number(deg) || 0) * Math.PI) / 180;
  const h = Math.max(0, Number(height) || 0);
  return {
    x: (Number(x) || 0) + h * Math.sin(rad),
    y: h * Math.cos(rad),
  };
}

function orient(ax, ay, bx, by, cx, cy) {
  const v = (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
  if (Math.abs(v) < 1e-9) return 0;
  return v > 0 ? 1 : 2;
}

function onSegment(ax, ay, bx, by, cx, cy) {
  return (
    cx <= Math.max(ax, bx) + 1e-9 &&
    cx >= Math.min(ax, bx) - 1e-9 &&
    cy <= Math.max(ay, by) + 1e-9 &&
    cy >= Math.min(ay, by) - 1e-9
  );
}

/** True if open segments AB and CD properly intersect (shared endpoint ≠ cross). */
export function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  if (o1 !== o2 && o3 !== o4) {
    // Ignore shared top anchors (adjacent ticks share no x, but tips can meet).
    const shareEnd =
      (Math.abs(ax - cx) < 1e-9 && Math.abs(ay - cy) < 1e-9) ||
      (Math.abs(ax - dx) < 1e-9 && Math.abs(ay - dy) < 1e-9) ||
      (Math.abs(bx - cx) < 1e-9 && Math.abs(by - cy) < 1e-9) ||
      (Math.abs(bx - dx) < 1e-9 && Math.abs(by - dy) < 1e-9);
    return !shareEnd;
  }
  if (o1 === 0 && onSegment(ax, ay, bx, by, cx, cy)) return true;
  if (o2 === 0 && onSegment(ax, ay, bx, by, dx, dy)) return true;
  if (o3 === 0 && onSegment(cx, cy, dx, dy, ax, ay)) return true;
  if (o4 === 0 && onSegment(cx, cy, dx, dy, bx, by)) return true;
  return false;
}

export function neighborTicksCross(x0, h0, deg0, x1, h1, deg1) {
  const a = { x: Number(x0) || 0, y: 0 };
  const b = tickTip(x0, h0, deg0);
  const c = { x: Number(x1) || 0, y: 0 };
  const d = tickTip(x1, h1, deg1);
  return segmentsIntersect(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
}

/** Count adjacent pairs whose segments cross. */
export function countCrossingPairs(xs, heights, leans) {
  let n = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    if (
      neighborTicksCross(xs[i], heights[i], leans[i], xs[i + 1], heights[i + 1], leans[i + 1])
    ) {
      n += 1;
    }
  }
  return n;
}

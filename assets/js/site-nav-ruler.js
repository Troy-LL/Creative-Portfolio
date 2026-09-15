function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function easeOutQuint(t) {
  const u = clamp(Number(t) || 0, 0, 1);
  return 1 - (1 - u) ** 5;
}

export function fanAppearRadius({ reveal = 0, straighten = 0 } = {}) {
  const r = clamp(Number(reveal) || 0, 0, 1);
  const s = clamp(Number(straighten) || 0, 0, 1);
  if (r < 1) return r * 0.58;
  return 0.58 + easeOutQuint(s) * 0.5;
}

export function fanTiltAmount({
  reveal = 0,
  straighten = 0,
  fanTilt = 1.15,
  restTilt = 0,
} = {}) {
  const fan = Math.max(Number(fanTilt) || 0, Number(restTilt) || 0);
  const rest = Math.max(0, Number(restTilt) || 0);
  const r = clamp(Number(reveal) || 0, 0, 1);
  const s = clamp(Number(straighten) || 0, 0, 1);
  const settleAt = 0.15;
  const revealShare = 0.92;

  let settle = 0;
  if (r < 1) {
    if (r > settleAt) {
      settle = easeOutQuint((r - settleAt) / (1 - settleAt)) * revealShare;
    }
  } else {
    settle = revealShare + easeOutQuint(s) * (1 - revealShare);
  }
  return fan + (rest - fan) * settle;
}

const DARK_NAV_STATIONS = new Set(["02"]);

/** @returns {"light" | "dark"} */
export function navSurfaceForStation(stationId) {
  return DARK_NAV_STATIONS.has(String(stationId || "")) ? "dark" : "light";
}

/** @returns {"light" | "dark"} */
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

export function fanAuthority({ reveal = 0, straighten = 0 } = {}) {
  const r = clamp(Number(reveal) || 0, 0, 1);
  const s = clamp(Number(straighten) || 0, 0, 1);
  const settleAt = 0.15;
  const revealShare = 0.92;
  let settle = 0;
  if (r < 1) {
    if (r > settleAt) {
      settle = easeOutQuint((r - settleAt) / (1 - settleAt)) * revealShare;
    }
  } else {
    settle = revealShare + easeOutQuint(s) * (1 - revealShare);
  }
  return 1 - settle;
}

export function landCrestPeak({
  reveal = 0,
  straighten = 0,
  sectionPeak = 0.5,
} = {}) {
  const r = clamp(Number(reveal) || 0, 0, 1);
  const s = clamp(Number(straighten) || 0, 0, 1);
  const target = clamp(Number(sectionPeak) || 0, 0, 1);
  if (r < 1) return 0.5;
  const u = s;
  const travel = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
  return 0.5 + (target - 0.5) * travel;
}

export function rulerTickPose({
  x,
  peak,
  radius,
  time,
  reveal,
  straighten,
  tilt,
  feel,
  noise = 0.5,
  phaseA = 0,
  phaseB = 0,
  stagger = 0,
  reduce = false,
} = {}) {
  const fanK = fanAuthority({ reveal, straighten });
  const distC = Math.abs(x - 0.5);
  const appear = clamp((radius - distC + 0.04) / 0.08, 0, 1);
  if (appear <= 0) return { appear: 0, height: 0, lean: 0, opacity: 0 };
  const signed = x - peak;
  const dist = Math.abs(signed);
  const side = signed < 0 ? -1 : 1;
  const span = Math.max(0.15, feel.epicenter);
  const envelope = Math.exp(-dist * (4.2 / span));
  const waveStrength = reduce ? 0 : feel.strength;
  const ripple =
    (Math.sin(dist * 14 - time * 2.1 + phaseA) * 0.7 +
      Math.sin(dist * 6.5 - time * 1.15 + phaseB) * 0.45) *
    waveStrength;
  const front = Math.exp(-Math.abs(distC - radius) * 26);
  const shock = front * (1.15 - clamp(reveal, 0, 1) * 0.55) * fanK;
  const lean =
    side * (6 + envelope * 18 + ripple * (8 + envelope * 14)) * tilt * appear;
  const jitter = reduce ? 0 : (noise - 0.5) * (0.9 + envelope * 1.4);
  const base = feel.baseline + stagger;
  const crest = envelope * envelope * (3.2 + 4.3 * fanK) * feel.lengthen;
  const waveLen = ripple * (1.4 + envelope * 3.2) * feel.lengthen;
  const shockLen = shock * 11 * feel.lengthen;
  const height = Math.max(2.8, base + crest + waveLen + shockLen + jitter);
  const opacity = (0.3 + envelope * 0.45) * appear * feel.opacity;
  return { appear, height, lean, opacity };
}

export function maxLeanDeltaDeg(spacingPx, heightPx) {
  const spacing = Math.max(0, Number(spacingPx) || 0);
  const height = Math.max(1, Number(heightPx) || 1);
  if (!(spacing > 0)) return 8;
  return clamp((Math.atan(spacing / height) * 180) / Math.PI * 0.82, 2.5, 14);
}

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

export function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  if (o1 !== o2 && o3 !== o4) {
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

/**
 * Stiff business-card paper simulation.
 *
 * Technical inspiration: dissimulate/Tearable-Cloth (Verlet + breakable constraints).
 * This is NOT cloth — high stiffness, almost no gravity until collapse,
 * localized press crumple, early fracture at the press (no elastic funnel),
 * then auto-collapse into a ball that falls.
 *
 * Debug-first: expose particles/constraints; no polished renderer here.
 */

/** @typedef {'idle'|'grabbed'|'deforming'|'tension'|'tearing'|'separated'|'collapsed'} TearState */

/**
 * @typedef {object} Particle
 * @property {number} x
 * @property {number} y
 * @property {number} px
 * @property {number} py
 * @property {number} ox  rest x
 * @property {number} oy  rest y
 * @property {number} ix  initial x
 * @property {number} iy  initial y
 * @property {number} col
 * @property {number} row
 * @property {boolean} pinned
 * @property {number|null} pinX
 * @property {number|null} pinY
 * @property {number} mass
 */

/**
 * @typedef {object} Link
 * @property {Particle} a
 * @property {Particle} b
 * @property {number} rest
 * @property {number} rest0
 * @property {boolean} broken
 * @property {'struct'|'shear'} kind
 */

/**
 * @param {object} opts
 * @param {number} opts.width   card width px
 * @param {number} opts.height  card height px
 * @param {number} [opts.cols]
 * @param {number} [opts.rows]
 */
export function createPaperSim(opts) {
  const cols = opts.cols ?? 10;
  const rows = opts.rows ?? 6;
  const width = opts.width;
  const height = opts.height;

  /** Stiff-paper knobs (vs Tearable-Cloth's floppy defaults) */
  const cfg = {
    cols,
    rows,
    width,
    height,
    /** Constraint solver passes — cloth uses ~5; paper needs more */
    iterations: 18,
    /** Verlet damping (cloth 0.99). Slightly lower = less wobble */
    friction: 0.985,
    /** Almost none until collapse — card stock on a table */
    gravity: 0.0,
    /**
     * Fracture when length > rest * ratio.
     * Stiff paper: tiny stretch, then RIP — no spandex cone.
     */
    fractureStrain: 1.06,
    /** Once tearing, neighbors break easier (propagation) */
    propagateStrain: 1.03,
    /** Fraction of cursor travel the grabbed point aims for (resistance) */
    grabFollow: 0.35,
    /** Spring toward that resisted target each frame */
    grabStiffness: 0.55,
    /** Soft anchors on the opposing half (center-rip with one pointer) */
    opposeStiffness: 0.72,
    /** Press crumple: strong inward bunch under the finger */
    pressCrumple: 0.09,
    /** Fraction of links broken → auto-collapse into a ball */
    collapseBrokenRatio: 0.1,
    /** Press frames before collapse can trigger from age alone */
    collapsePressAge: 40,
    /** Pull strength toward crumple center once collapsed */
    collapsePull: 0.2,
    /** Gravity once collapsed (fall as a wad) */
    collapseGravity: 0.38,
    /** Max breaks per frame while propagating */
    maxBreaksPerFrame: 8,
  };

  /** @type {Particle[]} */
  const particles = [];
  /** @type {Link[]} */
  const links = [];

  const dx = width / (cols - 1);
  const dy = height / (rows - 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * dx;
      const y = r * dy;
      particles.push({
        x,
        y,
        px: x,
        py: y,
        ox: x,
        oy: y,
        ix: x,
        iy: y,
        col: c,
        row: r,
        pinned: false,
        pinX: null,
        pinY: null,
        mass: 1,
      });
    }
  }

  function idx(c, r) {
    return r * cols + c;
  }

  function attach(a, b, kind) {
    const rest = Math.hypot(a.x - b.x, a.y - b.y);
    links.push({ a, b, rest, rest0: rest, broken: false, kind });
  }

  // Structural + shear (shear keeps the sheet from shearing like cloth)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = particles[idx(c, r)];
      if (c + 1 < cols) attach(p, particles[idx(c + 1, r)], "struct");
      if (r + 1 < rows) attach(p, particles[idx(c, r + 1)], "struct");
      if (c + 1 < cols && r + 1 < rows) {
        attach(p, particles[idx(c + 1, r + 1)], "shear");
        attach(particles[idx(c + 1, r)], particles[idx(c, r + 1)], "shear");
      }
    }
  }
  const totalLinkCount = links.length;

  /** @type {TearState} */
  let state = "idle";
  /** @type {Particle|null} */
  let grab = null;
  /** Cursor target in sim space (force, not direct set) */
  let grabTarget = { x: 0, y: 0 };
  /** Cursor + particle pose when grab began — for resistance ratio */
  let grabCursor0 = { x: 0, y: 0 };
  let grabParticle0 = { x: 0, y: 0 };
  /** Soft-pinned particles on the opposing half */
  /** @type {Particle[]} */
  let oppose = [];
  /** 0..∞ while pointer is held — drives crumple */
  let pressHeld = false;
  let pressAge = 0;
  let pressPoint = { x: 0, y: 0 };
  let maxStrain = 0;
  let brokenCount = 0;
  /** Crumple center once collapsing */
  let crumpleCenter = { x: width * 0.5, y: height * 0.5 };
  /** @type {Set<Particle>} */
  const tearFront = new Set();

  function nearestParticle(x, y) {
    let best = particles[0];
    let bestD = Infinity;
    for (const p of particles) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  /**
   * Press-to-crumple / center-rip — hold only, no dragging the node.
   */
  function beginGrab(x, y) {
    if (state === "separated" || state === "collapsed") return;

    // Unfreeze from a previous hold (broken links stay broken)
    for (const p of particles) {
      p.pinned = false;
      p.pinX = null;
      p.pinY = null;
    }

    grab = nearestParticle(x, y);
    // Lock press at the node — no outward spike / funnel tip
    grabTarget.x = grab.x;
    grabTarget.y = grab.y;
    grabCursor0 = { x: grab.x, y: grab.y };
    grabParticle0 = { x: grab.x, y: grab.y };
    pressPoint = { x: grab.x, y: grab.y };
    crumpleCenter = { x: grab.x, y: grab.y };
    pressHeld = true;
    pressAge = 0;
    oppose = [];

    const midX = width * 0.5;
    const grabLeft = grab.x < midX;
    for (const p of particles) {
      const onOpposite = grabLeft ? p.x > midX + dx * 0.5 : p.x < midX - dx * 0.5;
      if (onOpposite) {
        p.pinned = true;
        p.pinX = p.x;
        p.pinY = p.y;
        oppose.push(p);
      }
    }

    state = "grabbed";

    // Sever grab links on contact — paper snaps at the finger, no cone
    for (const link of links) {
      if (link.broken) continue;
      if (link.a === grab || link.b === grab) breakLink(link);
    }
  }

  /** Drag disabled — press/hold only. */
  function moveGrab(_x, _y) {
    /* intentionally empty */
  }

  function endGrab() {
    grab = null;
    pressHeld = false;
    pressAge = 0;

    if (state === "collapsed") {
      // Keep falling — don't freeze into a baked flat pose
      oppose = [];
      for (const p of particles) {
        p.pinned = false;
        p.pinX = null;
        p.pinY = null;
      }
      return;
    }

    // Bake the pose so unbroken links don't spring back
    for (const p of particles) {
      p.ox = p.x;
      p.oy = p.y;
      p.px = p.x;
      p.py = p.y;
      p.pinned = true;
      p.pinX = p.x;
      p.pinY = p.y;
    }
    for (const link of links) {
      if (link.broken) continue;
      const d = Math.hypot(link.a.x - link.b.x, link.a.y - link.b.y);
      if (d > 1e-4) link.rest = d;
    }
    oppose = [];

    if (brokenCount > 0) state = state === "separated" ? "separated" : "tearing";
    else state = "idle";
  }

  function breakLink(link) {
    if (link.broken) return false;
    link.broken = true;
    brokenCount++;
    tearFront.add(link.a);
    tearFront.add(link.b);
    if (state !== "separated" && state !== "collapsed") state = "tearing";
    return true;
  }

  /** Fracture near press; expand radius while held (no outward pull). */
  function fractureAtPress() {
    if (!grab || pressAge < 2) return;
    const cell = Math.max(dx, dy);
    const rad = cell * (1.1 + Math.min(2.5, pressAge / 28));
    let broke = 0;
    const budget = pressAge < 12 ? 4 : pressAge < 30 ? 6 : 10;

    /** @type {{ link: Link, score: number }[]} */
    const scored = [];
    for (const link of links) {
      if (link.broken) continue;
      const mx = (link.a.x + link.b.x) * 0.5;
      const my = (link.a.y + link.b.y) * 0.5;
      const dist = Math.hypot(mx - pressPoint.x, my - pressPoint.y);
      if (dist > rad) continue;
      let score = Math.max(0, 4 - dist / cell);
      if (link.a === grab || link.b === grab) score += 8;
      scored.push({ link, score });
    }
    scored.sort((a, b) => b.score - a.score);
    for (const { link } of scored) {
      if (broke >= budget) break;
      if (breakLink(link)) broke++;
    }
  }

  function tickPress() {
    if (!pressHeld || !grab || state === "collapsed") return;
    pressAge += 1;
    if (state === "grabbed" && pressAge > 2) state = "deforming";
    if (pressAge > 12) state = state === "tearing" ? state : "tension";

    grabTarget.x = pressPoint.x;
    grabTarget.y = pressPoint.y;

    if (pressAge % 2 === 0) fractureAtPress();
    maybeCollapse();
  }

  /** Apply after constraint solve so inward bunch isn't undone. */
  function applyInwardBunch() {
    if (!pressHeld || !grab || state === "collapsed") return;
    const t = Math.min(1, pressAge / 40);
    const cell = Math.max(dx, dy);
    const rad = cell * (4 + t * 4);
    const crumple = cfg.pressCrumple * (1 + t * 2);
    for (const p of particles) {
      if (p.pinned) continue;
      const d = Math.hypot(p.x - pressPoint.x, p.y - pressPoint.y);
      if (d > rad || d < 1e-3) continue;
      const w = (1 - d / rad) ** 2;
      const tx = (pressPoint.x - p.x) * crumple * w;
      const ty = (pressPoint.y - p.y) * crumple * w;
      p.x += tx;
      p.y += ty;
      p.px = p.x;
      p.py = p.y;
    }
    // Soften nearby rests so the sheet can bunch instead of springing open
    for (const link of links) {
      if (link.broken) continue;
      const mx = (link.a.x + link.b.x) * 0.5;
      const my = (link.a.y + link.b.y) * 0.5;
      if (Math.hypot(mx - pressPoint.x, my - pressPoint.y) > rad) continue;
      link.rest = Math.max(link.rest * 0.985, link.rest0 * 0.35);
    }
  }

  function maybeCollapse() {
    if (state === "collapsed") return;
    const ratio = brokenCount / Math.max(1, totalLinkCount);
    if (ratio < cfg.collapseBrokenRatio && pressAge < cfg.collapsePressAge) return;

    state = "collapsed";
    crumpleCenter = { ...pressPoint };
    cfg.gravity = cfg.collapseGravity;
    oppose = [];
    for (const p of particles) {
      p.pinned = false;
      p.pinX = null;
      p.pinY = null;
    }
    // Shatter most structure so the sheet can wad into a ball
    for (const link of links) {
      if (link.broken) continue;
      link.rest *= 0.35;
      if (link.kind === "shear") {
        breakLink(link);
        continue;
      }
      // Keep a sparse skeleton so the wad stays connected
      const keep =
        (link.a.col + link.a.row + link.b.col + link.b.row) % 5 === 0;
      if (!keep) breakLink(link);
    }
  }

  function applyCollapseForces() {
    if (state !== "collapsed") return;
    const k = cfg.collapsePull;
    // Recenter on live particle average so the ball packs tightly
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (const p of particles) {
      sx += p.x;
      sy += p.y;
      n++;
    }
    if (n > 0) {
      crumpleCenter.x += (sx / n - crumpleCenter.x) * 0.35;
      crumpleCenter.y += (sy / n - crumpleCenter.y) * 0.35;
    }
    for (const p of particles) {
      const tx = (crumpleCenter.x - p.x) * k;
      const ty = (crumpleCenter.y - p.y) * k;
      p.x += tx;
      p.y += ty;
      p.px = p.x - tx * 0.5;
      p.py = p.y - ty * 0.5;
    }
    // Fall as a wad, but keep packing toward the live center (don't drift apart)
    crumpleCenter.y += cfg.gravity * 0.55;
  }

  function resolveLink(link) {
    if (link.broken) return;
    const { a, b, rest } = link;
    let lx = a.x - b.x;
    let ly = a.y - b.y;
    let dist = Math.sqrt(lx * lx + ly * ly);
    if (dist < 1e-6) return;

    const strain = dist / rest;
    if (strain > maxStrain) maxStrain = strain;

    const thresh =
      tearFront.has(a) || tearFront.has(b) || state === "tearing" || state === "collapsed"
        ? cfg.propagateStrain
        : cfg.fractureStrain;

    if (strain > thresh) {
      breakLink(link);
      return;
    }

    if (dist <= rest) return;

    const diff = (rest - dist) / dist;
    const stiffness = link.kind === "shear" ? 0.85 : 1;
    const mul = diff * 0.5 * stiffness;
    const ox = lx * mul;
    const oy = ly * mul;

    const aPin = a.pinned && a.pinX != null;
    const bPin = b.pinned && b.pinX != null;
    if (!aPin) {
      a.x += ox;
      a.y += oy;
    }
    if (!bPin) {
      b.x -= ox;
      b.y -= oy;
    }
  }

  function applyGrabForces() {
    if (!grab || state === "collapsed") return;

    // Hold grab at press — no neighbor suction (that made the funnel)
    const follow = cfg.grabFollow;
    const desiredX = grabParticle0.x + (grabTarget.x - grabCursor0.x) * follow;
    const desiredY = grabParticle0.y + (grabTarget.y - grabCursor0.y) * follow;

    const k = cfg.grabStiffness;
    grab.px = grab.x - (desiredX - grab.x) * k;
    grab.py = grab.y - (desiredY - grab.y) * k;
  }

  function integrateParticle(p) {
    if (p.pinned && p.pinX != null) {
      p.x = p.pinX;
      p.y = p.pinY;
      p.px = p.x;
      p.py = p.y;
      return;
    }
    const vx = (p.x - p.px) * cfg.friction;
    const vy = (p.y - p.py) * cfg.friction + cfg.gravity;
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy;
  }

  function propagateBreaks() {
    if (state === "collapsed") return;
    if (state !== "tearing" && brokenCount === 0) return;
    let broke = 0;
    /** @type {{ link: Link, strain: number }[]} */
    const candidates = [];
    for (const link of links) {
      if (link.broken) continue;
      const dist = Math.hypot(link.a.x - link.b.x, link.a.y - link.b.y);
      const strain = dist / link.rest;
      const nearFront = tearFront.has(link.a) || tearFront.has(link.b);
      if (!nearFront && strain < cfg.fractureStrain) continue;
      candidates.push({ link, strain });
    }
    candidates.sort((u, v) => v.strain - u.strain);
    for (const { link, strain } of candidates) {
      if (broke >= cfg.maxBreaksPerFrame) break;
      const nearFront = tearFront.has(link.a) || tearFront.has(link.b);
      const thresh = nearFront ? cfg.propagateStrain : cfg.fractureStrain;
      if (strain >= thresh) {
        breakLink(link);
        broke++;
      }
    }
  }

  /** Connected components → true when ≥2 sizable pieces */
  function checkSeparated() {
    if (brokenCount < cols) return false;
    const parent = new Map();
    for (const p of particles) parent.set(p, p);
    function find(p) {
      let r = p;
      while (parent.get(r) !== r) r = parent.get(r);
      return r;
    }
    function union(a, b) {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    }
    for (const link of links) {
      if (!link.broken) union(link.a, link.b);
    }
    const sizes = new Map();
    for (const p of particles) {
      const r = find(p);
      sizes.set(r, (sizes.get(r) || 0) + 1);
    }
    const big = [...sizes.values()].filter((n) => n >= 4).length;
    return big >= 2;
  }

  /** Whether a mesh cell should still draw (skip torn cells → no funnel fill) */
  function cellIntact(c, r) {
    // Once wadded, keep drawing so the ball reads as paper, not swiss cheese
    if (state === "collapsed") return true;
    const a = particles[idx(c, r)];
    const b = particles[idx(c + 1, r)];
    const d = particles[idx(c, r + 1)];
    const e = particles[idx(c + 1, r + 1)];
    const corners = new Set([a, b, d, e]);
    let live = 0;
    for (const link of links) {
      if (link.broken) continue;
      if (corners.has(link.a) && corners.has(link.b)) live++;
    }
    return live >= 3;
  }

  function step() {
    maxStrain = 0;

    tickPress();
    applyGrabForces();

    for (const p of particles) integrateParticle(p);

    let i = cfg.iterations;
    while (i--) {
      for (const link of links) resolveLink(link);
    }

    if (state !== "collapsed") {
      for (const p of oppose) {
        if (p.pinX == null) continue;
        p.x += (p.pinX - p.x) * cfg.opposeStiffness;
        p.y += (p.pinY - p.y) * cfg.opposeStiffness;
        p.px = p.x;
        p.py = p.y;
      }
      applyInwardBunch();
    } else {
      applyCollapseForces();
    }

    propagateBreaks();

    if (maxStrain > 1.04 && state === "deforming") state = "tension";
    if (maxStrain > 1.08 && (state === "grabbed" || state === "deforming")) {
      state = "tension";
    }

    if (state === "tearing" && checkSeparated()) {
      state = "separated";
    }
  }

  function reset() {
    state = "idle";
    grab = null;
    oppose = [];
    brokenCount = 0;
    maxStrain = 0;
    pressHeld = false;
    pressAge = 0;
    cfg.gravity = 0;
    tearFront.clear();
    for (const p of particles) {
      p.x = p.ix;
      p.y = p.iy;
      p.ox = p.ix;
      p.oy = p.iy;
      p.px = p.ix;
      p.py = p.iy;
      p.pinned = false;
      p.pinX = null;
      p.pinY = null;
    }
    for (const link of links) {
      link.broken = false;
      link.rest = link.rest0;
    }
  }

  return {
    cfg,
    particles,
    links,
    get state() {
      return state;
    },
    get maxStrain() {
      return maxStrain;
    },
    get brokenCount() {
      return brokenCount;
    },
    get grab() {
      return grab;
    },
    beginGrab,
    moveGrab,
    endGrab,
    step,
    reset,
    nearestParticle,
    cellIntact,
  };
}

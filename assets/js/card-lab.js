/**
 * CSS 3D calling-card fall lab.
 *
 * Inspected stack (do not rebuild):
 * - Card: DOM `.physical-card` via mountPhysicalCard (paper lit map + ink layers)
 * - Paper: procedural canvas tooth (paper-grain.js) soft-light over --paper-base
 * - Ink: DOM type + optional coverage maps / SVG filters (flat by default)
 * - Motion: CSS perspective + transform-style 3D on .css-rig / .css-card
 * - Shadow: dual rectangular cast (contact + soft), flat underlay — not on face
 * - No animation library — rAF clock only
 *
 * This file extends that system: Bézier trajectory, velocity orientation,
 * cursor force, dynamic contact shadow, motion modes, debug panel.
 */

import {
  mountPhysicalCard,
  toPrintContent,
} from "./card-material/mount-physical-card.js";
import { CARD_BACK_FONT_DEFAULT } from "./card-material/card-back-fonts.js";
import { LOCKED_INK, LOCKED_STOCK } from "./card-material/locked.js";
import {
  FOLD_END,
  FOLD_END_DEFAULTS,
  FLIP,
  HATCH_OPENING,
  HATCH_OPENING_DEFAULTS,
  SCROLL_GAIN,
  SCROLL_IDLE_MS,
  applyLag,
  creaseAmount,
  cursorCardWeight,
  flipLagAlpha,
  flipMotion,
  flipShadowFootprint,
  panelAngles,
  panelShade,
  panelShadeFromAngles,
  resetFoldEnd,
  resetHatchOpening,
  resolveOpeningPeel,
  resolveScrollOnCard,
  setFlip,
  setFoldEnd,
  setHatchOpening,
  shouldEnableCursorLean,
  shouldSnapOpen,
} from "./card-fold.js";

const CARD = {
  phone: "0975 644 6519",
  company: "Next Decade",
  name: "Troy Lazaro",
  title: "AI Engineer",
  lines: ["troylazaro.dev"],
};

/** Locked physicality — dialed on :4173 (2026-09-01). */
const PHYS_DEFAULTS = {
  mode: "curved", // straight | organic | curved
  curveAmount: 1.6,
  fallMs: 1700,
  settleMs: 520,
  lateralDrift: 0.86,
  rotationResponse: 0.7,
  rotationInertia: 0.95,
  cursorInfluence: 1.06,
  gravity: 2,
  airResistance: 0.3,
  // Fall cast (in air / dropping)
  fallShadowStrength: 0.7,
  fallShadowSoftness: 2,
  fallShadowScale: 1.12,
  fallShadowReach: 0.71,
  // Flat table cast (resting)
  flatShadowStrength: 1.2,
  flatShadowSoftness: 2,
  flatShadowScale: 1.1,
  flatShadowReach: 1.13,
  perspective: 1400,
  // CSS mapping from normalized pose → px
  cssY: 0.5,
  cssX: 150,
  cssZ: 190,
};

const MAT_DEFAULTS = {
  paperBase: LOCKED_STOCK.paperBase,
  litOpacity: LOCKED_STOCK.litOpacity,
  inkColor: "#1a1814",
  density: LOCKED_INK.density,
  grain: 0,
  absorption: 0,
  relief: 0,
  typeScale: 1,
  cardWidth: 420,
  backFont: CARD_BACK_FONT_DEFAULT,
};

const CURSOR_DEFAULTS = {
  rotY: 9,
  rotX: 6.5,
  liftBase: 1.8,
  liftPeak: 3.8,
  xyX: 7.5,
  xyY: 5.5,
};

const PHYS_STORAGE_KEY = "card-lab-phys-v6";

const phys = { ...PHYS_DEFAULTS };
const mat = { ...MAT_DEFAULTS };
const cursorFeel = { ...CURSOR_DEFAULTS };

function loadPhysPrefs() {
  try {
    const raw =
      localStorage.getItem(PHYS_STORAGE_KEY) ||
      localStorage.getItem("card-lab-phys-v5");
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return null;
    return saved;
  } catch {
    return null;
  }
}

function savePhysPrefs(extra = {}) {
  try {
    const payload = {
      phys: { ...phys },
      mat: { ...mat },
      cursorFeel: { ...cursorFeel },
      fold: { ...FOLD_END },
      hatch: { ...HATCH_OPENING },
      flip: { ...FLIP },
      textEffects: false,
      paperGrain: true,
      ...extra,
    };
    localStorage.setItem(PHYS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

function applyPhysPrefs(saved) {
  if (!saved?.phys || typeof saved.phys !== "object") return;
  const p = saved.phys;
  // Migrate old single-shadow dials → fall + flat
  if (
    Number.isFinite(Number(p.shadowStrength)) &&
    !Number.isFinite(Number(p.fallShadowStrength))
  ) {
    const s = Number(p.shadowStrength);
    const soft = Number(p.shadowSoftness);
    const scale = Number(p.shadowScale);
    const reach = Number(p.shadowReach);
    if (Number.isFinite(s)) {
      p.fallShadowStrength = s * 1.15;
      p.flatShadowStrength = s * 0.9;
    }
    if (Number.isFinite(soft)) {
      p.fallShadowSoftness = soft;
      p.flatShadowSoftness = soft * 0.9;
    }
    if (Number.isFinite(scale)) {
      p.fallShadowScale = scale * 1.1;
      p.flatShadowScale = scale * 0.96;
    }
    if (Number.isFinite(reach)) {
      p.fallShadowReach = reach * 1.2;
      p.flatShadowReach = reach * 0.85;
    }
  }
  for (const [key, value] of Object.entries(p)) {
    if (!(key in PHYS_DEFAULTS)) continue;
    const n = Number(value);
    if (Number.isFinite(n) || typeof PHYS_DEFAULTS[key] === "string") {
      phys[key] = typeof PHYS_DEFAULTS[key] === "string" ? value : n;
    }
  }
  if (typeof p.mode === "string") phys.mode = p.mode;
}

function applyMatPrefs(saved) {
  if (!saved?.mat || typeof saved.mat !== "object") return;
  for (const [key, value] of Object.entries(saved.mat)) {
    if (!(key in MAT_DEFAULTS)) continue;
    if (key === "paperBase" || key === "inkColor" || key === "backFont") {
      if (typeof value === "string") mat[key] = value;
      continue;
    }
    const n = Number(value);
    if (Number.isFinite(n)) mat[key] = n;
  }
}

function applyCursorPrefs(saved) {
  if (!saved?.cursorFeel || typeof saved.cursorFeel !== "object") return;
  for (const [key, value] of Object.entries(saved.cursorFeel)) {
    if (!(key in CURSOR_DEFAULTS)) continue;
    const n = Number(value);
    if (Number.isFinite(n)) cursorFeel[key] = n;
  }
}

function applyFoldPrefs(saved) {
  if (!saved?.fold || typeof saved.fold !== "object") return;
  const next = {};
  for (const key of Object.keys(FOLD_END_DEFAULTS)) {
    const n = Number(saved.fold[key]);
    if (Number.isFinite(n)) next[key] = n;
  }
  if (Object.keys(next).length) setFoldEnd(next);
}

function applyHatchPrefs(saved) {
  if (!saved?.hatch || typeof saved.hatch !== "object") return;
  const next = {};
  for (const key of Object.keys(HATCH_OPENING_DEFAULTS)) {
    const n = Number(saved.hatch[key]);
    if (Number.isFinite(n)) next[key] = n;
  }
  if (Object.keys(next).length) setHatchOpening(next);
}

function applyFlipPrefs(saved) {
  if (!saved?.flip || typeof saved.flip !== "object") return;
  const n = Number(saved.flip.ms);
  if (Number.isFinite(n)) setFlip({ ms: n });
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Gravity-weighted time remapping — accelerate into the fall. */
function gravityT(t, g) {
  const x = clamp(t, 0, 1);
  const p = 1 + (g - 1) * 0.55;
  return Math.pow(x, p);
}

function cubic1(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return (
    u * u * u * p0 +
    3 * u * u * t * p1 +
    3 * u * t * t * p2 +
    t * t * t * p3
  );
}

function cubic1Dt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return (
    3 * u * u * (p1 - p0) +
    6 * u * t * (p2 - p1) +
    3 * t * t * (p3 - p2)
  );
}

function cubic3(p0, p1, p2, p3, t) {
  return {
    x: cubic1(p0.x, p1.x, p2.x, p3.x, t),
    y: cubic1(p0.y, p1.y, p2.y, p3.y, t),
    z: cubic1(p0.z, p1.z, p2.z, p3.z, t),
  };
}

function cubic3Dt(p0, p1, p2, p3, t) {
  return {
    x: cubic1Dt(p0.x, p1.x, p2.x, p3.x, t),
    y: cubic1Dt(p0.y, p1.y, p2.y, p3.y, t),
    z: cubic1Dt(p0.z, p1.z, p2.z, p3.z, t),
  };
}

/**
 * Settled: landscape card lying flat on the table (face up to camera).
 */
const REST = {
  x: 0,
  y: 0,
  z: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
};

/**
 * Normalized space: y -1 (high) → REST.y (float).
 */
function pathControls(mode, curveAmt, drift) {
  const c = curveAmt;
  const d = drift;
  const end = { x: REST.x, y: REST.y, z: REST.z };

  if (mode === "straight") {
    return {
      p0: { x: 0, y: -1, z: 0.55 },
      p1: { x: 0, y: -0.66, z: 0.38 },
      p2: { x: 0, y: -0.28, z: 0.18 },
      p3: end,
    };
  }

  if (mode === "organic") {
    return {
      p0: { x: -0.06 * d, y: -1, z: 0.58 },
      p1: { x: 0.1 * d * c, y: -0.62, z: 0.42 },
      p2: { x: -0.08 * d * c, y: -0.26, z: 0.16 },
      p3: end,
    };
  }

  return {
    p0: { x: -0.22 * d * c, y: -1.02, z: 0.72 },
    p1: { x: 0.48 * d * c, y: -0.72, z: 0.55 },
    p2: { x: -0.18 * d * c, y: -0.28, z: 0.2 },
    p3: end,
  };
}

function orientationFromTangent(vel, tAir, response) {
  const speed = Math.hypot(vel.x, vel.y, vel.z) + 1e-5;
  const nx = vel.x / speed;
  const ny = vel.y / speed;
  const nz = vel.z / speed;
  const r = response;

  const rotZ = clamp(nx * -38 * r, -28, 28) * tAir;
  const rotY = clamp(nx * 42 * r + nz * -12 * r, -32, 32) * tAir;
  const rotX = clamp(
    (1 - Math.abs(ny)) * 28 * r + nz * 18 * r + 8 * r,
    -8,
    48,
  ) * tAir;

  return { rotX, rotY, rotZ };
}

function secondaryDrift(t, mode, air) {
  if (mode === "straight") {
    return { rotX: 0, rotY: 0, rotZ: 0 };
  }
  const w = air * air;
  const amp = mode === "curved" ? 1 : 0.45;
  return {
    rotX: Math.sin(t * Math.PI * 2.1) * 3.2 * amp * w,
    rotY: Math.sin(t * Math.PI * 1.35 + 0.4) * 4.5 * amp * w,
    rotZ: Math.sin(t * Math.PI * 1.8 + 0.2) * 3.8 * amp * w,
  };
}

function poseAt(rawT) {
  const { mode, curveAmount, lateralDrift, rotationResponse, gravity, airResistance } =
    phys;
  const t = gravityT(rawT, gravity);
  const { p0, p1, p2, p3 } = pathControls(mode, curveAmount, lateralDrift);
  const pos = cubic3(p0, p1, p2, p3, t);
  const vel = cubic3Dt(p0, p1, p2, p3, t);

  const air = Math.pow(1 - t, 1 + airResistance);
  const orient = orientationFromTangent(vel, air, rotationResponse);
  const drift = secondaryDrift(rawT, mode, air);
  const land = smoothstep((t - 0.55) / 0.45);

  return {
    x: pos.x,
    y: pos.y,
    z: pos.z,
    rotX: lerp(orient.rotX + drift.rotX, REST.rotX, land),
    rotY: lerp(orient.rotY + drift.rotY, REST.rotY, land),
    rotZ: lerp(orient.rotZ + drift.rotZ, REST.rotZ, land),
    vx: vel.x,
    vy: vel.y,
    vz: vel.z,
    t,
    air,
  };
}

function settlePose(u) {
  const end = poseAt(1);
  const damp = Math.exp(-5.2 * u) * Math.sin(u * Math.PI * 2.15);
  const flatten = smoothstep(u);
  return {
    x: lerp(end.x, REST.x, flatten),
    y: lerp(end.y, REST.y, flatten) + damp * 0.012,
    z: lerp(end.z, REST.z, flatten),
    rotX: lerp(end.rotX, REST.rotX, flatten) + damp * 1.2 * (1 - u),
    rotY: lerp(end.rotY, REST.rotY, flatten) + damp * 0.8 * (1 - u),
    rotZ: lerp(end.rotZ, REST.rotZ, flatten) + damp * 0.6 * (1 - u),
    vx: 0,
    vy: 0,
    vz: 0,
    t: 1,
    air: 0,
  };
}

function createFps(el) {
  let frames = 0;
  let last = performance.now();
  return {
    tick(now = performance.now()) {
      frames += 1;
      if (now - last >= 500) {
        el.textContent = `${Math.round((frames * 1000) / (now - last))} fps`;
        frames = 0;
        last = now;
      }
    },
  };
}

function createCssEngine(root, materials) {
  const pane = root.closest(".pane");
  const rig = root.querySelector(".css-rig");
  const card = root.querySelector(".css-card");
  const face =
    root.querySelector(".css-card__face") ||
    root.querySelector(".fold-panel--mid .fold-panel__face");
  const shadowSoft = root.querySelector(".css-shadow--soft");
  const shadowContact = root.querySelector(".css-shadow--contact");
  const panelTop = root.querySelector('[data-fold="top"]');
  const panelMid = root.querySelector('[data-fold="mid"]');
  const panelBot = root.querySelector('[data-fold="bot"]');
  const cssStack = root.querySelector(".css-stack");
  const hatchWell = root.querySelector(".css-hatch-well");
  const hatchCover = root.querySelector(".css-hatch");
  const hatchSlot = root.querySelector(".css-hatch-slot");
  const shadowsWrap = root.querySelector(".css-shadows");
  const cardFlip = root.querySelector(".css-card__flip");
  const cardFront = root.querySelector(".css-card__front");
  const cardBack = root.querySelector(".css-card__back");
  const fps = createFps(pane.querySelector(".pane-fps"));

  function applyLayerZ() {
    if (cssStack) {
      cssStack.style.setProperty("--layer-z", String(HATCH_OPENING.layerZ));
    }
  }

  applyLayerZ();
  applyOpening(0);

  function applyOpening(fold) {
    if (!hatchWell || !hatchCover) return;
    const f = clamp(fold, 0, 1);
    if (f <= 0.001) {
      hatchWell.style.opacity = "0";
      hatchWell.style.clipPath = "inset(100% 0 0 0)";
      hatchCover.style.transform = "none";
      hatchCover.style.setProperty("--hatch-open", "0");
      return;
    }
    const peel = resolveOpeningPeel(f);
    hatchWell.style.opacity = String(HATCH_OPENING.wellOpacity * peel.shiftPct);
    hatchWell.style.clipPath = `inset(${peel.topPct * 100}% 0 0 0)`;
    hatchCover.style.transform = `translate3d(0, ${-peel.shiftPct * 100}%, 0)`;
    hatchCover.style.setProperty("--hatch-open", String(peel.shiftPct));
  }

  // Cursor: shifts position + face lean + matte lighting (ticket-style, not drag)
  let cursor = { x: 0, y: 0 };
  let cursorTarget = { x: 0, y: 0 };
  let cardLocal = { x: 0, y: 0 };
  let cardLocalTarget = { x: 0, y: 0 };
  let onCardWeight = 0.24;
  let onCardTarget = 0.24;
  let force = { x: 0, y: 0, rotX: 0, rotY: 0, faceX: 0, faceY: 0, lift: 0 };
  let forceTarget = { x: 0, y: 0, rotX: 0, rotY: 0, faceX: 0, faceY: 0, lift: 0 };

  // Smoothed pose for inertia
  let shown = null;
  let lastPose = null;
  let paperGrainLit = true;
  /** Base surface light — dialed; tilt modulates around this */
  let litBase = mat.litOpacity;
  /** 1 = full cursor response; 0 = flattened for fold */
  let cursorScale = 1;
  let cursorScaleTarget = 1;
  let foldDisplay = 0;
  let foldViewTip = 0;
  let flipDisplay = 0;

  function setPaperGrainLit(on) {
    paperGrainLit = on;
  }

  function applyPose(pose, falling) {
    const h = root.clientHeight;
    const inertia = phys.rotationInertia;
    const blend = falling ? 1 - inertia * 0.35 : 0.22;

    if (!shown) {
      shown = {
        ...pose,
        forceX: 0,
        forceY: 0,
        faceX: 0,
        faceY: 0,
        fRotX: 0,
        fRotY: 0,
        lift: 0,
      };
    } else {
      shown.x = lerp(shown.x, pose.x, blend);
      shown.y = lerp(shown.y, pose.y, blend);
      shown.z = lerp(shown.z, pose.z, blend);
      shown.rotX = lerp(shown.rotX, pose.rotX, blend);
      shown.rotY = lerp(shown.rotY, pose.rotY, blend);
      shown.rotZ = lerp(shown.rotZ, pose.rotZ, blend);
    }

    const ci = phys.cursorInfluence * cursorScale;
    const live = falling ? 0.35 : 1;
    const aimX = force.x * ci * live;
    const aimY = force.y * ci * live;
    const aimFaceX = force.faceX * ci * live;
    const aimFaceY = force.faceY * ci * live;
    const aimRotX = force.rotX * ci * live;
    const aimRotY = force.rotY * ci * live;
    const aimLift = force.lift * ci * live;

    shown.forceX = lerp(shown.forceX, aimX, falling ? 0.1 : 0.16);
    shown.forceY = lerp(shown.forceY, aimY, falling ? 0.1 : 0.16);
    shown.faceX = 0;
    shown.faceY = 0;
    shown.fRotX = lerp(shown.fRotX ?? 0, aimRotX, falling ? 0.1 : 0.22);
    shown.fRotY = lerp(shown.fRotY ?? 0, aimRotY, falling ? 0.1 : 0.22);
    shown.lift = lerp(shown.lift ?? 0, aimLift * 0.32, falling ? 0.08 : 0.18);

    const tip = foldViewTip;
    const ty = shown.y * (h * phys.cssY) + shown.forceY;
    const tx = shown.x * phys.cssX + shown.forceX;
    const tz = shown.z * phys.cssZ + shown.lift;
    const depthScale = 1 + shown.z * 0.04;

    // Single rigid transform — face stays glued to the stock (no separate face slide)
    rig.style.transform = `translate3d(${tx}px, ${ty}px, ${tz}px) scale(${depthScale}) rotateX(${shown.rotX + shown.fRotX + tip}deg) rotateY(${shown.rotY + shown.fRotY}deg) rotateZ(${shown.rotZ}deg)`;
    const flipFx = flipMotion(flipDisplay);
    card.style.transform = `translate3d(0, 0, calc(var(--layer-z, 80) * 1px + ${flipFx.liftZ.toFixed(1)}px)) scale(${flipFx.scale.toFixed(4)})`;
    if (cardFlip) {
      cardFlip.style.transform = `rotateY(${flipFx.rotateY.toFixed(2)}deg)`;
    }
    const flipHide = flipFx.lift;
    if (shadowsWrap) shadowsWrap.style.opacity = String(1 - flipHide * 0.95);
    if (hatchSlot) hatchSlot.style.opacity = String(1 - flipHide * 0.95);

    if (face) {
      face.style.transform = "none";
    }

    const angles = panelAngles(foldDisplay);
    if (panelTop) panelTop.style.transform = `rotateX(${angles.top}deg)`;
    if (panelMid) panelMid.style.transform = `rotateX(${angles.mid}deg)`;
    if (panelBot) panelBot.style.transform = `rotateX(${angles.bot}deg)`;
    const crease = creaseAmount(foldDisplay);
    const shade = panelShade(foldDisplay);
    card.style.setProperty("--crease", String(crease));
    const sheet = root.querySelector(".fold-sheet");
    if (sheet) {
      sheet.dataset.creased = crease > 0.06 ? "true" : "false";
      sheet.style.setProperty("--shade-top", String(shade.top));
      sheet.style.setProperty("--shade-mid", String(shade.mid));
      sheet.style.setProperty("--shade-bot", String(shade.bot));
      // React parity: fixed 4px — preserve-3d panels depth-test in front of hatch.
      sheet.style.transform = "translateZ(4px)";
    }

    const tex = root.querySelector(".physical-card__texture");
    if (tex && paperGrainLit && tex.style.display !== "none") {
      const tilt =
        (shown.rotY + shown.fRotY) / 40 +
        (shown.rotX + shown.fRotX) / 50 +
        cursor.x * 0.02 * cursorScale -
        cursor.y * 0.012 * cursorScale;
      // Dial base ± mild tilt — don't crush the grain map
      const litOp = clamp(
        litBase * (0.92 + tilt * 0.14),
        litBase * 0.72,
        Math.min(0.24, litBase * 1.28),
      );
      root.querySelectorAll(".physical-card").forEach((el) => {
        el.style.setProperty("--paper-lit-opacity", String(litOp));
      });
      const px = 50 + cursor.x * 5 * cursorScale + shown.fRotY * 0.25;
      const py = 50 + cursor.y * 4 * cursorScale - shown.fRotX * 0.2;
      root.querySelectorAll(".physical-card__texture-lit").forEach((node) => {
        node.style.backgroundPosition = `${px}% ${py}%`;
        node.style.backgroundSize = "105% 105%";
      });
    }

    // Dual profiles: fall (air) ↔ flat (table), blended by height
    const liftAmt = Math.max(0, shown.lift);
    const heightNorm = clamp(-shown.y + liftAmt / 70, 0, 1.2);
    const onTable = 1 - clamp(heightNorm, 0, 1);
    const air = 1 - onTable;
    // Prefer fall dials while dropping; height still blends during settle/lift
    const airMix = falling ? Math.max(air, 0.55) : air;
    const str = lerp(
      phys.flatShadowStrength,
      phys.fallShadowStrength,
      airMix,
    );
    const softAmt = lerp(
      phys.flatShadowSoftness,
      phys.fallShadowSoftness,
      airMix,
    );
    const shScale = clamp(
      lerp(phys.flatShadowScale, phys.fallShadowScale, airMix),
      0.4,
      2.4,
    );
    const shReach = clamp(
      lerp(phys.flatShadowReach, phys.fallShadowReach, airMix),
      0.2,
      2.5,
    );
    const cardW = rig.offsetWidth || 420;
    const cardH = rig.offsetHeight || 240;

    const totalRotX = shown.rotX + shown.fRotX + tip;
    const totalRotY = shown.rotY + shown.fRotY;
    const rx = (totalRotX * Math.PI) / 180;
    const ry = (totalRotY * Math.PI) / 180;
    const rz = shown.rotZ;
    const foldAmt = clamp(foldDisplay, 0, 1);
    const midRad = (angles.mid * Math.PI) / 180;
    const topRad = (angles.top * Math.PI) / 180;
    const botRad = (angles.bot * Math.PI) / 180;
    const third = cardH / 3;
    const foldedH = Math.max(
      third * 0.45,
      third *
        (Math.abs(Math.cos(midRad)) +
          Math.abs(Math.cos(topRad)) * 0.25 +
          Math.abs(Math.cos(botRad)) * 0.25),
    );
    const footH = (cardH * (1 - foldAmt) + foldedH * foldAmt) * shScale;
    const footW = cardW * (1 - foldAmt * 0.06) * shScale;
    const flipFoot = flipShadowFootprint(flipDisplay);
    const castFootW = footW * flipFoot.width;
    const castFootH = footH * flipFoot.height;
    const foldShiftY =
      Math.sin(midRad) * third * -0.22 * foldAmt + tip * 0.4 * foldAmt;

    const tiltX = Math.sin(ry);
    const tiltY = Math.sin(rx);
    // Shadows already live inside the rig, so they inherit the card's 3D pose.
    // Extra spin/skew/cast is for the table rest. In air, glue the silhouette.
    const table = 1 - clamp(heightNorm, 0, 1);
    // Fixed SE bias + tilt — cast lives on one side, not under the whole plate
    const castX =
      (5 +
        air * 8 * table +
        liftAmt * 0.12 +
        tiltX * (9 + air * 14 * table) +
        heightNorm * 6 * table) *
      shReach;
    const castY =
      (6 +
        air * 9 * table +
        liftAmt * 0.16 +
        tiltY * (7 + air * 12 * table) +
        heightNorm * 8 * table +
        foldShiftY) *
      shReach;
    const skew = clamp(tiltX * -10 + tiltY * 2.5, -12, 12) * table;
    const extraZ = rz * table;
    const foreX = clamp(0.94 - Math.abs(tiltX) * 0.05 - foldAmt * 0.03, 0.78, 0.98);
    const foreY = clamp(0.94 - Math.abs(tiltY) * 0.05 - foldAmt * 0.08, 0.55, 0.98);
    // One shared plate. Contact is only a tight umbra at rest — gone in air
    // so the fall never reads as a second card.
    const plateScale = 0.96 + heightNorm * 0.02;
    const plateX = foreX * plateScale;
    const plateY = foreY * plateScale;
    const castNudge = 0.52 + air * 0.12 * table;
    const castTx = castX * castNudge;
    const castTy = castY * castNudge;

    const base = `translate(-50%, -50%) rotate(${extraZ.toFixed(2)}deg) skewX(${skew.toFixed(2)}deg)`;

    if (shadowContact) {
      const cBlur =
        (4.5 + heightNorm * 2 * softAmt + liftAmt * 0.08 + foldAmt * 1.2) *
        (0.85 + softAmt * 0.1) *
        (0.85 + shScale * 0.12);
      shadowContact.style.width = `${castFootW}px`;
      shadowContact.style.height = `${castFootH}px`;
      shadowContact.style.transform = `translate(${castTx.toFixed(1)}px, ${castTy.toFixed(1)}px) ${base} scale(${plateX.toFixed(3)}, ${plateY.toFixed(3)})`;
      shadowContact.style.filter = `blur(${cBlur.toFixed(1)}px)`;
      shadowContact.style.opacity = String(
        (0.1 + onTable * 0.14) * str * (1 - foldAmt * 0.15) * table * flipFoot.opacity,
      );
    }

    if (shadowSoft) {
      const sBlur =
        (11 + heightNorm * 10 * softAmt + liftAmt * 0.12 + foldAmt * 2) *
        (0.75 + softAmt * 0.18) *
        (0.85 + shScale * 0.12);
      shadowSoft.style.width = `${castFootW}px`;
      shadowSoft.style.height = `${castFootH}px`;
      shadowSoft.style.transform = `translate(${castTx.toFixed(1)}px, ${castTy.toFixed(1)}px) ${base} scale(${(plateX * 1.03).toFixed(3)}, ${(plateY * 1.02).toFixed(3)})`;
      shadowSoft.style.filter = `blur(${sBlur.toFixed(1)}px)`;
      shadowSoft.style.opacity = String(
        (0.08 + onTable * 0.12 + air * 0.1) * str * (1 - foldAmt * 0.2) * flipFoot.opacity,
      );
    }

    root.style.perspective = `${phys.perspective}px`;
    lastPose = pose;
  }

  function onPointerMove(e) {
    const paneR = pane.getBoundingClientRect();
    cursorTarget.x = ((e.clientX - paneR.left) / paneR.width) * 2 - 1;
    cursorTarget.y = ((e.clientY - paneR.top) / paneR.height) * 2 - 1;

    const r = rig.getBoundingClientRect();
    if (r.width > 1 && r.height > 1) {
      cardLocalTarget.x = clamp(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -1.12,
        1.12,
      );
      cardLocalTarget.y = clamp(
        ((e.clientY - r.top) / r.height) * 2 - 1,
        -1.12,
        1.12,
      );
      onCardTarget = cursorCardWeight(
        cardLocalTarget.x,
        cardLocalTarget.y,
      );
    } else {
      cardLocalTarget.x = cursorTarget.x;
      cardLocalTarget.y = cursorTarget.y;
      onCardTarget = 0.24;
    }
  }

  function syncCursorForces() {
    if (cursorScaleTarget < 0.05) {
      forceTarget.rotY = 0;
      forceTarget.rotX = 0;
      forceTarget.lift = 0;
      forceTarget.x = 0;
      forceTarget.y = 0;
      return;
    }
    const w = onCardWeight;
    const nx = cardLocal.x;
    const ny = cardLocal.y;
    forceTarget.rotY = nx * cursorFeel.rotY * w;
    forceTarget.rotX = -ny * cursorFeel.rotX * w;
    forceTarget.lift =
      (cursorFeel.liftBase +
        (1 - Math.min(1, Math.hypot(nx, ny))) * cursorFeel.liftPeak) *
      w;
    forceTarget.x = nx * cursorFeel.xyX * w;
    forceTarget.y = ny * cursorFeel.xyY * w;
  }

  pane.addEventListener("pointermove", onPointerMove);
  pane.addEventListener("pointerleave", () => {
    cursorTarget.x = 0;
    cursorTarget.y = 0;
    cardLocalTarget.x = 0;
    cardLocalTarget.y = 0;
    onCardTarget = 0.24;
  });

  return {
    setCard(data) {
      const print = toPrintContent(data);
      materials.forEach((material) => {
        material.setContent(print);
        requestAnimationFrame(() => material.realign());
      });
    },
    setInteractive(on) {
      card.classList.toggle("is-live", on);
      root.classList.toggle("is-settled", on);
    },
    setPaperGrainLit,
    setLitBase(v) {
      litBase = clamp(Number(v) || MAT_DEFAULTS.litOpacity, 0.02, 0.3);
    },
    setCursorScaleTarget(v) {
      cursorScaleTarget = clamp(v, 0, 1);
    },
    setFoldDisplay(fold, viewTip) {
      foldDisplay = clamp(fold, 0, 1);
      foldViewTip = viewTip;
      applyOpening(foldDisplay);
    },
    setFlipDisplay(flip) {
      flipDisplay = clamp(flip, 0, 1);
      const onBack = flipDisplay > 0.5;
      card.dataset.face = onBack ? "back" : "front";
      card.setAttribute(
        "aria-label",
        onBack ? "Calling card back. Click to show front." : "Calling card. Click to show back.",
      );
      if (cardFront) cardFront.setAttribute("aria-hidden", onBack ? "true" : "false");
      if (cardBack) cardBack.setAttribute("aria-hidden", onBack ? "false" : "true");
    },
    setHatchLayer() {
      applyLayerZ();
    },
    getCursorFlatness() {
      return (
        Math.abs(force.rotX) +
        Math.abs(force.rotY) +
        Math.abs(force.lift) +
        Math.abs(force.x) +
        Math.abs(force.y)
      );
    },
    tickForces() {
      cursorScale += (cursorScaleTarget - cursorScale) * 0.14;
      cursor.x += (cursorTarget.x - cursor.x) * 0.18;
      cursor.y += (cursorTarget.y - cursor.y) * 0.18;
      cardLocal.x += (cardLocalTarget.x - cardLocal.x) * 0.2;
      cardLocal.y += (cardLocalTarget.y - cardLocal.y) * 0.2;
      onCardWeight += (onCardTarget - onCardWeight) * 0.22;
      syncCursorForces();
      forceTarget.faceX = 0;
      forceTarget.faceY = 0;
      force.x += (forceTarget.x - force.x) * 0.16;
      force.y += (forceTarget.y - force.y) * 0.16;
      force.faceX += (forceTarget.faceX - force.faceX) * 0.18;
      force.faceY += (forceTarget.faceY - force.faceY) * 0.18;
      force.rotX += (forceTarget.rotX - force.rotX) * 0.2;
      force.rotY += (forceTarget.rotY - force.rotY) * 0.2;
      force.lift += (forceTarget.lift - force.lift) * 0.16;
    },
    resetShown() {
      shown = null;
    },
    applyPose,
    fps,
  };
}

function boot() {
  const cssRoot = document.querySelector("[data-engine='css'] .css-stage");
  const replay = document.getElementById("replay");
  const hosts = [...document.querySelectorAll("[data-physical-host]")];
  const labRoot = document.getElementById("lab-devtools");
  const hintEl = document.querySelector(".css-scroll-hint");

  const savedPrefs = loadPhysPrefs();
  applyPhysPrefs(savedPrefs);
  applyMatPrefs(savedPrefs);
  applyCursorPrefs(savedPrefs);
  applyFoldPrefs(savedPrefs);
  applyHatchPrefs(savedPrefs);
  applyFlipPrefs(savedPrefs);

  const materials = hosts.map((host, i) =>
    mountPhysicalCard(host, {
      hideContactShadow: true,
      showPrint: !host.hasAttribute("data-card-back"),
      filterId: `lab-css-ink-${i}`,
      mapSize: 512,
      stock: {
        paperBase: mat.paperBase,
        litOpacity: mat.litOpacity,
        seed: host.hasAttribute("data-card-back")
          ? LOCKED_STOCK.seed + 31
          : LOCKED_STOCK.seed,
      },
      ink: {
        density: mat.density,
        grain: mat.grain,
        absorption: mat.absorption,
        relief: mat.relief,
      },
      typeScale: mat.typeScale,
      inkColor: mat.inkColor,
      backFont: host.hasAttribute("data-card-back") ? mat.backFont : undefined,
      backInitials: "TL",
    }),
  );

  const css = createCssEngine(cssRoot, materials);
  css.setLitBase(mat.litOpacity);
  if (cssRoot) {
    cssRoot.style.setProperty("--lab-card-w", `${mat.cardWidth}px`);
    cssRoot.style.setProperty("--paper-base", mat.paperBase);
  }

  let phase = "falling";
  let phaseStart = performance.now();
  let textEffects =
    savedPrefs?.textEffects === true ||
    mat.grain > 0.02 ||
    mat.absorption > 0.02 ||
    mat.relief > 0.02;
  let paperGrain = savedPrefs?.paperGrain !== false;
  let foldTarget = 0;
  let foldDisplay = 0;
  let foldPhase = "idle"; // idle | dragging | returning | opening | open
  let flipTarget = 0;
  let flipDisplay = 0;
  let pendingFoldDelta = 0;
  let scrollIdle = 0;
  let hintShown = false;
  let hintTimer = 0;
  const HINT_MS = 2000;
  const HINT_KEY = "card-lab-scroll-hint";
  const hintDismissed =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(HINT_KEY) === "1";

  function persist(extra = {}) {
    savePhysPrefs({ textEffects, paperGrain, ...extra });
  }

  function collapseLabSections() {
    document.querySelectorAll("#lab-devtools details.lab-debug").forEach((el) => {
      el.open = false;
    });
  }

  function setLab(on) {
    document.body.classList.toggle("is-lab", on);
    if (labRoot) labRoot.hidden = !on;
    if (on) collapseLabSections();
    const url = new URL(location.href);
    if (on) url.searchParams.set("lab", "1");
    else url.searchParams.delete("lab");
    if (startDebug) url.searchParams.set("debug", "1");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  // Visitor surface by default; ?lab=1 or key L opens the dial (sections collapsed).
  // ?debug=1 opens the same dial on this surface (no second localhost).
  const params = new URLSearchParams(location.search);
  const startDebug = params.has("debug");
  const startLab = params.has("lab") || startDebug;
  setLab(startLab);

  function drop() {
    phase = "falling";
    phaseStart = performance.now();
    foldTarget = 0;
    foldDisplay = 0;
    foldPhase = "idle";
    flipTarget = 0;
    flipDisplay = 0;
    pendingFoldDelta = 0;
    css.setFoldDisplay(0, 0);
    css.setFlipDisplay(0);
    css.setCursorScaleTarget(1);
    css.setInteractive(false);
    css.resetShown();
    css.applyPose(poseAt(0), true);
    if (hintEl) {
      hintEl.dataset.visible = "false";
      hintShown = false;
    }
    window.clearTimeout(hintTimer);
  }

  function freshDrop() {
    css.setCard(CARD);
    drop();
  }

  function showHintSoon() {
    if (hintDismissed || hintShown) return;
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => {
      if (phase !== "settled" || foldDisplay > 0.02) return;
      hintShown = true;
      if (hintEl) {
        hintEl.dataset.visible = "true";
        hintEl.setAttribute("aria-hidden", "false");
      }
    }, HINT_MS);
  }

  function dismissHint() {
    try {
      sessionStorage.setItem(HINT_KEY, "1");
    } catch {
      /* private */
    }
    if (hintEl) {
      hintEl.dataset.visible = "false";
      hintEl.setAttribute("aria-hidden", "true");
    }
  }

  function applyMaterialToCards() {
    materials.forEach((m, i) => {
      m.setStock({
        paperBase: mat.paperBase,
        litOpacity: mat.litOpacity,
      });
      m.setInk({
        density: mat.density,
        grain: mat.grain,
        absorption: mat.absorption,
        relief: mat.relief,
      });
      m.setTypeScale(mat.typeScale);
      m.setInkColor(mat.inkColor);
      m.setPaperGrain(paperGrain);
      if (hosts[i]?.hasAttribute("data-card-back")) {
        m.setBackFont?.(mat.backFont);
      }
    });
    css.setLitBase(mat.litOpacity);
    if (cssRoot) {
      cssRoot.style.setProperty("--lab-card-w", `${mat.cardWidth}px`);
      cssRoot.style.setProperty("--paper-base", mat.paperBase);
    }
    textEffects =
      mat.grain > 0.02 || mat.absorption > 0.02 || mat.relief > 0.02;
    const btn = document.getElementById("text-effects");
    if (btn) {
      btn.classList.toggle("is-active", textEffects);
      btn.setAttribute("aria-pressed", textEffects ? "true" : "false");
      btn.textContent = textEffects ? "Text effects" : "Flat ink";
    }
  }

  function syncTextEffectsButton() {
    const btn = document.getElementById("text-effects");
    if (!btn) return;
    btn.classList.toggle("is-active", textEffects);
    btn.setAttribute("aria-pressed", textEffects ? "true" : "false");
    btn.textContent = textEffects ? "Text effects" : "Flat ink";
    if (textEffects) {
      mat.grain = LOCKED_INK.grain;
      mat.absorption = LOCKED_INK.absorption;
      mat.relief = LOCKED_INK.relief;
    } else {
      mat.grain = 0;
      mat.absorption = 0;
      mat.relief = 0;
    }
    mat.density = mat.density || LOCKED_INK.density;
    applyMaterialToCards();
    syncMatInputs();
  }

  function syncPaperGrainButton() {
    const btn = document.getElementById("paper-grain");
    if (!btn) return;
    btn.classList.toggle("is-active", paperGrain);
    btn.setAttribute("aria-pressed", paperGrain ? "true" : "false");
    btn.textContent = paperGrain ? "Paper grain" : "Flat paper";
    materials.forEach((m) => m.setPaperGrain(paperGrain));
    css.setPaperGrainLit(paperGrain);
  }

  function syncMatInputs() {
    const root = document.getElementById("mat-debug");
    if (!root) return;
    root.querySelectorAll("[data-mat]").forEach((input) => {
      const key = input.dataset.mat;
      if (!(key in mat)) return;
      input.value = String(mat[key]);
      const out = root.querySelector(`[data-mat-val="${key}"]`);
      if (out && typeof mat[key] === "number") {
        out.textContent =
          key === "cardWidth" ? String(Math.round(mat[key])) : mat[key].toFixed(2);
      }
    });
    root.querySelectorAll("[data-stock]").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        btn.dataset.stock?.toLowerCase() === mat.paperBase.toLowerCase(),
      );
    });
  }

  function syncCursorInputs() {
    const root = document.getElementById("cursor-debug");
    if (!root) return;
    root.querySelectorAll("[data-cur]").forEach((input) => {
      const key = input.dataset.cur;
      if (!(key in cursorFeel)) return;
      input.value = String(cursorFeel[key]);
      const out = root.querySelector(`[data-cur-val="${key}"]`);
      if (out) out.textContent = Number(cursorFeel[key]).toFixed(2);
    });
  }

  function syncFoldInputs() {
    const root = document.getElementById("fold-debug");
    if (!root) return;
    root.querySelectorAll("[data-fold]").forEach((input) => {
      const key = input.dataset.fold;
      if (!(key in FOLD_END)) return;
      input.value = String(FOLD_END[key]);
      const out = root.querySelector(`[data-fold-val="${key}"]`);
      if (out) out.textContent = String(Math.round(FOLD_END[key]));
    });
  }

  function syncHatchInputs() {
    const root = document.getElementById("fold-debug");
    if (!root) return;
    root.querySelectorAll("[data-hatch]").forEach((input) => {
      const key = input.dataset.hatch;
      if (!(key in HATCH_OPENING)) return;
      input.value = String(HATCH_OPENING[key]);
      const out = root.querySelector(`[data-hatch-val="${key}"]`);
      if (out) {
        out.textContent =
          key === "layerZ"
            ? String(Math.round(HATCH_OPENING[key]))
            : Number(HATCH_OPENING[key]).toFixed(2);
      }
    });
  }

  function syncOpenFoldInput() {
    const root = document.getElementById("fold-debug");
    if (!root) return;
    const input = root.querySelector('[data-open="fold"]');
    const out = root.querySelector('[data-open-val="fold"]');
    if (input) input.value = String(foldDisplay);
    if (out) out.textContent = foldDisplay.toFixed(2);
  }

  function syncFlipInputs() {
    const root = document.getElementById("fold-debug");
    if (!root) return;
    const input = root.querySelector('[data-flip="ms"]');
    const out = root.querySelector('[data-flip-val="ms"]');
    if (input) input.value = String(FLIP.ms);
    if (out) out.textContent = String(Math.round(FLIP.ms));
  }

  applyMaterialToCards();
  syncPaperGrainButton();
  syncMatInputs();
  syncCursorInputs();
  syncFoldInputs();
  syncHatchInputs();
  syncFlipInputs();
  const teBtn = document.getElementById("text-effects");
  if (teBtn) {
    teBtn.classList.toggle("is-active", textEffects);
    teBtn.setAttribute("aria-pressed", textEffects ? "true" : "false");
    teBtn.textContent = textEffects ? "Text effects" : "Flat ink";
  }

  function settleFoldScroll() {
    if (foldPhase !== "dragging") return;
    if (shouldSnapOpen(foldTarget)) {
      foldPhase = "opening";
      foldTarget = 1;
    } else {
      foldPhase = "returning";
    }
  }

  function onWheel(e) {
    if (phase !== "settled") {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    dismissHint();

    const raw =
      e.deltaMode === 1
        ? e.deltaY * 16
        : e.deltaMode === 2
          ? e.deltaY * 32
          : e.deltaY;
    let delta = raw * SCROLL_GAIN;

    const scroll = resolveScrollOnCard({ flipTarget, flipDisplay, delta });
    if (scroll.kind === "flip-to-front") {
      flipTarget = scroll.flipTarget ?? 0;
      pendingFoldDelta += scroll.stashDelta;
      return;
    }
    if (scroll.kind === "defer-fold") {
      pendingFoldDelta += scroll.stashDelta;
      return;
    }

    if (Math.abs(pendingFoldDelta) > 0.001) {
      delta += pendingFoldDelta;
      pendingFoldDelta = 0;
    }

    // Flatten cursor lean first so fold starts from a flat card
    css.setCursorScaleTarget(0);

    if (foldPhase === "open" || foldPhase === "opening") {
      if (delta >= 0) {
        foldTarget = 1;
        foldDisplay = 1;
        foldPhase = "open";
        return;
      }
      foldPhase = "dragging";
      foldTarget = clamp(foldDisplay + delta, 0, 1);
      window.clearTimeout(scrollIdle);
      scrollIdle = window.setTimeout(settleFoldScroll, SCROLL_IDLE_MS);
      return;
    }

    if (foldPhase === "returning") foldPhase = "dragging";

    foldTarget = clamp(foldTarget + delta, 0, 1);
    if (delta > 0 && foldTarget >= 0.98) {
      window.clearTimeout(scrollIdle);
      foldPhase = "opening";
      foldTarget = 1;
      return;
    }
    foldPhase = "dragging";
    window.clearTimeout(scrollIdle);
    scrollIdle = window.setTimeout(settleFoldScroll, SCROLL_IDLE_MS);
  }

  window.addEventListener("wheel", onWheel, { passive: false });

  let flipClock = performance.now();

  function frame(now) {
    css.fps.tick(now);
    css.tickForces();

    let pose;
    let falling = false;
    if (phase === "falling") {
      falling = true;
      const t = Math.min(1, (now - phaseStart) / phys.fallMs);
      pose = poseAt(t);
      if (t >= 1) {
        phase = "settling";
        phaseStart = now;
      }
    } else if (phase === "settling") {
      const u = Math.min(1, (now - phaseStart) / phys.settleMs);
      pose = settlePose(u);
      if (u >= 1) {
        phase = "settled";
        css.setInteractive(true);
        showHintSoon();
      }
    } else {
      pose = settlePose(1);
    }

    // Fold lag + open/return springs (after settle)
    if (phase === "settled") {
      if (foldPhase === "opening") {
        foldTarget = 1;
        foldDisplay = applyLag(foldDisplay, 1, 0.5);
        if (foldDisplay > 0.992) {
          foldDisplay = 1;
          foldPhase = "open";
        }
      } else if (foldPhase === "returning") {
        foldTarget = Math.max(0, foldTarget - 0.045);
        foldDisplay = applyLag(foldDisplay, foldTarget, 0.38);
        if (foldTarget <= 0.001 && foldDisplay <= 0.001) {
          foldTarget = 0;
          foldDisplay = 0;
          foldPhase = "idle";
          css.setCursorScaleTarget(1);
        }
      } else if (foldPhase === "dragging" || foldPhase === "open") {
        foldDisplay = applyLag(foldDisplay, foldTarget, 0.45);
      } else {
        foldDisplay = applyLag(foldDisplay, foldTarget, 0.35);
      }

      const tip = FOLD_END.viewTip * foldDisplay;
      css.setFoldDisplay(foldDisplay, tip);
      const dt = Math.min(48, now - flipClock);
      flipClock = now;
      flipDisplay = applyLag(flipDisplay, flipTarget, flipLagAlpha(FLIP.ms, dt));
      css.setFlipDisplay(flipDisplay);
      css.setCursorScaleTarget(
        shouldEnableCursorLean({
          foldDisplay,
          flipTarget,
          flipDisplay,
          foldPhase,
        })
          ? 1
          : 0,
      );
      if (startDebug) syncOpenFoldInput();
    }

    css.applyPose(pose, falling || phase === "settling");
    requestAnimationFrame(frame);
  }

  css.setCard(CARD);
  drop();
  if (startDebug) {
    phase = "settled";
    css.setInteractive(true);
    css.applyPose(settlePose(1), false);
  }
  requestAnimationFrame(frame);

  replay?.addEventListener("click", freshDrop);

  cssRoot?.querySelector(".css-card")?.addEventListener("click", () => {
    if (phase !== "settled") return;
    if (foldDisplay > 0.04 || foldPhase !== "idle") return;
    flipTarget = flipTarget > 0.5 ? 0 : 1;
    pendingFoldDelta = 0;
    dismissHint();
  });

  document.getElementById("text-effects")?.addEventListener("click", () => {
    textEffects = !textEffects;
    syncTextEffectsButton();
    css.setCard(CARD);
    persist();
  });

  document.getElementById("paper-grain")?.addEventListener("click", () => {
    paperGrain = !paperGrain;
    syncPaperGrainButton();
    css.setCard(CARD);
    persist();
  });

  document.querySelectorAll('input[name="motion"]').forEach((input) => {
    if (input.value === phys.mode) input.checked = true;
    input.addEventListener("change", () => {
      if (!input.checked) return;
      phys.mode = input.value;
      persist();
      freshDrop();
    });
  });

  const debugRoot = document.getElementById("phys-debug");
  const matRoot = document.getElementById("mat-debug");
  const curRoot = document.getElementById("cursor-debug");
  const foldRoot = document.getElementById("fold-debug");
  for (const el of [matRoot, curRoot, foldRoot, debugRoot]) {
    if (el) el.open = false;
  }

  if (matRoot) {
    matRoot.querySelectorAll("[data-mat]").forEach((input) => {
      const key = input.dataset.mat;
      const sync = () => {
        if (key === "paperBase" || key === "inkColor" || key === "backFont") {
          mat[key] = input.value;
        } else {
          mat[key] = Number(input.value);
        }
        const out = matRoot.querySelector(`[data-mat-val="${key}"]`);
        if (out && typeof mat[key] === "number") {
          out.textContent =
            key === "cardWidth"
              ? String(Math.round(mat[key]))
              : Number(mat[key]).toFixed(2);
        }
        applyMaterialToCards();
        persist();
      };
      input.addEventListener("input", sync);
    });

    matRoot.querySelectorAll("[data-stock]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const hex = btn.dataset.stock;
        if (!hex) return;
        mat.paperBase = hex;
        const colorInput = matRoot.querySelector('[data-mat="paperBase"]');
        if (colorInput) colorInput.value = hex;
        applyMaterialToCards();
        syncMatInputs();
        persist();
      });
    });

    matRoot.querySelector("[data-mat-reset]")?.addEventListener("click", () => {
      Object.assign(mat, MAT_DEFAULTS);
      textEffects = false;
      applyMaterialToCards();
      syncMatInputs();
      persist();
    });
  }

  if (curRoot) {
    curRoot.querySelectorAll("[data-cur]").forEach((input) => {
      const key = input.dataset.cur;
      const sync = () => {
        cursorFeel[key] = Number(input.value);
        const out = curRoot.querySelector(`[data-cur-val="${key}"]`);
        if (out) out.textContent = cursorFeel[key].toFixed(2);
        persist();
      };
      input.addEventListener("input", sync);
    });
    curRoot.querySelector("[data-cur-reset]")?.addEventListener("click", () => {
      Object.assign(cursorFeel, CURSOR_DEFAULTS);
      syncCursorInputs();
      persist();
    });
  }

  if (foldRoot) {
    foldRoot.querySelectorAll("[data-fold]").forEach((input) => {
      const key = input.dataset.fold;
      const sync = () => {
        const v = Number(input.value);
        setFoldEnd({ [key]: v });
        const out = foldRoot.querySelector(`[data-fold-val="${key}"]`);
        if (out) out.textContent = String(Math.round(v));
        persist();
      };
      input.addEventListener("input", sync);
    });
    foldRoot.querySelector("[data-fold-reset]")?.addEventListener("click", () => {
      resetFoldEnd();
      syncFoldInputs();
      persist();
    });

    foldRoot.querySelectorAll("[data-hatch]").forEach((input) => {
      const key = input.dataset.hatch;
      const sync = () => {
        const v = Number(input.value);
        setHatchOpening({ [key]: v });
        const out = foldRoot.querySelector(`[data-hatch-val="${key}"]`);
        if (out) {
          out.textContent =
            key === "layerZ" ? String(Math.round(v)) : v.toFixed(2);
        }
        css.setHatchLayer();
        css.setFoldDisplay(foldDisplay, FOLD_END.viewTip * foldDisplay);
        persist();
      };
      input.addEventListener("input", sync);
    });
    foldRoot.querySelector("[data-hatch-reset]")?.addEventListener("click", () => {
      resetHatchOpening();
      syncHatchInputs();
      css.setHatchLayer();
      css.setFoldDisplay(foldDisplay, FOLD_END.viewTip * foldDisplay);
      persist();
    });

    foldRoot.querySelectorAll("[data-flip]").forEach((input) => {
      const sync = () => {
        const v = Number(input.value);
        setFlip({ ms: v });
        const out = foldRoot.querySelector('[data-flip-val="ms"]');
        if (out) out.textContent = String(Math.round(v));
        persist();
      };
      input.addEventListener("input", sync);
    });

    foldRoot.querySelector('[data-open="fold"]')?.addEventListener("input", (e) => {
      const f = clamp(Number(e.target.value), 0, 1);
      foldTarget = f;
      foldDisplay = f;
      foldPhase = f >= 0.98 ? "open" : f <= 0.001 ? "idle" : "dragging";
      css.setCursorScaleTarget(f > 0.04 ? 0 : 1);
      css.setFoldDisplay(f, FOLD_END.viewTip * f);
      syncOpenFoldInput();
      if (phase !== "settled") {
        phase = "settled";
        css.setInteractive(true);
        css.applyPose(settlePose(1), false);
      }
    });
  }

  if (debugRoot) {
    debugRoot.querySelectorAll("[data-phys]").forEach((input) => {
      const key = input.dataset.phys;
      const out = debugRoot.querySelector(`[data-phys-val="${key}"]`);
      if (key in phys && typeof phys[key] === "number") {
        input.value = String(phys[key]);
      }
      const sync = () => {
        const v = Number(input.value);
        phys[key] = v;
        if (out) out.textContent = v.toFixed(2);
        if (key === "perspective") {
          cssRoot.style.perspective = `${phys.perspective}px`;
        }
        persist();
      };
      input.addEventListener("input", sync);
      sync();
    });

    const resetBtn = debugRoot.querySelector("[data-phys-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        Object.assign(phys, PHYS_DEFAULTS);
        debugRoot.querySelectorAll("[data-phys]").forEach((input) => {
          const key = input.dataset.phys;
          if (key in PHYS_DEFAULTS && typeof PHYS_DEFAULTS[key] === "number") {
            input.value = String(PHYS_DEFAULTS[key]);
            input.dispatchEvent(new Event("input"));
          }
        });
        document.querySelectorAll('input[name="motion"]').forEach((input) => {
          input.checked = input.value === PHYS_DEFAULTS.mode;
        });
        persist();
        freshDrop();
      });
    }
  }

  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.code === "Space") {
      e.preventDefault();
      freshDrop();
      return;
    }
    if (e.key === "l" || e.key === "L") {
      e.preventDefault();
      const next = !document.body.classList.contains("is-lab");
      setLab(next);
    }
  });
}

boot();

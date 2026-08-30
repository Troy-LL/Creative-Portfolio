/** Curved calling-card fall → flat rest. Pure math; locked PHYS from card-lab. */

export const FALL_PHYS = {
  mode: "curved" as const,
  curveAmount: 1.6,
  fallMs: 1400,
  settleMs: 520,
  lateralDrift: 0.86,
  rotationResponse: 0.7,
  gravity: 2,
  airResistance: 0.3,
  /** CSS mapping from normalized pose → px (matches card-lab) */
  cssY: 0.48,
  cssX: 150,
  cssZ: 190,
  /** Resting translateZ before fold viewTip (matches FoldStage rest). */
  restZ: 40,
};

export type FallPose = {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  t: number;
  air: number;
};

const REST: FallPose = {
  x: 0,
  y: 0,
  z: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  t: 1,
  air: 0,
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function gravityT(t: number, g: number) {
  const x = clamp(t, 0, 1);
  const p = 1 + (g - 1) * 0.55;
  return Math.pow(x, p);
}

function cubic1(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function cubic1Dt(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return (
    3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2)
  );
}

type Vec3 = { x: number; y: number; z: number };

function cubic3(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  return {
    x: cubic1(p0.x, p1.x, p2.x, p3.x, t),
    y: cubic1(p0.y, p1.y, p2.y, p3.y, t),
    z: cubic1(p0.z, p1.z, p2.z, p3.z, t),
  };
}

function cubic3Dt(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  return {
    x: cubic1Dt(p0.x, p1.x, p2.x, p3.x, t),
    y: cubic1Dt(p0.y, p1.y, p2.y, p3.y, t),
    z: cubic1Dt(p0.z, p1.z, p2.z, p3.z, t),
  };
}

function pathControls(curveAmt: number, drift: number) {
  const c = curveAmt;
  const d = drift;
  const end = { x: REST.x, y: REST.y, z: REST.z };
  return {
    p0: { x: -0.22 * d * c, y: -1.02, z: 0.72 },
    p1: { x: 0.48 * d * c, y: -0.72, z: 0.55 },
    p2: { x: -0.18 * d * c, y: -0.28, z: 0.2 },
    p3: end,
  };
}

function orientationFromTangent(
  vel: Vec3,
  tAir: number,
  response: number,
): { rotX: number; rotY: number; rotZ: number } {
  const speed = Math.hypot(vel.x, vel.y, vel.z) + 1e-5;
  const nx = vel.x / speed;
  const ny = vel.y / speed;
  const nz = vel.z / speed;
  const r = response;

  return {
    rotZ: clamp(nx * -38 * r, -28, 28) * tAir,
    rotY: clamp(nx * 42 * r + nz * -12 * r, -32, 32) * tAir,
    rotX:
      clamp((1 - Math.abs(ny)) * 28 * r + nz * 18 * r + 8 * r, -8, 48) * tAir,
  };
}

function secondaryDrift(t: number, air: number) {
  const w = air * air;
  return {
    rotX: Math.sin(t * Math.PI * 2.1) * 3.2 * w,
    rotY: Math.sin(t * Math.PI * 1.35 + 0.4) * 4.5 * w,
    rotZ: Math.sin(t * Math.PI * 1.8 + 0.2) * 3.8 * w,
  };
}

/** rawT in 0…1 along the fall. */
export function fallPoseAt(rawT: number, phys = FALL_PHYS): FallPose {
  const t = gravityT(rawT, phys.gravity);
  const { p0, p1, p2, p3 } = pathControls(phys.curveAmount, phys.lateralDrift);
  const pos = cubic3(p0, p1, p2, p3, t);
  const vel = cubic3Dt(p0, p1, p2, p3, t);
  const air = Math.pow(1 - t, 1 + phys.airResistance);
  const orient = orientationFromTangent(vel, air, phys.rotationResponse);
  const drift = secondaryDrift(rawT, air);
  const land = smoothstep((t - 0.55) / 0.45);

  return {
    x: pos.x,
    y: pos.y,
    z: pos.z,
    rotX: lerp(orient.rotX + drift.rotX, REST.rotX, land),
    rotY: lerp(orient.rotY + drift.rotY, REST.rotY, land),
    rotZ: lerp(orient.rotZ + drift.rotZ, REST.rotZ, land),
    t,
    air,
  };
}

/** u in 0…1 settle after fall lands. */
export function settlePoseAt(u: number, phys = FALL_PHYS): FallPose {
  const end = fallPoseAt(1, phys);
  const damp = Math.exp(-5.2 * u) * Math.sin(u * Math.PI * 2.15);
  const flatten = smoothstep(u);
  return {
    x: lerp(end.x, REST.x, flatten),
    y: lerp(end.y, REST.y, flatten) + damp * 0.012,
    z: lerp(end.z, REST.z, flatten),
    rotX: lerp(end.rotX, REST.rotX, flatten) + damp * 1.2 * (1 - u),
    rotY: lerp(end.rotY, REST.rotY, flatten) + damp * 0.8 * (1 - u),
    rotZ: lerp(end.rotZ, REST.rotZ, flatten) + damp * 0.6 * (1 - u),
    t: 1,
    air: 0,
  };
}

export function fallRestPose(): FallPose {
  return { ...REST };
}

/** Map normalized fall pose → CSS transform pieces for the fold card rig. */
export function fallCssTransform(
  pose: FallPose,
  stageHeightPx: number,
  phys = FALL_PHYS,
): { transform: string; heightNorm: number } {
  const ty = pose.y * (stageHeightPx * phys.cssY);
  const tx = pose.x * phys.cssX;
  const tz = phys.restZ + pose.z * phys.cssZ;
  const depthScale = 1 + pose.z * 0.04;
  const heightNorm = clamp(-pose.y, 0, 1.2);
  return {
    transform: `translate3d(${tx}px, ${ty}px, ${tz}px) scale(${depthScale}) rotateX(${pose.rotX}deg) rotateY(${pose.rotY}deg) rotateZ(${pose.rotZ}deg)`,
    heightNorm,
  };
}

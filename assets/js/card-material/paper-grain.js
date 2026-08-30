/** Deterministic PRNG — same seed → same surface forever. Port of calling-card paperGrain. */

const cache = new Map();

function hash2(seed, ix, iy) {
  let n = (ix * 374761393 + iy * 668265263 + seed * 982451653) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash2(seed, x0, y0);
  const n10 = hash2(seed, x0 + 1, y0);
  const n01 = hash2(seed, x0, y0 + 1);
  const n11 = hash2(seed, x0 + 1, y0 + 1);
  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

function fbm(x, y, seed, octaves, lacunarity = 2.05, gain = 0.52) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + i * 97);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

function fillHeight(seed, size, height) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      const macro =
        fbm(u * 3.2, v * 2.7, seed + 1, 3) * 0.65 +
        fbm(u * 6.5 + 1.3, v * 5.8 + 0.7, seed + 2, 2) * 0.35;

      const toothA = fbm(u * 95, v * 102, seed + 11, 5, 2.1, 0.55);
      const toothB = fbm(u * 145 + 8, v * 138 + 3, seed + 12, 4, 2.15, 0.5);
      const toothC = fbm(u * 210 + 2, v * 195 + 11, seed + 13, 3, 2.2, 0.48);
      const toothD = fbm(u * 120 + v * 18, v * 28, seed + 14, 3);
      const tooth =
        toothA * 0.38 + toothB * 0.28 + toothC * 0.22 + toothD * 0.12;

      const micro = fbm(u * 340, v * 355, seed + 21, 2, 2.3, 0.45);
      const poreGate = fbm(u * 55, v * 58, seed + 22, 2);
      const pore = micro * (poreGate > 0.58 ? 1 : 0.15);

      height[y * size + x] =
        (macro - 0.5) * 0.12 + (tooth - 0.5) * 1.0 + (pore - 0.5) * 0.28;
    }
  }
}

function copyPix(d, size, tx, ty, sx, sy) {
  const ti = (ty * size + tx) * 4;
  const si = (sy * size + sx) * 4;
  d[ti] = d[si];
  d[ti + 1] = d[si + 1];
  d[ti + 2] = d[si + 2];
  d[ti + 3] = 255;
}

/**
 * One height field → lit map (paper) + ink coverage / pores.
 * Grain algorithm unchanged from the locked tooth pass.
 */
export function buildPaperMaps(seed, size = 768) {
  const key = `maps:tooth3+ink3:${seed}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { litUrl: "", heightUrl: "", inkUrl: "", inkBreakupUrl: "" };
  }

  const height = new Float32Array(size * size);
  fillHeight(seed, size, height);

  const blurH = new Float32Array(size * size);
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      blurH[i] =
        (height[i] +
          height[i - 1] +
          height[i + 1] +
          height[i - size] +
          height[i + size]) /
        5;
    }
  }

  const hImg = ctx.createImageData(size, size);
  const hd = hImg.data;
  for (let i = 0; i < height.length; i++) {
    const g = Math.max(
      0,
      Math.min(255, Math.round((0.5 + height[i] * 0.5) * 255)),
    );
    const o = i * 4;
    hd[o] = hd[o + 1] = hd[o + 2] = g;
    hd[o + 3] = 255;
  }
  ctx.putImageData(hImg, 0, 0);
  const heightUrl = canvas.toDataURL("image/png");

  const inkImg = ctx.createImageData(size, size);
  const idata = inkImg.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const u = x / size;
      const v = y / size;
      const hi = height[i];
      const fine = hi - (blurH[i] || 0);

      const covA = fbm(u * 420, v * 440, seed + 301, 3, 2.25, 0.5);
      const covB = fbm(u * 680 + v * 40, v * 620, seed + 302, 2, 2.4, 0.45);
      const coverage = covA * 0.55 + covB * 0.45;

      const poreNoise = fbm(u * 900, v * 920, seed + 303, 2);
      const inValley = hi < -0.04 || fine < -0.03;
      const pore =
        inValley && poreNoise > 0.72
          ? (poreNoise - 0.72) * 1.8
          : poreNoise > 0.88
            ? (poreNoise - 0.88) * 0.9
            : 0;

      let t = 0.42 + hi * 0.35 + fine * 0.55 + (coverage - 0.5) * 0.55;
      t = Math.max(0, Math.min(1, t - pore * 0.55));
      const g = Math.round(12 + t * 30);
      const o = i * 4;
      idata[o] = g;
      idata[o + 1] = Math.round(g * 0.96);
      idata[o + 2] = Math.round(g * 0.9);
      idata[o + 3] = 255;
    }
  }
  ctx.putImageData(inkImg, 0, 0);
  const inkUrl = canvas.toDataURL("image/png");

  const brImg = ctx.createImageData(size, size);
  const bd = brImg.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const u = x / size;
      const v = y / size;
      const hi = height[i];
      const fine = hi - (blurH[i] || 0);
      const poreNoise = fbm(u * 900, v * 920, seed + 303, 2);
      const inValley = hi < -0.04 || fine < -0.03;
      const pore =
        inValley && poreNoise > 0.72
          ? (poreNoise - 0.72) * 2.2
          : poreNoise > 0.88
            ? (poreNoise - 0.88) * 1.1
            : 0;
      const g = Math.round(128 + (0.5 - pore) * 50 + fine * 40);
      const o = i * 4;
      const c = Math.max(90, Math.min(160, g));
      bd[o] = bd[o + 1] = bd[o + 2] = c;
      bd[o + 3] = 255;
    }
  }
  ctx.putImageData(brImg, 0, 0);
  const inkBreakupUrl = canvas.toDataURL("image/png");

  const lx = -0.48;
  const ly = -0.58;
  const lz = 0.66;
  const invL = 1 / Math.hypot(lx, ly, lz);
  const Lx = lx * invL;
  const Ly = ly * invL;
  const Lz = lz * invL;
  const nScale = 3.8;
  const lImg = ctx.createImageData(size, size);
  const ld = lImg.data;

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      const dzdx = (height[i + 1] - height[i - 1]) * nScale;
      const dzdy = (height[i + size] - height[i - size]) * nScale;
      const nx = -dzdx;
      const ny = -dzdy;
      const nz = 1;
      const inv = 1 / Math.hypot(nx, ny, nz);
      let ndotl = nx * inv * Lx + ny * inv * Ly + nz * inv * Lz;
      ndotl = Math.max(0.28, Math.min(0.95, ndotl));
      const lit = 0.5 + (ndotl - 0.58) * 0.72;
      const g = Math.max(0, Math.min(255, Math.round(lit * 255)));
      const o = i * 4;
      ld[o] = ld[o + 1] = ld[o + 2] = g;
      ld[o + 3] = 255;
    }
  }
  for (let x = 0; x < size; x++) {
    copyPix(ld, size, x, 0, x, 1);
    copyPix(ld, size, x, size - 1, x, size - 2);
  }
  for (let y = 0; y < size; y++) {
    copyPix(ld, size, 0, y, 1, y);
    copyPix(ld, size, size - 1, y, size - 2, y);
  }
  ctx.putImageData(lImg, 0, 0);
  const litUrl = canvas.toDataURL("image/png");

  const maps = { litUrl, heightUrl, inkUrl, inkBreakupUrl };
  cache.set(key, maps);
  return maps;
}

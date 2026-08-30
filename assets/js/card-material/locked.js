/**
 * Locked print material.
 * Preferred look: paper grain on + flat ink (text effects off).
 * Keep in sync with calling-card/src/components/Card/types.ts defaults.
 */
export const LOCKED_STOCK = {
  seed: 20260331,
  paperBase: "#f4f2ea",
  litOpacity: 0.14,
};

export const LOCKED_INK = {
  density: 0.84,
  grain: 1,
  absorption: 0.24,
  relief: 0.47,
};

/** Default face: solid ink on tooth paper. */
export const FLAT_INK = {
  density: LOCKED_INK.density,
  grain: 0,
  absorption: 0,
  relief: 0,
};

export function grainVisual(g) {
  const x = Math.max(0, Math.min(1, g));
  return 1 - Math.pow(1 - x, 1.45);
}

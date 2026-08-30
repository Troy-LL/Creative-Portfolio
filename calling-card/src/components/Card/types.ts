import type { CSSProperties } from "react";

export type CardContent = {
  phone?: string;
  company?: string;
  division?: string;
  name: string;
  title?: string;
  lines?: string[];
};

/** Three independent print systems — not one mushy “texture” knob. */
export type InkParams = {
  /** Floor darkness of the print (keep high). */
  density: number;
  /** Micro coverage variation / pores inside the black. */
  grain: number;
  /** Narrow ink→paper boundary soak (not whole-glyph blur). */
  absorption: number;
  /** Thin directional paper deformation along glyph contours. */
  relief: number;
};

/** Locked from material lab dial-in (2026-08-31).
 * Fall-lab preferred look: paper grain on, flat ink (grain/absorb/relief off). */
export const defaultInkParams: InkParams = {
  density: 0.84,
  grain: 0,
  absorption: 0,
  relief: 0,
};

/** Locked paper surface light with the dialed print. */
export const defaultLitOpacity = 0.14;

export type CardMaterialProps = {
  seed?: number;
  showPrint?: boolean;
  ink?: InkParams;
  content?: CardContent;
  className?: string;
  style?: CSSProperties;
};

export const defaultCardContent: CardContent = {
  phone: "0975 644 6519",
  company: "Next Decade",
  name: "Troy Lazaro",
  title: "AI Engineer",
  lines: ["troylazaro.dev"],
};

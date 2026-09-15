import type { CSSProperties } from "react";

export type CardContent = {
  phone?: string;
  company?: string;
  division?: string;
  name: string;
  title?: string;
  lines?: string[];
  urlHref?: string;
};

export type InkParams = {
  density: number;
  grain: number;
  absorption: number;
  relief: number;
};

export const defaultInkParams: InkParams = {
  density: 0.84,
  grain: 0,
  absorption: 0,
  relief: 0,
};

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
  lines: ["troylazaro.dev/book"],
  urlHref: "/book",
};

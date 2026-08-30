import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { CardContent, InkParams } from "./types";
import { PrintedContent } from "./PrintedContent";

type Props = {
  content: CardContent;
  inkUrl: string;
  inkBreakupUrl: string;
  params: InkParams;
  filterId: string;
};

/** Remap grain so mid values show coverage pores clearly. */
export function grainVisual(g: number): number {
  const x = Math.max(0, Math.min(1, g));
  return 1 - Math.pow(1 - x, 1.45);
}

/**
 * Three independent print systems:
 * 1) Grain — coverage map inside the black
 * 2) Absorption — narrow rim soak only (sharp core)
 * 3) Relief — thin directional contour lighting (matte, not bevel)
 */
export function InkSurface({
  content,
  inkUrl,
  inkBreakupUrl,
  params,
  filterId,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const absorbId = `${filterId}-absorb`;
  const reliefId = `${filterId}-relief`;

  const gVis = grainVisual(params.grain);
  const absorb = Math.max(0, Math.min(1, params.absorption));
  const relief = Math.max(0, Math.min(1, params.relief));

  // Absorption: rim width in filter space (meaningful across 0→1)
  const coreErode = 0.15 + absorb * 1.1;
  const rimDilate = 0.2 + absorb * 1.35;
  const rimBlur = 0.25 + absorb * 1.1;
  const bleedOpacity = 0.15 + absorb * 0.55;

  // Relief: tiny surfaceScale — front-of-card press, not back-bevel
  const surfaceScale = -0.35 - relief * 2.2;
  const reliefBlur = 0.35 + relief * 0.55;
  const reliefDilate = 0.4 + relief * 1.2;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !inkUrl) return;

    const align = () => {
      const rr = root.getBoundingClientRect();
      root.style.setProperty("--ink-bg-w", `${rr.width}px`);
      root.style.setProperty("--ink-bg-h", `${rr.height}px`);
      root.querySelectorAll<HTMLElement>("[data-ink-align]").forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--ink-bg-x", `${rr.left - r.left}px`);
        el.style.setProperty("--ink-bg-y", `${rr.top - r.top}px`);
      });
    };

    align();
    requestAnimationFrame(align);
    const ro = new ResizeObserver(align);
    ro.observe(root);
    window.addEventListener("resize", align);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", align);
    };
  }, [inkUrl, inkBreakupUrl, content, gVis, absorb, relief]);

  const cssVars = {
    ["--ink-density" as string]: params.density,
    ["--ink-grain-vis" as string]: gVis,
    ["--ink-map-url" as string]: inkUrl ? `url(${inkUrl})` : "none",
    ["--ink-pore-url" as string]: inkBreakupUrl
      ? `url(${inkBreakupUrl})`
      : "none",
    ["--ink-relief-op" as string]: relief * 0.55,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="physical-card__relief physical-card__ink-surface"
      style={cssVars}
      data-ink="physical"
    >
      <svg
        className="physical-card__filters"
        aria-hidden="true"
        width={0}
        height={0}
        focusable="false"
      >
        <defs>
          {/* Absorption: sharp core + soft bleed rim only */}
          <filter
            id={absorbId}
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius={coreErode}
              result="core"
            />
            <feMorphology
              in="SourceAlpha"
              operator="dilate"
              radius={rimDilate}
              result="dilated"
            />
            <feGaussianBlur
              in="dilated"
              stdDeviation={rimBlur}
              result="softOuter"
            />
            <feComposite
              in="softOuter"
              in2="core"
              operator="out"
              result="rim"
            />
            <feComposite
              in="SourceGraphic"
              in2="core"
              operator="in"
              result="sharpBody"
            />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values={`1 0 0 0 0
                       0 1 0 0 0
                       0 0 1 0 0
                       0 0 0 ${bleedOpacity} 0`}
              result="faintInk"
            />
            <feComposite
              in="faintInk"
              in2="rim"
              operator="in"
              result="bleed"
            />
            <feMerge>
              <feMergeNode in="sharpBody" />
              <feMergeNode in="bleed" />
            </feMerge>
          </filter>

          {/* Relief: light only on a thin contour band (deboss-ish, matte) */}
          <filter
            id={reliefId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feMorphology
              in="SourceAlpha"
              operator="dilate"
              radius={reliefDilate}
              result="wide"
            />
            <feGaussianBlur
              in="wide"
              stdDeviation={reliefBlur}
              result="height"
            />
            <feDiffuseLighting
              in="height"
              surfaceScale={surfaceScale}
              diffuseConstant={0.7 + relief * 0.5}
              lightingColor="#ffffff"
              result="lit"
            >
              <feDistantLight azimuth={315} elevation={40} />
            </feDiffuseLighting>
            <feComposite
              in="lit"
              in2="SourceAlpha"
              operator="out"
              result="rimLit"
            />
            <feMorphology
              in="SourceAlpha"
              operator="dilate"
              radius={reliefDilate * 1.4}
              result="falloffSrc"
            />
            <feGaussianBlur
              in="falloffSrc"
              stdDeviation={reliefBlur * 1.2}
              result="falloff"
            />
            <feComposite
              in="rimLit"
              in2="falloff"
              operator="in"
              result="stamped"
            />
          </filter>
        </defs>
      </svg>

      {/* 3) Relief under print — paper reacts around contours */}
      {relief > 0.02 ? (
        <div
          className="physical-card__ink-relief"
          style={{ filter: `url(#${reliefId})`, opacity: relief * 0.7 }}
          aria-hidden="true"
        >
          <PrintedContent content={content} inkRole="relief" />
        </div>
      ) : null}

      {/* Floor black — absorption owns the boundary */}
      <div
        className="physical-card__ink-fill physical-card__ink-fill--solid"
        style={{
          opacity: params.density * (1 - gVis * 0.28),
          filter: absorb > 0.02 ? `url(#${absorbId})` : undefined,
        }}
      >
        <PrintedContent content={content} />
      </div>

      {/* 1) Grain — dark coverage + pores (interior only; rim from solid) */}
      {gVis > 0.02 ? (
        <div
          className="physical-card__ink-fill physical-card__ink-fill--density"
          style={{
            opacity: params.density * gVis,
            filter:
              absorb > 0.02
                ? `url(#${absorbId})`
                : undefined,
          }}
        >
          <PrintedContent content={content} inkRole="density" />
        </div>
      ) : null}

      {gVis > 0.08 ? (
        <div
          className="physical-card__ink-fill physical-card__ink-fill--pores"
          style={{ opacity: gVis * 0.65 }}
          aria-hidden="true"
        >
          <PrintedContent content={content} inkRole="breakup" />
        </div>
      ) : null}
    </div>
  );
}

export function InkSurfaceBlank({ children }: { children?: ReactNode }) {
  return <div className="physical-card__relief">{children}</div>;
}

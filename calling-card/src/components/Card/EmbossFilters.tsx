type Mode = "deboss" | "emboss";

type Props = {
  /** Unique filter id prefix */
  id: string;
  /** 0.1–0.8 visual depth. Drives surfaceScale, blur, halo. */
  depth: number;
  mode?: Mode;
};

/**
 * Glyph → height field → directional lighting.
 * Light fixed upper-left (azimuth 315°).
 * Deboss = pressed into stock (letterpress). Emboss = raised.
 */
export function EmbossFilters({ id, depth, mode = "deboss" }: Props) {
  const d = Math.max(0.05, Math.min(1, depth));
  const sign = mode === "deboss" ? -1 : 1;

  // Map depth → physical filter strength (0.45 ≈ clearly physical)
  const surfaceGlyph = sign * (2.2 + d * 14);
  const surfacePaper = sign * (1.2 + d * 7);
  const blurGlyph = 0.35 + d * 1.35;
  const blurPaper = 0.7 + d * 2.1;
  const dilate = 0.4 + d * 2.4;
  const specular = 12 + d * 28;
  const specularScale = sign * (1.5 + d * 6);
  const diffuseConstant = 0.85 + d * 0.55;

  const paperId = `${id}-paper`;
  const inkId = `${id}-ink`;

  return (
    <svg
      className="physical-card__filters"
      aria-hidden="true"
      width={0}
      height={0}
      focusable="false"
    >
      <defs>
        {/* Blind stamp: lighting only — paper reacts around glyph contours */}
        <filter
          id={paperId}
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
          colorInterpolationFilters="sRGB"
          filterUnits="objectBoundingBox"
        >
          <feGaussianBlur
            in="SourceAlpha"
            stdDeviation={blurGlyph}
            result="height"
          />
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius={dilate}
            result="dilated"
          />
          <feGaussianBlur
            in="dilated"
            stdDeviation={blurPaper}
            result="paperHeight"
          />

          <feDiffuseLighting
            in="height"
            surfaceScale={surfaceGlyph}
            diffuseConstant={diffuseConstant}
            lightingColor="#ffffff"
            result="glyphLit"
          >
            <feDistantLight azimuth={315} elevation={36} />
          </feDiffuseLighting>

          <feDiffuseLighting
            in="paperHeight"
            surfaceScale={surfacePaper}
            diffuseConstant={diffuseConstant * 0.75}
            lightingColor="#ffffff"
            result="paperLit"
          >
            <feDistantLight azimuth={315} elevation={36} />
          </feDiffuseLighting>

          <feSpecularLighting
            in="height"
            surfaceScale={specularScale}
            specularConstant={0.55 + d * 0.7}
            specularExponent={specular}
            lightingColor="#fffaf0"
            result="spec"
          >
            <feDistantLight azimuth={315} elevation={42} />
          </feSpecularLighting>

          {/* Halo = paper field minus glyph core */}
          <feComposite
            in="paperLit"
            in2="SourceAlpha"
            operator="out"
            result="haloLit"
          />
          <feComposite
            in="glyphLit"
            in2="SourceAlpha"
            operator="in"
            result="coreLit"
          />
          <feComposite
            in="spec"
            in2="SourceAlpha"
            operator="in"
            result="specIn"
          />

          <feMerge result="mergedLit">
            <feMergeNode in="haloLit" />
            <feMergeNode in="coreLit" />
            <feMergeNode in="specIn" />
          </feMerge>

          {/* Soft falloff mask so deformation dies into paper */}
          <feGaussianBlur
            in="dilated"
            stdDeviation={blurPaper * 1.1}
            result="falloff"
          />
          <feComposite
            in="mergedLit"
            in2="falloff"
            operator="in"
            result="stamped"
          />
        </filter>

        {/* Ink: preserve dark print + contour lighting on glyph height */}
        <filter
          id={inkId}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
          filterUnits="objectBoundingBox"
        >
          <feGaussianBlur
            in="SourceAlpha"
            stdDeviation={blurGlyph * 0.85}
            result="height"
          />

          <feDiffuseLighting
            in="height"
            surfaceScale={surfaceGlyph * 0.85}
            diffuseConstant={0.7 + d * 0.45}
            lightingColor="#ffffff"
            result="diff"
          >
            <feDistantLight azimuth={315} elevation={36} />
          </feDiffuseLighting>

          <feSpecularLighting
            in="height"
            surfaceScale={specularScale * 0.7}
            specularConstant={0.35 + d * 0.45}
            specularExponent={specular + 8}
            lightingColor="#fff8ee"
            result="spec"
          >
            <feDistantLight azimuth={315} elevation={48} />
          </feSpecularLighting>

          <feComposite
            in="diff"
            in2="SourceAlpha"
            operator="in"
            result="diffIn"
          />
          <feComposite
            in="spec"
            in2="SourceAlpha"
            operator="in"
            result="specIn"
          />

          {/* Ink body */}
          <feComposite
            in="SourceGraphic"
            in2="diffIn"
            operator="arithmetic"
            k1={0}
            k2={0.72}
            k3={0.38}
            k4={0}
            result="inkLit"
          />
          <feComposite
            in="inkLit"
            in2="specIn"
            operator="arithmetic"
            k1={0}
            k2={1}
            k3={0.55}
            k4={0}
            result="inkBevel"
          />

          {/* Tiny absorption soften at edge — not a shadow */}
          <feMorphology
            in="SourceAlpha"
            operator="erode"
            radius={0.15 + d * 0.2}
            result="eroded"
          />
          <feGaussianBlur
            in="SourceAlpha"
            stdDeviation={0.25 + d * 0.35}
            result="bleed"
          />
          <feComposite
            in="inkBevel"
            in2="bleed"
            operator="in"
            result="final"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function embossFilterUrls(id: string) {
  return {
    paper: `url(#${id}-paper)`,
    ink: `url(#${id}-ink)`,
  };
}

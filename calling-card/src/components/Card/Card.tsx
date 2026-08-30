import { useMemo, type CSSProperties } from "react";
import { CardEdge } from "./CardEdge";
import { InkSurface } from "./InkSurface";
import { Lighting } from "./Lighting";
import { PaperFilters } from "./PaperFilters";
import { PaperSurface } from "./PaperSurface";
import { PaperTexture } from "./PaperTexture";
import { buildPaperMaps } from "./paperGrain";
import {
  defaultCardContent,
  defaultInkParams,
  type CardMaterialProps,
} from "./types";
import "./Card.css";

export function Card({
  seed = 20260331,
  showPrint = true,
  ink = defaultInkParams,
  content = defaultCardContent,
  className,
  style,
}: CardMaterialProps) {
  const maps = useMemo(() => buildPaperMaps(seed, 768), [seed]);
  const mergedStyle: CSSProperties = { ...style };

  return (
    <article
      className={["physical-card", className].filter(Boolean).join(" ")}
      style={mergedStyle}
      data-card-material="uncoated-stock"
      data-print={showPrint ? "on" : "off"}
    >
      <PaperFilters seed={seed} />
      <Lighting />
      <div className="physical-card__body">
        <PaperSurface>
          <PaperTexture litUrl={maps.litUrl} />
          {showPrint ? (
            <InkSurface
              content={content}
              inkUrl={maps.inkUrl}
              inkBreakupUrl={maps.inkBreakupUrl}
              params={ink}
              filterId={`ink-${seed}`}
            />
          ) : null}
          <CardEdge />
        </PaperSurface>
      </div>
    </article>
  );
}

export type { CardContent, CardMaterialProps, InkParams } from "./types";
export {
  defaultCardContent,
  defaultInkParams,
  defaultLitOpacity,
} from "./types";

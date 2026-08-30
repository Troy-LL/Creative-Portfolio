import type { CSSProperties } from "react";
import {
  Card,
  defaultCardContent,
  defaultInkParams,
  defaultLitOpacity,
} from "../components/Card/Card";

type Props = {
  foldProgress: number;
  interactive: boolean;
  hovering: boolean;
  onEnter: () => void;
  onHoverChange: (hovering: boolean) => void;
};

/** Same stock as the card; shown on the mid panel as the accordion opens. */
export function FoldInside({
  foldProgress,
  interactive,
  hovering,
  onEnter,
  onHoverChange,
}: Props) {
  const lit = 0.8 + foldProgress * 0.2;
  const style: CSSProperties = {
    filter: `brightness(${lit})`,
    transform: `scale(${hovering && interactive ? 1.01 : 1})`,
  };

  return (
    <div
      className="fold-inside"
      data-interactive={interactive}
      data-hover={hovering}
      style={style}
      onPointerEnter={() => interactive && onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      <div className="fold-inside__stock" aria-hidden="true">
        <Card
          seed={20260331}
          showPrint={false}
          ink={defaultInkParams}
          content={defaultCardContent}
          style={
            {
              "--paper-lit-opacity": String(defaultLitOpacity),
              "--card-width": "100%",
            } as CSSProperties
          }
        />
      </div>
      <button
        type="button"
        className="fold-inside__enter"
        disabled={!interactive}
        tabIndex={interactive ? 0 : -1}
        aria-label="Enter portfolio"
        onClick={() => interactive && onEnter()}
      >
        <span className="fold-inside__eyebrow">Inside</span>
        <span className="fold-inside__label">Enter portfolio</span>
      </button>
    </div>
  );
}

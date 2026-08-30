import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Kept for API stability — emboss is disabled */
  blind?: ReactNode;
  filterId?: string;
  depth?: number;
  mode?: "deboss" | "emboss";
  /** When false (default), flat print only */
  enabled?: boolean;
};

/**
 * Emboss intentionally off. Typography is flat print on stock.
 * Re-enable only after the blank rectangle passes the stationery test.
 */
export function PrintRelief({ children, enabled = false }: Props) {
  return (
    <div
      className="physical-card__relief"
      data-emboss={enabled ? "on" : "off"}
    >
      <div className="physical-card__ink-layer">{children}</div>
    </div>
  );
}

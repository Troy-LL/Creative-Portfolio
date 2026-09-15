import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  blind?: ReactNode;
  filterId?: string;
  depth?: number;
  mode?: "deboss" | "emboss";
  enabled?: boolean;
};

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

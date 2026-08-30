type Props = {
  children?: import("react").ReactNode;
};

/** Layer 1 — warm ivory base stock (no decorative gradient). */
export function PaperSurface({ children }: Props) {
  return <div className="physical-card__surface">{children}</div>;
}

type Props = {
  children?: import("react").ReactNode;
};

export function PaperSurface({ children }: Props) {
  return <div className="physical-card__surface">{children}</div>;
}

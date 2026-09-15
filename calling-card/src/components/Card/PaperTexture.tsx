type Props = {
  litUrl: string;
};

export function PaperTexture({ litUrl }: Props) {
  return (
    <div className="physical-card__texture" aria-hidden="true">
      <div
        className="physical-card__texture-lit"
        style={{ backgroundImage: litUrl ? `url(${litUrl})` : undefined }}
      />
    </div>
  );
}

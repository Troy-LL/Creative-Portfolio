type Props = {
  litUrl: string;
};

/** Locked paper tooth — lit map only. Do not alter grain here. */
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

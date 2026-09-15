import type { CardContent } from "./types";

type Props = {
  content: CardContent;
  inkRole?: "solid" | "density" | "breakup" | "relief";
};

export function PrintedContent({ content, inkRole = "solid" }: Props) {
  const align =
    inkRole === "density" || inkRole === "breakup" ? true : undefined;
  const ink = [
    "physical-card__ink",
    inkRole === "density" && "physical-card__ink--density",
    inkRole === "breakup" && "physical-card__ink--breakup",
    inkRole === "relief" && "physical-card__ink--relief",
  ]
    .filter(Boolean)
    .join(" ");

  const hasTop = Boolean(content.phone || content.company || content.division);
  const lines = content.lines ?? [];

  return (
    <div
      className={[
        "physical-card__print",
        !hasTop && "physical-card__print--minimal",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasTop ? (
        <div className="physical-card__print-top">
          {content.phone ? (
            inkRole === "solid" ? (
              <button
                type="button"
                className={`${ink} physical-card__ink--small physical-card__ink--phone`}
                data-copy-phone={content.phone}
                data-ink-align={align || undefined}
                aria-label={`Copy phone number ${content.phone}`}
                onClick={async (e) => {
                  e.stopPropagation();
                  const value = content.phone ?? "";
                  try {
                    await navigator.clipboard.writeText(value);
                  } catch {
                    /* ignore — host may block clipboard */
                  }
                }}
              >
                {content.phone}
              </button>
            ) : (
              <span
                className={`${ink} physical-card__ink--small physical-card__ink--phone`}
                data-ink-align={align || undefined}
              >
                {content.phone}
              </span>
            )
          ) : (
            <span />
          )}
          <div className="physical-card__print-brand">
            {content.company ? (
              <span
                className={`${ink} physical-card__ink--small`}
                data-ink-align={align || undefined}
              >
                {content.company}
              </span>
            ) : null}
            {content.division ? (
              <span
                className={`${ink} physical-card__ink--tiny`}
                data-ink-align={align || undefined}
              >
                {content.division}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="physical-card__print-center">
        <p
          className={`${ink} physical-card__ink--name`}
          data-ink-align={align || undefined}
        >
          {content.name}
        </p>
        {content.title ? (
          <p
            className={`${ink} physical-card__ink--title`}
            data-ink-align={align || undefined}
          >
            {content.title}
          </p>
        ) : null}
      </div>

      <div className="physical-card__print-bottom">
        {lines.map((line) => {
          const className = `${ink} physical-card__ink--url`;
          const inkAlign = align || undefined;
          if (inkRole === "solid" && content.urlHref) {
            return (
              <a
                key={line}
                className={className}
                href={content.urlHref}
                data-ink-align={inkAlign}
              >
                {line}
              </a>
            );
          }
          return (
            <span
              key={line}
              className={className}
              data-ink-align={inkAlign}
            >
              {line}
            </span>
          );
        })}
      </div>
    </div>
  );
}

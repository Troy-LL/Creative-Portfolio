const MAIN_PORTFOLIO = "https://troylazaro.dev/";
const FOUNDERS_REL = "assets/founders-cafe/index.html";

function resolveHref(rel) {
  try {
    return new URL(rel, window.location.href).href;
  } catch {
    return rel;
  }
}

export function mountMobileSafari(host) {
  const foundersUrl = resolveHref(FOUNDERS_REL);

  host.innerHTML = `
    <p class="ios-safari-lead">
      Browse my public work, try an in-browser build, or reach out if you want something similar —
      I take select freelance and commission projects (sites, small apps, creative prototypes).
    </p>
    <div class="ios-safari-prompt" role="status">
      <strong>Open to collaborations</strong>
      <span class="ios-safari-prompt__sub">Tell me about your timeline, budget range, and what you want visitors to feel or do — I’ll reply with honest fit and next steps.</span>
    </div>
    <div class="ios-safari-actions">
      <a class="ios-safari-card" href="mailto:troylazaro09@gmail.com?subject=${encodeURIComponent("Commission / project inquiry")}">
        <span class="ios-safari-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16v16H4z" />
            <path d="m22 6-10 7L2 6" />
          </svg>
        </span>
        <span class="ios-safari-card__text">
          <span class="ios-safari-card__title">Commission me</span>
          <span class="ios-safari-card__meta">Email with your brief</span>
        </span>
      </a>
      <button type="button" class="ios-safari-card ios-safari-card--btn" data-open-main>
        <span class="ios-safari-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
          </svg>
        </span>
        <span class="ios-safari-card__text">
          <span class="ios-safari-card__title">Main portfolio</span>
          <span class="ios-safari-card__meta">troylazaro.dev</span>
        </span>
      </button>
      <button type="button" class="ios-safari-card ios-safari-card--btn" data-open-founders>
        <span class="ios-safari-card__icon ios-safari-card__icon--founders" aria-hidden="true">
          <svg viewBox="0 0 40 40" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="iosFcBg" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
                <stop stop-color="#1a1a1a" />
                <stop offset="1" stop-color="#0a0a0a" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="10" fill="url(#iosFcBg)" stroke="#242424" stroke-width="1" />
            <g transform="translate(8,8)" fill="none" stroke="#d4a574" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 7h11 M6 7v9a4 4 0 0 0 4 4h3a4 4 0 0 0 4-4V7" />
              <path d="M17 10a2.5 2.5 0 0 1 0 5" />
            </g>
          </svg>
        </span>
        <span class="ios-safari-card__text">
          <span class="ios-safari-card__title">Founders Cafe</span>
          <span class="ios-safari-card__meta">In-browser demo (same as desktop Safari)</span>
        </span>
      </button>
    </div>
    <div class="ios-safari-bar">
      <input type="text" class="ios-safari-url" readonly value="${MAIN_PORTFOLIO}" aria-label="Address" />
      <button type="button" class="ios-safari-open" data-open-main-tab>Open</button>
    </div>
    <p class="ios-safari-footnote">“Open” loads the main portfolio URL above. Founders Cafe opens the built demo from this site so you can explore the full UI.</p>
  `;

  const openMain = () =>
    window.open(MAIN_PORTFOLIO, "_blank", "noopener,noreferrer");
  const openFounders = () =>
    window.open(foundersUrl, "_blank", "noopener,noreferrer");

  host.querySelector("[data-open-main]")?.addEventListener("click", openMain);
  host.querySelector("[data-open-main-tab]")?.addEventListener("click", openMain);
  host.querySelector("[data-open-founders]")?.addEventListener("click", openFounders);
}

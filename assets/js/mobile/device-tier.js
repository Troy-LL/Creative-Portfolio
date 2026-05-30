/**
 * Device tier — single source of truth for the three Apple-ecosystem layouts.
 *
 *   mobile  → iOS 16 phone      (<= 767px)
 *   tablet  → iPadOS            (768px – 1023px)
 *   desktop → macOS             (>= 1024px)
 *
 * Sets `body[data-device]` and notifies subscribers when the tier changes so
 * JS-driven behaviors (lock screen, home screen, terminal app) can react.
 */

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
const tabletQuery = window.matchMedia(
  `(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`,
);

const subscribers = new Set();

export function getTier() {
  if (mobileQuery.matches) return "mobile";
  if (tabletQuery.matches) return "tablet";
  return "desktop";
}

/** True for any touch-first Apple layout (iOS phone or iPadOS tablet). */
export function isTouchTier() {
  const tier = getTier();
  return tier === "mobile" || tier === "tablet";
}

export function isMobileTier() {
  return getTier() === "mobile";
}

export function isTabletTier() {
  return getTier() === "tablet";
}

export function isDesktopTier() {
  return getTier() === "desktop";
}

/**
 * Subscribe to tier changes. Returns an unsubscribe function.
 * Callback receives the new tier string.
 */
export function onTierChange(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function applyTier() {
  const tier = getTier();
  if (document.body.dataset.device !== tier) {
    document.body.dataset.device = tier;
    subscribers.forEach((cb) => {
      try {
        cb(tier);
      } catch (err) {
        console.error("device-tier subscriber failed", err);
      }
    });
  }
}

let initialized = false;

export function initDeviceTier() {
  if (initialized) return;
  initialized = true;

  applyTier();

  const onChange = () => applyTier();
  // addEventListener("change") is supported in all evergreen browsers;
  // addListener is the Safari < 14 fallback.
  [mobileQuery, tabletQuery].forEach((q) => {
    if (typeof q.addEventListener === "function") {
      q.addEventListener("change", onChange);
    } else if (typeof q.addListener === "function") {
      q.addListener(onChange);
    }
  });
}

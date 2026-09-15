function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** @param {HTMLElement | null} signature */
function mountTlSignature(signature) {
  if (!signature) return;
  let drawn = false;
  const obs = new IntersectionObserver(
    (entries) => {
      if (drawn) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          drawn = true;
          signature.classList.add("is-drawn");
          obs.disconnect();
          break;
        }
      }
    },
    { threshold: 0.25 },
  );
  obs.observe(signature);
}

/** @param {HTMLElement | null} artifact */
function mountArchiveCursorDrift(artifact) {
  if (!artifact) return;
  let drifted = false;
  const obs = new IntersectionObserver(
    (entries) => {
      if (drifted) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          drifted = true;
          artifact.classList.add("is-drifted");
          obs.disconnect();
          break;
        }
      }
    },
    { threshold: 0.35 },
  );
  obs.observe(artifact);
}

/**
 * @param {HTMLElement | null} el
 * @param {number} strength
 */
function mountCursorLean(el, strength = 1) {
  if (!el) return;
  const target = { x: 0, y: 0 };
  const shown = { x: 0, y: 0 };

  const onMove = (event) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    target.x = clamp((event.clientX - cx) / (rect.width / 2), -1, 1);
    target.y = clamp((event.clientY - cy) / (rect.height / 2), -1, 1);
  };

  const onLeave = () => {
    target.x = 0;
    target.y = 0;
  };

  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);

  const tick = () => {
    shown.x = lerp(shown.x, target.x, 0.14);
    shown.y = lerp(shown.y, target.y, 0.14);
    const rotX = -shown.y * 8 * strength;
    const rotY = shown.x * 10 * strength;
    el.style.transform = `perspective(620px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function mountHorizonStations() {
  const media = document.querySelector("[data-flagship-media]");
  const signature = document.querySelector("[data-tl-signature]");
  const archive = document.querySelector("[data-archive-artifact]");
  const exitCta = document.querySelector("[data-exit-cta]");

  mountTlSignature(signature);
  mountArchiveCursorDrift(archive);
  mountCursorLean(exitCta, 1);

  let lastClear = -1;
  const tick = () => {
    if (media) {
      const rect = media.getBoundingClientRect();
      const elMid = rect.top + rect.height / 2;
      const viewMid = window.innerHeight / 2;
      const range = window.innerHeight * 0.48;
      const clear = 1 - Math.min(1, Math.abs(elMid - viewMid) / range);
      if (Math.abs(clear - lastClear) > 0.008) {
        lastClear = clear;
        media.style.setProperty("--veil-clear", String(clear));
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

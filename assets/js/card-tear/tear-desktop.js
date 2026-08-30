/**
 * Desktop tear-apart exit — organic peel / curl along a jagged seam.
 * Mobile / tablet path is separate (not wired here).
 */

import {
  buildTear,
  grabSide,
  isDesktopTearTarget,
  peelPose,
  seamHinge,
  tearResistance,
} from "./tear-path.js";
import { buildFibrousEdge } from "./tear-fiber-edge.js";
import {
  mountPhysicalCard,
  toPrintContent,
} from "../card-material/mount-physical-card.js";
import { FLAT_INK } from "../card-material/locked.js";

/**
 * @param {object} opts
 * @param {HTMLElement} opts.stage
 * @param {HTMLElement} opts.rig
 * @param {HTMLElement} opts.card
 * @param {object} opts.content
 * @param {() => void} [opts.onComplete]
 * @param {boolean} [opts.paperGrain]
 * @param {boolean} [opts.textEffects]
 */
export function mountDesktopTear(opts) {
  const {
    stage,
    rig,
    card,
    content,
    onComplete,
    paperGrain = true,
    textEffects = false,
  } = opts;

  if (!isDesktopTearTarget()) {
    return { enable() {}, disable() {}, destroy() {} };
  }

  let enabled = false;
  let tearing = false;
  let done = false;
  let tear = null;
  let shell = null;
  let pieceA = null;
  let pieceB = null;
  let fiber = null;
  let fiberPathLen = 0;
  let edgeA = null;
  let edgeB = null;
  let cue = null;
  let progress = 0; // smoothed displayed tear 0..1
  let pullTarget = 0; // resistance-mapped intent from the hand
  let grabbed = "b";
  let dragOrigin = null;
  let materials = [];
  let raf = 0;
  let flutterT = 0;
  let committing = false;

  const next = ensureNextStage(stage);

  function ensureCue() {
    if (cue) return cue;
    cue = document.createElement("p");
    cue.className = "tear-cue";
    cue.textContent = "tear me apart";
    cue.setAttribute("aria-hidden", "true");
    stage.appendChild(cue);
    return cue;
  }

  function enable() {
    if (done || enabled) return;
    enabled = true;
    ensureCue();
    cue.classList.add("is-visible");
    card.classList.add("is-tearable");
    card.addEventListener("pointerdown", onPointerDown);
  }

  function disable() {
    enabled = false;
    cue?.classList.remove("is-visible");
    card.classList.remove("is-tearable");
    card.removeEventListener("pointerdown", onPointerDown);
  }

  function destroy() {
    disable();
    stopLoop();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    shell?.remove();
    cue?.remove();
    materials.forEach((m) => m.dispose?.());
    materials = [];
    shell = null;
    cue = null;
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onPointerDown(e) {
    if (!enabled || done || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    beginTear(e);
  }

  function beginTear(e) {
    if (tearing) return;
    tearing = true;
    committing = false;
    progress = 0;
    pullTarget = 0;
    flutterT = 0;
    tear = buildTear((Math.random() * 0xffffffff) >>> 0);
    cue?.classList.remove("is-visible");

    const r = rig.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const ux = (e.clientX - r.left) / Math.max(1, r.width);
    const uy = (e.clientY - r.top) / Math.max(1, r.height);
    grabbed = grabSide(tear.recipe, ux, uy);

    shell = document.createElement("div");
    shell.className = "tear-shell";
    shell.dataset.recipe = tear.recipe;
    shell.dataset.grabbed = grabbed;
    shell.style.width = `${rig.offsetWidth}px`;
    shell.style.height = `${rig.offsetHeight}px`;
    shell.style.left = `${r.left - sr.left}px`;
    shell.style.top = `${r.top - sr.top}px`;

    const hinge = seamHinge(tear.seam);
    pieceA = makePiece("a", tear.clipA, hinge);
    pieceB = makePiece("b", tear.clipB, hinge);

    const fa = buildFibrousEdge("a", tear.seam, tear.recipe, tear.seed);
    const fb = buildFibrousEdge("b", tear.seam, tear.recipe, tear.seed);
    edgeA = fa.svg;
    edgeB = fb.svg;
    pieceA.appendChild(edgeA);
    pieceB.appendChild(edgeB);
    // Keep a shared rip-progress hairline between halves
    fiber = makeRipGuide(tear.seam);

    shell.append(pieceA, pieceB, fiber);
    stage.appendChild(shell);

    const print = toPrintContent(content);
    materials = [
      mountPiece(pieceA.querySelector("[data-tear-host]"), print),
      mountPiece(pieceB.querySelector("[data-tear-host]"), print),
    ];

    rig.classList.add("is-torn-source");
    card.classList.remove("is-tearable");
    card.removeEventListener("pointerdown", onPointerDown);

    dragOrigin = { x: e.clientX, y: e.clientY };
    stage.querySelector(".css-shadows")?.classList.add("is-hidden");
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    startLoop();
  }

  function makePiece(side, clip, hinge) {
    const el = document.createElement("div");
    el.className = `tear-piece tear-piece--${side}`;
    el.style.transformOrigin = `${(hinge.x * 100).toFixed(2)}% ${(hinge.y * 100).toFixed(2)}%`;
    el.innerHTML = `
      <div class="tear-piece__clipped">
        <div class="tear-piece__hinge">
          <div class="tear-piece__curl">
            <div class="tear-piece__face" data-tear-host></div>
          </div>
        </div>
      </div>`;
    const clipped = el.querySelector(".tear-piece__clipped");
    clipped.style.clipPath = clip;
    const hingeEl = el.querySelector(".tear-piece__hinge");
    const curlEl = el.querySelector(".tear-piece__curl");
    hingeEl.style.transformOrigin = `${(hinge.x * 100).toFixed(2)}% ${(hinge.y * 100).toFixed(2)}%`;
    curlEl.style.transformOrigin = `${(hinge.x * 100).toFixed(2)}% ${(hinge.y * 100).toFixed(2)}%`;
    return el;
  }

  function mountPiece(host, print) {
    const m = mountPhysicalCard(host, {
      hideContactShadow: true,
      filterId: `tear-ink-${Math.random().toString(36).slice(2, 8)}`,
      mapSize: 384,
      ink: FLAT_INK,
    });
    m.setContent(print);
    m.setPaperGrain(paperGrain);
    m.setTextEffects(textEffects);
    requestAnimationFrame(() => m.realign());
    return m;
  }

  function makeRipGuide(seam) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "tear-fiber tear-fiber--guide");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");

    const d = seam
      .map((p, i) => `${i ? "L" : "M"} ${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`)
      .join(" ");
    const core = document.createElementNS(ns, "path");
    core.setAttribute("d", d);
    core.setAttribute("fill", "none");
    core.setAttribute("stroke", "rgba(255,255,255,0.35)");
    core.setAttribute("stroke-width", "0.5");
    core.classList.add("tear-fiber__rip");
    svg.appendChild(core);

    requestAnimationFrame(() => {
      try {
        fiberPathLen = core.getTotalLength();
        core.style.strokeDasharray = String(fiberPathLen);
        core.style.strokeDashoffset = String(fiberPathLen);
      } catch {
        fiberPathLen = 0;
      }
    });
    return svg;
  }

  function startLoop() {
    stopLoop();
    const tick = () => {
      if (!tearing && !committing) return;
      flutterT += 0.045;
      // Paper yields slowly — lag behind the hand
      const ease = committing ? 0.07 : 0.055;
      progress += (pullTarget - progress) * ease;
      // Tiny organic stutter while fibers give
      const stutter =
        tearing && progress > 0.08 && progress < 0.92
          ? Math.sin(flutterT * 3.1) * 0.004 * progress
          : 0;
      applyProgress(Math.max(0, Math.min(1, progress + stutter)));
      if (progress >= 0.995 && committing) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function onPointerMove(e) {
    if (!tearing || !dragOrigin || !tear || committing) return;
    const dx = e.clientX - dragOrigin.x;
    const dy = e.clientY - dragOrigin.y;
    const pull = tear.pull;
    // Prefer pull away from the seam; slight help from any drag magnitude
    const along = Math.max(0, dx * pull.x + dy * pull.y);
    const size = Math.max(rig.offsetWidth, rig.offsetHeight);
    // Need a long deliberate pull — feels like ripping, not a flick
    const raw = along / (size * 0.72);
    pullTarget = tearResistance(raw);
  }

  function onPointerUp() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    if (done) return;
    if (progress >= 0.62) {
      // Rip finishes on its own — paper finishes yielding
      committing = true;
      pullTarget = 1;
      startLoop();
    } else {
      // Spring shut — not torn enough
      committing = true;
      const start = progress;
      const t0 = performance.now();
      stopLoop();
      const run = (now) => {
        const u = Math.min(1, (now - t0) / 380);
        // Elastic settle
        const bounce = Math.sin(u * Math.PI) * 0.04 * (1 - u);
        progress = start * (1 - u) * (1 - u) + bounce;
        pullTarget = progress;
        applyProgress(Math.max(0, progress));
        if (u < 1) requestAnimationFrame(run);
        else {
          committing = false;
          abortTear();
        }
      };
      requestAnimationFrame(run);
    }
  }

  function applyProgress(p) {
    if (!pieceA || !pieceB || !tear) return;

    const poseA = peelPose(tear.recipe, "a", p, grabbed);
    const poseB = peelPose(tear.recipe, "b", p, grabbed);
    paintPiece(pieceA, poseA, p, grabbed === "a");
    paintPiece(pieceB, poseB, p, grabbed === "b");

    if (fiber && fiberPathLen) {
      const rip = fiber.querySelector(".tear-fiber__rip");
      if (rip) rip.style.strokeDashoffset = String(fiberPathLen * (1 - p));
      fiber.style.opacity = String(0.15 + p * 0.35);
    }
    if (edgeA) edgeA.style.opacity = String(0.35 + p * 0.65);
    if (edgeB) edgeB.style.opacity = String(0.35 + p * 0.65);

    shell?.style.setProperty("--tear-gap", String(p));
    next.style.setProperty("--reveal", String(Math.min(1, p * 1.05)));
  }

  function paintPiece(el, pose, p, isGrabbed) {
    const hinge = el.querySelector(".tear-piece__hinge");
    const curl = el.querySelector(".tear-piece__curl");
    // Peel away from seam
    el.style.transform = `translate3d(${pose.tx.toFixed(1)}px, ${pose.ty.toFixed(1)}px, ${(p * (isGrabbed ? 36 : 8)).toFixed(1)}px) rotateZ(${pose.rotZ.toFixed(2)}deg)`;
    // Fold / roll around the seam hinge
    if (hinge) {
      hinge.style.transform = `rotateX(${pose.rotX.toFixed(2)}deg) rotateY(${pose.rotY.toFixed(2)}deg)`;
    }
    // Extra paper curl on the free edge of the grabbed piece
    if (curl) {
      const extra = isGrabbed ? p * p * 22 : p * 4;
      const axis =
        tear.recipe === "horizontal"
          ? `rotateX(${(pose.rotX >= 0 ? extra : -extra).toFixed(2)}deg)`
          : `rotateY(${(pose.rotY >= 0 ? extra : -extra).toFixed(2)}deg)`;
      curl.style.transform = axis;
      curl.style.filter = isGrabbed
        ? `brightness(${(1 - p * 0.06).toFixed(3)})`
        : "none";
    }
  }

  function abortTear() {
    tearing = false;
    committing = false;
    progress = 0;
    pullTarget = 0;
    stopLoop();
    shell?.remove();
    shell = null;
    pieceA = pieceB = fiber = edgeA = edgeB = null;
    fiberPathLen = 0;
    materials.forEach((m) => m.dispose?.());
    materials = [];
    rig.classList.remove("is-torn-source");
    stage.querySelector(".css-shadows")?.classList.remove("is-hidden");
    if (enabled && !done) {
      cue?.classList.add("is-visible");
      card.classList.add("is-tearable");
      card.addEventListener("pointerdown", onPointerDown);
    }
  }

  function finish() {
    if (done) return;
    done = true;
    tearing = false;
    committing = false;
    progress = 1;
    pullTarget = 1;
    applyProgress(1);
    stopLoop();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    shell?.classList.add("is-complete");
    next.classList.add("is-open");
    next.style.setProperty("--reveal", "1");
    disable();
    onComplete?.();
  }

  return {
    enable,
    disable,
    destroy,
    get active() {
      return enabled;
    },
  };
}

function ensureNextStage(stage) {
  let next = document.querySelector(".next-stage");
  if (next) return next;
  next = document.createElement("section");
  next.className = "next-stage";
  next.setAttribute("aria-hidden", "true");
  next.innerHTML = `
    <div class="next-stage__inner">
      <p class="next-stage__eyebrow">Next</p>
      <h2 class="next-stage__title">Stage two</h2>
      <p class="next-stage__body">Placeholder — the room beyond the card.</p>
    </div>`;
  const pane = stage.closest(".pane") || stage.parentElement;
  pane.insertBefore(next, pane.firstChild);
  return next;
}

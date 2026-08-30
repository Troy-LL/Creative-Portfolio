/**
 * Deckled / fibrous tear edge — matches rough cardstock rip:
 * irregular peaks, bright pulp fringe, delamination step, micro-frays.
 */

import { mulberry32, pullAxis } from "./tear-path.js";

/**
 * Amplify a seam into a deckled edge with multi-frequency roughness.
 * Returns denser points in unit space (same endpoints).
 */
export function deckleSeam(seam, seed, density = 3) {
  const rnd = mulberry32(seed ^ 0x51eed);
  /** @type {{ x: number, y: number }[]} */
  const out = [];
  for (let i = 0; i < seam.length - 1; i++) {
    const a = seam[i];
    const b = seam[i + 1];
    out.push(a);
    for (let k = 1; k < density; k++) {
      const t = k / density;
      const nx = a.x + (b.x - a.x) * t;
      const ny = a.y + (b.y - a.y) * t;
      // perpendicular wobble — peaks & valleys of unequal depth
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len;
      const py = dx / len;
      const coarse = (rnd() - 0.5) * 0.034;
      const fine = (rnd() - 0.5) * 0.018;
      const spike = rnd() > 0.82 ? (rnd() - 0.5) * 0.045 : 0;
      const w = coarse + fine + spike;
      out.push({
        x: Math.min(0.99, Math.max(0.01, nx + px * w)),
        y: Math.min(0.99, Math.max(0.01, ny + py * w)),
      });
    }
  }
  out.push(seam[seam.length - 1]);
  return out;
}

/**
 * Build an SVG fibrous edge overlay for one torn half.
 * @param {'a'|'b'} side
 * @param {{x:number,y:number}[]} seam unit seam
 * @param {string} recipe
 * @param {number} seed
 */
export function buildFibrousEdge(side, seam, recipe, seed) {
  const rnd = mulberry32(seed ^ (side === "a" ? 0xa11e : 0xb00b));
  const deckled = deckleSeam(seam, seed + (side === "a" ? 11 : 29), 4);
  const pull = pullAxis(recipe);
  // Fibers grow outward from this half (away from the other piece)
  const outX = side === "a" ? -pull.x : pull.x;
  const outY = side === "a" ? -pull.y : pull.y;
  const outLen = Math.hypot(outX, outY) || 1;
  const ox = outX / outLen;
  const oy = outY / outLen;

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", `tear-edge tear-edge--${side}`);
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  const fid = `tear-edge-${side}-${seed >>> 0}`;
  const defs = document.createElementNS(ns, "defs");
  defs.innerHTML = `
    <filter id="${fid}-fuzz" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves="4" seed="${seed % 997}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="${fid}-soft" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="3" seed="${(seed + 7) % 997}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  svg.appendChild(defs);

  // —— Delamination ribbon (brighter pulp layer stepped back from surface) ——
  const dela = document.createElementNS(ns, "path");
  const ribbon = delaminationPath(deckled, ox, oy, 1.15 + rnd() * 0.55);
  dela.setAttribute("d", ribbon);
  dela.setAttribute("fill", "#fbf9f3");
  dela.setAttribute("stroke", "none");
  dela.setAttribute("filter", `url(#${fid}-soft)`);
  dela.setAttribute("class", "tear-edge__dela");
  svg.appendChild(dela);

  // Soft shadow into the step
  const delaShade = document.createElementNS(ns, "path");
  delaShade.setAttribute("d", delaminationPath(deckled, ox, oy, 0.35));
  delaShade.setAttribute("fill", "none");
  delaShade.setAttribute("stroke", "rgba(40, 36, 30, 0.22)");
  delaShade.setAttribute("stroke-width", "0.35");
  delaShade.setAttribute("filter", `url(#${fid}-soft)`);
  svg.appendChild(delaShade);

  // —— Surface deckle lip (slightly darker face edge) ——
  const lip = document.createElementNS(ns, "path");
  lip.setAttribute("d", polyLine(deckled));
  lip.setAttribute("fill", "none");
  lip.setAttribute("stroke", "rgba(232, 226, 214, 0.95)");
  lip.setAttribute("stroke-width", "0.85");
  lip.setAttribute("filter", `url(#${fid}-fuzz)`);
  svg.appendChild(lip);

  // —— Hairy cellulose fibers / frays ——
  const fibers = document.createElementNS(ns, "g");
  fibers.setAttribute("class", "tear-edge__fibers");
  fibers.setAttribute("filter", `url(#${fid}-fuzz)`);

  for (let i = 1; i < deckled.length - 1; i++) {
    const p = deckled[i];
    const prev = deckled[i - 1];
    const next = deckled[i + 1];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tlen = Math.hypot(tx, ty) || 1;
    // Local outward ≈ average of geometric out and perpendicular
    const count = rnd() > 0.35 ? 2 + Math.floor(rnd() * 3) : 1;
    for (let f = 0; f < count; f++) {
      const len = 0.35 + rnd() * 1.8 + (rnd() > 0.9 ? 1.2 : 0);
      const spread = (rnd() - 0.5) * 0.9;
      const fx = ox * len + (-ty / tlen) * spread * 0.55;
      const fy = oy * len + (tx / tlen) * spread * 0.55;
      const x1 = p.x * 100;
      const y1 = p.y * 100;
      const x2 = x1 + fx;
      const y2 = y1 + fy;
      const hair = document.createElementNS(ns, "line");
      hair.setAttribute("x1", x1.toFixed(2));
      hair.setAttribute("y1", y1.toFixed(2));
      hair.setAttribute("x2", x2.toFixed(2));
      hair.setAttribute("y2", y2.toFixed(2));
      hair.setAttribute("stroke", rnd() > 0.3 ? "#ffffff" : "#f3efe6");
      hair.setAttribute("stroke-width", (0.12 + rnd() * 0.28).toFixed(2));
      hair.setAttribute("stroke-linecap", "round");
      hair.setAttribute("opacity", (0.55 + rnd() * 0.4).toFixed(2));
      fibers.appendChild(hair);
    }
    // Occasional thicker fray flake
    if (rnd() > 0.88) {
      const flake = document.createElementNS(ns, "path");
      const fl = 1.2 + rnd() * 2;
      const ang = (rnd() - 0.5) * 0.8;
      const bx = ox * Math.cos(ang) - oy * Math.sin(ang);
      const by = ox * Math.sin(ang) + oy * Math.cos(ang);
      const px = p.x * 100;
      const py = p.y * 100;
      flake.setAttribute(
        "d",
        `M ${px.toFixed(1)} ${py.toFixed(1)} L ${(px + bx * fl).toFixed(1)} ${(py + by * fl).toFixed(1)} L ${(px + bx * fl * 0.6 + (-by) * 0.35).toFixed(1)} ${(py + by * fl * 0.6 + bx * 0.35).toFixed(1)} Z`,
      );
      flake.setAttribute("fill", "#faf7f0");
      flake.setAttribute("opacity", "0.85");
      fibers.appendChild(flake);
    }
  }
  svg.appendChild(fibers);

  // Micro shadow along the torn face (depth in the pulp)
  const shade = document.createElementNS(ns, "path");
  shade.setAttribute("d", polyLine(deckled));
  shade.setAttribute("fill", "none");
  shade.setAttribute("stroke", "rgba(28, 24, 20, 0.28)");
  shade.setAttribute("stroke-width", "0.22");
  shade.setAttribute("filter", `url(#${fid}-soft)`);
  svg.appendChild(shade);

  return { svg, deckled };
}

function polyLine(pts) {
  return pts
    .map((p, i) => `${i ? "L" : "M"} ${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`)
    .join(" ");
}

/** Closed band along seam offset outward — the peeled under-layer. */
function delaminationPath(seam, ox, oy, width) {
  const left = seam.map((p) => ({
    x: p.x * 100 + ox * width * 0.15,
    y: p.y * 100 + oy * width * 0.15,
  }));
  const right = [...seam]
    .reverse()
    .map((p) => ({
      x: p.x * 100 + ox * width,
      y: p.y * 100 + oy * width,
    }));
  const all = [...left, ...right];
  return (
    all
      .map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ") + " Z"
  );
}

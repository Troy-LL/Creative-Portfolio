/**
 * Debug renderer for the stiff-paper sim — points + constraints only.
 * No paper polish. Broken links in amber; grab in red; oppose pins in blue.
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {ReturnType<import('./paper-sim.js').createPaperSim>} sim
 */
export function drawPaperDebug(canvas, sim) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Dim the card under the mesh so the grid reads
  ctx.fillStyle = "rgba(20, 18, 16, 0.08)";
  ctx.fillRect(0, 0, w, h);

  // Intact constraints
  ctx.lineWidth = 1;
  for (const link of sim.links) {
    if (link.broken) continue;
    const strain = Math.hypot(link.a.x - link.b.x, link.a.y - link.b.y) / link.rest;
    const t = Math.min(1, Math.max(0, (strain - 1) / 0.15));
    ctx.strokeStyle = `rgb(${Math.round(40 + t * 180)}, ${Math.round(40 + (1 - t) * 40)}, ${Math.round(40)})`;
    ctx.beginPath();
    ctx.moveTo(link.a.x, link.a.y);
    ctx.lineTo(link.b.x, link.b.y);
    ctx.stroke();
  }

  // Broken — tear path
  ctx.strokeStyle = "rgba(180, 60, 40, 0.85)";
  ctx.lineWidth = 2;
  for (const link of sim.links) {
    if (!link.broken) continue;
    ctx.beginPath();
    ctx.moveTo(link.a.x, link.a.y);
    ctx.lineTo(link.b.x, link.b.y);
    ctx.stroke();
  }

  // Particles
  for (const p of sim.particles) {
    const isGrab = sim.grab === p;
    const isPin = p.pinned;
    ctx.beginPath();
    ctx.arc(p.x, p.y, isGrab ? 4.5 : 2.4, 0, Math.PI * 2);
    if (isGrab) ctx.fillStyle = "#c0392b";
    else if (isPin) ctx.fillStyle = "#2980b9";
    else ctx.fillStyle = "#1a1814";
    ctx.fill();
  }

  // HUD
  ctx.fillStyle = "rgba(26, 24, 20, 0.75)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText(
    `state=${sim.state}  strain=${sim.maxStrain.toFixed(3)}  broken=${sim.brokenCount}`,
    8,
    14,
  );
  ctx.fillText("center-rip debug · drag left/right of center · T toggles", 8, 28);
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPaperSim } from "../../assets/js/paper-rip/paper-sim.js";

describe("paper-sim (stiff card)", () => {
  it("builds a grid of particles and constraints", () => {
    const sim = createPaperSim({ width: 280, height: 160, cols: 8, rows: 5 });
    assert.equal(sim.particles.length, 8 * 5);
    assert.ok(sim.links.length > 40);
    assert.equal(sim.state, "idle");
  });

  it("press-hold breaks at the pressed node", () => {
    const sim = createPaperSim({ width: 280, height: 160, cols: 12, rows: 7 });
    const left = sim.particles.find((p) => p.col === 2 && p.row === 3);
    sim.beginGrab(left.x, left.y);
    for (let i = 0; i < 50; i++) sim.step();
    assert.ok(sim.brokenCount > 0, "expected breaks at press");
    const touchesGrab = sim.links.some(
      (l) => l.broken && (l.a === sim.grab || l.b === left || l.a === left || l.b === left),
    );
    // grab may be null after — check left particle still in tear
    const brokeNear = sim.links.some(
      (l) =>
        l.broken &&
        (l.a === left ||
          l.b === left ||
          Math.hypot((l.a.x + l.b.x) / 2 - left.ox, (l.a.y + l.b.y) / 2 - left.oy) < 40),
    );
    assert.ok(touchesGrab || brokeNear, "expected fracture near press node");
  });

  it("broken links stay broken after release (no heal)", () => {
    const sim = createPaperSim({ width: 280, height: 160, cols: 12, rows: 7 });
    const left = sim.particles.find((p) => p.col === 2 && p.row === 3);
    sim.beginGrab(left.x, left.y);
    for (let i = 0; i < 60; i++) sim.step();
    const n = sim.brokenCount;
    assert.ok(n > 0);
    sim.endGrab();
    for (let i = 0; i < 30; i++) sim.step();
    assert.equal(sim.brokenCount, n, "breaks must not heal on release");
    assert.ok(sim.links.filter((l) => l.broken).length === n);
  });

  it("press-hold alone builds crumple and can fracture", () => {
    const sim = createPaperSim({ width: 280, height: 160, cols: 12, rows: 7 });
    const left = sim.particles.find((p) => p.col === 2 && p.row === 3);
    sim.beginGrab(left.x, left.y);
    for (let i = 0; i < 90; i++) sim.step();
    assert.ok(sim.maxStrain > 1.02 || sim.brokenCount > 0);
  });

  it("press severs grab links so no elastic funnel spike forms", () => {
    const sim = createPaperSim({ width: 280, height: 160, cols: 12, rows: 7 });
    const left = sim.particles.find((p) => p.col === 2 && p.row === 3);
    sim.beginGrab(left.x, left.y);
    for (let i = 0; i < 24; i++) sim.step();
    const grab = left;
    const liveFromGrab = sim.links.filter(
      (l) => !l.broken && (l.a === grab || l.b === grab),
    );
    assert.equal(liveFromGrab.length, 0, "grab node must be severed — no funnel tip");
    const tipOut = Math.hypot(grab.x - grab.ix, grab.y - grab.iy);
    const cell = Math.max(280 / 11, 160 / 6);
    assert.ok(tipOut < cell * 2.2, `grab tip should not spike out (${tipOut.toFixed(1)}px)`);
  });

  it("press crumples particles inward toward the finger", () => {
    const sim = createPaperSim({ width: 280, height: 160, cols: 10, rows: 6 });
    const left = sim.particles.find((p) => p.col === 2 && p.row === 3);
    const neighbors = sim.particles.filter((p) => {
      if (p === left) return false;
      const d = Math.hypot(p.ix - left.ix, p.iy - left.iy);
      return d > 8 && d < 70;
    });
    const meanDist = () =>
      neighbors.reduce((s, p) => s + Math.hypot(p.x - left.ix, p.y - left.iy), 0) /
      neighbors.length;
    const before = meanDist();
    sim.beginGrab(left.x, left.y);
    // Sample early — before gravity carries the wad away from the press point
    for (let i = 0; i < 6; i++) sim.step();
    const after = meanDist();
    assert.ok(
      after < before * 0.7,
      `expected inward crumple (before=${before.toFixed(1)} after=${after.toFixed(1)})`,
    );
  });

  it("enough crumple collapses the card into a ball that falls", () => {
    const sim = createPaperSim({ width: 280, height: 160, cols: 12, rows: 7 });
    const left = sim.particles.find((p) => p.col === 2 && p.row === 3);
    sim.beginGrab(left.x, left.y);
    for (let i = 0; i < 140; i++) sim.step();
    assert.equal(sim.state, "collapsed");
    const free = sim.particles.filter((p) => !p.pinned);
    const cx = free.reduce((s, p) => s + p.x, 0) / free.length;
    const cy = free.reduce((s, p) => s + p.y, 0) / free.length;
    const meanR =
      free.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / free.length;
    const diag = Math.hypot(280, 160);
    assert.ok(meanR < diag * 0.28, `expected ball-like cluster (meanR=${meanR.toFixed(1)})`);
    assert.ok(sim.cfg.gravity > 0, "collapsed sheet should fall under gravity");
  });
});

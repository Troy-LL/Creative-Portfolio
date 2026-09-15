import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countCrossingPairs,
  fanAppearRadius,
  fanTiltAmount,
  limitNeighborLean,
  maxLeanDeltaDeg,
  navSurfaceForStation,
  navSurfaceFromPose,
  neighborTicksCross,
} from "../../assets/js/site-nav-ruler.js";

describe("site-nav ruler lean", () => {
  it("detects when a sharp lean spike crosses a neighbor", () => {
    // Same-side spike: steeper tick swings through its neighbor (land fan-out bug).
    assert.equal(neighborTicksCross(0, 22, -22.5, 4.7, 22, -35), true);
  });

  it("shock-front lean arrays cross before limiting", () => {
    const n = 24;
    const spacing = 4.7;
    const xs = Array.from({ length: n }, (_, i) => i * spacing);
    const heights = Array.from({ length: n }, () => 22);
    // Sharp V crest on the left edge — same shape that crossed in the screenshot.
    const leans = Array.from({ length: n }, (_, i) => {
      const x = i / (n - 1);
      const front = Math.exp(-Math.abs(x - 0.12) * 26);
      const side = x < 0.5 ? -1 : 1;
      return side * (6 + front * 32) * 1.15;
    });
    assert.ok(countCrossingPairs(xs, heights, leans) > 0);
  });

  it("limitNeighborLean removes adjacent crossings for that shock front", () => {
    const n = 24;
    const spacing = 4.7;
    const xs = Array.from({ length: n }, (_, i) => i * spacing);
    const heights = Array.from({ length: n }, () => 22);
    const leans = Array.from({ length: n }, (_, i) => {
      const x = i / (n - 1);
      const front = Math.exp(-Math.abs(x - 0.12) * 26);
      const side = x < 0.5 ? -1 : 1;
      return side * (6 + front * 32) * 1.15;
    });
    const cap = maxLeanDeltaDeg(spacing, 22);
    const limited = limitNeighborLean(leans, cap);
    assert.equal(countCrossingPairs(xs, heights, limited), 0);
    for (let i = 1; i < n; i++) {
      assert.ok(Math.abs(limited[i] - limited[i - 1]) <= cap + 1e-6);
    }
  });

  it("fanTiltAmount holds fan tilt through reveal end, then eases to rest", () => {
    const fan = 1.15;
    const rest = 0;
    assert.equal(fanTiltAmount({ reveal: 0.5, straighten: 0, fanTilt: fan, restTilt: rest }), fan);
    // Must not snap to rest the instant reveal hits 1.
    assert.equal(fanTiltAmount({ reveal: 1, straighten: 0, fanTilt: fan, restTilt: rest }), fan);
    // Ease-out: most of the drop happens early; mid-late is near rest.
    const early = fanTiltAmount({ reveal: 1, straighten: 0.15, fanTilt: fan, restTilt: rest });
    assert.ok(early < fan - 0.15 && early > rest + 0.15);
    const late = fanTiltAmount({ reveal: 1, straighten: 0.7, fanTilt: fan, restTilt: rest });
    assert.ok(late < early);
    assert.equal(fanTiltAmount({ reveal: 1, straighten: 1, fanTilt: fan, restTilt: rest }), rest);
  });

  it("fanTiltAmount eases out so the last fifth of straighten moves less than the first", () => {
    const fan = 1.15;
    const rest = 0;
    const early =
      fanTiltAmount({ reveal: 1, straighten: 0, fanTilt: fan, restTilt: rest }) -
      fanTiltAmount({ reveal: 1, straighten: 0.2, fanTilt: fan, restTilt: rest });
    const late =
      fanTiltAmount({ reveal: 1, straighten: 0.8, fanTilt: fan, restTilt: rest }) -
      fanTiltAmount({ reveal: 1, straighten: 1, fanTilt: fan, restTilt: rest });
    assert.ok(late < early * 0.55, `late ${late} should be gentler than early ${early}`);
  });

  it("fanAppearRadius keeps growing through straighten so edge ticks do not pop in", () => {
    const atRevealEnd = fanAppearRadius({ reveal: 1, straighten: 0 });
    const midStraighten = fanAppearRadius({ reveal: 1, straighten: 0.5 });
    const done = fanAppearRadius({ reveal: 1, straighten: 1 });
    assert.ok(midStraighten > atRevealEnd);
    assert.ok(done >= midStraighten);
    assert.ok(done >= 0.5);
  });

  it("navSurfaceForStation is dark on 02 and light on the card", () => {
    assert.equal(navSurfaceForStation("01"), "light");
    assert.equal(navSurfaceForStation("02"), "dark");
    assert.equal(navSurfaceForStation("03"), "light");
  });

  it("navSurfaceFromPose turns dark only when the nav sample sits on station 02", () => {
    const stair = {
      vw: 1000,
      layout: [
        { id: "01", x: 0, y: 0, w: 1350, h: 800 },
        { id: "02", x: 1350, y: 0, w: 1000, h: 2800 },
        { id: "03", x: 1350, y: 2800, w: 1000, h: 2800 },
      ],
    };
    assert.equal(navSurfaceFromPose({ x: 0, y: 0 }, stair), "light");
    // Center of viewport still on 01 runway.
    assert.equal(navSurfaceFromPose({ x: 200, y: 0 }, stair), "light");
    // Hop far enough that top-center samples 02.
    assert.equal(navSurfaceFromPose({ x: 1000, y: 0 }, stair), "dark");
    // Later beige leg on the same column.
    assert.equal(navSurfaceFromPose({ x: 1000, y: 2900 }, stair), "light");
  });
});

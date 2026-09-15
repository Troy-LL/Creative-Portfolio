import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countCrossingPairs,
  fanAppearRadius,
  fanAuthority,
  fanTiltAmount,
  landCrestPeak,
  limitNeighborLean,
  maxLeanDeltaDeg,
  navSurfaceForStation,
  navSurfaceFromPose,
  neighborTicksCross,
  rulerTickPose,
} from "../../assets/js/site-nav-ruler.js";

const FEEL = {
  baseline: 3.3,
  tilt: 0,
  lengthen: 1.65,
  strength: 0.55,
  opacity: 0.9,
  epicenter: 0.7,
};

function poseAt({
  x,
  reveal,
  straighten,
  peak = 0.5,
  time = 0,
  tilt,
  noise = 0.5,
  phaseA = 0,
  phaseB = 0,
  stagger = 0,
  reduce = false,
}) {
  const radius = fanAppearRadius({ reveal, straighten });
  const tiltNow =
    tilt ??
    fanTiltAmount({
      reveal,
      straighten,
      fanTilt: 1.15,
      restTilt: FEEL.tilt,
    });
  return rulerTickPose({
    x,
    peak,
    radius,
    time,
    reveal,
    straighten,
    tilt: tiltNow,
    feel: FEEL,
    noise,
    phaseA,
    phaseB,
    stagger,
    reduce,
  });
}

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

  it("fanTiltAmount begins settling early in reveal (V does not linger)", () => {
    const fan = 1.15;
    const rest = 0;
    // Very early reveal still fans.
    assert.equal(fanTiltAmount({ reveal: 0.1, straighten: 0, fanTilt: fan, restTilt: rest }), fan);
    // By mid-reveal lean is mostly gone — not a long full-V hold.
    const midReveal = fanTiltAmount({ reveal: 0.55, straighten: 0, fanTilt: fan, restTilt: rest });
    assert.ok(midReveal < fan * 0.45, `mid reveal still too fanned: ${midReveal}`);
    const lateReveal = fanTiltAmount({ reveal: 0.85, straighten: 0, fanTilt: fan, restTilt: rest });
    assert.ok(lateReveal < midReveal);
    assert.ok(lateReveal < fan * 0.25);
    // Continuous into straighten — no snap at reveal end.
    const atRevealEnd = fanTiltAmount({ reveal: 1, straighten: 0, fanTilt: fan, restTilt: rest });
    const justAfter = fanTiltAmount({ reveal: 1, straighten: 0.02, fanTilt: fan, restTilt: rest });
    assert.ok(Math.abs(atRevealEnd - lateReveal) < 0.35);
    assert.ok(justAfter <= atRevealEnd + 0.02);
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

  it("fanAuthority begins decaying mid-reveal with tilt (shock V dies with lean)", () => {
    assert.equal(fanAuthority({ reveal: 0.1, straighten: 0 }), 1);
    const mid = fanAuthority({ reveal: 0.55, straighten: 0 });
    assert.ok(mid < 0.55, `mid reveal fanK still high: ${mid}`);
    assert.equal(fanAuthority({ reveal: 1, straighten: 1 }), 0);
  });

  it("landCrestPeak opens at center then travels to the highlighted section", () => {
    // Fan opens from the middle.
    assert.equal(landCrestPeak({ reveal: 0.5, straighten: 0, sectionPeak: 0 }), 0.5);
    assert.equal(landCrestPeak({ reveal: 1, straighten: 0, sectionPeak: 0 }), 0.5);
    // Through straighten the V glides to the highlight (Card = 0).
    const early = landCrestPeak({ reveal: 1, straighten: 0.25, sectionPeak: 0 });
    const mid = landCrestPeak({ reveal: 1, straighten: 0.5, sectionPeak: 0 });
    const late = landCrestPeak({ reveal: 1, straighten: 0.85, sectionPeak: 0 });
    assert.ok(early < 0.5 && early > mid);
    assert.ok(mid > late && late > 0);
    assert.equal(landCrestPeak({ reveal: 1, straighten: 1, sectionPeak: 0 }), 0);
    assert.ok(
      Math.abs(landCrestPeak({ reveal: 1, straighten: 1, sectionPeak: 0.2 }) - 0.2) <
        1e-9,
    );
  });

  it("mean lean stays near zero while crest is still centered in late reveal", () => {
    function meanLean(reveal, straighten, sectionPeak) {
      const peak = landCrestPeak({ reveal, straighten, sectionPeak });
      const tilt = fanTiltAmount({
        reveal,
        straighten,
        fanTilt: 1.15,
        restTilt: 0,
      });
      const n = 24;
      let sum = 0;
      for (let i = 0; i < n; i += 1) {
        const x = i / (n - 1);
        sum += poseAt({
          x,
          peak,
          reveal,
          straighten,
          tilt,
          reduce: true,
        }).lean;
      }
      return sum / n;
    }
    const before = meanLean(0.999, 0, 0);
    const after = meanLean(1, 0, 0);
    assert.ok(Math.abs(before) < 1.5, `before mean lean ${before}`);
    assert.ok(Math.abs(after) < 1.5, `after mean lean ${after}`);
    assert.ok(Math.abs(after - before) < 0.75, `boundary jump ${after - before}`);
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
    assert.equal(navSurfaceFromPose({ x: 200, y: 0 }, stair), "light");
    assert.equal(navSurfaceFromPose({ x: 1000, y: 0 }, stair), "dark");
    assert.equal(navSurfaceFromPose({ x: 1000, y: 2900 }, stair), "light");
  });

  it("fanAuthority eases out through late reveal and straighten", () => {
    assert.equal(fanAuthority({ reveal: 0.1, straighten: 0 }), 1);
    assert.ok(fanAuthority({ reveal: 0.4, straighten: 0.9 }) <= 1);
    assert.ok(fanAuthority({ reveal: 1, straighten: 0 }) < 0.35);
    assert.equal(fanAuthority({ reveal: 1, straighten: 1 }), 0);
    assert.equal(fanAuthority({ reveal: 1, straighten: 2 }), 0);
    const early =
      fanAuthority({ reveal: 1, straighten: 0 }) -
      fanAuthority({ reveal: 1, straighten: 0.2 });
    const late =
      fanAuthority({ reveal: 1, straighten: 0.8 }) -
      fanAuthority({ reveal: 1, straighten: 1 });
    assert.ok(late < early * 0.55, `late ${late} should be gentler than early ${early}`);
  });

  it("does not snap height or lean at the reveal→straighten boundary", () => {
    for (let i = 0; i <= 20; i++) {
      const x = i / 20;
      const before = poseAt({ x, reveal: 0.999, straighten: 0 });
      const after = poseAt({ x, reveal: 1, straighten: 0 });
      assert.ok(
        Math.abs(before.height - after.height) < 0.35,
        `height snap at x=${x}: ${before.height} vs ${after.height}`,
      );
      assert.ok(
        Math.abs(before.lean - after.lean) < 0.5,
        `lean snap at x=${x}: ${before.lean} vs ${after.lean}`,
      );
    }
  });

  it("does not snap at straighten→idle, and clamps straighten past 1", () => {
    for (let i = 0; i <= 20; i++) {
      const x = i / 20;
      const almost = poseAt({ x, reveal: 1, straighten: 0.98 });
      const idle = poseAt({ x, reveal: 1, straighten: 1 });
      const past = poseAt({ x, reveal: 1, straighten: 1.4 });
      assert.ok(
        Math.abs(almost.height - idle.height) < 0.35,
        `height snap at x=${x}: ${almost.height} vs ${idle.height}`,
      );
      assert.ok(
        Math.abs(almost.lean - idle.lean) < 0.5,
        `lean snap at x=${x}: ${almost.lean} vs ${idle.lean}`,
      );
      assert.equal(idle.height, past.height);
      assert.equal(idle.lean, past.lean);
      assert.equal(
        fanAuthority({ reveal: 1, straighten: 1 }),
        fanAuthority({ reveal: 1, straighten: 1.4 }),
      );
    }
  });

  it("keeps an epicenter crest after straighten, and the crest follows peak", () => {
    const atPeak = poseAt({ x: 0.5, peak: 0.5, reveal: 1, straighten: 1 });
    const atEdge = poseAt({ x: 0.05, peak: 0.5, reveal: 1, straighten: 1 });
    assert.ok(
      atPeak.height - atEdge.height >= 2.5,
      `crest ${atPeak.height} vs edge ${atEdge.height}`,
    );
    const underCrest = poseAt({ x: 0.3, peak: 0.3, reveal: 1, straighten: 1 });
    const offCrest = poseAt({ x: 0.3, peak: 0.8, reveal: 1, straighten: 1 });
    assert.ok(
      underCrest.height > offCrest.height,
      `crest should move with peak: ${underCrest.height} vs ${offCrest.height}`,
    );
  });

  it("keeps idle ripple after straighten", () => {
    const a = poseAt({
      x: 0.4,
      peak: 0.5,
      reveal: 1,
      straighten: 1,
      time: 0,
    });
    const b = poseAt({
      x: 0.4,
      peak: 0.5,
      reveal: 1,
      straighten: 1,
      time: 1.7,
    });
    assert.ok(
      Math.abs(a.height - b.height) > 0.4,
      `idle ripple too small: ${a.height} vs ${b.height}`,
    );
  });

  it("reduced motion is static but still has an epicenter", () => {
    const a = poseAt({
      x: 0.5,
      peak: 0.5,
      reveal: 1,
      straighten: 1,
      time: 0,
      reduce: true,
    });
    const b = poseAt({
      x: 0.5,
      peak: 0.5,
      reveal: 1,
      straighten: 1,
      time: 1.7,
      reduce: true,
    });
    assert.equal(a.height, b.height);
    assert.equal(a.lean, b.lean);
    const edge = poseAt({
      x: 0.05,
      peak: 0.5,
      reveal: 1,
      straighten: 1,
      reduce: true,
    });
    assert.ok(a.height - edge.height >= 2.5);
  });

  it("fan lean limits to zero crossings with limitNeighborLean", () => {
    const n = 24;
    const spacing = 4.7;
    const xs = Array.from({ length: n }, (_, i) => i * spacing);
    const reveal = 0.2;
    const straighten = 0;
    const radius = fanAppearRadius({ reveal, straighten });
    const tilt = fanTiltAmount({
      reveal,
      straighten,
      fanTilt: 1.15,
      restTilt: 0,
    });
    const heights = [];
    const leans = [];
    for (let i = 0; i < n; i++) {
      const p = rulerTickPose({
        x: i / (n - 1),
        peak: 0.5,
        radius,
        time: 0,
        reveal,
        straighten,
        tilt,
        feel: FEEL,
        noise: 0.5,
      });
      heights.push(p.height);
      leans.push(p.lean);
    }
    const cap = maxLeanDeltaDeg(spacing, Math.max(...heights, 2.8));
    const limited = limitNeighborLean(leans, cap);
    assert.equal(countCrossingPairs(xs, heights, limited), 0);
  });

  it("rest lean is upright at tilt 0 and antisymmetric at tilt 0.4", () => {
    const left0 = poseAt({
      x: 0.3,
      peak: 0.5,
      reveal: 1,
      straighten: 1,
      tilt: 0,
    });
    const right0 = poseAt({
      x: 0.7,
      peak: 0.5,
      reveal: 1,
      straighten: 1,
      tilt: 0,
    });
    assert.ok(left0.lean === 0);
    assert.ok(right0.lean === 0);

    const left = poseAt({
      x: 0.3,
      peak: 0.5,
      reveal: 1,
      straighten: 1,
      tilt: 0.4,
    });
    const right = poseAt({
      x: 0.7,
      peak: 0.5,
      reveal: 1,
      straighten: 1,
      tilt: 0.4,
    });
    assert.ok(Math.abs(left.lean + right.lean) < 1e-9);
    assert.ok(left.lean !== 0);
  });
});


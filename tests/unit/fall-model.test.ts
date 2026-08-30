import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FALL_PHYS,
  fallCssTransform,
  fallPoseAt,
  fallRestPose,
  settlePoseAt,
} from "../../calling-card/src/fold/fall.ts";

describe("fall model", () => {
  it("starts high and ends at flat rest", () => {
    const start = fallPoseAt(0);
    const end = fallPoseAt(1);
    assert.ok(start.y < -0.5);
    assert.ok(Math.abs(end.x) < 0.02);
    assert.ok(Math.abs(end.y) < 0.02);
    assert.ok(Math.abs(end.z) < 0.05);
    assert.ok(Math.abs(end.rotX) < 2);
    assert.ok(Math.abs(end.rotY) < 2);
    assert.ok(Math.abs(end.rotZ) < 2);
  });

  it("settle finishes at rest pose", () => {
    const done = settlePoseAt(1);
    const rest = fallRestPose();
    assert.ok(Math.abs(done.x - rest.x) < 0.001);
    assert.ok(Math.abs(done.y - rest.y) < 0.001);
    assert.ok(Math.abs(done.rotX) < 0.5);
  });

  it("css rest transform matches fold rest Z", () => {
    const { transform, heightNorm } = fallCssTransform(fallRestPose(), 800);
    assert.match(transform, new RegExp(`translate3d\\(0px, 0px, ${FALL_PHYS.restZ}px\\)`));
    assert.equal(heightNorm, 0);
  });
});

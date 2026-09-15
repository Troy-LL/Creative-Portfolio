import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HORIZON,
  advanceHorizon,
  buildStaircase,
  equalizerTicks,
  navProgress,
  navStations,
  pathAtStation,
  scrollMeter,
  stationIndex,
  trackPose,
} from "../../assets/js/portfolio-horizon.js";

const view = { viewportHeight: 800, viewportWidth: 1200 };

describe("portfolio staircase", () => {
  it("does not advance the path while fold is still closing", () => {
    const next = advanceHorizon({
      fold: 0.4,
      hold: 0,
      path: 0,
      deltaPx: 200,
      ...view,
    });
    assert.equal(next.kind, "fold");
    assert.equal(next.hold, 0);
    assert.equal(next.path, 0);
  });

  it("hold consumes extra downward scroll after fold is open before any path", () => {
    const holdPx = HORIZON.holdVh * view.viewportHeight;
    const next = advanceHorizon({
      fold: 1,
      hold: 0,
      path: 0,
      deltaPx: holdPx * 0.4,
      ...view,
    });
    assert.equal(next.kind, "hold");
    assert.ok(next.hold > 0 && next.hold < 1);
    assert.equal(next.path, 0);
    const pose = trackPose(next.path, buildStaircase(view.viewportWidth, view.viewportHeight));
    assert.equal(pose.x, 0);
    assert.equal(pose.y, 0);
  });

  it("first path after hold is a horizontal corner onto section 02", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    const cornerPx = view.viewportWidth * HORIZON.cornerVw;
    const next = advanceHorizon({
      fold: 1,
      hold: 1,
      path: 0,
      deltaPx: cornerPx * 0.5,
      ...view,
    });
    assert.equal(next.kind, "corner");
    assert.equal(next.hold, 1);
    const pose = trackPose(next.path, stair);
    assert.ok(pose.x > cornerPx * 0.4);
    assert.equal(pose.y, 0);
    assert.equal(pose.station, "02");
  });

  it("after the first corner, further scroll is a vertical leg (y grows, x parked)", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    const cornerPx = view.viewportWidth * HORIZON.cornerVw;
    const atCornerEnd = advanceHorizon({
      fold: 1,
      hold: 1,
      path: 0,
      deltaPx: cornerPx,
      ...view,
    });
    const intoLeg = advanceHorizon({
      fold: 1,
      hold: 1,
      path: atCornerEnd.path,
      deltaPx: view.viewportHeight * 0.4,
      ...view,
    });
    assert.equal(intoLeg.kind, "leg");
    const pose = trackPose(intoLeg.path, stair);
    assert.ok(Math.abs(pose.x - view.viewportWidth) < 1e-6);
    assert.ok(pose.y > 50);
    assert.equal(pose.station, "02");
  });

  it("never scales — pose is x/y translation only", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    const pose = trackPose(0.5, stair);
    assert.equal(typeof pose.x, "number");
    assert.equal(typeof pose.y, "number");
    assert.ok(pose.x >= 0);
    assert.ok(pose.y >= 0);
  });

  it("clamps at the end of the last leg", () => {
    const next = advanceHorizon({
      fold: 1,
      hold: 1,
      path: 1,
      deltaPx: 800,
      ...view,
    });
    assert.equal(next.kind, "end");
    assert.equal(next.path, 1);
  });

  it("scroll up from a leg returns through path then hold then fold", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    const mid = advanceHorizon({
      fold: 1,
      hold: 1,
      path: 0.35,
      deltaPx: 0,
      ...view,
    });
    assert.ok(mid.path > 0);
    const back = advanceHorizon({
      fold: 1,
      hold: 1,
      path: mid.path,
      deltaPx: -stair.totalPx,
      ...view,
    });
    assert.ok(back.path < 0.01);

    const holdPx = HORIZON.holdVh * view.viewportHeight;
    const throughHold = advanceHorizon({
      fold: 1,
      hold: 0.5,
      path: 0,
      deltaPx: -holdPx,
      ...view,
    });
    assert.equal(throughHold.hold, 0);

    const toFold = advanceHorizon({
      fold: 1,
      hold: 0,
      path: 0,
      deltaPx: -40,
      ...view,
    });
    assert.equal(toFold.kind, "fold");
  });

  it("builds staggered columns: 01 then 02–06 legs", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    assert.equal(stair.layout[0].id, "01");
    assert.deepEqual(
      stair.layout.slice(1).map((c) => c.id),
      ["02", "03", "04", "05", "06"],
    );
    assert.ok(stair.totalPx > view.viewportWidth);
    assert.equal(stair.layout[1].x, view.viewportWidth);
    assert.equal(stair.layout[1].y, 0);
    assert.ok(stair.layout[2].y > 0);
  });

  it("ticks station labels along the path", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    assert.equal(stationIndex(0, stair), "01");
    assert.equal(stationIndex(0.01, stair), "02");
    assert.equal(stationIndex(1, stair), "06");
  });

  it("nav stations use kickers and pathAtStation jumps to leg starts", () => {
    const items = navStations();
    assert.deepEqual(
      items.map((s) => s.label),
      ["Card", "Flagship", "Shelf", "Archive", "Person", "Exit"],
    );
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    assert.equal(pathAtStation("01", stair), 0);
    const p2 = pathAtStation("02", stair);
    const p3 = pathAtStation("03", stair);
    assert.ok(p2 > 0);
    assert.ok(p3 > p2);
    assert.equal(trackPose(p2, stair).station, "02");
    assert.equal(trackPose(p2, stair).kind, "leg");
  });

  it("navProgress glides continuously between station label centers", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    assert.equal(navProgress(0, stair), 0);
    assert.equal(navProgress(1, stair), 1);
    const p2 = pathAtStation("02", stair);
    const p3 = pathAtStation("03", stair);
    const atFlagship = navProgress(p2, stair);
    const mid = navProgress((p2 + p3) / 2, stair);
    const atShelf = navProgress(p3, stair);
    assert.ok(Math.abs(atFlagship - 0.2) < 0.02);
    assert.ok(mid > atFlagship && mid < atShelf);
    assert.ok(Math.abs(atShelf - 0.4) < 0.02);
  });

  it("equalizer ticks grow short → mid → tall across overall path", () => {
    assert.deepEqual(equalizerTicks(0).slice(0, 3), ["short", "short", "short"]);
    assert.deepEqual(equalizerTicks(0.1).slice(0, 3), ["tall", "mid", "short"]);
    assert.deepEqual(equalizerTicks(0.2).slice(0, 4), [
      "tall",
      "tall",
      "mid",
      "short",
    ]);
    assert.equal(equalizerTicks(1).every((t) => t === "tall"), true);
    assert.equal(equalizerTicks(0.997).every((t) => t === "tall"), true);
  });

  it("scroll meter reports progress while on the staircase path", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    const hold = scrollMeter(0, stair);
    assert.equal(hold.visible, false);

    const mid = advanceHorizon({
      fold: 1,
      hold: 1,
      path: 0,
      deltaPx: view.viewportWidth * 0.4,
      ...view,
    });
    const meter = scrollMeter(mid.path, stair);
    assert.equal(meter.visible, true);
    assert.ok(meter.progress > 0);
    assert.equal(meter.ticks.length, 12);
    assert.ok(meter.ticks.includes("tall") || meter.ticks.includes("mid"));
  });

  it("legs stay long enough that a vertical read exists before the next corner", () => {
    assert.ok(HORIZON.legVh >= 3);
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    assert.ok(stair.overflow >= view.viewportHeight * 1.5);
    assert.ok(stair.cornerHoldPx > 0);
    assert.ok(stair.segments.some((s) => s.kind === "dwell"));
  });

  it("first page wall is short so leaving 01 is easy", () => {
    assert.ok(HORIZON.holdVh > 0);
    assert.ok(HORIZON.holdVh <= 0.28);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HORIZON,
  advanceHorizon,
  buildStaircase,
  equalizerTicks,
  navActiveStation,
  navProgress,
  navStations,
  pathAtStation,
  scrollMeter,
  stationIndex,
  trackPose,
} from "../../assets/js/portfolio-horizon.js";

const view = { viewportHeight: 800, viewportWidth: 1200 };

describe("portfolio L-path", () => {
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
    // Hop still belongs to 01 — 02 only after the column leg starts.
    assert.equal(pose.station, "01");
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
    assert.ok(
      Math.abs(pose.x - view.viewportWidth * HORIZON.cornerVw) < 1e-6,
    );
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

  it("L-path: only one horizontal corner, then stacked vertical legs", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    const corners = stair.segments.filter((s) => s.kind === "corner");
    assert.equal(corners.length, 1);
    assert.equal(stair.segments.filter((s) => s.kind === "dwell").length, 0);
    const cornerPx = view.viewportWidth * HORIZON.cornerVw;
    assert.equal(stair.layout[1].x, cornerPx);
    assert.equal(stair.layout[2].x, cornerPx);
    assert.ok(stair.layout[2].y > stair.layout[1].y);
  });

  it("after the first corner, further scroll stays on one X while Y grows through later stations", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    const cornerPx = view.viewportWidth * HORIZON.cornerVw;
    const atCornerEnd = advanceHorizon({
      fold: 1,
      hold: 1,
      path: 0,
      deltaPx: cornerPx,
      ...view,
    });
    const deep = advanceHorizon({
      fold: 1,
      hold: 1,
      path: atCornerEnd.path,
      deltaPx: view.viewportHeight * 8,
      ...view,
    });
    const pose = trackPose(deep.path, stair);
    assert.ok(Math.abs(pose.x - cornerPx) < 1e-6);
    assert.ok(pose.y > view.viewportHeight);
    assert.ok(["03", "04", "05", "06"].includes(pose.station));
  });

  it("builds 01 then stacked 02–06 legs on one column", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    assert.equal(stair.layout[0].id, "01");
    assert.deepEqual(
      stair.layout.slice(1).map((c) => c.id),
      ["02", "03", "04", "05", "06"],
    );
    assert.ok(stair.totalPx > view.viewportWidth);
    assert.equal(stair.layout[1].x, view.viewportWidth * HORIZON.cornerVw);
    assert.equal(stair.layout[1].y, 0);
    assert.ok(stair.layout[2].y > 0);
  });

  it("legs stay long enough for a vertical read after the hop", () => {
    assert.ok(HORIZON.legVh >= 3);
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    assert.ok(stair.overflow >= view.viewportHeight * 1.5);
  });

  it("ticks station labels along the path", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    assert.equal(stationIndex(0, stair), "01");
    // Mid-hop is still the card chapter — not Flagship yet.
    assert.equal(stationIndex(0.01, stair), "01");
    assert.equal(stationIndex(pathAtStation("02", stair), stair), "02");
    assert.equal(stationIndex(1, stair), "06");
  });

  it("each content leg owns its scroll — hop and handoff stay on the current station", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    const corner = stair.segments.find((s) => s.kind === "corner");
    assert.equal(corner?.station, "01");

    const byStation = {};
    for (const seg of stair.segments) {
      if (seg.kind !== "leg") continue;
      byStation[seg.station] = (byStation[seg.station] || 0) + 1;
    }
    // 02…05: overflow + handoff to next; 06: overflow only.
    assert.equal(byStation["02"], 2);
    assert.equal(byStation["03"], 2);
    assert.equal(byStation["04"], 2);
    assert.equal(byStation["05"], 2);
    assert.equal(byStation["06"], 1);

    // Handoff 02→03 is still tagged 02 (leaving Flagship), not Shelf early.
    const after02 = stair.segments.findIndex(
      (s) => s.kind === "leg" && s.station === "02" && s.lengthPx === stair.overflow,
    );
    assert.ok(after02 >= 0);
    const handoff = stair.segments[after02 + 1];
    assert.equal(handoff?.station, "02");
    assert.equal(handoff?.lengthPx, stair.vh);
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
    // Shelf path starts when 03's top is parked — not during Flagship handoff.
    assert.ok(Math.abs(p3 - (p2 + (stair.overflow + stair.vh) / stair.totalPx)) < 0.02);
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

  it("navActiveStation matches the nearest label to navProgress", () => {
    const stair = buildStaircase(view.viewportWidth, view.viewportHeight);
    assert.equal(navActiveStation(0, stair), "01");
    assert.equal(navActiveStation(0.01, stair), "01");
    assert.equal(navActiveStation(pathAtStation("02", stair), stair), "02");
    assert.equal(navActiveStation(pathAtStation("03", stair), stair), "03");
    assert.equal(navActiveStation(1, stair), "06");
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

  it("scroll meter reports progress while on the path", () => {
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

  it("first page wall is short so leaving 01 is easy", () => {
    assert.ok(HORIZON.holdVh > 0);
    assert.ok(HORIZON.holdVh <= 0.28);
  });

  it("station 01 spans the hop so the push hand can exit off-frame", () => {
    assert.ok(HORIZON.cornerVw >= 1.3 && HORIZON.cornerVw <= 1.45);
    const stair = buildStaircase(1440, 900);
    const cornerPx = 1440 * HORIZON.cornerVw;
    assert.ok(Math.abs(stair.layout[0].w - cornerPx) < 1e-6);
    assert.ok(stair.layout[0].w >= stair.vw);
    assert.equal(stair.layout[1].x, stair.layout[0].w);
    assert.ok(Math.abs(stair.width - (cornerPx + stair.vw)) < 1e-6);
    assert.equal(stair.segments.filter((s) => s.kind === "corner").length, 1);
    const atCornerEnd = trackPose(
      stair.segments[0].lengthPx / stair.totalPx,
      stair,
    );
    assert.ok(Math.abs(atCornerEnd.x - cornerPx) < 1e-6);
    assert.ok(atCornerEnd.x >= stair.vw);
  });
});

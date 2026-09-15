function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export const HORIZON = {
  holdVh: 0.22,
  cornerVw: 1.35,
  legVh: 3.5,
  foldOpen: 0.992,
  lag: 0.45,
  legs: [
    { id: "02", title: "The thing behind the hatch.", kicker: "Flagship" },
    { id: "03", title: "Kept work.", kicker: "Shelf" },
    { id: "04", title: "The site this one replaced.", kicker: "Archive" },
    { id: "05", title: "The hand that made the card.", kicker: "Person" },
    { id: "06", title: "The card has a back. So does this.", kicker: "Exit" },
  ],
};

/** @deprecated use cornerVw */
Object.defineProperty(HORIZON, "travelVw", {
  get() {
    return this.cornerVw;
  },
  enumerable: true,
});

export function buildStaircase(
  viewportWidth,
  viewportHeight,
  opts = HORIZON,
) {
  const vw = Math.max(1, Number(viewportWidth) || 0);
  const vh = Math.max(1, Number(viewportHeight) || 0);
  const cornerPx = vw * (opts.cornerVw ?? 1);
  const legVh = Math.max(1, Number(opts.legVh) || 3.5);
  const legH = legVh * vh;
  const overflow = Math.max(0, legH - vh);
  const legs = Array.isArray(opts.legs) ? opts.legs : HORIZON.legs;

  const layout = [
    { id: "01", x: 0, y: 0, w: Math.max(vw, cornerPx), h: vh, kind: "card" },
  ];
  /** @type {Array<{ kind: string, lengthPx: number, x0: number, y0: number, x1: number, y1: number, station: string }>} */
  const segments = [];

  let x = 0;
  let y = 0;

  if (legs.length > 0) {
    const x1 = x + cornerPx;
    segments.push({
      kind: "corner",
      lengthPx: cornerPx,
      x0: x,
      y0: y,
      x1,
      y1: y,
      station: "01",
    });
    x = x1;
  }

  for (let i = 0; i < legs.length; i += 1) {
    const leg = legs[i];
    layout.push({
      id: leg.id,
      x,
      y,
      w: vw,
      h: legH,
      kind: "leg",
      title: leg.title,
      kicker: leg.kicker,
    });
    if (overflow > 0) {
      const y1 = y + overflow;
      segments.push({
        kind: "leg",
        lengthPx: overflow,
        x0: x,
        y0: y,
        x1: x,
        y1,
        station: leg.id,
      });
      y = y1;
    }
    if (i < legs.length - 1) {
      const y1 = y + vh;
      segments.push({
        kind: "leg",
        lengthPx: vh,
        x0: x,
        y0: y,
        x1: x,
        y1,
        station: leg.id,
      });
      y = y1;
    }
  }

  const totalPx = segments.reduce((sum, s) => sum + s.lengthPx, 0);
  const width = x + vw;
  const height = y + vh;

  return {
    segments,
    layout,
    totalPx,
    width,
    height,
    vw,
    vh,
    overflow,
    cornerHoldPx: 0,
  };
}

export function trackPose(path, staircase) {
  const stair = staircase;
  const t = clamp(Number(path) || 0, 0, 1);
  if (!stair || !stair.segments?.length || stair.totalPx <= 0) {
    return {
      x: 0,
      y: 0,
      kind: "hold",
      station: "01",
      segmentIndex: -1,
      progress: 0,
    };
  }
  if (t <= 0) {
    return {
      x: 0,
      y: 0,
      kind: "hold",
      station: "01",
      segmentIndex: -1,
      progress: 0,
    };
  }

  let remain = t * stair.totalPx;
  for (let i = 0; i < stair.segments.length; i += 1) {
    const seg = stair.segments[i];
    if (remain > seg.lengthPx && i < stair.segments.length - 1) {
      remain -= seg.lengthPx;
      continue;
    }
    const p = clamp(remain / Math.max(1, seg.lengthPx), 0, 1);
    return {
      x: seg.x0 + (seg.x1 - seg.x0) * p,
      y: seg.y0 + (seg.y1 - seg.y0) * p,
      kind: seg.kind,
      station: seg.station,
      segmentIndex: i,
      progress: p,
    };
  }

  const last = stair.segments[stair.segments.length - 1];
  return {
    x: last.x1,
    y: last.y1,
    kind: "end",
    station: last.station,
    segmentIndex: stair.segments.length - 1,
    progress: 1,
  };
}

export function equalizerTicks(path, tickCount = 12) {
  const n = Math.max(1, Math.floor(Number(tickCount) || 12));
  const t = clamp(Number(path) || 0, 0, 1);
  if (t >= 0.995) return Array.from({ length: n }, () => "tall");
  const p = t * n;
  /** @type {Array<"short" | "mid" | "tall">} */
  const ticks = [];
  for (let i = 0; i < n; i += 1) {
    if (p >= i + 1) ticks.push("tall");
    else if (p > i) ticks.push("mid");
    else ticks.push("short");
  }
  return ticks;
}

export function scrollMeter(path, staircase) {
  const pose = trackPose(path, staircase);
  let p = clamp(Number(path) || 0, 0, 1);
  if (pose.kind === "end") p = 1;
  if (pose.kind === "hold" || pose.segmentIndex < 0 || p <= 0) {
    return {
      visible: false,
      progress: 0,
      station: pose.station,
      kind: pose.kind,
      ticks: equalizerTicks(0),
    };
  }
  return {
    visible: true,
    progress: p,
    station: pose.station,
    kind: pose.kind,
    ticks: equalizerTicks(p),
  };
}

export function stationIndex(path, staircase) {
  if (!staircase) {
    const fallback = buildStaircase(1200, 800);
    return trackPose(path, fallback).station;
  }
  return trackPose(path, staircase).station;
}

export function navStations(opts = HORIZON) {
  const legs = Array.isArray(opts.legs) ? opts.legs : HORIZON.legs;
  return [
    { id: "01", label: "Card" },
    ...legs.map((leg) => ({
      id: leg.id,
      label: leg.kicker || leg.title || leg.id,
    })),
  ];
}

export function pathAtStation(stationId, staircase) {
  const id = String(stationId || "01");
  if (id === "01") return 0;
  if (!staircase?.segments?.length || !(staircase.totalPx > 0)) return 0;

  let dist = 0;
  for (const seg of staircase.segments) {
    if (seg.station === id && (seg.kind === "leg" || seg.kind === "dwell")) {
      return clamp((dist + 1) / staircase.totalPx, 0, 1);
    }
    dist += seg.lengthPx;
  }

  dist = 0;
  for (const seg of staircase.segments) {
    if (seg.station === id) {
      return clamp(dist / staircase.totalPx, 0, 1);
    }
    dist += seg.lengthPx;
  }
  return 1;
}

export function navProgress(path, staircase, opts = HORIZON) {
  const stations = navStations(opts);
  const n = stations.length;
  if (n <= 1) return 0;
  const p = clamp(Number(path) || 0, 0, 1);
  if (p <= 0.0005) return 0;
  if (p >= 0.995) return 1;

  const anchors = stations.map((s) =>
    s.id === "01" ? 0 : pathAtStation(s.id, staircase),
  );

  let idx = 0;
  for (let i = 0; i < n; i += 1) {
    if (anchors[i] <= p) idx = i;
  }
  if (idx >= n - 1) return 1;

  const a0 = anchors[idx];
  const a1 = anchors[idx + 1];
  const local = a1 > a0 ? clamp((p - a0) / (a1 - a0), 0, 1) : 0;
  return (idx + local) / (n - 1);
}

export function navActiveStation(path, staircase, opts = HORIZON) {
  const stations = navStations(opts);
  const n = stations.length;
  if (n <= 1) return "01";
  const prog = navProgress(path, staircase, opts);
  const idx = Math.round(prog * (n - 1));
  return stations[clamp(idx, 0, n - 1)].id;
}

export function wheelPixels(event) {
  const y = event?.deltaY ?? 0;
  const mode = event?.deltaMode ?? 0;
  if (mode === 1) return y * 16;
  if (mode === 2) return y * 32;
  return y;
}

/** @deprecated overflow is path-based */
export function overflowPx(viewportWidth, cornerVw = HORIZON.cornerVw) {
  return Math.max(0, Number(viewportWidth) || 0) * cornerVw;
}

/** @deprecated use trackPose */
export function trackTranslatePx(travel, overflow) {
  const x = -clamp(travel, 0, 1) * Math.max(0, Number(overflow) || 0);
  return x === 0 ? 0 : x;
}

export function advanceHorizon({
  fold,
  hold,
  path,
  travel,
  deltaPx,
  viewportHeight,
  viewportWidth,
}) {
  const holdNow = clamp(Number(hold) || 0, 0, 1);
  const pathNow = clamp(
    Number(path ?? travel) || 0,
    0,
    1,
  );
  const dy = Number(deltaPx) || 0;

  if ((Number(fold) || 0) < HORIZON.foldOpen) {
    return {
      kind: "fold",
      hold: holdNow,
      path: pathNow,
      travel: pathNow,
      preventDefault: true,
    };
  }

  const stair = buildStaircase(viewportWidth, viewportHeight);
  const holdSpan = Math.max(1, (Number(viewportHeight) || 0) * HORIZON.holdVh);
  const pathSpan = Math.max(1, stair.totalPx);

  let nextHold = holdNow;
  let nextPath = pathNow;

  if (dy >= 0) {
    let rest = dy;
    if (nextPath <= 0 && nextHold < 1) {
      const room = (1 - nextHold) * holdSpan;
      const used = Math.min(rest, room);
      nextHold = clamp(nextHold + used / holdSpan, 0, 1);
      rest -= used;
    }
    if (rest > 0 && nextHold >= 1) {
      nextPath = clamp(nextPath + rest / pathSpan, 0, 1);
    }
  } else {
    let rest = -dy;
    if (nextPath > 0) {
      const room = nextPath * pathSpan;
      const used = Math.min(rest, room);
      nextPath = clamp(nextPath - used / pathSpan, 0, 1);
      rest -= used;
    }
    if (rest > 0 && nextPath <= 0) {
      const room = nextHold * holdSpan;
      const used = Math.min(rest, room);
      nextHold = clamp(nextHold - used / holdSpan, 0, 1);
      rest -= used;
    }
    if (rest > 0 && nextHold <= 0 && nextPath <= 0) {
      return {
        kind: "fold",
        hold: 0,
        path: 0,
        travel: 0,
        preventDefault: true,
      };
    }
  }

  let kind = "hold";
  if (dy > 0 && nextPath >= 1 && pathNow >= 1) kind = "end";
  else if (nextPath > 0) {
    kind = trackPose(nextPath, stair).kind;
    if (kind === "end") kind = "leg";
  }

  return {
    kind,
    hold: nextHold,
    path: nextPath,
    travel: nextPath,
    preventDefault: true,
  };
}

export function applyStaircaseLayout(track, staircase) {
  if (!track || !staircase) return;
  track.style.width = `${staircase.width}px`;
  track.style.height = `${staircase.height}px`;
  track.style.setProperty("--horizon-vw", `${staircase.vw}px`);
  for (const col of staircase.layout) {
    const el = track.querySelector(`[data-station="${col.id}"]`);
    if (!el) continue;
    el.style.left = `${col.x}px`;
    el.style.top = `${col.y}px`;
    el.style.width = `${col.w}px`;
    el.style.height = `${col.h}px`;
  }
}

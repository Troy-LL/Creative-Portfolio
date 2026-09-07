/**
 * Horizontal table after the locked fold/hatch.
 * Vertical wheel → short wall on 01 → one page of translateX. 02 is the last page.
 */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export const HORIZON = {
  holdVh: 0.22,
  travelVw: 1,
  foldOpen: 0.992,
  stationAt: 0.5,
  lag: 0.45,
};

export function overflowPx(viewportWidth, travelVw = HORIZON.travelVw) {
  return Math.max(0, Number(viewportWidth) || 0) * travelVw;
}

export function trackTranslatePx(travel, overflow) {
  const x = -clamp(travel, 0, 1) * Math.max(0, Number(overflow) || 0);
  return x === 0 ? 0 : x;
}

export function stationIndex(travel) {
  return clamp(travel, 0, 1) >= HORIZON.stationAt ? "02" : "01";
}

export function wheelPixels(event) {
  const y = event?.deltaY ?? 0;
  const mode = event?.deltaMode ?? 0;
  if (mode === 1) return y * 16;
  if (mode === 2) return y * 32;
  return y;
}

export function advanceHorizon({
  fold,
  hold,
  travel,
  deltaPx,
  viewportHeight,
  viewportWidth,
}) {
  const holdNow = clamp(Number(hold) || 0, 0, 1);
  const travelNow = clamp(Number(travel) || 0, 0, 1);
  const dy = Number(deltaPx) || 0;

  if ((Number(fold) || 0) < HORIZON.foldOpen) {
    return {
      kind: "fold",
      hold: holdNow,
      travel: travelNow,
      preventDefault: true,
    };
  }

  const holdSpan = Math.max(1, (Number(viewportHeight) || 0) * HORIZON.holdVh);
  const travelSpan = Math.max(1, overflowPx(viewportWidth));

  let nextHold = holdNow;
  let nextTravel = travelNow;

  if (dy >= 0) {
    let rest = dy;
    if (nextTravel <= 0 && nextHold < 1) {
      const room = (1 - nextHold) * holdSpan;
      const used = Math.min(rest, room);
      nextHold = clamp(nextHold + used / holdSpan, 0, 1);
      rest -= used;
    }
    if (rest > 0 && nextHold >= 1) {
      nextTravel = clamp(nextTravel + rest / travelSpan, 0, 1);
    }
  } else {
    let rest = -dy;
    if (nextTravel > 0) {
      const room = nextTravel * travelSpan;
      const used = Math.min(rest, room);
      nextTravel = clamp(nextTravel - used / travelSpan, 0, 1);
      rest -= used;
    }
    if (rest > 0 && nextTravel <= 0) {
      const room = nextHold * holdSpan;
      const used = Math.min(rest, room);
      nextHold = clamp(nextHold - used / holdSpan, 0, 1);
      rest -= used;
    }
    if (rest > 0 && nextHold <= 0 && nextTravel <= 0) {
      return { kind: "fold", hold: 0, travel: 0, preventDefault: true };
    }
  }

  let kind = "hold";
  if (dy > 0 && nextTravel >= 1 && travelNow >= 1) kind = "end";
  else if (nextTravel > 0) kind = "travel";

  return {
    kind,
    hold: nextHold,
    travel: nextTravel,
    preventDefault: true,
  };
}

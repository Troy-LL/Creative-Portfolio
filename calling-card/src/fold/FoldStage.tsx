import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Card,
  defaultCardContent,
  defaultInkParams,
  defaultLitOpacity,
} from "../components/Card/Card";
import {
  applyLag,
  alignPose,
  applyHatchDebug,
  clampPose,
  creaseAmountFromAngles,
  FOLD_END,
  panelAngles,
  panelAnglesAtEnd,
  panelShadeFromAngles,
  shouldSnapOpen,
  surfacePeel,
  surfacePeelFromAngles,
  type CardPose,
  type FoldPhase,
} from "./model";
import {
  FOLD_DEBUG_DEFAULTS,
  FoldDebugPanel,
  type FoldDebugState,
} from "./FoldDebugPanel";
import {
  FALL_PHYS,
  fallCssTransform,
  fallPoseAt,
  fallRestPose,
  settlePoseAt,
  type FallPose,
} from "./fall";
import "./fold.css";

const LAG_ALPHA = 0.45;
const RETURN_SPEED = 1.9;
const OPEN_SPEED = 0.85;
const ENTER_SPEED = 1.05;
/** Wheel deltaY → fold progress (lower = more scroll to show the Z). */
const SCROLL_GAIN = 0.00115;
const SCROLL_IDLE_MS = 280;
export const HINT_REVEAL_MS = 2000;
const HINT_SESSION_KEY = "fold-scroll-hint-dismissed";
const SEED = 20260331;

const DEBUG =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debug");

type EntryPhase = "falling" | "settling" | "ready";

type Pose = {
  phase: FoldPhase;
  fold: number;
  displayFold: number;
  enter: number;
  displayEnter: number;
  cardPose: CardPose;
};

const REST: Pose = {
  phase: "idle",
  fold: 0,
  displayFold: 0,
  enter: 0,
  displayEnter: 0,
  cardPose: { rotateX: 0, rotateY: 0, rotateZ: 0 },
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function snapshot(p: Pose): Pose {
  return { ...p, cardPose: { ...p.cardPose } };
}

function skipFallEntry(): boolean {
  if (DEBUG) return true;
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ThirdPrint({ index }: { index: 0 | 1 | 2 }) {
  return (
    <div className="fold-panel__clip">
      <div
        className="fold-panel__print"
        style={{ transform: `translateY(${-index * (100 / 3)}%)` }}
      >
        <Card
          seed={SEED}
          showPrint
          ink={defaultInkParams}
          content={defaultCardContent}
          style={
            {
              "--paper-lit-opacity": String(defaultLitOpacity),
              "--card-width": "100%",
            } as CSSProperties
          }
        />
      </div>
    </div>
  );
}

export function FoldStage() {
  const stageRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pose = useRef<Pose>(snapshot(REST));
  const raf = useRef(0);
  const lastT = useRef(0);
  const scrollIdle = useRef(0);
  const entryPhase = useRef<EntryPhase>(
    skipFallEntry() ? "ready" : "falling",
  );
  const entryStart = useRef(
    typeof performance !== "undefined" ? performance.now() : 0,
  );
  const fallPose = useRef<FallPose>(
    entryPhase.current === "ready" ? fallRestPose() : fallPoseAt(0),
  );
  const scrolledSession = useRef(
    typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(HINT_SESSION_KEY) === "1",
  );
  const [hintOut, setHintOut] = useState(false);
  const [ready, setReady] = useState(entryPhase.current === "ready");
  const [frame, setFrame] = useState<Pose>(() => snapshot(REST));
  const [fallFrame, setFallFrame] = useState<FallPose>(() => fallPose.current);
  const [debug, setDebug] = useState<FoldDebugState>(FOLD_DEBUG_DEFAULTS);

  useEffect(() => {
    if (!ready || scrolledSession.current) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(
      () => {
        if (!scrolledSession.current) setHintOut(true);
      },
      reduce ? 0 : HINT_REVEAL_MS,
    );
    return () => window.clearTimeout(id);
  }, [ready]);

  const dismissHint = () => {
    if (scrolledSession.current) return;
    scrolledSession.current = true;
    setHintOut(false);
    try {
      sessionStorage.setItem(HINT_SESSION_KEY, "1");
    } catch {
      /* private mode */
    }
  };

  useEffect(() => {
    const w = window as Window & {
      __foldDebugSet?: (fold: number) => void;
    };
    w.__foldDebugSet = (fold: number) => {
      const f = clamp(fold, 0, 1);
      const p = pose.current;
      p.fold = f;
      p.displayFold = f;
      p.phase = f >= 0.98 ? "open" : f <= 0.001 ? "idle" : "dragging";
      p.cardPose = { rotateX: 0, rotateY: 0, rotateZ: 0 };
    };
    return () => {
      delete w.__foldDebugSet;
    };
  }, []);

  useEffect(() => {
    const tick = (now: number) => {
      const p = pose.current;
      const prev = lastT.current || now;
      lastT.current = now;
      const dt = Math.min(0.05, (now - prev) / 1000);

      if (entryPhase.current === "falling") {
        const t = Math.min(1, (now - entryStart.current) / FALL_PHYS.fallMs);
        fallPose.current = fallPoseAt(t);
        setFallFrame(fallPose.current);
        if (t >= 1) {
          entryPhase.current = "settling";
          entryStart.current = now;
        }
      } else if (entryPhase.current === "settling") {
        const u = Math.min(1, (now - entryStart.current) / FALL_PHYS.settleMs);
        fallPose.current = settlePoseAt(u);
        setFallFrame(fallPose.current);
        if (u >= 1) {
          entryPhase.current = "ready";
          fallPose.current = fallRestPose();
          setFallFrame(fallPose.current);
          setReady(true);
        }
      }

      if (DEBUG) {
        p.fold = 1;
        p.displayFold = 1;
        p.phase = "open";
        p.cardPose = { rotateX: 0, rotateY: 0, rotateZ: 0 };
      } else if (entryPhase.current === "ready") {
        if (p.phase === "dragging") {
          p.displayFold = applyLag(p.displayFold, p.fold, LAG_ALPHA);
          p.cardPose = clampPose(alignPose(p.displayFold, p.cardPose, dt * 5));
        } else if (p.phase === "returning") {
          p.fold = Math.max(0, p.fold - RETURN_SPEED * dt);
          p.displayFold = applyLag(p.displayFold, p.fold, 0.38);
          p.cardPose = clampPose(alignPose(p.displayFold, p.cardPose, dt * 3.5));
          if (p.fold <= 0.001 && p.displayFold <= 0.001) {
            pose.current = snapshot(REST);
          }
        } else if (p.phase === "opening") {
          p.fold = Math.min(1, p.fold + OPEN_SPEED * dt);
          p.displayFold = applyLag(p.displayFold, p.fold, 0.5);
          p.cardPose = clampPose(alignPose(p.displayFold, p.cardPose, dt * 6));
          if (p.fold >= 1 && p.displayFold > 0.992) {
            p.phase = "open";
            p.fold = 1;
            p.displayFold = 1;
            p.cardPose = { rotateX: 0, rotateY: 0, rotateZ: 0 };
          }
        } else if (p.phase === "open") {
          p.cardPose = clampPose(alignPose(1, p.cardPose, dt * 4));
        } else if (p.phase === "entering") {
          p.enter = Math.min(1, p.enter + ENTER_SPEED * dt);
          p.displayEnter = applyLag(p.displayEnter, p.enter, 0.4);
          if (p.enter >= 1 && p.displayEnter > 0.98) {
            p.phase = "entered";
            p.enter = 1;
            p.displayEnter = 1;
          }
        }
      }

      setFrame(snapshot(pose.current));
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    if (!DEBUG) return;
    const p = pose.current;
    p.fold = 1;
    p.displayFold = 1;
    p.phase = "open";
    p.cardPose = { rotateX: 0, rotateY: 0, rotateZ: 0 };
  }, []);

  useEffect(() => {
    const settleScroll = () => {
      if (DEBUG || entryPhase.current !== "ready") return;
      const p = pose.current;
      if (p.phase !== "dragging") return;
      const commitAt = p.fold;
      if (shouldSnapOpen(commitAt)) {
        p.phase = "opening";
      } else {
        p.phase = "returning";
      }
    };

    const onWheel = (e: WheelEvent) => {
      const p = pose.current;
      if (p.phase === "entered" || p.phase === "entering") return;

      if (DEBUG) {
        e.preventDefault();
        return;
      }

      if (entryPhase.current !== "ready") {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      dismissHint();

      const raw =
        e.deltaMode === 1
          ? e.deltaY * 16
          : e.deltaMode === 2
            ? e.deltaY * 32
            : e.deltaY;
      const delta = raw * SCROLL_GAIN;

      if (p.phase === "open" || p.phase === "opening") {
        if (delta >= 0) {
          p.fold = 1;
          p.displayFold = 1;
          p.phase = "open";
          return;
        }
        p.phase = "dragging";
        p.fold = clamp(p.displayFold + delta, 0, 1);
        p.displayFold = applyLag(p.displayFold, p.fold, 0.65);
        window.clearTimeout(scrollIdle.current);
        scrollIdle.current = window.setTimeout(settleScroll, SCROLL_IDLE_MS);
        return;
      }

      if (p.phase === "returning") {
        p.phase = "dragging";
      }

      p.fold = clamp(p.fold + delta, 0, 1);
      p.displayFold = applyLag(p.displayFold, p.fold, 0.65);

      if (delta > 0 && p.fold >= 0.98) {
        window.clearTimeout(scrollIdle.current);
        p.phase = "opening";
        return;
      }

      p.phase = "dragging";
      window.clearTimeout(scrollIdle.current);
      scrollIdle.current = window.setTimeout(settleScroll, SCROLL_IDLE_MS);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.clearTimeout(scrollIdle.current);
    };
  }, []);

  const debugEnd = { top: debug.top, mid: debug.mid, bot: debug.bot };
  const modelAngles = panelAngles(frame.displayFold);
  const angles = DEBUG
    ? panelAnglesAtEnd(debug.fold, debugEnd)
    : modelAngles;
  const foldForFx = DEBUG ? debug.fold : frame.displayFold;
  const shade = DEBUG
    ? panelShadeFromAngles(angles)
    : panelShadeFromAngles(modelAngles);
  const crease = DEBUG
    ? creaseAmountFromAngles(angles)
    : creaseAmountFromAngles(modelAngles);
  const computedPeel = DEBUG
    ? surfacePeelFromAngles(debug.fold, angles)
    : surfacePeel(foldForFx);
  const peel = applyHatchDebug(computedPeel, debug.hatch);
  const viewTip = DEBUG
    ? debug.viewTip * debug.fold
    : FOLD_END.viewTip * foldForFx;
  const behind = Math.min(1, Math.max(0, (foldForFx - 0.25) / 0.5));
  const hatchOpen = peel.shiftPct;
  const wellOpacity = debug.hatch.wellOpacity * hatchOpen;

  const stageH =
    stageRef.current?.clientHeight ||
    (typeof window !== "undefined" ? window.innerHeight : 800);
  const inEntry = !DEBUG && !ready;
  const fallCss = fallCssTransform(fallFrame, stageH);

  const rigTransform = inEntry
    ? fallCss.transform
    : frame.phase === "entered" || frame.phase === "entering"
      ? `translate3d(0, ${-frame.displayEnter * 14}vh, ${28 + frame.displayEnter * 120}px) rotateX(${viewTip + frame.cardPose.rotateX}deg) rotateY(${frame.cardPose.rotateY}deg) rotateZ(${frame.cardPose.rotateZ}deg) scale(${1 + frame.displayEnter * 0.4})`
      : `translate3d(0, ${-foldForFx * 1.5}vh, 40px) rotateX(${viewTip + frame.cardPose.rotateX}deg) rotateY(${frame.cardPose.rotateY}deg) rotateZ(${frame.cardPose.rotateZ}deg)`;

  const shadowOpacity = inEntry
    ? 0.15 + (1 - Math.min(1, fallCss.heightNorm)) * 0.55
    : 0.7;
  const shadowScale = inEntry
    ? 0.7 + (1 - Math.min(1, fallCss.heightNorm)) * 0.35
    : 1;

  const stackStyle: CSSProperties = {
    transform: rigTransform,
    ["--crease" as string]: String(inEntry ? 0 : crease),
    ["--layer-z" as string]: String(DEBUG ? debug.hatch.depthPx : 72),
  };

  const openish =
    frame.phase === "open" ||
    frame.phase === "opening" ||
    foldForFx > 0.72;

  const hintVisible =
    !DEBUG &&
    ready &&
    hintOut &&
    !scrolledSession.current &&
    foldForFx < 0.03 &&
    (frame.phase === "idle" || frame.phase === "hover");

  return (
    <main
      ref={stageRef}
      className="fold"
      data-surface="redesign-stub"
      data-fold-phase={frame.phase}
      data-entry={inEntry ? entryPhase.current : "ready"}
      data-open={openish}
      data-debug={DEBUG || undefined}
    >
      <div className="fold__bg" aria-hidden="true" />
      {!DEBUG ? (
        <div
          className="fold__depth"
          data-visible={!inEntry && behind > 0.05}
          aria-hidden="true"
          style={{ opacity: behind * 0.5 } as CSSProperties}
        />
      ) : null}
      <div className="fold__stage">
        <div className="fold__fore">
          <div ref={cardRef} className="fold__stack" style={stackStyle}>
            <div className="fold__hatch-slot" aria-hidden="true">
              <div
                className="fold__hatch-well"
                data-open={hatchOpen > 0.04}
                style={{
                  opacity: inEntry ? 0 : wellOpacity,
                  clipPath: inEntry
                    ? "inset(100% 0 0 0)"
                    : `inset(${peel.topPct * 100}% 0 0 0)`,
                }}
              />
              <div
                className="fold__hatch"
                style={{
                  ["--hatch-open" as string]: String(inEntry ? 0 : hatchOpen),
                  transform: inEntry
                    ? "none"
                    : `translate3d(0, ${-peel.shiftPct * 100}%, 0)`,
                }}
              />
            </div>
            <div className="fold__card">
            <div
              className="fold__shadow"
              aria-hidden="true"
              style={{
                opacity: shadowOpacity,
                transform: `translateZ(-40px) scale(${shadowScale})`,
              }}
            />

            <div className="fold-sheet">
              <div
                className="fold-panel fold-panel--top"
                style={{
                  transform: `rotateX(${inEntry ? 0 : angles.top}deg)`,
                }}
              >
                <div className="fold-panel__face">
                  <ThirdPrint index={0} />
                  <span
                    className="fold-panel__shade"
                    style={{ opacity: inEntry ? 0 : shade.top }}
                    aria-hidden="true"
                  />
                  <span className="fold-panel__edge" aria-hidden="true" />
                  <span className="fold-panel__crease fold-panel__crease--bottom" />
                  <span className="fold-panel__thickness" aria-hidden="true" />
                </div>

                <div
                  className="fold-panel fold-panel--mid"
                  style={{
                    transform: `rotateX(${inEntry ? 0 : angles.mid}deg)`,
                  }}
                >
                  <div className="fold-panel__face">
                    <ThirdPrint index={1} />
                    <span
                      className="fold-panel__shade fold-panel__shade--valley"
                      style={{ opacity: inEntry ? 0 : shade.mid }}
                      aria-hidden="true"
                    />
                    <span className="fold-panel__edge" aria-hidden="true" />
                    <span className="fold-panel__crease fold-panel__crease--top" />
                    <span className="fold-panel__crease fold-panel__crease--bottom" />
                  </div>

                  <div
                    className="fold-panel fold-panel--bot"
                    style={{
                      transform: `rotateX(${inEntry ? 0 : angles.bot}deg)`,
                    }}
                  >
                    <div className="fold-panel__face">
                      <ThirdPrint index={2} />
                      <span
                        className="fold-panel__shade"
                        style={{ opacity: inEntry ? 0 : shade.bot }}
                        aria-hidden="true"
                      />
                      <span className="fold-panel__edge" aria-hidden="true" />
                      <span className="fold-panel__crease fold-panel__crease--top" />
                      <span className="fold-panel__thickness" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          <p
            className="fold__scroll-hint"
            data-visible={hintVisible}
            aria-hidden={!hintVisible}
          >
            scroll down
          </p>
        </div>
      </div>

      {DEBUG ? (
        <FoldDebugPanel
          value={debug}
          liveAngles={angles}
          computedPeel={computedPeel}
          resolvedPeel={peel}
          onChange={setDebug}
        />
      ) : null}
    </main>
  );
}

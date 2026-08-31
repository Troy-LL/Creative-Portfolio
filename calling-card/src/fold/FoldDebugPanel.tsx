import type { PanelAngles, SurfacePeel } from "./model";
import { FOLD_END, HATCH_DEBUG_DEFAULTS, type HatchDebugState } from "./model";
export type FoldDebugState = {
  fold: number;
  top: number;
  mid: number;
  bot: number;
  viewTip: number;
  hatch: HatchDebugState;
};

/** Defaults match current model peaks at fold = 1. */
export const FOLD_DEBUG_DEFAULTS: FoldDebugState = {
  fold: 1,
  top: FOLD_END.top,
  mid: FOLD_END.mid,
  bot: FOLD_END.bot,
  viewTip: FOLD_END.viewTip,
  hatch: { ...HATCH_DEBUG_DEFAULTS },
};

type Props = {
  value: FoldDebugState;
  liveAngles: PanelAngles;
  computedPeel: SurfacePeel;
  resolvedPeel: SurfacePeel;
  onChange: (next: FoldDebugState) => void;
};
function RowDeg({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="fold-debug__row">
      <span className="fold-debug__label">
        {label}
        <em>{value.toFixed(0)}°</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function RowUnit({
  label,
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  const digits = step >= 0.01 ? 2 : step >= 0.001 ? 3 : 0;
  return (
    <label className="fold-debug__row">
      <span className="fold-debug__label">
        {label}
        <em>
          {value.toFixed(digits)}
          {unit}
        </em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function FoldDebugPanel({
  value,
  liveAngles,
  computedPeel,
  resolvedPeel,
  onChange,
}: Props) {  const set = (patch: Partial<FoldDebugState>) =>
    onChange({ ...value, ...patch });
  const setHatch = (patch: Partial<HatchDebugState>) =>
    onChange({ ...value, hatch: { ...value.hatch, ...patch } });

  const syncFromComputed = () => {
    setHatch({
      topPct: computedPeel.topPct,
      heightPct: computedPeel.heightPct,
      shiftPct: computedPeel.shiftPct,
    });
  };

  return (
    <aside className="fold-debug" aria-label="Fold debug">
      <header className="fold-debug__head">
        <strong>Fold debug</strong>
        <button
          type="button"
          className="fold-debug__btn"
          onClick={() => onChange({ ...FOLD_DEBUG_DEFAULTS })}
        >
          Reset
        </button>
      </header>

      <p className="fold-debug__hint">
        Scrub <strong>fold progress</strong> to preview the whole sequence. End-pose
        sliders apply at fold&nbsp;=&nbsp;1.
      </p>

      <p className="fold-debug__section">Fold sequence</p>

      <RowUnit
        label="fold progress"
        min={0}
        max={1}
        step={0.01}
        value={value.fold}
        unit=""
        onChange={(fold) => set({ fold })}
      />

      <p className="fold-debug__hint" style={{ marginBottom: "0.45rem" }}>
        Live angles at this progress (end-pose peaks below apply when fold = 1):
      </p>
      <p className="fold-debug__code" style={{ marginTop: 0 }}>
        {`live { top: ${liveAngles.top.toFixed(0)}, mid: ${liveAngles.mid.toFixed(0)}, bot: ${liveAngles.bot.toFixed(0)} }°`}
      </p>

      <p className="fold-debug__section">End pose @ fold = 1</p>
      <RowDeg
        label="top rotateX"
        min={-180}
        max={180}
        step={1}
        value={value.top}
        onChange={(top) => set({ top })}
      />
      <RowDeg
        label="mid rotateX"
        min={-180}
        max={180}
        step={1}
        value={value.mid}
        onChange={(mid) => set({ mid })}
      />
      <RowDeg
        label="bot rotateX"
        min={-180}
        max={180}
        step={1}
        value={value.bot}
        onChange={(bot) => set({ bot })}
      />
      <RowDeg
        label="viewTip"
        min={-45}
        max={45}
        step={1}
        value={value.viewTip}
        onChange={(viewTip) => set({ viewTip })}
      />

      <p className="fold-debug__section">Opening slot (placeholder)</p>

      <p className="fold-debug__hint" style={{ marginBottom: "0.45rem" }}>
        Full card width. Placeholder slot clipped from reveal line → card bottom.
      </p>
      <label className="fold-debug__toggle">
        <input
          type="checkbox"
          checked={value.hatch.autoSilhouette}
          onChange={(e) => setHatch({ autoSilhouette: e.target.checked })}
        />
        Auto top from fold
      </label>

      {!value.hatch.autoSilhouette ? (
        <>
          <RowUnit
            label="opening top"
            min={0}
            max={1}
            step={0.01}
            value={value.hatch.topPct}
            unit=""
            onChange={(topPct) => setHatch({ topPct })}
          />
          <RowUnit
            label="opening height"
            min={0.1}
            max={1}
            step={0.01}
            value={value.hatch.heightPct}
            unit=""
            onChange={(heightPct) => setHatch({ heightPct })}
          />
          <RowUnit
            label="cover slide"
            min={0}
            max={1}
            step={0.01}
            value={value.hatch.shiftPct}
            unit=""
            onChange={(shiftPct) => setHatch({ shiftPct })}
          />
        </>
      ) : (
        <button
          type="button"
          className="fold-debug__btn fold-debug__btn--block"
          onClick={syncFromComputed}
        >
          Copy auto → manual
        </button>
      )}

      <RowUnit
        label="pull reveal ↑"
        min={0}
        max={0.6}
        step={0.01}
        value={value.hatch.topPullPct}
        unit=""
        onChange={(topPullPct) => setHatch({ topPullPct })}
      />
      <RowUnit
        label="height scale"
        min={0.5}
        max={1.5}
        step={0.01}
        value={value.hatch.heightScale}
        unit="×"
        onChange={(heightScale) => setHatch({ heightScale })}
      />
      <RowUnit
        label="extend bottom ↓"
        min={0}
        max={0.4}
        step={0.01}
        value={value.hatch.extendBottomPct}
        unit=""
        onChange={(extendBottomPct) => setHatch({ extendBottomPct })}
      />
      <RowUnit
        label="card lift Z"
        min={48}
        max={120}
        step={1}
        value={value.hatch.depthPx}
        unit="px"
        onChange={(depthPx) => setHatch({ depthPx })}
      />
      <RowUnit
        label="well opacity"
        min={0}
        max={1}
        step={0.05}
        value={value.hatch.wellOpacity}
        unit=""
        onChange={(wellOpacity) => setHatch({ wellOpacity })}
      />

      <p className="fold-debug__code">
        {`fold ${value.fold.toFixed(2)} · { top: ${value.top}, mid: ${value.mid}, bot: ${value.bot} }`}
      </p>
      <p className="fold-debug__code">
        {`reveal ${resolvedPeel.topPct.toFixed(2)} · visible h ${resolvedPeel.heightPct.toFixed(2)} · bottom ${(resolvedPeel.topPct + resolvedPeel.heightPct).toFixed(2)} · cover ${resolvedPeel.shiftPct.toFixed(2)}`}
      </p>      <p className="fold-debug__code">
        {`auto top ${computedPeel.topPct.toFixed(2)} · extend ↓ ${value.hatch.extendBottomPct.toFixed(2)} · lift ${value.hatch.depthPx}px`}
      </p>
    </aside>
  );
}

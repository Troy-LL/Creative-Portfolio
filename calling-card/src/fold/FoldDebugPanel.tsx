export type FoldDebugState = {
  top: number;
  mid: number;
  bot: number;
  viewTip: number;
};

/** Defaults match current model peaks at fold = 1. */
export const FOLD_DEBUG_DEFAULTS: FoldDebugState = {
  top: 20,
  mid: 103,
  bot: -111,
  viewTip: -1,
};

type Props = {
  value: FoldDebugState;
  onChange: (next: FoldDebugState) => void;
};

function Row({
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

export function FoldDebugPanel({ value, onChange }: Props) {
  const set = (patch: Partial<FoldDebugState>) =>
    onChange({ ...value, ...patch });

  return (
    <aside className="fold-debug" aria-label="Fold end-state debug">
      <header className="fold-debug__head">
        <strong>End fold</strong>
        <button
          type="button"
          className="fold-debug__btn"
          onClick={() => onChange({ ...FOLD_DEBUG_DEFAULTS })}
        >
          Reset
        </button>
      </header>

      <p className="fold-debug__hint" style={{ marginBottom: "0.55rem" }}>
        Card is locked at the final folded pose. Tune what fold&nbsp;=&nbsp;1
        should look like.
      </p>

      <Row
        label="top rotateX"
        min={-180}
        max={180}
        step={1}
        value={value.top}
        onChange={(top) => set({ top })}
      />
      <Row
        label="mid rotateX"
        min={-180}
        max={180}
        step={1}
        value={value.mid}
        onChange={(mid) => set({ mid })}
      />
      <Row
        label="bot rotateX"
        min={-180}
        max={180}
        step={1}
        value={value.bot}
        onChange={(bot) => set({ bot })}
      />
      <Row
        label="viewTip"
        min={-45}
        max={45}
        step={1}
        value={value.viewTip}
        onChange={(viewTip) => set({ viewTip })}
      />

      <p className="fold-debug__code">
        {`{ top: ${value.top}, mid: ${value.mid}, bot: ${value.bot} } · viewTip ${value.viewTip}`}
      </p>
    </aside>
  );
}

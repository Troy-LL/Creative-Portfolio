import { useMemo, useState, type CSSProperties } from "react";
import {
  Card,
  defaultCardContent,
  defaultInkParams,
  defaultLitOpacity,
} from "./components/Card/Card";
import { grainVisual } from "./components/Card/InkSurface";
import type { InkParams } from "./components/Card/types";
import "./App.css";

const STOCKS = [
  {
    id: "bone-a",
    label: "#F4F2EA",
    seed: 20260331,
    style: { "--paper-base": "#f4f2ea" } as CSSProperties,
  },
  {
    id: "bone-b",
    label: "#F3F1E9",
    seed: 88421,
    style: { "--paper-base": "#f3f1e9" } as CSSProperties,
  },
  {
    id: "bone-c",
    label: "#F5F3EC",
    seed: 11002,
    style: { "--paper-base": "#f5f3ec" } as CSSProperties,
  },
  {
    id: "bone-d",
    label: "#F1F0E9",
    seed: 5501,
    style: { "--paper-base": "#f1f0e9" } as CSSProperties,
  },
] as const;

function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="stage__depth">
      <span>
        {label}: <strong>{value.toFixed(2)}</strong>
        {hint ? <em className="stage__hint"> {hint}</em> : null}
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

export default function App() {
  const [stock, setStock] = useState<(typeof STOCKS)[number]>(STOCKS[0]);
  const [blank, setBlank] = useState(false);
  const [litOpacity, setLitOpacity] = useState(defaultLitOpacity);
  const [ink, setInk] = useState<InkParams>(defaultInkParams);
  const [macro, setMacro] = useState(false);

  const style = useMemo(
    () =>
      ({
        ...stock.style,
        "--paper-lit-opacity": String(litOpacity),
      }) as CSSProperties,
    [stock, litOpacity],
  );

  const patch = (key: keyof InkParams, value: number) =>
    setInk((prev) => ({ ...prev, [key]: value }));

  return (
    <main className="stage" data-surface="card-material">
      <header className="stage__head">
        <h1>Print material</h1>
        <p>
          Paper locked. Three ink systems: grain (coverage pores), absorption
          (rim only), relief (thin contour press). No bevels.
        </p>

        <div className="stage__controls">
          {STOCKS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={stock.id === s.id ? "is-active" : undefined}
              onClick={() => setStock(s)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="stage__controls">
          <button
            type="button"
            className={blank ? "is-active" : undefined}
            onClick={() => setBlank(true)}
          >
            Blank
          </button>
          <button
            type="button"
            className={!blank ? "is-active" : undefined}
            onClick={() => setBlank(false)}
          >
            Print
          </button>
          <button
            type="button"
            className={macro ? "is-active" : undefined}
            onClick={() => setMacro((m) => !m)}
          >
            Macro 600%
          </button>
          <button type="button" onClick={() => setInk(defaultInkParams)}>
            Reset ink
          </button>
        </div>

        <div className="stage__panels">
          <div>
            <h2 className="stage__sub">Paper</h2>
            <Slider
              label="surface light"
              value={litOpacity}
              min={0.05}
              max={0.18}
              step={0.005}
              onChange={setLitOpacity}
            />
          </div>
          <div>
            <h2 className="stage__sub">Ink</h2>
            <Slider
              label="Ink density"
              value={ink.density}
              min={0.8}
              max={1}
              onChange={(v) => patch("density", v)}
            />
            <Slider
              label="Ink grain"
              value={ink.grain}
              onChange={(v) => patch("grain", v)}
              hint={`→ ${grainVisual(ink.grain).toFixed(2)}`}
            />
            <Slider
              label="Print absorption"
              value={ink.absorption}
              onChange={(v) => patch("absorption", v)}
            />
            <Slider
              label="Print relief"
              value={ink.relief}
              onChange={(v) => patch("relief", v)}
            />
          </div>
        </div>
      </header>

      <div className="stage__floor">
        <div className={macro ? "stage__zoom stage__zoom--macro" : undefined}>
          <Card
            key={stock.id}
            seed={stock.seed}
            showPrint={!blank}
            ink={ink}
            content={defaultCardContent}
            style={style}
            className={macro ? "physical-card--name-zoom" : undefined}
          />
        </div>
      </div>
    </main>
  );
}

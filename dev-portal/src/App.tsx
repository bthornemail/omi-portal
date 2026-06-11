import { useMemo, useRef, useState } from 'react';
import { parseAddress, ZERO_BASIS_ADDRESS } from './core/address';
import { exportSnapshot, importSnapshot, downloadJson } from './core/exportImport';
import { createRuntime, touch, type OmiRuntimeState } from './core/runtime';
import { slide } from './core/nomogram';
import { Inspector } from './components/Inspector';
import { SpectralGrid } from './components/SpectralGrid';
import './styles.css';

export default function App() {
  const root = useMemo(() => parseAddress(ZERO_BASIS_ADDRESS), []);
  const [runtime, setRuntime] = useState<OmiRuntimeState>(() => createRuntime(root));
  const [page, setPage] = useState(0);
  const [scale, setScale] = useState(0x3e);
  const [message, setMessage] = useState('Ready. Select a cell, export a snapshot, or import one.');
  const importRef = useRef<HTMLInputElement | null>(null);

  const nomogram = slide(scale, runtime.selected.cell || 1, runtime.deltaValue || 1);

  async function onExport() {
    const snapshot = await exportSnapshot(runtime.rootAddress, runtime.bitboard, runtime.rewrites);
    downloadJson(`omi-snapshot-${snapshot.receipt.slice(0, 12)}.json`, snapshot);
    setMessage(`Exported receipt ${snapshot.receipt.slice(0, 16)}…`);
  }

  async function onImport(file: File) {
    const text = await file.text();
    const snapshot = JSON.parse(text);
    const { bitboard, rewrites } = importSnapshot(snapshot);
    setRuntime((prev) => ({ ...prev, rootAddress: snapshot.rootAddress, bitboard, rewrites }));
    setMessage(`Imported receipt ${snapshot.receipt.slice(0, 16)}…`);
  }

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">OMI Portal Runtime</p>
          <h1>Deterministic SpectralDOM Portal</h1>
          <p>Zero-basis address → Omi-Gauge cell → Omi-Plane Capsule → surrogate RPC → Omi-CONS receipt → DOM/CSSOM/SpectralDOM projection.</p>
        </div>
        <omi-gate data-address={runtime.rootAddress}>omi---imo</omi-gate>
      </header>

      <section className="toolbar panel">
        <label>Page
          <input type="number" min={0} max={15} value={page} onChange={(e) => setPage(Number(e.target.value))} />
        </label>
        <label>Omi-Nomogram scale
          <select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
            {Array.from({ length: 16 }, (_, i) => 0x30 + i).map((s) => <option key={s} value={s}>0x{s.toString(16).toUpperCase()}</option>)}
          </select>
        </label>
        <button onClick={onExport}>Export snapshot</button>
        <button onClick={() => importRef.current?.click()}>Import snapshot</button>
        <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
      </section>

      <div className="layout">
        <SpectralGrid page={page} onSelect={(row, x, y) => setRuntime((r) => touch(r, page, row, x, y))} />
        <Inspector runtime={runtime} />
      </div>

      <section className="panel">
        <h2>Omi-SlideRule / Nomogram result</h2>
        <p><code>scale {`0x${scale.toString(16).toUpperCase()}`}</code> — {nomogram.label}</p>
        <p><code>{nomogram.expression}</code> = <strong>{String(nomogram.value)}</strong></p>
      </section>

      <section className="panel code-notes">
        <h2>Model boundary</h2>
        <pre>{`DOM        = custom element projection
CSSOM      = deterministic style face
JSDOM      = replay/import/export test surface
SpectralDOM = glyph + row + agreement UI surface
Authority  = computed gauge cell + receipt, not rendered glyph`}</pre>
      </section>

      <p className="status">{message}</p>
    </main>
  );
}

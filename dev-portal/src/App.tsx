import { useEffect, useMemo, useRef, useState } from 'react';
import { parseAddress, ZERO_BASIS_ADDRESS } from './core/address';
import { exportSnapshot, importSnapshot, downloadJson } from './core/exportImport';
import { createRuntime, touch, type OmiRuntimeState } from './core/runtime';
import { slide } from './core/nomogram';
import { CidrMcrsgspPanel } from './components/CidrMcrsgspPanel';
import { CombinatorialDesignViewer } from './components/CombinatorialDesignViewer';
import { DeterministicClockMenu } from './components/DeterministicClockMenu';
import { Inspector } from './components/Inspector';
import { NarrativeProjectionPanel } from './components/NarrativeProjectionPanel';
import { SpectralGrid } from './components/SpectralGrid';
import { useNarrativePipeline } from './narrative/useNarrativePipeline';
import { parseCidrMcrsgspFiles, summarizeCidrMcrsgspRecords, type CidrMcrsgspRecord, type CidrMcrsgspSummary } from './omi/cidrMcrsgspParser';
import { loadCidrMcrsgspSources } from './omi/cidrMcrsgspSources';
import './styles.css';

export default function App() {
  const root = useMemo(() => parseAddress(ZERO_BASIS_ADDRESS), []);
  const [runtime, setRuntime] = useState<OmiRuntimeState>(() => createRuntime(root));
  const [page, setPage] = useState(0);
  const [scale, setScale] = useState(0x3e);
  const [message, setMessage] = useState('Ready. Select a cell, export a snapshot, or import one.');
  const [mcrsgspRecords, setMcrsgspRecords] = useState<CidrMcrsgspRecord[]>([]);
  const [mcrsgspSummary, setMcrsgspSummary] = useState<CidrMcrsgspSummary | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);
  const {
    projectionState: narrative,
    declarations,
    playbackControls,
    inspectedDeclaration,
    lastCandidateId,
    onInspectDeclaration,
    onReceiptCandidate
  } = useNarrativePipeline(setMessage);

  const nomogram = slide(scale, runtime.selected.cell || 1, runtime.deltaValue || 1);

  useEffect(() => {
    let alive = true;
    parseCidrMcrsgspFiles(loadCidrMcrsgspSources())
      .then((records) => {
        if (!alive) return;
        setMcrsgspRecords(records);
        setMcrsgspSummary(summarizeCidrMcrsgspRecords(records));
      })
      .catch((error: Error) => setMessage(`CIDR MCRSGSP parser failed: ${error.message}`));
    return () => {
      alive = false;
    };
  }, []);

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

      <section
        className="panel narrative-bridge"
        data-omi="o---o/---/?v=narrative;l=4;h=design;b=beta1;s={4,3}@3C@"
        data-imo="o---o/---/?receipt=candidate@3C@"
        data-phase={narrative.beat?.phase ?? 'loading'}
        data-beat={narrative.ready ? String(narrative.beatIndex + 1) : '0'}
        data-motif={narrative.beat?.motifs?.join('|') ?? ''}
      >
        <div>
          <p className="eyebrow">Narrative Pipeline Bridge</p>
          <h2>{narrative.beat?.phaseEmoji ?? ''} {narrative.beat?.motifs?.join(' · ') || 'Loading narrative projection'}</h2>
          <p>{narrative.beat?.caption?.slice(0, 180) ?? 'Canonical narrative series is being projected into the dev portal viewer.'}</p>
        </div>
        <div className="narrative-actions">
          <button type="button" onClick={() => playbackControls.stepBeat(-1)}>Prev beat</button>
          <button type="button" className="primary-action" onClick={playbackControls.togglePlayback}>
            {narrative.playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={() => playbackControls.stepBeat(1)}>Next beat</button>
        </div>
        <div className="narrative-meta">
          <span>beat {narrative.ready ? narrative.beatIndex + 1 : 0}/{narrative.beatCount}</span>
          <span>tick {narrative.tick}</span>
          <span>epoch {narrative.epoch}</span>
          <span>topology {narrative.topologyNodeCount}</span>
          <span>receipts {narrative.receiptCount}</span>
        </div>
      </section>

      <CombinatorialDesignViewer projectionState={narrative} />

      <DeterministicClockMenu
        projectionState={narrative}
        playbackControls={playbackControls}
      />

      <NarrativeProjectionPanel
        declarations={declarations}
        inspectedDeclarationId={inspectedDeclaration?.id}
        latestCandidateId={lastCandidateId}
        onInspectDeclaration={onInspectDeclaration}
        onReceiptCandidate={onReceiptCandidate}
      />

      <CidrMcrsgspPanel records={mcrsgspRecords} summary={mcrsgspSummary} />

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

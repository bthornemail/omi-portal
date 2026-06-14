import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
// @ts-expect-error — root JS module
import { modemRoundTripToGeometryReceipts, modemFrameToOWord, packModemFramesToOFile, oWordToModemFrame, unpackOFileToModemFrames } from '../../../src/omi/tetragrammatron-modem.js';
// @ts-expect-error — root JS module
import { oWordToHex, unpackOWord } from '../../../src/omi/o-bitboard.js';
// @ts-expect-error — root JS module
import { projectToOMI, projectToIMO } from '../../../src/omi/o-projector.js';
import {
  createInitialModemState,
  DEFAULT_SAMPLE,
  type ModemFrame,
} from '../omi/tetragrammatronModemParser';
import { deriveOmiCarrierHash, modemFrameToOmiCarrier } from '../omi/omiSurfaceCarrier';
import { OmiForm, OmiGlyph, OmiGnomon, OmiMatrix, OmiPortal, OmiWorkerSurface, OmiWorld } from './omi-surfaces';

type Tab = 'omi' | 'geometry' | 'oword' | 'ofile' | 'demod' | 'receipt';

export function TetragrammatronModemPanel() {
  const [state, setState] = useState(createInitialModemState);
  const [tab, setTab] = useState<Tab>('receipt');
  const [importedState, setImportedState] = useState<{ text: string; frames: Record<string, unknown>[]; activeFrame: number } | null>(null);
  const [carrierHash, setCarrierHash] = useState('');
  const [workerEvent, setWorkerEvent] = useState<Record<string, unknown> | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  const runPipeline = useCallback((input: string) => {
    try {
      const result = modemRoundTripToGeometryReceipts(input);
      setState(prev => ({ ...prev, input, result, activeFrame: 0, error: null }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setState(prev => ({ ...prev, input, result: null, error: msg }));
    }
  }, []);

  const handleInput = useCallback((text: string) => {
    setState(prev => ({ ...prev, input: text }));
  }, []);

  const handleRun = useCallback(() => {
    if (state.input.trim()) runPipeline(state.input);
  }, [state.input, runPipeline]);

  const handleSample = useCallback(() => {
    runPipeline(DEFAULT_SAMPLE);
  }, [runPipeline]);

  const setFrame = useCallback((i: number) => {
    setState(prev => ({ ...prev, activeFrame: i }));
  }, []);

  const handleExport = useCallback(() => {
    const out = state.result ? packModemFramesToOFile(state.result.frames) : '';
    if (!out) return;
    const blob = new Blob([out], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tetragrammatron-modem.o';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.result]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const frames = unpackOFileToModemFrames(text);
        setImportedState({ text, frames, activeFrame: 0 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setState(prev => ({ ...prev, error: `Import failed: ${msg}` }));
      }
    };
    reader.readAsText(file);
  }, []);

  const frame: ModemFrame | undefined = state.result?.frames[state.activeFrame];
  const importedFrame: Record<string, unknown> | undefined = importedState?.frames[importedState.activeFrame];

  const oWord = frame ? modemFrameToOWord(frame) : null;
  const oWordHex = oWord ? oWordToHex(oWord) : '';
  const oWordData = oWord ? unpackOWord(oWord) : null;
  const oFile = state.result ? packModemFramesToOFile(state.result.frames) : '';
  const decoded = oWord ? oWordToModemFrame(oWord) : null;
  const activeCarrier = useMemo(() => {
    if (!frame || !oWordHex) return null;
    return modemFrameToOmiCarrier({
      frame,
      oWordHex,
      oFile,
      surface: 'matrix',
      hash: carrierHash || undefined,
    });
  }, [carrierHash, frame, oFile, oWordHex]);

  useEffect(() => {
    let alive = true;
    setCarrierHash('');
    if (!frame || !oWordHex) return () => { alive = false; };
    const carrier = modemFrameToOmiCarrier({ frame, oWordHex, oFile, surface: 'matrix' });
    deriveOmiCarrierHash(carrier)
      .then((hash) => { if (alive) setCarrierHash(hash); })
      .catch(() => { if (alive) setCarrierHash(''); });
    return () => { alive = false; };
  }, [frame, oFile, oWordHex]);

  return (
    <section
      className="panel tetragrammatron-panel"
      data-omi={frame ? `o---o/tq/?status=${frame.event.status}&slot5040=${frame.slot5040}&rcpt=${frame.receiptState}` : 'o---o/tq/---'}
      data-imo={frame ? `o---o/tq/?receipt=${frame.receiptState}` : 'o---o/tq/---'}
    >
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Tetragrammatron Modem</p>
          <h2>Ὁδός Μέτρον</h2>
        </div>
        <span className="design-status">
          {state.result
            ? `${state.result.eventCount} events · ${state.result.summary.accepted} accepted`
            : 'idle'}
        </span>
      </div>

      <p className="boundary-copy">
        The Tetragrammatron modem reads proof streams, modulates to OMI notation,
        routes through geometry, and compiles to 256-bit .o carrier words.
      </p>

      {/* Input */}
      <div className="tq-input-section">
        <div className="tq-mode-toggle" style={{ marginBottom: '8px' }}>
          <button className="tq-mode-btn active" onClick={handleSample}>
            Load sample test output
          </button>
          <button className="tq-mode-btn" onClick={() => { setState(createInitialModemState()); }}>
            Clear
          </button>
        </div>
        <textarea
          className="tq-modem-input"
          rows={6}
          placeholder="Paste test output (▶/✔/✖ lines)…"
          value={state.input}
          onChange={e => handleInput(e.target.value)}
          style={{
            width: '100%',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '13px',
            background: 'var(--bg-card, #111)',
            color: 'var(--fg, #eee)',
            border: '1px solid var(--border, #333)',
            borderRadius: '4px',
            padding: '8px',
            resize: 'vertical',
            boxSizing: 'border-box',
            whiteSpace: 'pre',
            overflow: 'auto',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
          <button
            className="tq-mode-btn active"
            onClick={handleRun}
            disabled={!state.input.trim()}
          >
            Run Modem Pipeline
          </button>
          <button className="tq-mode-btn" onClick={() => importRef.current?.click()}>
            Import .o file
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".o,.txt"
            hidden
            onChange={e => e.target.files?.[0] && handleImport(e.target.files[0])}
          />
        </div>
        {state.error && (
          <p style={{ color: '#f55', marginTop: '6px', fontSize: '13px' }}>
            Error: {state.error}
          </p>
        )}
      </div>

      {state.result && state.result.eventCount > 0 && (
        <>
          {/* Frame selector */}
          <div className="tq-walk-controls" style={{ marginTop: '10px' }}>
            <label>
              Frame
              <input
                type="range"
                min={0}
                max={state.result.eventCount - 1}
                value={state.activeFrame}
                onChange={e => setFrame(Number(e.target.value))}
                style={{ width: '200px' }}
              />
              <span className="tq-slider-val">{state.activeFrame + 1}/{state.result.eventCount}</span>
            </label>
          </div>

          {/* Tabs */}
          <div className="tq-tabs">
            {([
              ['receipt', 'Receipt'],
              ['omi', 'OMI'],
              ['geometry', 'Geometry'],
              ['oword', '.o Word'],
              ['demod', 'Decomp'],
              ['ofile', '.o File'],
            ] as [Tab, string][]).map(([k, label]) => (
              <button key={k}
                className={'tq-tab' + (tab === k ? ' active' : '')}
                onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Receipt ─────────────────────────────── */}
          {tab === 'receipt' && (
            <div className="tq-tab-content">
              <div className="tq-metric-grid">
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Total events</span>
                  <span className="tq-metric-val">{state.result.eventCount}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Passed</span>
                  <span className="tq-metric-val" style={{ color: '#4c4' }}>{state.result.summary.passed}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Failed</span>
                  <span className="tq-metric-val" style={{ color: '#f44' }}>{state.result.summary.failed}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Running</span>
                  <span className="tq-metric-val" style={{ color: '#cc4' }}>{state.result.summary.running}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Accepted</span>
                  <span className="tq-metric-val" style={{ color: '#4c4' }}>{state.result.summary.accepted}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Candidate</span>
                  <span className="tq-metric-val" style={{ color: '#cc4' }}>{state.result.summary.candidate}</span>
                </div>
              </div>

              <div className="tq-two-col" style={{ marginTop: '10px' }}>
                <div className="tq-info-block">
                  <h4>Current frame</h4>
                  <div className="tq-arch-line">status: <strong>{frame?.event.status}</strong></div>
                  <div className="tq-arch-line">name: {frame?.event.name}</div>
                  <div className="tq-arch-line">suite: {frame?.event.suite ?? '(none)'}</div>
                  <div className="tq-arch-line">duration: {frame?.event.durationMs != null ? `${frame.event.durationMs}ms` : '(none)'}</div>
                  <div className="tq-arch-line">receipt: <strong className={frame?.receiptState === 'accepted' ? 'tq-pass' : 'tq-pending'}>{frame?.receiptState}</strong></div>
                </div>
                <div className="tq-info-block">
                  <h4>Pipeline</h4>
                  <div className="tq-arch-line">parse → modulate → parse → demodulate</div>
                  <div className="tq-arch-line">→ geometry route → .o word → .o file</div>
                  <div className="tq-arch-line sep">48-bit OMI address</div>
                  <div className="tq-arch-line">256-bit omi---imo carrier</div>
                  <div className="tq-arch-line">N-word .o file sequence</div>
                </div>
              </div>

              {state.result.summary.failed > 0 && (
                <div className="tq-info-block" style={{ marginTop: '10px' }}>
                  <h4 style={{ color: '#f44' }}>Failed</h4>
                  {state.result.frames.filter(f => f.event.status === 'failed').map((f, i) => (
                    <div key={i} className="tq-arch-line">✖ {f.event.name}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: OMI Notation ────────────────────────── */}
          {tab === 'omi' && frame && (
            <div className="tq-tab-content">
              <pre className="tq-modem-pre">
                {frame.omi}
              </pre>
              <div className="tq-psi-block" style={{ marginTop: '8px' }}>
                <div className="tq-psi-row">
                  <span>address:</span>
                  <code>{frame.address}</code>
                </div>
                <div className="tq-psi-row">
                  <span>keyword:</span>
                  <code>{String((frame.parsed.records[0] as Record<string, unknown>)?.keyword ?? '(none)')}</code>
                </div>
                <div className="tq-psi-row">
                  <span>source block:</span>
                  <code>{String(((frame.parsed.records[0] as Record<string, unknown>)?.sourceBlock as Record<string, unknown>)?.raw ?? '(none)').trim()}</code>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Geometry Route ──────────────────────── */}
          {tab === 'geometry' && frame && (
            <div className="tq-tab-content">
              <div className="tq-metric-grid">
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Channel</span>
                  <span className="tq-metric-val">{String(frame.node?.channel ?? '')} → Q{frame.baseQ}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Chart 11</span>
                  <span className="tq-metric-val">{frame.chart11}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Base Q</span>
                  <span className="tq-metric-val">{frame.baseQ}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Fiber Q</span>
                  <span className="tq-metric-val">{frame.fiberQ}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Local 240</span>
                  <span className="tq-metric-val">{frame.local240}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Slot 5040</span>
                  <span className="tq-metric-val">{frame.slot5040}</span>
                </div>
              </div>

              <div className="tq-two-col" style={{ marginTop: '10px' }}>
                <div className="tq-info-block">
                  <h4>Thrust Direction</h4>
                  <div className="tq-arch-line">a = {frame.thrustDirection?.a?.toFixed(4) ?? '—'}</div>
                  <div className="tq-arch-line">b = {frame.thrustDirection?.b?.toFixed(4) ?? '—'}</div>
                  <div className="tq-arch-line">c = {frame.thrustDirection?.c?.toFixed(4) ?? '—'}</div>
                  <h4 style={{ marginTop: '8px' }}>Polybius</h4>
                  <div className="tq-arch-line">row = {String(frame.polybius?.row ?? '—')}</div>
                  <div className="tq-arch-line">col = {String(frame.polybius?.col ?? '—')}</div>
                  <div className="tq-arch-line">cell = {String(frame.polybius?.cell ?? '—')}</div>
                </div>
                <div className="tq-info-block">
                  <h4>Q_xy</h4>
                  <div className="tq-arch-line">60x² + 16xy + 4y² = <strong>{frame.qxy}</strong></div>
                  <div className="tq-arch-line">x = {frame.baseQ}, y = {frame.fiberQ}</div>
                  <div className="tq-arch-line sep">slot5040 = fano7×720 + role3×240 + local240</div>
                  <div className="tq-arch-line">= {frame.fano7}×720 + {frame.role3}×240 + {frame.local240}</div>
                  <div className="tq-arch-line">= <strong>{frame.slot5040}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: .o Word ─────────────────────────────── */}
          {tab === 'oword' && frame && oWordData && (
            <div className="tq-tab-content">
              <div className="tq-metric-grid">
                <div className="tq-metric-card" style={{ gridColumn: '1 / -1' }}>
                  <span className="tq-metric-label">256-bit carrier</span>
                  <code className="tq-metric-bit" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                    {oWordHex}
                  </code>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Selector</span>
                  <span className="tq-metric-val">{oWordData.selector}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Path</span>
                  <span className="tq-metric-val">{oWordData.path}</span>
                  <code className="tq-metric-bit">{oWordData.path.toString(2).padStart(19, '0')}</code>
                </div>
                <div className="tq-metric-card" style={{ gridColumn: '1 / -1' }}>
                  <span className="tq-metric-label">Surface bits</span>
                  <code className="tq-metric-bit" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                    {oWordData.surface.toString(2).padStart(236, '0')}
                  </code>
                </div>
              </div>
              <div className="tq-info-block" style={{ marginTop: '8px' }}>
                <h4>Path fields</h4>
                <div className="tq-arch-line">baseQ: {decoded?.baseQ ?? '—'} &middot; fiberQ: {decoded?.fiberQ ?? '—'}</div>
                <div className="tq-arch-line">chart11: {decoded?.chart11 ?? '—'} &middot; fano7: {decoded?.fano7 ?? '—'} &middot; role3: {decoded?.role3 ?? '—'}</div>
              </div>
              {decoded && (
                <div className="tq-info-block" style={{ marginTop: '6px' }}>
                  <h4>Surface fields</h4>
                  <div className="tq-arch-line">status: {decoded.status as string} &middot; receipt: {decoded.receiptState as string}</div>
                  <div className="tq-arch-line">local240: {decoded.local240 as number} &middot; slot5040: {decoded.slot5040 as number}</div>
                  <div className="tq-arch-line">idHash: {decoded.idHash as string} &middot; nameHash: {decoded.nameHash as string}</div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Decompiled ──────────────────────────── */}
          {tab === 'demod' && decoded && (
            <div className="tq-tab-content">
              <div className="tq-metric-grid">
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Status (recovered)</span>
                  <span className="tq-metric-val">{decoded.status as string}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Slot 5040</span>
                  <span className="tq-metric-val">{decoded.slot5040 as number}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Chart 11</span>
                  <span className="tq-metric-val">{decoded.chart11 as number}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Local 240</span>
                  <span className="tq-metric-val">{decoded.local240 as number}</span>
                </div>
              </div>
              <table className="tq-demod-table" style={{ marginTop: '8px', width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border, #333)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Field</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(decoded).map(([key, value]) => (
                    <tr key={key} style={{ borderBottom: '1px solid var(--border, #222)' }}>
                      <td style={{ padding: '3px 8px', fontFamily: 'var(--font-mono, monospace)', color: '#888' }}>{key}</td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontFamily: 'var(--font-mono, monospace)' }}>
                        {typeof value === 'number' ? value : String(value).slice(0, 64)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tab: .o File ─────────────────────────────── */}
          {tab === 'ofile' && (
            <div className="tq-tab-content">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <div className="tq-metric-card" style={{ margin: 0, flex: 1 }}>
                  <span className="tq-metric-label">.o file ({state.result.frames.length} words, {oFile.length} chars)</span>
                </div>
                <button className="tq-mode-btn active" onClick={handleExport} style={{ whiteSpace: 'nowrap' }}>
                  ⬇ Export .o
                </button>
              </div>
              <pre className="tq-modem-pre" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {oFile}
              </pre>
              <p className="tq-cla-note" style={{ marginTop: '6px' }}>
                Each line is a 256-bit omi---imo carrier word (64 hex chars).
                Readable proof → carrier → geometry → receipt.
              </p>
            </div>
          )}

          {activeCarrier && frame && (
            <div className="tq-input-section omi-projection-faces">
              <div className="tq-mode-toggle">
                <span className="tq-mode-label">Projection Faces</span>
                <span className="tq-slider-val">{activeCarrier.receiptState}</span>
              </div>
              <div className="omi-surface-grid">
                <OmiForm carrier={{ ...activeCarrier, surface: 'form' }}>
                  <span>slot {frame.slot5040 ?? '—'}</span>
                  <code>local240 {frame.local240 ?? '—'}</code>
                </OmiForm>
                <OmiGlyph carrier={{ ...activeCarrier, surface: 'glyph' }}>
                  <span>{frame.event.status}</span>
                  <code>{frame.event.name.slice(0, 48)}</code>
                </OmiGlyph>
                <OmiMatrix carrier={{ ...activeCarrier, surface: 'matrix' }}>
                  <span>Q{frame.baseQ ?? '—'} / F{frame.fiberQ ?? '—'}</span>
                  <code>{frame.qxy ?? '—'}</code>
                </OmiMatrix>
                <OmiGnomon carrier={{ ...activeCarrier, surface: 'gnomon' }}>
                  <span>chart {frame.chart11 ?? '—'}</span>
                  <code>{String(frame.polybius?.cell ?? '—')}</code>
                </OmiGnomon>
                <OmiPortal carrier={{ ...activeCarrier, surface: 'portal' }}>
                  <span>{frame.address.slice(0, 28)}…</span>
                  <code>{activeCarrier.hash?.slice(0, 16) || 'hash pending'}</code>
                </OmiPortal>
                <OmiWorld carrier={{ ...activeCarrier, surface: 'world' }}>
                  <span>fano {frame.fano7 ?? '—'} role {frame.role3 ?? '—'}</span>
                  <code>{activeCarrier.oWord?.slice(0, 18)}…</code>
                </OmiWorld>
              </div>
              <OmiWorkerSurface
                carrier={activeCarrier}
                onEvent={(event) => setWorkerEvent(event as unknown as Record<string, unknown>)}
              />
              {workerEvent && (
                <div className="tq-arch-line sep">
                  worker event: <code>{String(workerEvent.type)}:{String(workerEvent.carrierId)}</code>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Imported .o file section ─────────────────────── */}
      {importedState && importedState.frames.length > 0 && (
        <div className="tq-input-section" style={{ borderTop: '1px solid rgba(148,163,184,.2)', paddingTop: '14px', marginTop: '4px' }}>
          <div className="tq-mode-toggle">
            <span className="tq-mode-label">Imported .o file</span>
            <span className="tq-slider-val">{importedState.frames.length} words</span>
            <button className="tq-mode-btn" onClick={() => setImportedState(null)} style={{ marginLeft: 'auto' }}>
              Clear import
            </button>
          </div>

          {importedState.frames.length > 1 && (
            <div className="tq-walk-controls" style={{ marginTop: '6px' }}>
              <label>
                Frame
                <input type="range" min={0} max={importedState.frames.length - 1}
                  value={importedState.activeFrame}
                  onChange={e => setImportedState(prev => prev ? { ...prev, activeFrame: Number(e.target.value) } : prev)}
                  style={{ width: '200px' }} />
                <span className="tq-slider-val">{importedState.activeFrame + 1}/{importedState.frames.length}</span>
              </label>
            </div>
          )}

          {importedFrame && (
            <>
              <div className="tq-metric-grid" style={{ marginTop: '6px' }}>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Status (recovered)</span>
                  <span className="tq-metric-val">{String(importedFrame.status ?? '—')}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Slot 5040</span>
                  <span className="tq-metric-val">{String(importedFrame.slot5040 ?? '—')}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Chart 11</span>
                  <span className="tq-metric-val">{String(importedFrame.chart11 ?? '—')}</span>
                </div>
                <div className="tq-metric-card">
                  <span className="tq-metric-label">Local 240</span>
                  <span className="tq-metric-val">{String(importedFrame.local240 ?? '—')}</span>
                </div>
              </div>

              {/* Projection */}
              <div className="tq-two-col" style={{ marginTop: '8px' }}>
                <div className="tq-info-block">
                  <h4>OMI Projection</h4>
                  {(() => {
                    const word = BigInt('0x' + String(importedFrame.wordHex ?? '0'));
                    try { return <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{projectToOMI(word)}</code>; }
                    catch { return <span style={{ color: '#888', fontSize: '11px' }}>no projection</span>; }
                  })()}
                </div>
                <div className="tq-info-block">
                  <h4>IMO Projection</h4>
                  {(() => {
                    const word = BigInt('0x' + String(importedFrame.wordHex ?? '0'));
                    try { return <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{projectToIMO(word)}</code>; }
                    catch { return <span style={{ color: '#888', fontSize: '11px' }}>no projection</span>; }
                  })()}
                </div>
              </div>

              <div className="tq-info-block" style={{ marginTop: '6px' }}>
                <h4>Decompiled fields</h4>
                <table className="tq-demod-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border, #333)' }}>
                      <th style={{ textAlign: 'left', padding: '3px 8px' }}>Field</th>
                      <th style={{ textAlign: 'right', padding: '3px 8px' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(importedFrame).map(([key, value]) => (
                      <tr key={key} style={{ borderBottom: '1px solid var(--border, #222)' }}>
                        <td style={{ padding: '2px 8px', fontFamily: 'var(--font-mono, monospace)', color: '#888' }}>{key}</td>
                        <td style={{ padding: '2px 8px', textAlign: 'right', fontFamily: 'var(--font-mono, monospace)' }}>
                          {key === 'wordHex'
                            ? String(value).slice(0, 16) + '…'
                            : typeof value === 'number' ? value : String(value).slice(0, 48)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Canon note */}
      <footer className="tq-canon-note">
        <code>The Tetragrammatron modem reads proof streams, modulates to OMI notation, routes through geometry, and compiles to 256-bit .o carrier words. Readable proof becomes carrier. Carrier becomes readable proof. Receipt accepts.</code>
      </footer>
    </section>
  );
}

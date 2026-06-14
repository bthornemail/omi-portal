import { useState } from 'react';
import {
  interpolateRootedQuQuart,
  deriveRootedQuQuartFromCla,
  classifyByteAddress,
  binaryQuadraticDifferential,
  differenceOfSquares,
  gnomonMetrics,
  precisionShellMetrics,
  elevenCellOrientation,
  walkElevenCellShell,
  archimedeanCatalanCoordination,
  twosComplementGeometry,
  computeCla4Bit,
  evaluatePsi,
  type RootedQuQuartInput,
} from '../omi/tetragrammatronQuquartInterpolator';

type InputMode = 'canonical' | 'cla-derived';
type Tab = 'ququart' | 'cla' | 'elevenCell' | 'archCat';

export function TetragrammatronQuQuartPanel() {
  const [mode, setMode] = useState<InputMode>('canonical');
  const [tab, setTab] = useState<Tab>('ququart');

  // Canonical sliders
  const [orientation60, setOrientation60] = useState(30);
  const [phase4, setPhase4] = useState(0);
  const [role3, setRole3] = useState(0);
  const [fano7, setFano7] = useState(0);

  // CLA-derived inputs
  const [claA, setClaA] = useState(5);
  const [claB, setClaB] = useState(6);
  const [claCin, setClaCin] = useState<0|1>(1);

  // Walk control
  const [walkSteps, setWalkSteps] = useState(11);
  const [walkStart, setWalkStart] = useState(3);

  // Derive rooted from CLA when in CLA-derived mode
  const claResult = mode === 'cla-derived'
    ? deriveRootedQuQuartFromCla({ A: claA, B: claB, Cin: claCin })
    : null;

  const rootedInput: RootedQuQuartInput = mode === 'canonical'
    ? { orientation60, phase4: phase4 as 0|1|2|3, role3: role3 as 0|1|2, fano7: fano7 as 0|1|2|3|4|5|6 }
    : {
        orientation60: claResult!.orientation60,
        phase4: claResult!.phase4,
        role3: claResult!.role3,
        fano7: claResult!.fano7,
      };

  const rootedOut = interpolateRootedQuQuart(rootedInput);
  const claRaw = computeCla4Bit(claA, claB, claCin);
  const bqd = binaryQuadraticDifferential(rootedInput.orientation60, rootedInput.phase4);
  const diffSq = differenceOfSquares(rootedInput.orientation60, rootedInput.fano7);
  const gm = gnomonMetrics(rootedInput.orientation60, rootedInput.phase4);
  const ps = precisionShellMetrics(rootedInput.orientation60, rootedInput.role3);
  const byteClass = classifyByteAddress(rootedOut.activeByte);

  const elevenWalk = walkElevenCellShell(walkStart, walkSteps);
  const archCat = archimedeanCatalanCoordination(rootedInput.orientation60, rootedInput.fano7, rootedOut.local240);
  const twosComp = twosComplementGeometry(rootedInput.orientation60, rootedInput.phase4);

  const psiResult = evaluatePsi({
    F1: rootedInput.orientation60, W1: rootedInput.phase4,
    F2: rootedInput.role3, W2: rootedInput.fano7,
    P: rootedInput.phase4, E: rootedInput.orientation60 % 16,
    G: rootedInput.orientation60 >> 4, I: rootedInput.role3,
    B: rootedInput.orientation60, H: rootedOut.local240,
    S: rootedInput.role3,
  });

  function handleClaHex(val: string, setter: (v: number) => void) {
    const n = parseInt(val, 16);
    if (!isNaN(n)) setter(n & 0x0F);
  }

  return (
    <section
      className="panel tetragrammatron-panel"
      data-omi={`o---o/tq/?phase=${rootedInput.phase4}&orientation=${rootedInput.orientation60}&role=${rootedInput.role3}&fano=${rootedInput.fano7}&local240=${rootedOut.local240}&slot5040=${rootedOut.slot5040}`}
      data-imo={`o---o/tq/?receipt=candidate&phase=${rootedInput.phase4}&orientation=${rootedInput.orientation60}&local240=${rootedOut.local240}`}
    >
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Rooted QuQuart Interpolator</p>
          <h2>Tetragrammatron Μνήμη</h2>
        </div>
        <span className="design-status">
          slot5040 = {rootedOut.slot5040} &middot; ψ{' '}
          {psiResult.accepted ? '✓' : '○'}
        </span>
      </div>

      <p className="boundary-copy">
        The Tetragrammatron is the Hidden 5! of the 11-cell — a QuQuart interpolator
        rooted in the self-dual 60-state orientation shell.
      </p>

      {/* Mode toggle */}
      <div className="tq-mode-toggle">
        <span className="tq-mode-label">Input mode:</span>
        <button
          className={'tq-mode-btn' + (mode === 'canonical' ? ' active' : '')}
          onClick={() => setMode('canonical')}
        >
          Canonical sliders
        </button>
        <button
          className={'tq-mode-btn' + (mode === 'cla-derived' ? ' active' : '')}
          onClick={() => setMode('cla-derived')}
        >
          Derive from CLA
        </button>
      </div>

      {/* Input section */}
      <div className="tq-input-section">
        {mode === 'canonical' ? (
          <div className="tq-slider-grid">
            <label>
              orientation60 <span className="tq-range-label">0..59</span>
              <input type="range" min={0} max={59} value={orientation60}
                onChange={e => setOrientation60(Number(e.target.value))} />
              <span className="tq-slider-val">{orientation60}</span>
            </label>
            <label>
              phase4 <span className="tq-range-label">0..3</span>
              <input type="range" min={0} max={3} value={phase4}
                onChange={e => setPhase4(Number(e.target.value))} />
              <span className="tq-slider-val">{phase4}</span>
            </label>
            <label>
              role3 <span className="tq-range-label">0..2</span>
              <input type="range" min={0} max={2} value={role3}
                onChange={e => setRole3(Number(e.target.value))} />
              <span className="tq-slider-val">{role3}</span>
            </label>
            <label>
              fano7 <span className="tq-range-label">0..6</span>
              <input type="range" min={0} max={6} value={fano7}
                onChange={e => setFano7(Number(e.target.value))} />
              <span className="tq-slider-val">{fano7}</span>
            </label>
          </div>
        ) : (
          <div className="tq-cla-controls">
            <label>A (hex)
              <input type="text" maxLength={1}
                value={claA.toString(16).toUpperCase()}
                onChange={e => handleClaHex(e.target.value, setClaA)} />
            </label>
            <label>B (hex)
              <input type="text" maxLength={1}
                value={claB.toString(16).toUpperCase()}
                onChange={e => handleClaHex(e.target.value, setClaB)} />
            </label>
            <label>Cin
              <input type="text" maxLength={1} value={claCin}
                onChange={e => setClaCin((parseInt(e.target.value) & 1) as 0|1)} />
            </label>
            <button onClick={() => {
              setClaA(~~(Math.random() * 16));
              setClaB(~~(Math.random() * 16));
              setClaCin(~~(Math.random() * 2) as 0|1);
            }}>Random</button>
            {claResult && (
              <div className="tq-derived-badge">
                derived: ori={claResult.orientation60} ph={claResult.phase4}
                ro={claResult.role3} fn={claResult.fano7}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tq-tabs">
        {([['ququart', 'Rooted'], ['cla', 'CLA'], ['elevenCell', '11-Cell'], ['archCat', 'Arch/Cat']] as [Tab, string][]).map(([k, label]) => (
          <button key={k}
            className={'tq-tab' + (tab === k ? ' active' : '')}
            onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Rooted QuQuart ────────────────────────────── */}
      {tab === 'ququart' && (
        <div className="tq-tab-content">
          <div className="tq-metric-grid">
            <div className="tq-metric-card">
              <span className="tq-metric-label">local240</span>
              <span className="tq-metric-val">{rootedOut.local240}</span>
              <code className="tq-metric-bit">
                {rootedOut.local240.toString(2).padStart(8, '0')}
              </code>
            </div>
            <div className="tq-metric-card">
              <span className="tq-metric-label">slot5040</span>
              <span className="tq-metric-val">{rootedOut.slot5040}</span>
              <code className="tq-metric-bit">7! cycle</code>
            </div>
            <div className="tq-metric-card">
              <span className="tq-metric-label">active byte</span>
              <span className="tq-metric-val">0x{rootedOut.activeByte.toString(16).toUpperCase().padStart(2, '0')}</span>
              <code className="tq-metric-bit">
                {byteClass.activeBridge ? 'active bridge' : 'reserved'}
              </code>
            </div>
            <div className="tq-metric-card">
              <span className="tq-metric-label">receipt</span>
              <span className="tq-metric-val">{rootedOut.receiptState}</span>
              <code className="tq-metric-bit">ψ {psiResult.accepted ? 'candidate accepted by local reducer' : 'pending'}</code>
            </div>
          </div>

          <div className="tq-two-col">
            <div className="tq-info-block">
              <h4>Binary Quadratic Differential</h4>
              <p>OO_hex = 60x² + 16xy + 4y²</p>
              <p><strong>{bqd}</strong> (x={rootedInput.orientation60}, y={rootedInput.phase4})</p>
              <h4 style={{marginTop:'10px'}}>Difference of Squares (Gnomon)</h4>
              <p>a² - b² = <strong>{diffSq}</strong></p>
              <p>bridge = <strong>{gm.width}</strong> (sum={gm.sum}, diff={gm.difference}, rect={gm.bridgeRectangle})</p>
              <h4 style={{marginTop:'10px'}}>Precision Shell</h4>
              <p>2¹¹ = {ps.shell} &middot; 2¹⁰ = {ps.surface}</p>
              <p>anchor = <code>{ps.anchor}</code></p>
            </div>
            <div className="tq-info-block">
              <h4>Architecture</h4>
              <div className="tq-arch-line">11-cell → {rootedInput.orientation60} orientation</div>
              <div className="tq-arch-line">QuQuart → phase {rootedInput.phase4}</div>
              <div className="tq-arch-line">role → {rootedInput.role3}</div>
              <div className="tq-arch-line">Fano → point {rootedInput.fano7}</div>
              <div className="tq-arch-line sep">4 × 60 = <strong>240</strong> active byte-plane</div>
              <div className="tq-arch-line">3 × 240 = <strong>720</strong> semantic sweep</div>
              <div className="tq-arch-line">7 × 720 = <strong>5040</strong> replay ring</div>
            </div>
          </div>

          <div className="tq-psi-block">
            <h4>ψ Function — Receipt Evaluation</h4>
            <div className="tq-psi-row">
              <span>accepted:</span>
              <strong className={psiResult.accepted ? 'tq-pass' : 'tq-pending'}>
                {psiResult.accepted ? 'YES (local reducer)' : 'NO'}
              </strong>
            </div>
            <div className="tq-psi-row">
              <span>receipt:</span>
              <code>{psiResult.receiptId}</code>
            </div>
            <div className="tq-psi-row">
              <span>degree:</span>
              <span>{psiResult.degree}°</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: CLA Simulator ─────────────────────────────── */}
      {tab === 'cla' && (
        <div className="tq-tab-content">
          <div className="tq-cla-display">
            <div className="tq-cla-row">
              <span className="tq-cla-key">P = A ⊕ B</span>
              <span className="tq-cla-val">0x{claRaw.P.toString(16).toUpperCase()}</span>
            </div>
            <div className="tq-cla-row">
              <span className="tq-cla-key">G = A & B</span>
              <span className="tq-cla-val">0x{claRaw.G.toString(16).toUpperCase()}</span>
            </div>
            <div className="tq-cla-row">
              <span className="tq-cla-key">Σ = S₃S₂S₁S₀</span>
              <span className="tq-cla-val">0x{claRaw.sum.toString(16).toUpperCase()} ({claRaw.sum})</span>
            </div>
            <div className="tq-cla-row">
              <span className="tq-cla-key">Cout</span>
              <span className="tq-cla-val">{claRaw.Cout}</span>
            </div>
          </div>
          <div className="tq-carry-chain">
            C{claRaw.carries[3]} — C{claRaw.carries[2]} — C{claRaw.carries[1]} — C{claRaw.carries[0]} — Cin{claRaw.Cin}
          </div>
          <p className="tq-cla-note">
            Gate delay: 1dt (P/G) → 3dt (carry) → 4dt (sum)
            &middot; vs ripple 8dt &mdash; 50% faster
          </p>
        </div>
      )}

      {/* ── Tab: 11-Cell Walk ──────────────────────────────── */}
      {tab === 'elevenCell' && (
        <div className="tq-tab-content">
          <div className="tq-walk-controls">
            <label>
              Start vertex
              <input type="range" min={0} max={10} value={walkStart}
                onChange={e => setWalkStart(Number(e.target.value))} />
              <span className="tq-slider-val">{walkStart}</span>
            </label>
            <label>
              Steps
              <input type="range" min={1} max={55} value={walkSteps}
                onChange={e => setWalkSteps(Number(e.target.value))} />
              <span className="tq-slider-val">{walkSteps}</span>
            </label>
          </div>
          <div className="tq-eleven-stats">
            <span>path ({walkSteps + 1}): <code>{elevenWalk.path.join('→')}</code></span>
            <span>55 edges; {walkSteps} distances walked</span>
            <span>60 orientation states; ϕ range 0..59</span>
          </div>
          <div className="tq-info-block" style={{marginTop:'10px'}}>
            <h4>Self-Dual 11-Cell</h4>
            <p>11 vertices, 11 cells, 55 edges, 55 faces</p>
            <p>L₂(11)/Z₁₁ = 660/11 = 60 cosets (buckyball orientation surface)</p>
            <p>vertex ↔ cell &middot; edge ↔ face &middot; omi ↔ imo</p>
          </div>
        </div>
      )}

      {/* ── Tab: Archimedean/Catalan ───────────────────────── */}
      {tab === 'archCat' && (
        <div className="tq-tab-content">
          <div className="tq-two-col">
            <div className="tq-info-block">
              <h4>Archimedean + Catalan</h4>
              <div className="tq-arch-line">traversal: {archCat.traversal}</div>
              <div className="tq-arch-line">chiral: {archCat.chiral}</div>
              <div className="tq-arch-line">tangent: <code>{archCat.tangent}</code></div>
              <div className="tq-arch-line">solidus: <code>{archCat.solidus}</code></div>
            </div>
            <div className="tq-info-block">
              <h4>Two's-Complement Geometry</h4>
              <div className="tq-arch-line">Δ = {twosComp.delta}</div>
              <div className="tq-arch-line">signed = {twosComp.signedDelta}</div>
              <div className="tq-arch-line">orientation = {twosComp.orientation}</div>
              <div className="tq-arch-line">overflow = {twosComp.overflow ? 'yes (handoff)' : 'no'}</div>
            </div>
          </div>
          <div className="tq-space-triad">
            <div><strong>User space</strong> — fexpression, POS/features, predicate phrase</div>
            <div><strong>Runtime space</strong> — geometry predicate, Schläfli, Coxeter, snub/truncation</div>
            <div><strong>Identity space</strong> — OMI frame, Omicron stream cell, receipt</div>
          </div>
        </div>
      )}

      {/* Canon */}
      <footer className="tq-canon-note">
        <code>The Tetragrammatron is the Hidden 5! of the 11-cell. CLA may derive a rooted QuQuart coordinate. The rooted coordinate remains orientation60 + phase4 + role3 + fano7. The 11-cell roots orientation. QuQuart selects phase. CONS reduces. MCRSGSP carries. Receipt accepts.</code>
      </footer>
    </section>
  );
}

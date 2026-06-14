import type { NetworkingDocCell } from '../narrative/narrativeTypes';

type NetworkingLiteratePanelProps = {
  cells: NetworkingDocCell[];
  loaded: boolean;
  activeLayer: string | null;
  onSetLayer: (layer: string | null) => void;
};

const LAYER_META: Record<string, { label: string; color: string; icon: string }> = {
  core: { label: 'Core Spec', color: 'rgba(91,141,238,.25)', icon: 'Ο' },
  addressing: { label: 'Addressing', color: 'rgba(20,184,166,.25)', icon: 'ο' },
  distributed: { label: 'Distributed', color: 'rgba(245,158,11,.25)', icon: '⊞' },
  transport: { label: 'Transport', color: 'rgba(239,68,68,.25)', icon: '⇄' },
  memory: { label: 'Memory', color: 'rgba(168,85,247,.25)', icon: '⊡' },
  application: { label: 'Application', color: 'rgba(236,72,153,.25)', icon: '◈' }
};

export function NetworkingLiteratePanel({ cells, loaded, activeLayer, onSetLayer }: NetworkingLiteratePanelProps) {
  const layers = Object.keys(LAYER_META);
  const filtered = activeLayer ? cells.filter(c => c.layer === activeLayer) : cells;
  const byLayer: Record<string, NetworkingDocCell[]> = {};
  for (const c of filtered) {
    (byLayer[c.layer] ??= []).push(c);
  }

  return (
    <section
      className="panel networking-literate-panel"
      data-omi={`networking/${activeLayer || 'all'}/${cells.length}`}
      data-imo={`imo:networking@${cells.length}`}
    >
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Protocol Literacy Surface</p>
          <h2>Networking Docs</h2>
        </div>
        <span className="design-status">{loaded ? `${cells.length} sections` : 'loading'}</span>
      </div>

      <p className="boundary-copy">
        Docs explain. MCRSGSP carries. Memory bounds. Receipts accept.
      </p>

      {/* layer tabs */}
      <div className="netlit-tabs">
        <button
          className={'netlit-tab' + (activeLayer === null ? ' active' : '')}
          onClick={() => onSetLayer(null)}
        >
          All
        </button>
        {layers.map(l => (
          <button
            key={l}
            className={'netlit-tab' + (activeLayer === l ? ' active' : '')}
            onClick={() => onSetLayer(l)}
            style={{ '--tab-accent': LAYER_META[l].color } as React.CSSProperties}
          >
            {LAYER_META[l].icon} {LAYER_META[l].label}
          </button>
        ))}
      </div>

      {!loaded && <p style={{ color: '#9ca3af' }}>Loading networking docs…</p>}

      {loaded && filtered.length === 0 && (
        <p style={{ color: '#9ca3af' }}>No cells for this layer.</p>
      )}

      {loaded && layers.map(layer => {
        const layerCells = byLayer[layer];
        if (!layerCells) return null;
        const meta = LAYER_META[layer];
        return (
          <div key={layer} className="netlit-layer-block">
            <div className="netlit-layer-heading" style={{ borderLeftColor: meta.color }}>
              <span className="netlit-layer-icon">{meta.icon}</span>
              <strong>{meta.label}</strong>
              <span className="netlit-cell-count">{layerCells.length}</span>
            </div>
            <div className="netlit-cell-grid">
              {layerCells.map(cell => (
                <article
                  key={cell.id}
                  className="netlit-cell"
                  id={cell.id}
                  data-omi={cell.dataOmi}
                  data-imo={cell.dataImo}
                  data-layer={cell.layer}
                  data-receipt-state={cell.receiptState}
                >
                  <header className="netlit-cell-header">
                    <span className="netlit-source">{cell.sourcePath.replace('docs/', '').replace('.md', '')}</span>
                    <span className={`netlit-receipt ${cell.receiptState}`}>{cell.receiptState}</span>
                  </header>
                  <strong className="netlit-section-title">{cell.section}</strong>
                  <p className="netlit-excerpt">{cell.explanation}</p>
                  <footer className="netlit-footer">
                    {cell.sourceRefs.map((ref, i) => (
                      <code key={i} className="netlit-ref">{ref.path}</code>
                    ))}
                    <code className="netlit-omi">{cell.dataOmi}</code>
                    <code className="netlit-imo">{cell.dataImo}</code>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

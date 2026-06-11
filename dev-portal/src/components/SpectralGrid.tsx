import { ROOT_ROW_LABELS, cellFromRowXY, unicodeLabel, scalarFromPageCell } from '../core/gauge';

type Props = {
  page: number;
  onSelect: (row: number, x: number, y: number) => void;
};

export function SpectralGrid({ page, onSelect }: Props) {
  const rows = Array.from({ length: 16 }, (_, row) => row);
  const xs = Array.from({ length: 16 }, (_, x) => x * 4);
  return (
    <section className="panel">
      <h2>SpectralDOM Gauge Rows</h2>
      <p>Compressed 16×16 view over the 16×64×64 Omi-Gauge plane. Each tile samples every fourth x/y lane.</p>
      <div className="grid" role="grid" aria-label="Omi-Gauge sampled grid">
        {rows.map((row) => xs.map((x) => {
          const y = x;
          const cell = cellFromRowXY(row, x, y);
          const scalar = scalarFromPageCell(page, cell);
          return (
            <button key={`${row}-${x}`} className="cell" onClick={() => onSelect(row, x, y)} title={`${ROOT_ROW_LABELS[row]} ${unicodeLabel(scalar)}`}>
              <span>{row.toString(16).toUpperCase()}</span>
              <small>{x.toString(16).toUpperCase().padStart(2, '0')}</small>
            </button>
          );
        }))}
      </div>
    </section>
  );
}

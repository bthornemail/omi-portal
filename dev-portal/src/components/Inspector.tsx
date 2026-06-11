import { ROOT_ROW_LABELS, unicodeLabel } from '../core/gauge';
import { toSurrogatePair } from '../core/surrogate';
import { consQuery } from '../core/cons';
import type { OmiRuntimeState } from '../core/runtime';
import { receiptCons } from '../core/runtime';

type Props = { runtime: OmiRuntimeState };

export function Inspector({ runtime }: Props) {
  const { selected } = runtime;
  const pair = toSurrogatePair(selected.scalar);
  const cons = receiptCons(runtime);
  const hex = (n: number, width = 4) => `0x${n.toString(16).toUpperCase().padStart(width, '0')}`;
  return (
    <section className="panel inspector">
      <h2>Inspector</h2>
      <dl>
        <dt>Root</dt><dd><code>{runtime.rootAddress}</code></dd>
        <dt>Page</dt><dd>{selected.page}</dd>
        <dt>Row</dt><dd>{hex(selected.row, 1)} — {ROOT_ROW_LABELS[selected.row]}</dd>
        <dt>X/Y</dt><dd>{selected.x} / {selected.y}</dd>
        <dt>Cell</dt><dd><code>{hex(selected.cell, 4)}</code></dd>
        <dt>Scalar</dt><dd><code>{unicodeLabel(selected.scalar)}</code></dd>
        <dt>UTF-16 RPC</dt><dd><code>{hex(pair.high, 4)} {hex(pair.low, 4)}</code></dd>
        <dt>Delta</dt><dd><code>{hex(runtime.deltaValue, 4)}</code></dd>
        <dt>Omi-CONS</dt><dd><code>{consQuery(cons)}</code></dd>
      </dl>
    </section>
  );
}

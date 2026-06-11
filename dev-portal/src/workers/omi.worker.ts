/// <reference lib="webworker" />
import { delta } from '../core/delta';
import { cellFromRowXY, scalarFromPageCell } from '../core/gauge';

self.onmessage = (event: MessageEvent) => {
  const { kind, payload } = event.data ?? {};
  try {
    if (kind === 'delta') {
      const value = delta(payload.value, payload.constant ?? 0x03bf, payload.width ?? 16);
      self.postMessage({ ok: true, kind, value });
      return;
    }
    if (kind === 'cell') {
      const cell = cellFromRowXY(payload.row, payload.x, payload.y);
      const scalar = scalarFromPageCell(payload.page ?? 0, cell);
      self.postMessage({ ok: true, kind, cell, scalar });
      return;
    }
    self.postMessage({ ok: false, error: `Unknown worker kind: ${kind}` });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};

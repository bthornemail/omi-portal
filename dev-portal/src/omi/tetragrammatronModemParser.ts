export interface OmiTestEvent {
  id: string;
  suite: string | null;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'todo' | 'running';
  durationMs?: number;
  raw: string;
  source: string;
}

export interface ModemFrame {
  event: OmiTestEvent;
  address: string;
  omi: string;
  parsed: { records: Record<string, unknown>[]; malformed: unknown[] };
  demodulated: Record<string, unknown>[];
  receiptState: string;
  geometry?: Record<string, unknown>;
  node?: Record<string, unknown>;
  qphase?: string;
  chart11?: number;
  baseQ?: number;
  fiberQ?: number;
  fano7?: number;
  role3?: number;
  local240?: number;
  slot5040?: number;
  qxy?: number;
  thrustDirection?: { a: number; b: number; c: number };
  polybius?: Record<string, unknown>;
}

export interface ModemTabState {
  input: string;
  result: {
    eventCount: number;
    frames: ModemFrame[];
    summary: { passed: number; failed: number; running: number; accepted: number; candidate: number };
  } | null;
  activeFrame: number;
  error: string | null;
}

export function createInitialModemState(): ModemTabState {
  return {
    input: '',
    result: null,
    activeFrame: 0,
    error: null,
  };
}

export const DEFAULT_SAMPLE = [
  '▶ Tetragrammatron Geometry',
  '  ✔ Hopf projection matches expected (0.31ms)',
  '  ✔ BQD formula is deterministic (0.19ms)',
  '  ✖ 11-cell walk fails at step 7 (0.45ms)',
  '  ✔ Catmull-Clark subdivision converges (0.88ms)',
  '',
  '▶ Modem Pipeline',
  '  ✔ parseNodeTestOutput recovers events (0.12ms)',
  '  ✔ modemFrameToOWord packs geometry (0.09ms)',
].join('\n');

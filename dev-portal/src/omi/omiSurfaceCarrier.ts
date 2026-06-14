export type ReceiptState = 'candidate' | 'accepted' | 'rejected';

export type OmiSurfaceName =
  | 'form'
  | 'glyph'
  | 'matrix'
  | 'gnomon'
  | 'portal'
  | 'world';

export type OmiCarrierMime =
  | 'application/javascript'
  | 'application/wasm'
  | 'application/octet-stream';

export type OmiCarrier = {
  id: string;
  address: string;
  surface: OmiSurfaceName;
  receiptState: ReceiptState;
  mime: OmiCarrierMime;
  base64: string;
  hash?: string;
  oWord?: string;
};

export type OmiCarrierInput = Omit<OmiCarrier, 'surface' | 'receiptState' | 'mime'> & {
  surface?: OmiSurfaceName;
  receiptState?: string;
  mime?: string;
};

const SURFACES = new Set<OmiSurfaceName>(['form', 'glyph', 'matrix', 'gnomon', 'portal', 'world']);
const RECEIPTS = new Set<ReceiptState>(['candidate', 'accepted', 'rejected']);
const MIMES = new Set<OmiCarrierMime>([
  'application/javascript',
  'application/wasm',
  'application/octet-stream',
]);

export function normalizeReceiptState(value: unknown): ReceiptState {
  const normalized = String(value ?? 'candidate').toLowerCase();
  return RECEIPTS.has(normalized as ReceiptState) ? normalized as ReceiptState : 'candidate';
}

export function normalizeOmiSurfaceName(value: unknown): OmiSurfaceName {
  const normalized = String(value ?? 'form').toLowerCase();
  return SURFACES.has(normalized as OmiSurfaceName) ? normalized as OmiSurfaceName : 'form';
}

export function normalizeOmiCarrierMime(value: unknown): OmiCarrierMime {
  const normalized = String(value ?? 'application/octet-stream').toLowerCase();
  return MIMES.has(normalized as OmiCarrierMime)
    ? normalized as OmiCarrierMime
    : 'application/octet-stream';
}

export function textToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  if (typeof btoa === 'function') return btoa(binary);
  return Buffer.from(bytes).toString('base64');
}

export function base64ToBytes(base64: string): Uint8Array {
  const normalized = String(base64 || '').trim();
  if (typeof atob === 'function') {
    const binary = atob(normalized);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(normalized, 'base64'));
}

export function createOmiCarrier(input: OmiCarrierInput): OmiCarrier {
  return {
    id: String(input.id || 'omi-carrier'),
    address: String(input.address || 'o---o/---/?v=projection;l=10;h=carrier@3C@'),
    surface: normalizeOmiSurfaceName(input.surface),
    receiptState: normalizeReceiptState(input.receiptState),
    mime: normalizeOmiCarrierMime(input.mime),
    base64: String(input.base64 || ''),
    hash: input.hash,
    oWord: input.oWord,
  };
}

export function omiCarrierDataAttributes(carrier: OmiCarrier, surface = carrier.surface) {
  const normalizedSurface = normalizeOmiSurfaceName(surface);
  const attrs: Record<string, string> = {
    'data-omi': carrier.address,
    'data-imo': `o---o/---/?receipt=${carrier.receiptState}@3C@`,
    'data-omi-surface': normalizedSurface,
    'data-receipt-state': carrier.receiptState,
    'data-o-word': carrier.oWord || '',
    'data-carrier-id': carrier.id,
    'data-carrier-mime': carrier.mime,
  };
  if (carrier.hash) attrs['data-carrier-hash'] = carrier.hash;
  if (carrier.base64) attrs['data-carrier-base64'] = carrier.base64;
  return attrs;
}

export async function deriveOmiCarrierHash(carrier: Pick<OmiCarrier, 'base64'>): Promise<string> {
  const bytes = base64ToBytes(carrier.base64);
  const copy = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function modemFrameToOmiCarrier(options: {
  frame: {
    event?: { id?: string; name?: string; status?: string };
    address?: string;
    receiptState?: string;
    slot5040?: number;
  };
  oWordHex: string;
  oFile?: string;
  surface?: OmiSurfaceName;
  hash?: string;
}): OmiCarrier {
  const frame = options.frame;
  const payload = options.oFile || options.oWordHex;
  const id = String(frame.event?.id || `slot-${frame.slot5040 ?? 0}`);
  return createOmiCarrier({
    id: `tetragrammatron:${id}`,
    address: String(frame.address || `o---o/tq/?slot5040=${frame.slot5040 ?? 0}`),
    surface: options.surface ?? 'matrix',
    receiptState: frame.receiptState || (frame.event?.status === 'passed' ? 'accepted' : 'candidate'),
    mime: 'application/octet-stream',
    base64: textToBase64(payload),
    hash: options.hash,
    oWord: options.oWordHex,
  });
}

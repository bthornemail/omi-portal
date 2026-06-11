import { base64ToBytes, bytesToBase64, bytesToUint32, sha256Hex, uint32ToBytes } from './bytes';
import { TOTAL_CELLS } from './gauge';
import type { OmiSnapshot } from './types';

export async function exportSnapshot(rootAddress: string, bitboard: Uint8Array, rewrites: Uint32Array): Promise<OmiSnapshot> {
  const rewriteBytes = uint32ToBytes(rewrites);
  const combined = new Uint8Array(bitboard.byteLength + rewriteBytes.byteLength);
  combined.set(bitboard, 0);
  combined.set(rewriteBytes, bitboard.byteLength);
  const receipt = await sha256Hex(combined);
  return {
    version: 1,
    rootAddress,
    createdAt: new Date().toISOString(),
    bitboardBase64: bytesToBase64(bitboard),
    rewritesBase64: bytesToBase64(rewriteBytes),
    receipt,
    cells: rewrites.length
  };
}

export function importSnapshot(snapshot: OmiSnapshot): { bitboard: Uint8Array; rewrites: Uint32Array } {
  if (snapshot.version !== 1) throw new Error('Unsupported OMI snapshot version');
  const bitboard = base64ToBytes(snapshot.bitboardBase64);
  const rewrites = bytesToUint32(base64ToBytes(snapshot.rewritesBase64));
  if (rewrites.length !== TOTAL_CELLS) throw new Error(`Expected ${TOTAL_CELLS} rewrite cells, got ${rewrites.length}`);
  return { bitboard, rewrites };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

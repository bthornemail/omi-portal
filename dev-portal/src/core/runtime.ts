import { addressSeed, ZERO_BASIS_ADDRESS } from './address';
import { delta, BLOCK_B } from './delta';
import { absoluteIndex, cellFromRowXY, makeMasterBitboard, scalarFromPageCell, setBit, TOTAL_CELLS } from './gauge';
import { computeCons } from './cons';
import type { OmiAddress, OmiCell } from './types';

export type OmiRuntimeState = {
  rootAddress: string;
  bitboard: Uint8Array;
  rewrites: Uint32Array;
  selected: OmiCell;
  deltaValue: number;
};

export function createRuntime(root: OmiAddress): OmiRuntimeState {
  const rootAddress = ZERO_BASIS_ADDRESS;
  const bitboard = makeMasterBitboard(TOTAL_CELLS);
  const rewrites = new Uint32Array(TOTAL_CELLS);
  const deltaValue = delta(addressSeed(root), 0x03bf, 16);
  const row = (deltaValue >>> 12) & 0xf;
  const x = (deltaValue >>> 6) & 0x3f;
  const y = deltaValue & 0x3f;
  const cell = cellFromRowXY(row, x, y);
  const scalar = scalarFromPageCell(0, cell);
  const selected = { page: 0, row, x, y, cell, scalar };
  return { rootAddress, bitboard, rewrites, selected, deltaValue };
}

export function touch(runtime: OmiRuntimeState, page: number, row: number, x: number, y: number, value?: number): OmiRuntimeState {
  const cell = cellFromRowXY(row, x, y);
  const index = absoluteIndex(page, cell);
  const bitboard = runtime.bitboard.slice();
  const rewrites = runtime.rewrites.slice();
  setBit(bitboard, index, true);
  const nextValue = value ?? (cell ^ BLOCK_B[(x + y + row) % BLOCK_B.length]);
  rewrites[index] = nextValue >>> 0;
  return { ...runtime, bitboard, rewrites, selected: { page, row, x, y, cell, scalar: scalarFromPageCell(page, cell) } };
}

export function receiptCons(runtime: OmiRuntimeState) {
  const selectedIndex = absoluteIndex(runtime.selected.page, runtime.selected.cell);
  const rewrite = runtime.rewrites[selectedIndex] ?? 0;
  return computeCons(runtime.selected.cell, rewrite);
}

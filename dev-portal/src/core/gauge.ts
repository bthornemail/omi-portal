import type { OmiCell } from './types';

export const PAGES = 16;
export const ROWS = 16;
export const LANES = 64;
export const CELLS_PER_PAGE = ROWS * LANES * LANES; // 65536
export const TOTAL_CELLS = PAGES * CELLS_PER_PAGE; // 1048576
export const FULL_UNICODE_CODEPOINTS = 0x110000; // 17 * 65536

export const ROOT_ROW_LABELS = [
  'axioms', 'rules', 'facts', 'closures', 'combinators', 'cons', 'car', 'cdr',
  'encode', 'decode', 'frame', 'buffer', 'file', 'group', 'record', 'unit'
] as const;

export const LOCAL_ROOT_LUT = [
  'axiomatic-algorithms', 'logic-rules', 'configuration-facts', 'event-closures',
  'intent-combinators', 'element-constructions', 'block-node', 'edge-node',
  'graph-node', 'data-view', 'data-source', 'data-input', 'data-sink', 'data-output',
  'done-statement', 'unit-boundary'
] as const;

export function cellFromRowXY(row: number, x: number, y: number): number {
  assertRange('row', row, 0, 15);
  assertRange('x', x, 0, 63);
  assertRange('y', y, 0, 63);
  return (row << 12) | (x << 6) | y;
}

export function rowXYFromCell(cell: number): { row: number; x: number; y: number } {
  assertRange('cell', cell, 0, 0xffff);
  return { row: cell >>> 12, x: (cell >>> 6) & 0x3f, y: cell & 0x3f };
}

export function scalarFromPageCell(page: number, cell: number): number {
  assertRange('page', page, 0, 15);
  assertRange('cell', cell, 0, 0xffff);
  return 0x10000 + (page << 16) + cell;
}

export function cellFromScalar(scalar: number): OmiCell {
  assertRange('scalar', scalar, 0x10000, 0x10ffff);
  const n = scalar - 0x10000;
  const page = n >>> 16;
  const cell = n & 0xffff;
  const { row, x, y } = rowXYFromCell(cell);
  return { page, row, x, y, cell, scalar };
}

export function unicodeLabel(codepoint: number): string {
  return `U+${codepoint.toString(16).toUpperCase().padStart(6, '0')}`;
}

export function makeMasterBitboard(cells = TOTAL_CELLS): Uint8Array {
  return new Uint8Array(Math.ceil(cells / 8));
}

export function setBit(bitboard: Uint8Array, index: number, value = true): void {
  assertRange('index', index, 0, bitboard.length * 8 - 1);
  const byte = index >>> 3;
  const bit = index & 7;
  if (value) bitboard[byte] |= 1 << bit;
  else bitboard[byte] &= ~(1 << bit);
}

export function getBit(bitboard: Uint8Array, index: number): boolean {
  assertRange('index', index, 0, bitboard.length * 8 - 1);
  return Boolean(bitboard[index >>> 3] & (1 << (index & 7)));
}

export function absoluteIndex(page: number, cell: number): number {
  assertRange('page', page, 0, 15);
  assertRange('cell', cell, 0, 0xffff);
  return page * CELLS_PER_PAGE + cell;
}

function assertRange(name: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} must be an integer in [${min}, ${max}], got ${value}`);
}

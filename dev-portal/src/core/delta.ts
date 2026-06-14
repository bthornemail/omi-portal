export function mask(width: number): number {
  if (!Number.isInteger(width) || width <= 0 || width > 31) throw new Error('width must be an integer from 1 to 31');
  return (1 << width) - 1;
}

export function rotl(value: number, shift: number, width = 16): number {
  const m = mask(width);
  const s = ((shift % width) + width) % width;
  const x = value & m;
  return ((x << s) | (x >>> (width - s))) & m;
}

export function rotr(value: number, shift: number, width = 16): number {
  const m = mask(width);
  const s = ((shift % width) + width) % width;
  const x = value & m;
  return ((x >>> s) | (x << (width - s))) & m;
}

export function delta(value: number, constant: number, width = 16): number {
  return (rotl(value, 1, width) ^ rotl(value, 3, width) ^ rotr(value, 2, width) ^ constant) & mask(width);
}

export const BLOCK_B = [0, 1, 3, 6, 9, 8, 6, 3] as const;
export const BLOCK_B_WIDTH = BLOCK_B.reduce<number>((a, b) => a + b, 0); // 36

export function orbitOffset(position: number): { orbit: number; offset: number } {
  const orbit = Math.floor(position / BLOCK_B_WIDTH);
  const offset = position % BLOCK_B_WIDTH;
  return { orbit, offset };
}

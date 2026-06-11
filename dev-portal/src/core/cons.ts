import type { OmiCons } from './types';

export function computeCons(car: number, cdr: number, width = 32): OmiCons {
  const mask = width >= 32 ? 0xffffffff : (1 << width) - 1;
  const a = car & mask;
  const d = cdr & mask;
  const cid = ~(a ^ d) & mask;
  return { car: a | d, cdr: a ^ d, cid };
}

export function consQuery(cons: OmiCons): string {
  const hex = (n: number) => `0x${(n >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  return `?car:${hex(cons.car)};cdr:${hex(cons.cdr)};cid:${hex(cons.cid)}`;
}

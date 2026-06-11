import type { OmiAddress } from './types';

export const ZERO_BASIS_ADDRESS = 'omi-0000/0000/0000/0000/0000-imo';

export function formatAddress(address: OmiAddress): string {
  const part = (n: number) => n.toString(16).toUpperCase().padStart(4, '0');
  return `omi-${part(address.frame)}/${part(address.control)}/${part(address.scale)}/${part(address.relation)}/${part(address.unit)}-imo`;
}

export function parseAddress(input: string): OmiAddress {
  const match = /^omi-([0-9a-fA-F]{4})\/([0-9a-fA-F]{4})\/([0-9a-fA-F]{4})\/([0-9a-fA-F]{4})\/([0-9a-fA-F]{4})-imo$/.exec(input.trim());
  if (!match) throw new Error('Invalid OMI address. Expected omi-0000/0000/0000/0000/0000-imo');
  const [, frame, control, scale, relation, unit] = match;
  return { frame: parseInt(frame, 16), control: parseInt(control, 16), scale: parseInt(scale, 16), relation: parseInt(relation, 16), unit: parseInt(unit, 16) };
}

export function addressSeed(address: OmiAddress): number {
  return (address.frame ^ address.control ^ address.scale ^ address.relation ^ address.unit) & 0xffff;
}

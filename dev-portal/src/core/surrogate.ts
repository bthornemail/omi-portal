export function toSurrogatePair(scalar: number): { high: number; low: number } {
  if (!Number.isInteger(scalar) || scalar < 0x10000 || scalar > 0x10ffff) throw new Error('scalar must be U+010000..U+10FFFF');
  const u = scalar - 0x10000;
  return { high: 0xd800 + (u >>> 10), low: 0xdc00 + (u & 0x3ff) };
}

export function fromSurrogatePair(high: number, low: number): number {
  if (high < 0xd800 || high > 0xdbff) throw new Error('high surrogate out of range');
  if (low < 0xdc00 || low > 0xdfff) throw new Error('low surrogate out of range');
  return 0x10000 + ((high - 0xd800) << 10) + (low - 0xdc00);
}

export function surrogateKind(word: number): 'high-rpc' | 'low-rpc' | 'bmp-valid' | 'invalid' {
  if (!Number.isInteger(word) || word < 0 || word > 0xffff) return 'invalid';
  if (word >= 0xd800 && word <= 0xdbff) return 'high-rpc';
  if (word >= 0xdc00 && word <= 0xdfff) return 'low-rpc';
  return 'bmp-valid';
}

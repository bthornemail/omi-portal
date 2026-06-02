export const BASIS32 = Object.freeze([...Array(32).keys()]);

export const HIDDEN_OPERATOR_PLANE = Object.freeze([...Array(32).keys()]);

export const VISIBLE_OPERATOR_PLANE = Object.freeze([...Array(32).keys()].map(i => i + 0x20));

export const NATIVE_PLANE64 = Object.freeze([...Array(64).keys()]);

export function basis32(index) {
  if (index < 0 || index > 31) {
    throw new RangeError(`basis32: index ${index} out of range [0, 31]`);
  }
  return index;
}

export function native64(index) {
  if (index < 0 || index > 63) {
    throw new RangeError(`native64: index ${index} out of range [0, 63]`);
  }
  return index;
}

export function splitBasis32(index) {
  if (index < 0 || index > 31) return null;
  return { hidden: index < 0x20, operator: index };
}

export function branchForBasis(index) {
  if (index < 0 || index > 31) return null;
  if (index >= 0x00 && index <= 0x07) return 'cons';
  if (index >= 0x08 && index <= 0x0f) return 'combinator';
  if (index >= 0x10 && index <= 0x17) return 'rule';
  if (index >= 0x18 && index <= 0x1f) return 'fact';
  return null;
}

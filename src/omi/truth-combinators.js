export const WITTGENSTEIN_OPERATOR_MIN = 0;
export const WITTGENSTEIN_OPERATOR_MAX = 15;

export const WITTGENSTEIN_OPERATOR_NAMES = Object.freeze({
  0: "FALSE",
  1: "NOR",
  6: "XOR",
  8: "AND",
  14: "OR",
  15: "TRUE"
});

export const KARNAUGH_BIT_ORDER = Object.freeze({
  bit3: "f(T,T)",
  bit2: "f(T,F)",
  bit1: "f(F,T)",
  bit0: "f(F,F)"
});

export function assertWittgensteinOperatorIndex(index) {
  const value = Number(index);
  if (!Number.isInteger(value) || value < WITTGENSTEIN_OPERATOR_MIN || value > WITTGENSTEIN_OPERATOR_MAX) {
    throw new RangeError(`Wittgenstein operator index must be 0..15: ${index}`);
  }
  return value;
}

export function wittgensteinOperator(index, p, q) {
  const value = assertWittgensteinOperatorIndex(index);
  const bit = karnaughBitIndex(p, q);
  return (value >> bit) & 1;
}

export function karnaughBitIndex(p, q) {
  const left = Boolean(p);
  const right = Boolean(q);
  if (left && right) return 3;
  if (left && !right) return 2;
  if (!left && right) return 1;
  return 0;
}

export function karnaughMap(index) {
  const value = assertWittgensteinOperatorIndex(index);
  return {
    bit3: (value >> 3) & 1,
    bit2: (value >> 2) & 1,
    bit1: (value >> 1) & 1,
    bit0: value & 1
  };
}

export const W6 = (p, q) => wittgensteinOperator(6, p, q);
export const W8 = (p, q) => wittgensteinOperator(8, p, q);
export const W14 = (p, q) => wittgensteinOperator(14, p, q);

export function carryForwardGnomon(p, q, cin) {
  const P = W6(p, q);
  const G = W8(p, q);
  const sum = W6(P, cin);
  const carry = W14(G, W8(P, cin));
  return { P, G, sum, carry };
}

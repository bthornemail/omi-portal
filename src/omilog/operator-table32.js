import { BASIS32 } from './trigintaduonion-model.js';

export const OPERATOR_TABLE32_SIZE = 1024;

const SIGN_TABLE = new Int8Array(1024);

const RESULT_TABLE = new Uint8Array(1024);

export function initOperatorTables() {
  for (let a = 0; a < 32; a++) {
    for (let b = 0; b < 32; b++) {
      const idx = a * 32 + b;
      if (a === 0 || b === 0) {
        SIGN_TABLE[idx] = 1;
        RESULT_TABLE[idx] = a === 0 ? b : a;
      } else if (a === b) {
        SIGN_TABLE[idx] = -1;
        RESULT_TABLE[idx] = 0;
      } else {
        const pair = a < b ? (a << 5) | b : (b << 5) | a;
        const orderSensitive = (a % 4 === 1 || b % 4 === 1);
        SIGN_TABLE[idx] = orderSensitive ? -1 : 1;
        RESULT_TABLE[idx] = (a ^ b) % 32;
      }
    }
  }
}

export function operatorProduct32(a, b) {
  if (a < 0 || a > 31 || b < 0 || b > 31) return null;
  return { result: RESULT_TABLE[a * 32 + b], sign: SIGN_TABLE[a * 32 + b] };
}

export function operatorSign32(a, b) {
  if (a < 0 || a > 31 || b < 0 || b > 31) return null;
  return SIGN_TABLE[a * 32 + b];
}

export function operatorResult32(a, b) {
  if (a < 0 || a > 31 || b < 0 || b > 31) return null;
  return RESULT_TABLE[a * 32 + b];
}

export function isOperatorOrderSensitive(a, b) {
  if (a < 0 || a > 31 || b < 0 || b > 31) return null;
  const fwd = operatorProduct32(a, b);
  const rev = operatorProduct32(b, a);
  if (!fwd || !rev) return null;
  return fwd.result !== rev.result || fwd.sign !== rev.sign;
}

initOperatorTables();

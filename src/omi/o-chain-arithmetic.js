const WORD_BITS = 256n;
const WORD_MAX = (1n << WORD_BITS) - 1n;

function align(a, b) {
  const A = Array.isArray(a) ? [...a] : [BigInt(a)];
  const B = Array.isArray(b) ? [...b] : [BigInt(b)];
  const len = Math.max(A.length, B.length);
  const offA = len - A.length;
  const offB = len - B.length;
  for (let i = 0; i < offA; i++) A.unshift(0n);
  for (let i = 0; i < offB; i++) B.unshift(0n);
  return { A, B, len };
}

export function compareWords(a, b) {
  const { A, B, len } = align(a, b);
  for (let i = 0; i < len; i++) {
    const diff = A[i] - B[i];
    if (diff > 0n) return 1;
    if (diff < 0n) return -1;
  }
  return 0;
}

export function addWords(a, b) {
  const { A, B, len } = align(a, b);
  const result = new Array(len);
  let carry = 0n;
  for (let i = len - 1; i >= 0; i--) {
    const total = A[i] + B[i] + carry;
    result[i] = total & WORD_MAX;
    carry = total >> WORD_BITS;
  }
  if (carry > 0n) {
    result.unshift(carry);
  }
  return result;
}

export function subtractWords(a, b) {
  const { A, B, len } = align(a, b);
  const result = new Array(len);
  let borrow = 0n;
  for (let i = len - 1; i >= 0; i--) {
    let diff = A[i] - B[i] - borrow;
    if (diff < 0n) {
      borrow = 1n;
      diff += WORD_MAX + 1n;
    } else {
      borrow = 0n;
    }
    result[i] = diff & WORD_MAX;
  }
  const negative = borrow > 0n;
  return { value: trimWords(result), negative };
}

export function trimWords(words) {
  const arr = Array.isArray(words) ? words : [BigInt(words)];
  let i = 0;
  while (i < arr.length - 1 && BigInt(arr[i]) === 0n) {
    i++;
  }
  return i === 0 ? arr : arr.slice(i);
}

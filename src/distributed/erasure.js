const GF256_PRIMITIVE = 0x11d;

const GF_LOG = new Uint8Array(256);
const GF_ALOG = new Uint8Array(256);

(function initGF() {
  let v = 1;
  for (let i = 0; i < 255; i++) {
    GF_ALOG[i] = v;
    GF_LOG[v] = i;
    v <<= 1;
    if (v & 0x100) v ^= GF256_PRIMITIVE;
  }
  GF_ALOG[255] = GF_ALOG[0];
  GF_LOG[0] = 0;
})();

export function gfAdd(a, b) { return a ^ b; }

export function gfSub(a, b) { return a ^ b; }

export function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_ALOG[(GF_LOG[a] + GF_LOG[b]) % 255];
}

export function gfDiv(a, b) {
  if (b === 0) throw new RangeError("GF(2^8) division by zero");
  if (a === 0) return 0;
  return GF_ALOG[(GF_LOG[a] - GF_LOG[b] + 255) % 255];
}

export function gfInv(a) {
  if (a === 0) throw new RangeError("GF(2^8) inverse of zero");
  return GF_ALOG[(255 - GF_LOG[a]) % 255];
}

function gfMatrixMulRows(matrix, vector) {
  return matrix.map((row) => row.reduce((acc, c, j) => acc ^ gfMul(c, vector[j]), 0));
}

function gfGaussianElimination(matrix) {
  const n = matrix.length;
  const m = matrix[0].length;
  const aug = matrix.map((row, i) => {
    const r = row.slice();
    for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
    return r;
  });
  for (let col = 0; col < n; col++) {
    let pivot = -1;
    for (let row = col; row < n; row++) {
      if (aug[row][col] !== 0) { pivot = row; break; }
    }
    if (pivot < 0) throw new Error("Singular matrix in GF(2^8) Gaussian elimination");
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const invPivot = gfInv(aug[col][col]);
    for (let j = col; j < m + n; j++) aug[col][j] = gfMul(aug[col][j], invPivot);
    for (let row = 0; row < n; row++) {
      if (row !== col && aug[row][col] !== 0) {
        const factor = aug[row][col];
        for (let j = col; j < m + n; j++) aug[row][j] ^= gfMul(factor, aug[col][j]);
      }
    }
  }
  return aug.map((row) => row.slice(n));
}

function makeVandermondeMatrix(k, n) {
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix.push(new Array(k).fill(0).map((_, j) => GF_ALOG[(i * j) % 255]));
  }
  return matrix;
}

export function rsEncode(data, k, n) {
  if (k > n) throw new RangeError(`RS require k <= n, got k=${k} n=${n}`);
  if (n > 255) throw new RangeError(`RS n must be <= 255, got ${n}`);
  if (data.length % k !== 0) throw new RangeError(`Data length ${data.length} must be divisible by k=${k}`);
  const blockLen = data.length / k;
  const dataBlocks = [];
  for (let i = 0; i < k; i++) {
    dataBlocks.push(data.slice(i * blockLen, (i + 1) * blockLen));
  }
  const generator = makeVandermondeMatrix(k, n);
  const fragments = [];
  for (let i = 0; i < n; i++) {
    const genRow = generator[i];
    const frag = new Uint8Array(blockLen);
    for (let b = 0; b < blockLen; b++) {
      const col = dataBlocks.map((block) => block[b]);
      frag[b] = gfMatrixMulRows([genRow], col)[0];
    }
    fragments.push(frag);
  }
  return fragments;
}

export function rsDecode(fragments, indices, k, n) {
  if (fragments.length < k) throw new RangeError(`RS decode requires >= k=${k} fragments, got ${fragments.length}`);
  if (indices.length !== fragments.length) throw new RangeError("Fragments and indices must have same length");
  const selected = indices.slice(0, k);
  const selectedFrags = fragments.slice(0, k);
  const generator = makeVandermondeMatrix(k, n);
  const subMatrix = selected.map((idx) => generator[idx].slice());
  const invMatrix = gfGaussianElimination(subMatrix);
  const blockLen = selectedFrags[0].length;
  const result = new Uint8Array(k * blockLen);
  for (let i = 0; i < k; i++) {
    const row = invMatrix[i];
    for (let b = 0; b < blockLen; b++) {
      let sum = 0;
      for (let j = 0; j < k; j++) sum ^= gfMul(row[j], selectedFrags[j][b]);
      result[i * blockLen + b] = sum;
    }
  }
  return result;
}

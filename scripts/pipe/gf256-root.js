#!/usr/bin/env node

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (value && !value.startsWith("--")) {
      args[key] = value;
      i++;
    } else {
      args[key] = "true";
    }
  }
  return args;
}

function gf256Mul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1d;
    b >>= 1;
  }
  return p & 0xff;
}

function gf256Pow(a, e) {
  let out = 1;
  while (e) {
    if (e & 1) out = gf256Mul(out, a);
    a = gf256Mul(a, a);
    e >>= 1;
  }
  return out;
}

function gf256Inv(a) {
  if (a === 0) return 0;
  return gf256Pow(a, 254);
}

function gf256Div(a, b) {
  if (b === 0) throw new Error("gf256-zero-denominator");
  return gf256Mul(a, gf256Inv(b));
}

function parseSubset(input) {
  if (!input) throw new Error("missing subset");
  return input.split(",").filter(Boolean).map((part) => {
    if (!/^\d+$/.test(part)) throw new Error(`bad subset index: ${part}`);
    return Number(part);
  });
}

function parseFrags(input) {
  if (!input) throw new Error("missing frags");
  const roots = new Map();
  for (const entry of input.split(",")) {
    const [idxText, rootText] = entry.split(":");
    if (!/^\d+$/.test(idxText || "")) throw new Error(`bad frag index: ${entry}`);
    if (!/^[0-9a-fA-F]{1,8}$/.test(rootText || "")) throw new Error(`bad frag root: ${entry}`);
    const idx = Number(idxText);
    if (roots.has(idx)) throw new Error(`duplicate frag index: ${idx}`);
    roots.set(idx, Number.parseInt(rootText, 16) & 0xffff);
  }
  return roots;
}

function lagrangeEval0Byte(indices, values, k) {
  let acc = 0;
  for (let i = 0; i < k; i++) {
    const xi = indices[i] + 1;
    const yi = values[i];
    let num = 1;
    let den = 1;
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const xj = indices[j] + 1;
      const diff = xi ^ xj;
      if (diff === 0) throw new Error("gf256-zero-denominator");
      num = gf256Mul(num, xj);
      den = gf256Mul(den, diff);
    }
    acc ^= gf256Mul(yi, gf256Div(num, den));
  }
  return acc & 0xff;
}

function replayRoot16({ k, subset, frags }) {
  const basis = subset.slice(0, k);
  const high = [];
  const low = [];
  for (const idx of basis) {
    if (!frags.has(idx)) throw new Error(`missing frag for subset index: ${idx}`);
    const root = frags.get(idx);
    high.push((root >> 8) & 0xff);
    low.push(root & 0xff);
  }
  const replayHigh = lagrangeEval0Byte(basis, high, k);
  const replayLow = lagrangeEval0Byte(basis, low, k);
  return (replayHigh << 8) | replayLow;
}

const args = parseArgs(process.argv.slice(2));
const k = Number(args.k);
if (!Number.isInteger(k) || k <= 0) {
  throw new Error("--k must be a positive integer");
}
const subset = parseSubset(args.subset);
const frags = parseFrags(args.frags);
const root = replayRoot16({ k, subset, frags });
console.log(`candidate-root=0x${root.toString(16).padStart(4, "0")}`);

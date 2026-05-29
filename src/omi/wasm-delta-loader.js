import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let wasmExportsCache = null;
let wasmMemory = null;
let initialized = false;

function getExports() {
  if (!wasmExportsCache) throw new Error('WASM not loaded. Call initWasm() first.');
  return wasmExportsCache;
}

export async function initWasm(wasmPath) {
  if (initialized) return getExports();

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const path = wasmPath || join(__dirname, 'delta-orbital-lexer.wasm');
  const bytes = readFileSync(path);
  const mod = await WebAssembly.compile(bytes);

  wasmMemory = new WebAssembly.Memory({ initial: 1 });
  const memoryBase = 1024;
  const env = { memory: wasmMemory, __memory_base: memoryBase };

  const instance = await WebAssembly.instantiate(mod, { env });
  wasmExportsCache = instance.exports;

  if (typeof wasmExportsCache.__wasm_call_ctors === 'function') {
    wasmExportsCache.__wasm_call_ctors();
  }

  initialized = true;
  return wasmExportsCache;
}

export function isWasmLoaded() {
  return initialized;
}

export function getWasmMemory() {
  if (!wasmMemory) throw new Error('WASM not loaded');
  return wasmMemory;
}

export function w_deltaC(x, C = 0x5A3C) {
  return getExports().deltaC(x & 0xFFFF, C & 0xFFFF) >>> 0;
}

export function w_fanoTruthResolver(LL, NN, MM) {
  return getExports().fanoTruthResolver(LL & 0xFF, NN & 0xFFFF, MM & 0xFFFF);
}

export function w_makeGenesisTarget(LL, NN) {
  return getExports().makeGenesisTarget(LL & 0xFF, NN & 0xFFFF) >>> 0;
}

function writeSegmentsToHeap(S, ptr) {
  const heap = new Uint16Array(getWasmMemory().buffer);
  for (let i = 0; i < 8; i++) heap[(ptr >> 1) + i] = S[i];
}

export function w_verifyOrbitLexer(S) {
  if (S.length < 8) return -1;
  const ptr = 16;
  writeSegmentsToHeap(S, ptr);
  return getExports().verifyOrbitLexer(ptr);
}

export function w_verifyOrbitLexerQuadratic(S) {
  if (S.length < 8) return -1;
  const ptr = 16;
  writeSegmentsToHeap(S, ptr);
  return getExports().verifyOrbitLexerQuadratic(ptr);
}

export function w_generateDeltaCOrbit(start, C, maxLen = 16) {
  const ex = getExports();
  const heap = new Uint16Array(getWasmMemory().buffer);
  const ptr = 1024;
  const len = ex.generateDeltaCOrbit(start & 0xFFFF, C & 0xFFFF, ptr, maxLen);
  const out = [];
  for (let i = 0; i < len; i++) out.push(heap[(ptr >> 1) + i] >>> 0);
  return out;
}

export function w_fanoIntercept(a, b, C = 0x5A3C) {
  return getExports().fanoIntercept(a & 0xFFFF, b & 0xFFFF, C & 0xFFFF);
}

export function w_fanoIntersectionPoint(LL1, LL2) {
  return getExports().fanoIntersectionPoint(LL1 & 0xFF, LL2 & 0xFF);
}

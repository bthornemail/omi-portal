import { createPolytopeBuffer, registerTick, polytopeWindow, tickFactorials } from "./polytope-sab.js";

export const SMITH_MATRIX_SLOTS = 5040;

const TWO_PI = Math.PI * 2;
const I32_MAX = 0x7fffffff;

function atomicLoad(view, index) {
  return view.buffer instanceof SharedArrayBuffer ? Atomics.load(view, index) : view[index];
}

function atomicStore(view, index, value) {
  if (view.buffer instanceof SharedArrayBuffer) Atomics.store(view, index, value);
  else view[index] = value;
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (const char of String(input)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function complexDiv(a, b) {
  const denom = b.re * b.re + b.im * b.im || Number.EPSILON;
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom
  };
}

export function createSmithMatrix({ shared = true } = {}) {
  const BufferType = shared && typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : ArrayBuffer;
  return new Int32Array(new BufferType(SMITH_MATRIX_SLOTS * Int32Array.BYTES_PER_ELEMENT));
}

export function storeSmithTick(matrix, tick) {
  atomicStore(matrix, 0, Number(tick) | 0);
}

export function loadSmithTick(matrix) {
  return atomicLoad(matrix, 0) >>> 0;
}

export function writeCanvasGraphToSmithMatrix(matrix, canvas, tick = 0) {
  if (matrix.length < SMITH_MATRIX_SLOTS) {
    throw new RangeError(`Smith matrix must expose ${SMITH_MATRIX_SLOTS} slots`);
  }

  storeSmithTick(matrix, tick);

  const nodes = Array.isArray(canvas?.nodes) ? canvas.nodes : [];
  const edges = Array.isArray(canvas?.edges) ? canvas.edges : [];
  const nodeDegree = new Map();

  for (const edge of edges) {
    nodeDegree.set(edge.fromNode, (nodeDegree.get(edge.fromNode) || 0) + 1);
    nodeDegree.set(edge.toNode, (nodeDegree.get(edge.toNode) || 0) + 1);
  }

  for (let i = 1; i < matrix.length; i++) {
    const node = nodes[(i - 1) % Math.max(nodes.length, 1)];
    const edge = edges[(i - 1) % Math.max(edges.length, 1)];
    const degree = node ? nodeDegree.get(node.id) || 0 : 0;
    const payload = node
      ? `${node.id}:${node.type}:${node.color || ""}:${degree}:${edge?.fromSide || ""}:${edge?.toSide || ""}`
      : `empty:${i}`;
    const hash = fnv1a32(payload);
    atomicStore(matrix, i, (hash ^ (degree << 24) ^ i) & I32_MAX);
  }

  return matrix;
}

export function smithPointForSlot(matrix, slot, tick = loadSmithTick(matrix)) {
  const boundedSlot = ((slot % SMITH_MATRIX_SLOTS) + SMITH_MATRIX_SLOTS) % SMITH_MATRIX_SLOTS;
  const raw = atomicLoad(matrix, boundedSlot) >>> 0;
  const phaseJitter = ((raw & 0xff) / 255 - 0.5) * (TWO_PI / SMITH_MATRIX_SLOTS);
  const theta = (boundedSlot / SMITH_MATRIX_SLOTS) * TWO_PI + phaseJitter;
  const magnitudeBits = (raw >>> 8) & 0xffff;
  const magnitude = 0.08 + (magnitudeBits / 0xffff) * 0.86;
  const pulse = boundedSlot === tick % SMITH_MATRIX_SLOTS ? 0.035 : 0;
  const radius = Math.min(0.98, magnitude + pulse);

  const gamma = {
    re: radius * Math.cos(theta),
    im: radius * Math.sin(theta)
  };

  const z = complexDiv(
    { re: 1 + gamma.re, im: gamma.im },
    { re: 1 - gamma.re, im: -gamma.im }
  );
  const y = complexDiv(
    { re: 1 - gamma.re, im: -gamma.im },
    { re: 1 + gamma.re, im: gamma.im }
  );

  return {
    slot: boundedSlot,
    raw,
    theta,
    gamma,
    gammaY: { re: -gamma.re, im: -gamma.im },
    z,
    y
  };
}

export function activeSmithState(matrix) {
  const tick = loadSmithTick(matrix);
  const slot = tick % SMITH_MATRIX_SLOTS;
  const pt = smithPointForSlot(matrix, slot, tick);
  return {
    tick,
    slot,
    point: pt,
    polytope: tickFactorials(tick)
  };
}

export function createSmithMatrixFloat({ shared = true } = {}) {
  return createPolytopeBuffer({ shared });
}

export function storePolytopeTick(matrix, tick) {
  return registerTick(matrix, tick);
}

export function polytopeWindows() {
  return {
    edges: polytopeWindow(new Float64Array(5040), 720),
    vertices: polytopeWindow(new Float64Array(5040), 120),
    cells: polytopeWindow(new Float64Array(5040), 24),
    frames: polytopeWindow(new Float64Array(5040), 6)
  };
}

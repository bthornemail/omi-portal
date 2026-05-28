export const POLYTOPE_SLOTS = 5040;
export const BYTES_PER_SLOT = 8;

export const FACTORIAL_STRIDES = Object.freeze({
  720: { fact: "6!", name: "600-cell-120-cell", vertices720: 720 },
  120: { fact: "5!", name: "120-vertex", vertices: 120 },
   24: { fact: "4!", name: "24-cell", vertices: 24 },
    6: { fact: "3!", name: "octahedron", vertices: 6 },
    2: { fact: "2!", name: "edge-dipole", vertices: 2 }
});

export const POLYTOPE_MAP = Object.freeze({
  "600-cell":  { stride: 720, sub: 120, vertices: 120, edges: 720, faces: 1200, cells: 600 },
  "120-cell":  { stride: 720, sub: 120, vertices: 600, edges: 1200, faces: 720, cells: 120 },
  "24-cell":   { stride: 24, sub: 6, vertices: 24, edges: 96, faces: 96, cells: 24 },
  "16-cell":   { stride: 24, sub: 6, vertices: 8, edges: 24, faces: 32, cells: 16 },
  "tesseract": { stride: 24, sub: 6, vertices: 16, edges: 32, faces: 24, cells: 8 }
});

export function createPolytopeBuffer({ shared = true } = {}) {
  const BufferType = shared && typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : ArrayBuffer;
  return new Float64Array(new BufferType(POLYTOPE_SLOTS * BYTES_PER_SLOT));
}

export function pack4D(x, y, z, w) {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setInt16(0, clamp16(x), true);
  view.setInt16(2, clamp16(y), true);
  view.setInt16(4, clamp16(z), true);
  view.setInt16(6, clamp16(w), true);
  return view.getFloat64(0, true);
}

export function unpack4D(value) {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setFloat64(0, value, true);
  const view = new DataView(buf);
  return {
    x: view.getInt16(0, true),
    y: view.getInt16(2, true),
    z: view.getInt16(4, true),
    w: view.getInt16(6, true)
  };
}

function clamp16(v) {
  return Math.max(-32768, Math.min(32767, Math.round(v)));
}

export function factorialStride(n) {
  if (n < 0 || n > 7) throw new RangeError(`Factorial stride n must be 0..7, got ${n}`);
  const strides = [1, 1, 2, 6, 24, 120, 720, 5040];
  return strides[n];
}

export function tickFactorials(tick) {
  const t = ((tick % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
  return {
    tick: t,
    page6: Math.floor(t / 720),
    remainder720: t % 720,
    block5: Math.floor((t % 720) / 120),
    remainder120: t % 120,
    cell4: Math.floor((t % 120) / 24),
    remainder24: t % 24,
    frame3: Math.floor((t % 24) / 6),
    remainder6: t % 6,
    edge2: Math.floor((t % 6) / 2),
    remainder2: t % 2
  };
}

export function polytopeWindow(buffer, stride) {
  const count = POLYTOPE_SLOTS / stride;
  return {
    count,
    stride,
    read(slotIndex, offset = 0) {
      const idx = (slotIndex % count) * stride + (offset % stride);
      return buffer[idx];
    },
    write(slotIndex, offset, value) {
      const idx = (slotIndex % count) * stride + (offset % stride);
      buffer[idx] = value;
    },
    slice(slotIndex) {
      const start = (slotIndex % count) * stride;
      return buffer.subarray(start, start + stride);
    },
    fill(slotIndex, values) {
      const start = (slotIndex % count) * stride;
      const len = Math.min(values.length, stride);
      for (let i = 0; i < len; i++) buffer[start + i] = values[i];
    }
  };
}

export function registerTick(clock, tick) {
  const t = ((tick % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
  clock[0] = t;
  return t;
}

export function readTick(clock) {
  return clock[0];
}

export function storeTickValue(clock, tick, value) {
  const t = ((tick % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
  clock[t] = value;
  return t;
}

export function readTickValue(clock, tick) {
  const t = ((tick % POLYTOPE_SLOTS) + POLYTOPE_SLOTS) % POLYTOPE_SLOTS;
  return clock[t];
}

export class OmiPolytopeFactorialBuffer {
  constructor(preAllocatedSAB = null) {
    const SAB = typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : ArrayBuffer;
    const buf = preAllocatedSAB || new SAB(POLYTOPE_SLOTS * BYTES_PER_SLOT);
    this.sab = buf;
    this.view = new Float64Array(buf);
    this.FACTORIAL_STRIDES = FACTORIAL_STRIDES;
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

  resolveFactorialAddress(absoluteTick) {
    const f = tickFactorials(Number(absoluteTick));
    return {
      absoluteIndex: f.tick,
      hierarchy: {
        page720: f.page6,
        block120: f.block5,
        cell24: f.cell4,
        frame6: f.frame3,
        element2: f.edge2
      },
      tokenMnemonic: `page${f.page6}-block${f.block5}-cell${f.cell4}-frame${f.frame3}-edge${f.edge2}-slot${f.tick}`
    };
  }

  writeCoordinateToSlot(absoluteSlotIndex, float64Value) {
    if (absoluteSlotIndex < 0 || absoluteSlotIndex >= POLYTOPE_SLOTS) return false;
    this.view[absoluteSlotIndex] = float64Value;
    return true;
  }

  readCoordinateFromSlot(absoluteSlotIndex) {
    if (absoluteSlotIndex < 0 || absoluteSlotIndex >= POLYTOPE_SLOTS) return 0.0;
    return this.view[absoluteSlotIndex];
  }

  evaluateGCLifecycle(currentTick, domCleanupCallback) {
    const t = Number(currentTick) % POLYTOPE_SLOTS;
    if (t > 0 && t % 720 === 0) {
      if (domCleanupCallback) domCleanupCallback("720_SWEEP", t);
    }
    if (Number(currentTick) > 0 && Number(currentTick) % POLYTOPE_SLOTS === 0) {
      for (let i = 0; i < POLYTOPE_SLOTS; i++) this.view[i] = 0.0;
      if (domCleanupCallback) domCleanupCallback("5040_RESET", 0);
    }
  }
}

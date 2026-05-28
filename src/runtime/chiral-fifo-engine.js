const CANONICAL_ROOT = "omi-ffff-127-0-0-1";

export class OmiChiralFifoEngine {
  constructor(sharedArrayBuffer) {
    if (!sharedArrayBuffer || sharedArrayBuffer.byteLength < 5040 * 8) {
      throw new TypeError("OmiChiralFifoEngine requires a SharedArrayBuffer of at least 40320 bytes");
    }
    this.sab = sharedArrayBuffer;
    this.view = new DataView(this.sab);
    this.PIPE_PATH_LEFT = "/tmp/omi-bus/chiral_left.fifo";
    this.PIPE_PATH_RIGHT = "/tmp/omi-bus/chiral_right.fifo";
    this.fs = null;
    this.execSync = null;
    this.initNamedPipes();
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

  async initNamedPipes() {
    const cp = globalThis.process?.versions?.node;
    if (!cp) return;
    try {
      const { existsSync } = await import("node:fs");
      const { execSync } = await import("node:child_process");
      const dir = "/tmp/omi-bus";
      if (!existsSync(dir)) {
        execSync(`mkdir -p ${dir}`);
      }
      for (const path of [this.PIPE_PATH_LEFT, this.PIPE_PATH_RIGHT]) {
        if (!existsSync(path)) {
          execSync(`mkfifo ${path}`);
        }
      }
    } catch {
      // FIFOs may fail in non-POSIX or sandboxed environments
    }
  }

  static construct(sharedArrayBuffer) {
    const engine = new OmiChiralFifoEngine(sharedArrayBuffer);
    engine.initNamedPipes().catch(() => {});
    return engine;
  }

  processAnalogFFTChunk(targetSlotIndex, frequencyDataArray, isLeftChiral = true) {
    if (targetSlotIndex < 0 || targetSlotIndex >= 5040) return null;

    const baseOffset = targetSlotIndex * 8;
    let accumulatedPhaseEnergy = 0.0;
    for (let i = 0; i < Math.min(frequencyDataArray.length, 4); i++) {
      accumulatedPhaseEnergy += frequencyDataArray[i] * Math.sin((i + 1) * Math.PI / 4);
    }

    const finalChiralValue = isLeftChiral ? -accumulatedPhaseEnergy : accumulatedPhaseEnergy;
    this.view.setFloat64(baseOffset, finalChiralValue, true);

    const opHex = isLeftChiral ? "0x02" : "0x04";
    const shapeTag = isLeftChiral ? "archimedean-snub" : "catalan-dual";
    const id = `${CANONICAL_ROOT}-${opHex}-${shapeTag}-slot${targetSlotIndex}`;

    return this.cons(
      { id, targetSlotIndex, isLeftChiral, timestamp: Date.now() },
      new Float64Array([finalChiralValue])
    );
  }

  readSlot(index) {
    if (index < 0 || index >= 5040) return null;
    return this.view.getFloat64(index * 8, true);
  }
}

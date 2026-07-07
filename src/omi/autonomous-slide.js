/**
 * OMI Autonomous Slide
 * ---------------------------------------------------------------------------
 * Deterministic bitwise cell mutation engine. It keeps the execution surface
 * local to one OmiCell, reads address material as paired 16-bit words, and
 * emits replayable QED telemetry for every non-zero delta.
 */

export const OMI_SLIDE_FOLD_CONST = 0x30000020;

export const OMI_SLIDE_PORTS = Object.freeze({
  STDIN: 0,
  STDOUT: 1,
  STDERR: 2,
  RPMB: 3
});

export function rotl32(x, r) {
  const shift = r & 31;
  return (((x >>> 0) << shift) | ((x >>> 0) >>> ((32 - shift) & 31))) >>> 0;
}

export function rotr32(x, r) {
  const shift = r & 31;
  return (((x >>> 0) >>> shift) | ((x >>> 0) << ((32 - shift) & 31))) >>> 0;
}

export function ringMask(ring) {
  switch ((ring >>> 0) & 3) {
    case 0:
      return 0x0000000f;
    case 1:
      return 0x000000ff;
    case 2:
      return 0x0000ffff;
    default:
      return 0xffffffff;
  }
}

export function add4Forward(a, b) {
  let out = 0;
  let carry = 0;

  for (let k = 0; k < 8; k++) {
    const an = ((a >>> 0) >>> (k * 4)) & 0x0f;
    const bn = ((b >>> 0) >>> (k * 4)) & 0x0f;
    let sn = 0;

    for (let i = 0; i < 4; i++) {
      const ai = (an >>> i) & 1;
      const bi = (bn >>> i) & 1;
      const s = ai ^ bi ^ carry;

      carry = (ai & bi) | (carry & (ai ^ bi));
      sn |= s << i;
    }

    out = (out | (sn << (k * 4))) >>> 0;
  }

  return { out: out >>> 0, carry: carry >>> 0 };
}

export function gamma32(rt, lambda, beta, omega, foldConst = OMI_SLIDE_FOLD_CONST) {
  const { out: c, carry } = add4Forward(omega >>> 0, foldConst >>> 0);
  const result = (
    rotl32(rt, 1) ^
    rotl32(lambda, 3) ^
    rotr32(beta, 2) ^
    c
  ) >>> 0;

  return { result, carry };
}

export function makeOmiCell(slot, port, pipe, ring, oldWord = 0) {
  return {
    slot: slot >>> 0,
    port: port >>> 0,
    pipe: pipe >>> 0,
    ring: ring >>> 0,
    mask: ringMask(ring),
    oldWord: oldWord >>> 0,
    newWord: 0,
    delta: 0,
    carry: 0,
    surrogate: 0,
    suboptimal: 0
  };
}

export function stepOmiCell(cell, rt, lambda, beta, omega, options = {}) {
  const nextCell = { ...cell };
  const mask = ringMask(nextCell.ring);
  const { result: rawNext, carry } = gamma32(rt, lambda, beta, omega, options.foldConst);
  const next = (rawNext & mask) >>> 0;
  const old = (nextCell.oldWord & mask) >>> 0;
  const delta = (old ^ next) >>> 0;

  nextCell.mask = mask;
  nextCell.newWord = next;
  nextCell.delta = delta;
  nextCell.carry = carry;
  nextCell.surrogate = carry !== 0 ? 1 : 0;
  nextCell.suboptimal = (rawNext & (~mask >>> 0)) !== 0 ? 1 : 0;

  if (delta !== 0) {
    nextCell.oldWord = next;
  }

  return nextCell;
}

export function formatHex32(value) {
  return (value >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

export function formatSlideTelemetry(cell) {
  const oldWordBeforeMutation = (cell.oldWord ^ cell.delta) >>> 0;

  return `QED slot=${cell.slot >>> 0}` +
    ` port=${cell.port >>> 0}` +
    ` pipe=${cell.pipe >>> 0}` +
    ` ring=${cell.ring >>> 0}` +
    ` mask=0x${formatHex32(cell.mask)}` +
    ` old=0x${formatHex32(oldWordBeforeMutation)}` +
    ` new=0x${formatHex32(cell.newWord)}` +
    ` delta=0x${formatHex32(cell.delta)}` +
    ` carry=${cell.carry >>> 0}` +
    ` surrogate=${cell.surrogate >>> 0}` +
    ` suboptimal=${cell.suboptimal >>> 0}`;
}

export function emitSlideTelemetry(cell) {
  return cell.delta === 0 ? null : formatSlideTelemetry(cell);
}

export function runSlideTick(cells, inputsForCell, options = {}) {
  return cells.map((cell, index) => {
    const input = inputsForCell(cell, index);
    return stepOmiCell(
      cell,
      input.rt >>> 0,
      input.lambda >>> 0,
      input.beta >>> 0,
      input.omega >>> 0,
      options
    );
  });
}

export class AutonomousSlideEngine {
  static FOLD_CONST = OMI_SLIDE_FOLD_CONST;

  static rotl32(x, r) {
    return rotl32(x, r);
  }

  static rotr32(x, r) {
    return rotr32(x, r);
  }

  static getRingMask(ring) {
    return ringMask(ring);
  }

  static add4Forward(a, b) {
    return add4Forward(a, b);
  }

  static gamma32(rt, lambda, beta, omega) {
    return gamma32(rt, lambda, beta, omega);
  }

  static makeCell(slot, port, pipe, ring) {
    return makeOmiCell(slot, port, pipe, ring);
  }

  static stepCell(cell, rt, lambda, beta, omega) {
    return stepOmiCell(cell, rt, lambda, beta, omega);
  }

  static formatTelemetry(cell) {
    return formatSlideTelemetry(cell);
  }
}

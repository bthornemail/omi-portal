import { unpackOWord, oWordToHex } from "./o-bitboard.js";
import { QuquartMachine, InterpretiveState } from "./ququart-machine.js";

export function projectRegister(oWord, { notationMask, activeReading } = {}) {
  const source = BigInt(oWord);
  return {
    source,
    notationMask: notationMask != null ? BigInt(notationMask) : source,
    activeReading: activeReading != null ? BigInt(activeReading) : 0n,
    receipt: null,
  };
}

export function projectToOMI(oWord, options = {}) {
  const { selector, path } = unpackOWord(oWord);
  const reg = projectRegister(oWord, options);
  const prefix = selector === 0 ? "omi" : "imo";

  const output = `${prefix}---imo / ${InterpretiveState.Source} / path:0x${path.toString(16).padStart(5, "0")} / ${QuquartMachine.formatKetBoundary(reg)}`;
  return output;
}

export function projectToIMO(oWord, options = {}) {
  const { selector, path } = unpackOWord(oWord);
  const reading = options.activeReading != null ? BigInt(options.activeReading) : BigInt(path);
  const reg = projectRegister(oWord, { ...options, activeReading: reading });
  const prefix = selector === 0 ? "imo" : "omi";

  const output = `${prefix}---omi / ${InterpretiveState.Reading} / path:0x${path.toString(16).padStart(5, "0")} / ${QuquartMachine.formatKetBoundary(reg)}`;
  return output;
}

export function projectReadable(oWord, options = {}) {
  return {
    omi: projectToOMI(oWord, options),
    imo: projectToIMO(oWord, options),
    register: projectRegister(oWord, options),
  };
}

export function projectWithReceipt(oWord, notationMask, operator) {
  const reg = projectRegister(oWord, { notationMask });
  const { first, isStable } = QuquartMachine.evaluateReceiptReplayStability(
    reg.source, reg.notationMask, reg.activeReading, operator
  );
  const receipt = isStable ? first : null;
  return { reg, receipt, isStable, readable: projectReadable(oWord, { notationMask }) };
}

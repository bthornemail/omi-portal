import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

export const OCTUPLE_EXPONENT_BIAS = 262143;

export class OmiOctuplePrecisionKernel {
  constructor(globalTimelineSAB) {
    if (!globalTimelineSAB) throw new Error("[Omi Octuple] Missing global timeline SAB.");
    this.timelineArray = new BigInt64Array(globalTimelineSAB);
  }

  decodeOctuplePrecisionWord(S_High, S_Low) {
    if (!S_High || !S_Low || !isOrbitLexerValid(S_High) || !isOrbitLexerValid(S_Low)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowHigh = extractTruthRow(S_High);

    const rawWordHigh = Number(rowHigh.NN) & 0xFFFF;
    const signBit = (rawWordHigh >> 15) & 0x01;
    const alphaHexChannel = signBit === 0 ? "ff" : "33";

    const upperExponentBits = (rawWordHigh & 0x7FFF);
    const lowerExponentBits = (Number(rowHigh.MM) >> 12) & 0x0F;
    const totalBiasedExponent = (upperExponentBits << 4) | lowerExponentBits;

    const trueExponentValue = totalBiasedExponent - OCTUPLE_EXPONENT_BIAS;

    const rowLow = extractTruthRow(S_Low);
    const baseSignificandWord = Number(rowLow.NN) & 0xFFFF;

    let targetPresetColorCode = "5";

    if (totalBiasedExponent === 0x7FFFF) {
      targetPresetColorCode = "1";
    } else if (totalBiasedExponent === 0) {
      targetPresetColorCode = "6";
    }

    const timelineSlot = baseSignificandWord % 5040;
    const hueAngleDegrees = (timelineSlot * 360) / 5040;

    return {
      accepted: true,
      signBit,
      alphaHexChannel,
      totalBiasedExponent,
      trueExponentValue,
      targetPresetColorCode,
      timelineSlot,
      hueAngleDegrees
    };
  }
}

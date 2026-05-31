import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const IEEE754_BINARY256_EXP_BIAS = 262143;

export class OmiBitSliceAluKernel {
  constructor() {
    this.bitSliceRegisterMap = new BigUint64Array(16);
  }

  evaluateCipherSlice(S, sliceIndex, raw128BitSliceUpper, raw128BitSliceLower) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const idx = sliceIndex & 0x07;
    const hi = BigInt(raw128BitSliceUpper);
    const lo = BigInt(raw128BitSliceLower);

    this.bitSliceRegisterMap[idx * 2]     = lo & 0xFFFFFFFFFFFFFFFFn;
    this.bitSliceRegisterMap[idx * 2 + 1] = hi & 0xFFFFFFFFFFFFFFFFn;

    let signBit = 0;
    let biasedExponent = 0;
    if (idx === 0) {
      signBit = Number((hi >> 63n) & 1n);
      biasedExponent = Number((hi >> 44n) & 0x7FFFFn);
    }

    const actualExponent = biasedExponent - IEEE754_BINARY256_EXP_BIAS;

    let canvasPresetColorId = "5";
    let bitSliceALUModelType = "STANDARD_ALU_FIELD_PASS";

    if (biasedExponent > 0 && biasedExponent < 0x7FFFF) {
      bitSliceALUModelType = "BINARY256_OVERSCALED_NORMAL_PLANE";
      canvasPresetColorId = "6";
    } else if (biasedExponent === 0x7FFFF) {
      bitSliceALUModelType = "OMI1024_CRYPTOGRAPHIC_OVERFLOW_ANOMALY";
      canvasPresetColorId = "1";
    }

    const simulatedAdderResult = computeCla4Bit(idx, signBit, 1);

    return {
      accepted: (biasedExponent !== 0x7FFFF),
      bitSliceALUModelType,
      sliceIndex: idx,
      signBit,
      biasedExponent,
      actualExponent,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(rowData.NN) % 5040
    };
  }
}

import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const NAT64_PREFIX_SEG0 = 0x0064;
export const NAT64_PREFIX_SEG1 = 0xff9b;

export class OmiNat64ComplexKernel {
  processComplexAddressNorm(S, valRealA, valImagB, valRealC, valImagD) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);

    const isNat64Aligned = (S[0] === NAT64_PREFIX_SEG0 && S[1] === NAT64_PREFIX_SEG1);

    const a = Number(valRealA) & 0xFF;
    const b = Number(valImagB) & 0xFF;
    const c = Number(valRealC) & 0xFF;
    const d = Number(valImagD) & 0xFF;

    const normA = (a * a) + (b * b);
    const normB = (c * c) + (d * d);
    const expectedProductNorm = normA * normB;

    const compositeReal = (a * c) - (b * d);
    const compositeImag = (a * d) + (b * c);
    const actualProductNorm = (compositeReal * compositeReal) + (compositeImag * compositeImag);

    const isNormMultiplicative = (expectedProductNorm === actualProductNorm);

    let canvasPresetColorId = "5";
    let complexNat64LayerModel = "STANDARD_NAT64_TRANSIT";

    if (isNormMultiplicative && actualProductNorm > 500) {
      complexNat64LayerModel = "HIGH_RESONANCE_CHAKRAVALA_CYCLE";
      canvasPresetColorId = "6";
    } else if (!isNormMultiplicative) {
      complexNat64LayerModel = "COMPOSITION_FIELD_NORM_DISCREPANCY";
      canvasPresetColorId = "1";
    } else {
      canvasPresetColorId = "4";
    }

    const simulatedAdderResult = computeCla4Bit(a & 0x0F, c & 0x0F, 1);

    return {
      accepted: isNormMultiplicative,
      complexNat64LayerModel,
      isNat64Aligned,
      normA,
      normB,
      actualProductNorm,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(rowData.NN) % 5040
    };
  }
}

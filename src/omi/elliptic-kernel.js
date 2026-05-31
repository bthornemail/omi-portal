import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const PRIME_RATIONALITY_THRESHOLD = 37;

export class OmiSupersingularEllipticKernel {
  evaluateEllipticPrime(S, targetPrimeOperand, explicitJInvariant, isExtensionField = false) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const p = Number(targetPrimeOperand);
    const jInvariant = Number(explicitJInvariant);

    const requiresExtension = (p >= PRIME_RATIONALITY_THRESHOLD);

    if (!requiresExtension && isExtensionField) {
      return { accepted: false, reason: "ILLEGAL_FIELD_EXTENSION_BELOW_PRIME_37_EVICTION" };
    }

    const baseAutomorphismCount = Math.floor(p / 12);
    const massTotalWeight = (p - 1) / 24;

    let canvasPresetColorId = "5";
    let modularReductionModel = "STANDARD_RATIONAL_REDUCTION";

    if (jInvariant === 0) {
      modularReductionModel = "CYCLIC_ORDER_6_CENTROID";
      canvasPresetColorId = "3";
    } else if (jInvariant === 1728) {
      modularReductionModel = "CYCLIC_ORDER_4_CENTROID";
      canvasPresetColorId = "6";
    } else if (requiresExtension && isExtensionField) {
      modularReductionModel = "QUADRATIC_EXTENSION_ROOT_MESH";
      canvasPresetColorId = "1";
    }

    const simulatedAdderResult = computeCla4Bit(p & 0x0F, jInvariant & 0x0F, 1);

    return {
      accepted: true,
      modularReductionModel,
      baseAutomorphismCount,
      massTotalWeight,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}

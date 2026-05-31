import { isOrbitLexerValid, extractTruthRow } from '../omi/delta-orbital-lexer.js';

export const CODE16K_MODULO_BASE = 107;

export class OmiCode16KRegisterKernel {
  decodeMultiRowFrame(S, characterArray, explicitRowCount, explicitModeId) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_SURFACE_FAULT" };
    }

    const rowData = extractTruthRow(S);

    const r = Math.max(2, Math.min(16, explicitRowCount));
    const m = Math.max(0, Math.min(6, explicitModeId));
    const packedStartingChar = 7 * (r - 2) + m;

    let c1WeightedSum = 2 * packedStartingChar;
    let c2WeightedSum = 1 * packedStartingChar;

    for (let i = 0; i < characterArray.length; i++) {
      const charValue = characterArray[i] & 0x7F;
      const positionWeightC1 = i + 2;
      const positionWeightC2 = i + 2;

      c1WeightedSum += positionWeightC1 * charValue;
      c2WeightedSum += positionWeightC2 * charValue;
    }

    const expectedC1 = c1WeightedSum % CODE16K_MODULO_BASE;
    const expectedC2 = c2WeightedSum % CODE16K_MODULO_BASE;

    let activeCodeSetModel = "UNKNOWN_TRACK";
    let canvasPresetColorId = "5";

    switch (m) {
      case 0:
        activeCodeSetModel = "INITIAL_SET_A_LEXICAL";
        canvasPresetColorId = "4";
        break;
      case 1:
        activeCodeSetModel = "INITIAL_SET_B_INFLECTIONAL";
        canvasPresetColorId = "6";
        break;
      case 2:
        activeCodeSetModel = "INITIAL_SET_C_OTHER_POINTER";
        canvasPresetColorId = "3";
        break;
      default:
        activeCodeSetModel = "IMPLIED_FNC1_OR_SHIFT";
    }

    return {
      accepted: true,
      packedStartingChar,
      activeCodeSetModel,
      expectedC1,
      expectedC2,
      canvasPresetColorId,
      timelineSlot: Number(BigInt(rowData.NN) % 5040n)
    };
  }
}

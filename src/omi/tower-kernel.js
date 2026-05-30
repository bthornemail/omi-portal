import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

export class OmiTowerPrecisionKernel {
  evaluatePrecisionTowerStep(S, targetCharacterByte) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    if (!rowData) return { accepted: false, reason: "EXTRACTION_FAILURE" };

    const charValue = targetCharacterByte & 0xFF;

    const timelineSlot = rowData.NN % 5040;
    const remainderFactor = timelineSlot % 60;

    const isRegular60Base = (60 % remainderFactor === 0) || remainderFactor === 0;

    let canvasPresetColorId = "5";
    let isAbsolutePrimeBoundary = false;

    if (remainderFactor === 59 || remainderFactor === 61) {
      isAbsolutePrimeBoundary = true;
      canvasPresetColorId = remainderFactor === 59 ? "1" : "6";
    }

    const maskedCodepointIndex = charValue & 0x7F;
    const inverseCodepointIndex = 127 - maskedCodepointIndex;

    const upscaledExponentShift = (timelineSlot << 4) | maskedCodepointIndex;

    return {
      accepted: true,
      isRegular60Base,
      isAbsolutePrimeBoundary,
      canvasPresetColorId,
      maskedCodepointIndex,
      inverseCodepointIndex,
      upscaledExponentShift,
      timelineSlot
    };
  }
}

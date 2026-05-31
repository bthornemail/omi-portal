import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const CODE_UNICODE_LOWER_OMICRON = 0x03BF;
export const CODE_UNICODE_UPPER_OMICRON = 0x039F;

export class OmiMegatronKernel {
  evaluateMegatronActivation(S, unicodeCharacterCode, absoluteWeightValue, isSigmoidMode = false) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const charCode = unicodeCharacterCode & 0xFFFF;
    const absWeight = Math.abs(Number(absoluteWeightValue));

    const isLowerOmicronChiral = (charCode === CODE_UNICODE_LOWER_OMICRON);
    const isUpperOmicronCardinal = (charCode === CODE_UNICODE_UPPER_OMICRON);

    if (!isLowerOmicronChiral && !isUpperOmicronCardinal) {
      return { accepted: false, reason: "OUTSIDE_OMICRON_CASE_BOUNDARY_EVICTION" };
    }

    let canvasPresetColorId = "5";
    let megatronActivationState = "METACIRCULAR_IDLE_ZONE";

    if (absWeight > 512) {
      megatronActivationState = "MEGATRON_DOMINANT_FIRE_STEP";
      canvasPresetColorId = "5";
    } else if (absWeight < 32 && isLowerOmicronChiral) {
      megatronActivationState = "CHIRAL_INHIBITED_TRACK";
      canvasPresetColorId = "1";
    } else if (isSigmoidMode) {
      megatronActivationState = "CONTINUOUS_LOGISTIC_CONFIDENCE";
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(charCode & 0x0F, absWeight & 0x0F, 1);

    return {
      accepted: true,
      megatronActivationState,
      isLowerOmicronChiral,
      isUpperOmicronCardinal,
      absWeight,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}

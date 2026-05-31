import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const HELLENISTIC_MAX_SLOT = 54;
export const OMICRON_NUMERAL_VALUE = 70;

export class OmiHellenisticAstroKernel {
  processSexagesimalFraction(S, targetValueOperand, wholeIntegerPart) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const operand = Number(targetValueOperand);
    const integerBase = Number(wholeIntegerPart);

    const isOmicronZeroActive = (operand === OMICRON_NUMERAL_VALUE);
    const derivedFractionalDigit = isOmicronZeroActive ? 0 : (operand % 60);

    const isWithinSlotLimit = (derivedFractionalDigit <= HELLENISTIC_MAX_SLOT);
    if (!isWithinSlotLimit) {
      return { accepted: false, reason: "EXCEEDS_HELLENISTIC_MAX_SLOT_EVICTION" };
    }

    let canvasPresetColorId = "5";
    let astroFractionalModel = "STANDARD_SEXAGESIMAL_TRACK";

    if (isOmicronZeroActive) {
      astroFractionalModel = "OMICRON_ZERO_PIVOT_ACTIVE";
      canvasPresetColorId = "3";
    } else if (derivedFractionalDigit === HELLENISTIC_MAX_SLOT) {
      astroFractionalModel = "HELLENISTIC_TERMINAL_SLOT_CLAMP";
      canvasPresetColorId = "6";
    }

    const simulatedAdderResult = computeCla4Bit(derivedFractionalDigit & 0x0F, integerBase & 0x0F, 1);

    return {
      accepted: true,
      astroFractionalModel,
      derivedFractionalDigit,
      isOmicronZeroActive,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}

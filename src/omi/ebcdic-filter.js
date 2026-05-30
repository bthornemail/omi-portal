import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export class OmiEbcdicCharacterFilter {
  evaluateCharacterMatrix(S, characterByteValue) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "OUTSIDE_THE_LANGUAGE_BOUNDARY_FAULT" };
    }

    const rowData = extractTruthRow(S);
    if (!rowData) return { accepted: false, reason: "EXTRACTION_FAILURE" };

    const targetByte = characterByteValue & 0xFF;

    const isStructural = (targetByte >= 0x00 && targetByte <= 0x2F);
    const isNumeric    = (targetByte >= 0x30 && targetByte <= 0x3F);

    if (!isStructural && !isNumeric) {
      return { accepted: false, reason: "OUTSIDE_OMICRON_LEXICON_EVOCATION" };
    }

    const derivedIntegerCode = isNumeric ? (targetByte - 0x30) : 0;

    let canvasPresetColorId = "5";
    if (isStructural) {
      canvasPresetColorId = "2";
    } else if (derivedIntegerCode > 6) {
      canvasPresetColorId = "1";
    }

    const simulatedAdderResult = computeCla4Bit(derivedIntegerCode, 0x03, 1);

    return {
      accepted: true,
      isStructural,
      isNumeric,
      derivedIntegerCode,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: rowData.NN % 5040
    };
  }
}

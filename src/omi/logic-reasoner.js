import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

export class OmiMultiValuedLogicReasoner {
  evaluateLogicPrime(S, operatorByteKey) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const keyByte = operatorByteKey & 0xFF;

    const isFiveValuePrimeGate = (keyByte >= 0x3A && keyByte <= 0x3F);

    let logicTierModel = "TWO_VALUE_PRIME";
    let canvasPresetColorId = "5";

    if (isFiveValuePrimeGate) {
      logicTierModel = "FIVE_VALUE_PRIME";
      canvasPresetColorId = "3";
    } else {
      const significandBits = rowData.NN & 0x03FF;
      if (significandBits === 0) {
        logicTierModel = "THREE_VALUE_PRIME";
        canvasPresetColorId = "6";
      } else if (significandBits > 512) {
        canvasPresetColorId = "1";
      }
    }

    return {
      accepted: true,
      logicTierModel,
      isFiveValuePrimeGate,
      canvasPresetColorId,
      timelineSlot: rowData.NN % 5040
    };
  }
}

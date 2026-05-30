import { verifyOrbitLexer, extractTruthRow } from './delta-orbital-lexer.js';

export class OmiOneWordRegisterMachine {
  evaluateRegisterWordCons(S) {
    if (verifyOrbitLexer(S) !== 0) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const packedRowData = extractTruthRow(S);
    if (!packedRowData) return { accepted: false, reason: "EXTRACTION_FAILURE" };

    const registerCAR = packedRowData.NN & 0xFFFF;
    const registerCDR = packedRowData.MM & 0xFFFF;
    const operatorLL  = packedRowData.LL & 0xFF;

    const isCdrNilTerminated = (registerCDR === 0x01FF);

    return {
      accepted: true,
      operatorLL,
      registerCAR,
      registerCDR,
      isCdrNilTerminated,
      canvasPresetColorId: isCdrNilTerminated ? "5" : "6",
      timelineSlot: registerCAR % 5040
    };
  }
}

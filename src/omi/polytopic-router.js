import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

export class OmiPolytopicSemanticRouter {
  routePolytopicWordNetField(S, cellCountIndex, rawSynsetBits) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    if (!rowData) return { accepted: false, reason: "EXTRACTION_FAILURE" };

    let targetHyperCellCap = 5;
    let canvasPresetColorId = "5";

    switch (cellCountIndex) {
      case 5:   targetHyperCellCap = 5;   canvasPresetColorId = "5"; break;
      case 24:  targetHyperCellCap = 24;  canvasPresetColorId = "2"; break;
      case 8:   targetHyperCellCap = 8;   canvasPresetColorId = "3"; break;
      case 120: targetHyperCellCap = 120; canvasPresetColorId = "6"; break;
      case 600: targetHyperCellCap = 600; canvasPresetColorId = "1"; break;
      default:  targetHyperCellCap = 5;
    }

    const bitboardGraphemeVertex = rawSynsetBits & 0x03FF;
    const isSnubbedTruncationValid = ((bitboardGraphemeVertex ^ targetHyperCellCap) & 0x01) === 0;

    if (!isSnubbedTruncationValid) {
      canvasPresetColorId = "1";
    }

    const timelineSlot = rowData.NN % 5040;
    const hueAngleDegrees = (timelineSlot * 360) / 5040;

    return {
      accepted: isSnubbedTruncationValid,
      targetHyperCellCap,
      bitboardGraphemeVertex,
      isSnubbedTruncationValid,
      canvasPresetColorId,
      timelineSlot,
      hueAngleDegrees
    };
  }
}

import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const METAPROGRAM_LOCI_CEILING = 5040;

export class OmiMetaCircularCompiler {
  constructor(globalRingSAB) {
    if (!globalRingSAB) throw new Error("[Omi Meta] Missing global timeline SAB.");
    this.ringBigIntView = new BigInt64Array(globalRingSAB);
  }

  compileMetaInstruction(S, rawObjectBits) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "OUTSIDE_THE_LANGUAGE_BOUNDARY_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const targetLocusSlot = rowData.NN % METAPROGRAM_LOCI_CEILING;

    const grammarOperand = rawObjectBits & 0x0F;
    const isGrammarValid = ((targetLocusSlot ^ grammarOperand) & 0x01) === 0;

    let objectPresetColorId = "5";
    let semanticLayerModel = "TERMINATING_METAPROGRAM";

    if (!isGrammarValid) {
      objectPresetColorId = "1";
      semanticLayerModel = "REJECTED_CIRCUMELOCATION";
    } else if (targetLocusSlot === 1504) {
      objectPresetColorId = "6";
      semanticLayerModel = "GENESIS_LOCI_MANIFOLD";
    }

    const simulatedAdderResult = computeCla4Bit(grammarOperand, 0x07, 1);

    return {
      accepted: isGrammarValid,
      targetLocusSlot,
      semanticLayerModel,
      objectPresetColorId,
      simulatedAdderResult,
      hueAngleDegrees: (targetLocusSlot * 360) / METAPROGRAM_LOCI_CEILING
    };
  }
}

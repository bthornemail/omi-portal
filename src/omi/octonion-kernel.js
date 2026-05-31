import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export class OmiOctonionFanoKernel {
  evaluateOctonionBundle(S, leftQuatMask, rightQuatMask, targetLayerId) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const qLeft = BigInt(leftQuatMask);
    const qRight = BigInt(rightQuatMask);
    const layerId = targetLayerId & 0x0F;

    const isS4OmicronNode = (layerId === 4);
    const isS8Tetragrammatron = (layerId === 8 || layerId === 7);

    if (!isS4OmicronNode && !isS8Tetragrammatron) {
      return { accepted: false, reason: "OUTSIDE_ADAMS_FIBRATION_DIMENSIONS" };
    }

    const combinedFanoXorSum = qLeft ^ qRight ^ BigInt(rowData.NN);
    const fanoPointIndex = Number(combinedFanoXorSum & 0x07n);

    let canvasPresetColorId = "5";
    let objectModelLayerKey = "STANDARD_DOM_SURFACE";

    if (isS8Tetragrammatron) {
      objectModelLayerKey = "OCTONION_FANO_PROLOG_WORDNET";
      canvasPresetColorId = "6";
    } else if (isS4OmicronNode) {
      objectModelLayerKey = "QUTERNIONIC_S4_24CELL_NODE";
      canvasPresetColorId = "4";
    }

    if (fanoPointIndex === 0) {
      canvasPresetColorId = "1";
    }

    const simulatedAdderResult = computeCla4Bit(fanoPointIndex, layerId, 1);

    return {
      accepted: (fanoPointIndex !== 0),
      objectModelLayerKey,
      fanoPointIndex,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: rowData.NN % 5040
    };
  }
}

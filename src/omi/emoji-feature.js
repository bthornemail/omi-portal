import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const UNICODE_17_TOTAL_EMOJI = 3953;
export const UNICODE_17_CHARACTER_LIMIT = 1438;

export class OmiEmojiFeatureKernel {
  evaluateFeatureRoute(S, emojiCodePoint, posClass, featureMode) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const cp = Number(emojiCodePoint);
    const pos = posClass & 0x03;
    const feat = featureMode & 0x03;

    const isEmoticonBlock = (cp >= 0x1F600 && cp <= 0x1F64F);
    const isDingbatBlock = (cp >= 0x2700 && cp <= 0x27BF);
    const isPictographBlock = (cp >= 0x1F300 && cp <= 0x1F5FF) || (cp >= 0x1F900 && cp <= 0x1F9FF) || (cp >= 0x1FA70 && cp <= 0x1FAFF);
    const isTransportBlock = (cp >= 0x1F680 && cp <= 0x1F6FF);

    const isUnicode17Valid = (isEmoticonBlock || isDingbatBlock || isPictographBlock || isTransportBlock);
    if (!isUnicode17Valid && cp > 0) {
      return { accepted: false, reason: "OUT_OF_BOUNDS_UNICODE_17_BLOCK_EVICTION" };
    }

    let canvasPresetColorId = "5";
    let emojiFeatureRoutingModel = "STANDARD_TOPOLOGICAL_ROUTING";

    if ((pos === 0 || pos === 1) && feat === 1) {
      emojiFeatureRoutingModel = "REGULAR_ICOSAHEDRON_DODECAHEDRON_INFLECTION_ACTIVE";
      canvasPresetColorId = "5";
    } else if (pos === 2 && feat === 0) {
      emojiFeatureRoutingModel = "REGULAR_STELLATED_OCTAHEDRON_LEXICAL_ACTIVE";
      canvasPresetColorId = "6";
    } else if (pos === 2 && feat === 2) {
      emojiFeatureRoutingModel = "TOPOLOGICAL_POINT_LINE_PLANE_POINTER_LOCKED";
      canvasPresetColorId = "4";
    }

    const simulatedAdderResult = computeCla4Bit(pos, feat, 1);

    return {
      accepted: true,
      emojiFeatureRoutingModel,
      targetCodepointHex: cp.toString(16),
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}

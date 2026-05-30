import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const UNIVERSAL_POS_GEOMETRY = Object.freeze({
  NOUN:  { space: "CUBE_FACE",   idx: 1 }, VERB:  { space: "CUBE_FACE",   idx: 2 },
  PROPN: { space: "CUBE_FACE",   idx: 3 }, ADJ:   { space: "CUBE_FACE",   idx: 4 },
  ADV:   { space: "CUBE_FACE",   idx: 5 }, INTJ:  { space: "CUBE_FACE",   idx: 6 },
  PRON:  { space: "CUBE_VERTEX", idx: 1 }, DET:   { space: "CUBE_VERTEX", idx: 2 },
  ADP:   { space: "CUBE_VERTEX", idx: 3 }, AUX:   { space: "CUBE_VERTEX", idx: 4 },
  CCONJ: { space: "CUBE_VERTEX", idx: 5 }, SCONJ: { space: "CUBE_VERTEX", idx: 6 },
  PART:  { space: "CUBE_VERTEX", idx: 7 }, NUM:   { space: "CUBE_VERTEX", idx: 8 },
  PUNCT: { space: "CENTROID",    idx: 1 }, SYM:   { space: "CENTROID",    idx: 2 },
  X:     { space: "CENTROID",    idx: 3 }
});

export class OmiPolyhedralSemanticRouter {
  routePolyhedralSymbol(S, uposTagString, lexicalMask, inflectionalMask) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    if (!rowData) return { accepted: false, reason: "EXTRACTION_FAILURE" };

    const normalizedTag = uposTagString.trim().toUpperCase();

    const targetGeo = UNIVERSAL_POS_GEOMETRY[normalizedTag];
    if (!targetGeo) {
      return { accepted: false, reason: "MALFORMED_UNIVERSAL_POS_EVICTION" };
    }

    const lexIdx = lexicalMask & 0x0F;
    const infIdx = inflectionalMask & 0x1F;

    const timelineSlot = rowData.NN % 5040;
    const remainderFactor = timelineSlot % 60;

    const isRegular = (60 % remainderFactor === 0) || remainderFactor === 0;

    let canvasPresetColorId = "5";
    if (remainderFactor === 59) canvasPresetColorId = "1";
    if (remainderFactor === 61) canvasPresetColorId = "6";

    const simulatedAdderResult = computeCla4Bit(lexIdx, infIdx & 0x0F, 1);

    return {
      accepted: true,
      space: targetGeo.space,
      posIndex: targetGeo.idx,
      lexIdx,
      infIdx,
      isRegular,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot
    };
  }
}

import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

export const POLYHEDRAL_POS_MAP = Object.freeze({
  NOUN:  { geometricRole: "CUBE_FACE", index: 1 },
  VERB:  { geometricRole: "CUBE_FACE", index: 2 },
  PROPN: { geometricRole: "CUBE_FACE", index: 3 },
  ADJ:   { geometricRole: "CUBE_FACE", index: 4 },
  ADV:   { geometricRole: "CUBE_FACE", index: 5 },
  INTJ:  { geometricRole: "CUBE_FACE", index: 6 },
  PRON:  { geometricRole: "CUBE_VERTEX", index: 1 },
  DET:   { geometricRole: "CUBE_VERTEX", index: 2 },
  ADP:   { geometricRole: "CUBE_VERTEX", index: 3 },
  AUX:   { geometricRole: "CUBE_VERTEX", index: 4 },
  CCONJ: { geometricRole: "CUBE_VERTEX", index: 5 },
  SCONJ: { geometricRole: "CUBE_VERTEX", index: 6 },
  PART:  { geometricRole: "CUBE_VERTEX", index: 7 },
  NUM:   { geometricRole: "CUBE_VERTEX", index: 8 },
  PUNCT: { geometricRole: "CENTROID_POINTER", index: 1 },
  SYM:   { geometricRole: "CENTROID_POINTER", index: 2 },
  X:     { geometricRole: "CENTROID_POINTER", index: 3 }
});

export const POLYHEDRAL_VERTEX_CHROMA = Object.freeze({
  NOUN:  { x:  1, y:  1, z:  1, hexColor: "#FF0000" },
  VERB:  { x: -1, y:  1, z:  1, hexColor: "#00FF00" },
  PROPN: { x: -1, y: -1, z:  1, hexColor: "#0000FF" },
  ADJ:   { x:  1, y: -1, z:  1, hexColor: "#FFFF00" },
  ADV:   { x:  1, y:  1, z: -1, hexColor: "#FF00FF" },
  INTJ:  { x: -1, y:  1, z: -1, hexColor: "#00FFFF" },
  PRON:  { x:  1, y:  0, z:  0, hexColor: "#FF8800" },
  DET:   { x: -1, y:  0, z:  0, hexColor: "#00FF88" },
  ADP:   { x:  0, y:  1, z:  0, hexColor: "#8800FF" },
  AUX:   { x:  0, y: -1, z:  0, hexColor: "#FF0088" },
  CCONJ: { x:  0, y:  0, z:  1, hexColor: "#88FF00" },
  SCONJ: { x:  0, y:  0, z: -1, hexColor: "#0088FF" },
  PART:  { x:  0, y:  1, z:  1, hexColor: "#FFAAAA" },
  NUM:   { x:  0, y: -1, z: -1, hexColor: "#AAFFAA" },
  PUNCT: { x:  0, y:  0, z:  0, hexColor: "#FFFFFF" },
  SYM:   { x:  0, y:  0, z:  0, hexColor: "#777777" },
  X:     { x:  0, y:  0, z:  0, hexColor: "#333333" }
});

export function getVertexChromaticDifferential(uposTagString) {
  const normalizedTag = uposTagString.trim().toUpperCase();
  const vertexSpec = POLYHEDRAL_VERTEX_CHROMA[normalizedTag];

  if (!vertexSpec) {
    return { valid: false, hexColor: "#000000", x: 0, y: 0, z: 0 };
  }

  return {
    valid: true,
    tag: normalizedTag,
    x: vertexSpec.x,
    y: vertexSpec.y,
    z: vertexSpec.z,
    hexColor: vertexSpec.hexColor
  };
}

export class OmiPolyhedralSemanticRouter {
  routePolyhedralSymbol(S, uposTagString, lexicalMask, inflectionalMask) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "OUTSIDE_THE_LANGUAGE_BOUNDARY_FAULT" };
    }

    const rowData = extractTruthRow(S);
    if (!rowData) return { accepted: false, reason: "EXTRACTION_FAILURE" };

    const normalizedTag = uposTagString.trim().toUpperCase();

    const posGeometry = POLYHEDRAL_POS_MAP[normalizedTag];
    if (!posGeometry) {
      return { accepted: false, reason: "MALFORMED_UNIVERSAL_POS_EVICTION" };
    }

    const lexicalVertexIndex = lexicalMask & 0x0F;
    const inflectionalFaceIndex = inflectionalMask & 0x1F;

    const isDualIntersectionAligned = ((lexicalVertexIndex ^ inflectionalFaceIndex) & 0x01) === 0;

    let canvasPresetColorCode = "5";
    if (posGeometry.geometricRole === "CENTROID_POINTER") {
      canvasPresetColorCode = "3";
    } else if (posGeometry.geometricRole === "CUBE_VERTEX") {
      canvasPresetColorCode = "6";
    }

    if (!isDualIntersectionAligned) {
      canvasPresetColorCode = "1";
    }

    const timelineSlot = rowData.NN % 5040;
    const hueAngleDegrees = (timelineSlot * 360) / 5040;

    return {
      accepted: true,
      geometricRole: posGeometry.geometricRole,
      posIndex: posGeometry.index,
      lexicalVertexIndex,
      inflectionalFaceIndex,
      isDualIntersectionAligned,
      canvasPresetColorCode,
      timelineSlot,
      hueAngleDegrees
    };
  }
}

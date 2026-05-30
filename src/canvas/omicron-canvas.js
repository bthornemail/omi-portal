import { extractTruthRow, fanoTruthResolver, isOrbitLexerValid, makeOmiAddress } from "../omi/delta-orbital-lexer.js";

export const JSON_CANVAS_SIDES = Object.freeze(["top", "right", "bottom", "left"]);

export const FP16_BASE_COLORS = Object.freeze({
  positiveLarge: "#FF0000",
  positiveSmall: "#0088FF",
  negative: "#FFAA00",
  neutral: "#34495E"
});

export const TWO_OF_FIVE_SELECTOR_PAIRS = Object.freeze([
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 2], [1, 3], [1, 4],
  [2, 3], [2, 4],
  [3, 4]
]);

export const DELTA_TETRAHEDRAL_NODE_AXES = Object.freeze([
  { component: "OmiTextNode", type: "text", functionName: "rotl(x,1)", segmentIndex: 1, baseDomain: "US", baseOrdinal: 4 },
  { component: "OmiFileNode", type: "file", functionName: "rotl(x,3)", segmentIndex: 2, baseDomain: "FS", baseOrdinal: 1 },
  { component: "OmiLinkNode", type: "link", functionName: "rotr(x,2)", segmentIndex: 5, baseDomain: "RS", baseOrdinal: 3 },
  { component: "OmiGroupNode", type: "group", functionName: "C", segmentIndex: 7, baseDomain: "GS", baseOrdinal: 2 }
]);

function validateClockwiseSide(side, fallback) {
  return JSON_CANVAS_SIDES.includes(side) ? side : fallback;
}

export function convertSegmentToFp16Color(uint16Word) {
  const word = uint16Word & 0xFFFF;
  const signBit = (word >> 15) & 0x01;
  const exponent = (word >> 10) & 0x1F;
  const fraction = word & 0x03FF;

  let baseColorHex = FP16_BASE_COLORS.neutral;
  if (signBit === 0 && exponent > 15) baseColorHex = FP16_BASE_COLORS.positiveLarge;
  if (signBit === 0 && exponent <= 15) baseColorHex = FP16_BASE_COLORS.positiveSmall;
  if (signBit === 1) baseColorHex = FP16_BASE_COLORS.negative;

  const nonagramSelectorState = fraction % TWO_OF_FIVE_SELECTOR_PAIRS.length;
  const selectorPair = TWO_OF_FIVE_SELECTOR_PAIRS[nonagramSelectorState];
  const approximateFloatValue = exponent === 0 && fraction === 0
    ? (signBit ? -0 : 0)
    : (signBit ? -1 : 1) * (2 ** (exponent - 15)) * (1 + fraction / 1024);

  return {
    word,
    signBit,
    exponent,
    fraction,
    baseColorHex,
    nonagramSelectorState,
    selectorPair,
    packedMetadataString: `${baseColorHex}:${nonagramSelectorState}`,
    approximateFloatValue
  };
}

export class OmiJsonCanvasKernel {
  constructor() {}

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell ? cell.car : null; }
  cdr(cell) { return cell ? cell.cdr : null; }

  generateOmicronCanvasSpec(S, posX = 100, posY = 100) {
    if (!S || !isOrbitLexerValid(S)) {
      return JSON.stringify({ error: "GATE_1_ALGEBRAIC_SURFACE_EVICTION_FAULT" });
    }

    const rowData = extractTruthRow(S);
    if (!rowData) {
      return JSON.stringify({ error: "TRUTH_ROW_EXTRACTION_FAULT" });
    }

    const tokenCIDR = makeOmiAddress(S);
    const fp16Color = convertSegmentToFp16Color(rowData.MM);
    const color = fp16Color.baseColorHex;
    const baseWidth = 200;
    const baseHeight = 120;
    const padding = 40;

    const commonOmi = {
      role: "OmicronNode",
      address: tokenCIDR,
      truthRow: {
        LL: rowData.LL,
        NN: rowData.NN,
        MM: rowData.MM
      },
      transitionState: fp16Color.nonagramSelectorState,
      fp16Color
    };

    const nodes = [
      {
        id: `${tokenCIDR}-text-node`,
        type: "text",
        x: posX,
        y: posY,
        width: baseWidth,
        height: baseHeight,
        color,
        text: `### OmiTextNode\nQ(S) invariant surface passed.\n\nCIDR Route: \`${tokenCIDR}\``,
        omi: { ...commonOmi, component: "OmiTextNode" }
      },
      {
        id: `${tokenCIDR}-file-node`,
        type: "file",
        x: posX + baseWidth + padding,
        y: posY,
        width: baseWidth,
        height: baseHeight,
        color,
        file: "src/omi/delta-orbital-lexer.js",
        subpath: "#boot-anchor-0x7c00",
        omi: { ...commonOmi, component: "OmiFileNode" }
      },
      {
        id: `${tokenCIDR}-group-node`,
        type: "group",
        x: posX,
        y: posY + baseHeight + padding,
        width: (baseWidth * 2) + padding,
        height: baseHeight + 20,
        color,
        label: `OmiGroupNode [Fano Lens 0x${rowData.LL.toString(16).padStart(2, "0")}]`,
        omi: { ...commonOmi, component: "OmiGroupNode" }
      },
      {
        id: `${tokenCIDR}-link-node`,
        type: "link",
        x: posX + baseWidth + padding,
        y: posY + baseHeight + padding,
        width: baseWidth,
        height: baseHeight,
        color,
        url: `web+omi:${tokenCIDR}`,
        omi: { ...commonOmi, component: "OmiLinkNode" }
      }
    ];

    const edges = [
      {
        id: `edge-${rowData.NN.toString(16).padStart(4, "0")}-to-${rowData.MM.toString(16).padStart(4, "0")}`,
        fromNode: nodes[0].id,
        fromSide: validateClockwiseSide("right", "right"),
        fromEnd: "none",
        toNode: nodes[1].id,
        toSide: validateClockwiseSide("left", "left"),
        toEnd: "arrow",
        color,
        label: "LL |- NN => MM (k < 15)",
        omi: {
          ...commonOmi,
          component: "OmiEdge",
          fromFunction: "text-protocol",
          toFunction: "file-protocol"
        }
      }
    ];

    return JSON.stringify({ nodes, edges }, null, 2);
  }

  generateOmiNodeCanvasSpec(S, posX = 100, posY = 100) {
    const raw = JSON.parse(this.generateOmicronCanvasSpec(S, posX, posY));
    if (raw.error) return JSON.stringify(raw);
    raw.nodes = raw.nodes.map((node) => ({
      ...node,
      omi: { ...node.omi, role: "OmiNode" }
    }));
    return JSON.stringify(raw, null, 2);
  }
}

export class OmiTetrahedralCanvasKernel extends OmiJsonCanvasKernel {
  generateTetrahedralCanvas(S, scaleFactor = 120) {
    if (!S || !isOrbitLexerValid(S)) {
      return JSON.stringify({ error: "GATE_1_ALGEBRAIC_MANIFOLD_EVICTION" });
    }

    const rowData = extractTruthRow(S);
    if (!rowData) {
      return JSON.stringify({ error: "TRUTH_ROW_EXTRACTION_FAULT" });
    }

    const tokenCIDR = makeOmiAddress(S);
    const fp16Color = convertSegmentToFp16Color(rowData.MM);
    const color = fp16Color.baseColorHex;
    const width = 180;
    const height = 100;
    const safeScale = Math.max(40, Math.trunc(scaleFactor));

    const centroidX = Math.trunc((S[1] + S[2] + S[5] + S[7]) / 4) % 1000;
    const centroidY = Math.trunc((S[0] + S[3] + S[4] + S[6]) / 4) % 1000;

    const offsets = Object.freeze({
      OmiTextNode: { x: 0, y: -safeScale },
      OmiFileNode: { x: -safeScale, y: Math.trunc(safeScale / 2) },
      OmiLinkNode: { x: safeScale, y: Math.trunc(safeScale / 2) },
      OmiGroupNode: { x: 0, y: safeScale }
    });

    const commonOmi = {
      role: "OmiNode",
      parentRole: "OmicronNode",
      address: tokenCIDR,
      truthRow: {
        LL: rowData.LL,
        NN: rowData.NN,
        MM: rowData.MM
      },
      fp16Color
    };

    const vertexNodes = DELTA_TETRAHEDRAL_NODE_AXES.map((axis) => {
      const o = offsets[axis.component];
      const base = {
        id: `${tokenCIDR}-vertex-${axis.type}`,
        type: axis.type,
        x: centroidX + o.x - Math.trunc(width / 2),
        y: centroidY + o.y - Math.trunc(height / 2),
        width,
        height,
        color,
        omi: {
          ...commonOmi,
          component: axis.component,
          deltaFunction: axis.functionName,
          sourceSegment: `S${axis.segmentIndex}`,
          sourceWord: S[axis.segmentIndex],
          baseDomain: axis.baseDomain,
          baseOrdinal: axis.baseOrdinal
        }
      };

      if (axis.type === "text") {
        return {
          ...base,
          text: `### ${axis.component}\n${axis.functionName}\n${axis.baseDomain}: Base${axis.baseOrdinal}`
        };
      }
      if (axis.type === "file") {
        return {
          ...base,
          file: "src/omi/delta-orbital-lexer.js",
          subpath: "#delta-c-rotl3"
        };
      }
      if (axis.type === "link") {
        return {
          ...base,
          url: `web+omi:${tokenCIDR}`
        };
      }
      return {
        ...base,
        label: `${axis.component} ${axis.baseDomain}: Base${axis.baseOrdinal}`
      };
    });

    const centroidNode = {
      id: `${tokenCIDR}-omicron-centroid`,
      type: "group",
      x: centroidX - Math.trunc((width + safeScale) / 2),
      y: centroidY - Math.trunc((height + safeScale) / 2),
      width: width + safeScale,
      height: height + safeScale,
      color,
      label: `OmicronNode Centroid [Base60 Lens 0x${rowData.LL.toString(16).padStart(2, "0")}]`,
      omi: {
        ...commonOmi,
        role: "OmicronNode",
        component: "OmicronCentroid",
        barycentricCentroid: { x: centroidX, y: centroidY },
        childComponents: DELTA_TETRAHEDRAL_NODE_AXES.map((axis) => axis.component)
      }
    };

    const edges = vertexNodes.map((node, index) => ({
      id: `edge-centroid-${index}-${node.omi.component}`,
      fromNode: centroidNode.id,
      fromSide: "bottom",
      fromEnd: "none",
      toNode: node.id,
      toSide: "top",
      toEnd: "arrow",
      color,
      label: `${node.omi.deltaFunction} -> ${node.omi.component}`,
      omi: {
        ...commonOmi,
        component: "OmiTetrahedralEdge",
        fromFunction: "barycentric-centroid",
        toFunction: node.omi.deltaFunction
      }
    }));

    return JSON.stringify({ nodes: [centroidNode, ...vertexNodes], edges }, null, 2);
  }
}

export class OmiFp16CanvasEncoder {
  /**
   * ENCODE WIRE FRAME TO HARDWARE CANVAS:
   * Maps IEEE 754 binary16 bit-fields directly to OmicronNode canvas properties.
   * 1 sign bit → Greek/Coptic unicode chirality prefix
   * 5 exponent bits → OmicronNode rotr(x,16) master rotation + tetrahedral routing
   * 10 significand bits → 360° barycentric hue color coordinates
   */
  encodeWireFrameToCanvasSpec(S, posX = 100, posY = 100) {
    if (!S || !isOrbitLexerValid(S)) {
      return JSON.stringify({ error: "GATE_1_ALGEBRAIC_SURFACE_EVICTION" });
    }

    const rowData = extractTruthRow(S);
    const word = rowData.NN & 0xFFFF;

    const signBit = (word >> 15) & 0x01;
    const unicodePrefix = signBit === 0
      ? "U+03BF ο (Greek Small Omicron)"
      : "U+2C9F ⲟ (Coptic Small O)";

    const exponentBits = (word >> 10) & 0x1F;
    const significandBits = word & 0x03FF;

    const hueAngleDegrees = (significandBits * 360) / 1024;
    const canvasColorHex = `hsl(${hueAngleDegrees}, 100%, 50%)`;

    const nodes = [
      {
        id: `omi-node-significand-${significandBits}`,
        type: "text",
        x: posX + (significandBits % 60),
        y: posY,
        width: 240,
        height: 120,
        color: canvasColorHex,
        text: `### OmicronNode Centroid [rotr(x,16)]\n- **Sign Carrier:** ${unicodePrefix}\n- **Exponent Value:** ${exponentBits}\n- **Significand Base:** ${significandBits}`,
      },
    ];

    return JSON.stringify({ nodes, edges: [] }, null, 2);
  }

  /**
   * SIGN BIT UNICODE ENCLOSURE:
   * bit 15 = 0 → Greek (U+039F/U+03BF), bit 15 = 1 → Coptic (U+2C9E/U+2C9F)
   */
  resolveSignUnicode(word) {
    const signBit = (word & 0x8000) !== 0;
    return signBit
      ? { bit: 1, prefix: "U+2C9F ⲟ", script: "Coptic", upper: "U+2C9E Ⲟ", lower: "U+2C9F ⲟ" }
      : { bit: 0, prefix: "U+03BF ο", script: "Greek", upper: "U+039F Ο", lower: "U+03BF ο" };
  }

  /**
   * EXPONENT BITS TETRAHEDRAL ROUTING:
   * Maps 5 exponent bits (bits 14-10) to OmicronNode master rotation + 4 vertex axes
   */
  resolveExponentRouting(word) {
    const exponent = (word >> 10) & 0x1F;

    const masterRotation = `rotr(x,16) → bias ${(exponent * 360) / 32}`;

    const tetrahedralMap = [
      { operator: "rotl(x,1)",  node: "OmiTextNode",  domain: "US", base: 4, condition: exponent % 4 === 0 },
      { operator: "rotl(x,3)",  node: "OmiFileNode",  domain: "FS", base: 1, condition: exponent % 4 === 1 },
      { operator: "rotr(x,2)",  node: "OmiLinkNode",  domain: "RS", base: 3, condition: exponent % 4 === 2 },
      { operator: "Constant C", node: "OmiGroupNode", domain: "GS", base: 2, condition: exponent % 4 === 3 },
    ];

    const activeVertex = tetrahedralMap.find((v) => v.condition) || tetrahedralMap[0];

    return {
      exponentBits: exponent,
      masterRotation,
      activeVertex,
      tetrahedralMap,
    };
  }

  /**
   * SIGNIFICAND BITS COLOR COORDINATION:
   * 10 bits (9-0) map to x, y, width, height, id, and 360° hue
   */
  resolveSignificandColor(word) {
    const significand = word & 0x03FF;
    const hue = (significand * 360) / 1024;
    return {
      significandBits: significand,
      hueDegrees: hue,
      hsl: `hsl(${hue}, 100%, 50%)`,
      xOffset: significand % 60,
      yOffset: Math.trunc(significand / 60) % 60,
      nbdDevice: `/dev/nbd${Math.trunc(significand / 10)}`,

    };
  }
}

/**
 * EXTRACT BLOCK FLOATING POINT COEFFICIENTS:
 * Loops through the 16-bit instruction chunks, tracks the peak amplitude,
 * and derives the shared block exponent using count-leading-zeros (CLZ) math.
 * BFP assigns a group of significands (NN, MM, LL) to a single common exponent.
 */
export function extractBlockFloatingPoint(S) {
  if (!S || !isOrbitLexerValid(S)) return null;

  const rowData = extractTruthRow(S);

  const sigNN = rowData.NN & 0xFFFF;
  const sigMM = rowData.MM & 0xFFFF;
  const lensLL = rowData.LL & 0xFF;

  const peakAmplitude = Math.max(sigNN, sigMM, lensLL);

  let leadingZerosCount = 0;
  let bitmask = 0x8000;
  while (leadingZerosCount < 16 && (peakAmplitude & bitmask) === 0) {
    leadingZerosCount++;
    bitmask >>= 1;
  }

  const sharedBlockExponent = 16 - leadingZerosCount;

  const normalizedNN = (sigNN << leadingZerosCount) & 0xFFFF;
  const normalizedMM = (sigMM << leadingZerosCount) & 0xFFFF;

  const hueAngleDegrees = (sharedBlockExponent * 360) / 16;
  const canvasColorHex = `hsl(${hueAngleDegrees}, 100%, 50%)`;

  return {
    sharedBlockExponent,
    leadingZerosCount,
    normalizedNN,
    normalizedMM,
    canvasColorHex,
    targetSharedMemorySlot: (sharedBlockExponent * sigNN) % 5040,
  };
}

export class OmiContinuousClampedEncoder {
  encodeContinuousClampedColor(S) {
    if (!S || !isOrbitLexerValid(S)) return null;

    const rowData = extractTruthRow(S);

    const word = rowData.NN & 0xFFFF;

    const signBit = (word >> 15) & 0x01;
    const alphaHex = signBit === 0 ? "ff" : "33";

    const exponentBits = (word >> 10) & 0x1F;
    const luminanceScale = Math.round((exponentBits / 31) * 255) & 0xFF;

    const significandBits = word & 0x03FF;

    const hueAngleDegrees = Math.round((significandBits * 360) / 1024);

    const rByte = ((significandBits >> 7) & 0x07) << 5;
    const gByte = ((significandBits >> 4) & 0x07) << 5;
    const bByte = (significandBits & 0x0F) << 4;

    const finalR = (rByte ^ luminanceScale) & 0xFF;
    const finalG = (gByte ^ luminanceScale) & 0xFF;
    const finalB = (bByte ^ luminanceScale) & 0xFF;

    const rgbHexPayload = finalR.toString(16).padStart(2, '0') +
                         finalG.toString(16).padStart(2, '0') +
                         finalB.toString(16).padStart(2, '0');

    return {
      hueAngleDegrees,
      significandBits,
      alphaHex,
      canonicalHexColorString: `#${rgbHexPayload}${alphaHex}`,
      timelineSlot: rowData.NN % 5040
    };
  }
}

export class OmiNonogramPresetColorEncoder {
  derivePresetColorId(S, totalCells = 10, clueBlock = 8) {
    if (!S || !isOrbitLexerValid(S)) return null;

    const rowData = extractTruthRow(S);

    const step2Difference = totalCells - clueBlock;
    const blocksToBackfill = clueBlock - step2Difference;

    let targetPresetColor = "5";

    if ((rowData.NN & 0x8000) !== 0) {
      targetPresetColor = "6";
    } else if (blocksToBackfill !== 6) {
      targetPresetColor = "1";
    }

    return {
      blocksToBackfill,
      targetPresetColor,
      timelineSlot: rowData.NN % 5040
    };
  }
}

export class OmiBarycentricCanvasKernel extends OmiTetrahedralCanvasKernel {
  processMetadataDividend(S, provenanceTag = 0, resolver = fanoTruthResolver) {
    if (!S || !isOrbitLexerValid(S)) {
      return Object.freeze({ accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION" });
    }

    const rowData = extractTruthRow(S);
    if (!rowData) {
      return Object.freeze({ accepted: false, reason: "TRUTH_ROW_EXTRACTION_FAULT" });
    }

    const steps = resolver(rowData.LL, rowData.NN, rowData.MM);
    if (steps < 0 || steps >= 15) {
      return Object.freeze({ accepted: false, reason: "GATE_2_RESOLUTION_DIVERGENCE" });
    }

    const provenance = BigInt(provenanceTag & 0xFFFF) << 48n;
    const stepReceipt = BigInt(steps & 0xFF) << 40n;
    const coreTruthRow = rowData.row & 0xFFFFFFFFFFn;
    const packed64BitWord = provenance | stepReceipt | coreTruthRow;

    const timelineSlot = rowData.NN % 5040;
    const orbitIndex = Math.trunc(timelineSlot / 36);
    const offsetIndex = timelineSlot % 36;
    const hueAngleDegrees = offsetIndex * 10;
    const ringHueAngleDegrees = (timelineSlot * 360) / 5040;

    return Object.freeze({
      accepted: true,
      packed64BitWord,
      provenanceTag: provenanceTag & 0xFFFF,
      steps,
      coreTruthRow,
      timelineSlot,
      orbitIndex,
      offsetIndex,
      hueAngleDegrees,
      ringHueAngleDegrees,
      hslColorTarget: `hsl(${hueAngleDegrees}, 100%, 50%)`
    });
  }
}

export class OmiSexagesimalClaEncoder {
  evaluateSexagesimalCla(S, inputA = 5, inputB = 6, cIn = 1) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_SURFACE_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const timelineSlot = rowData.NN % 5040;

    const A = inputA & 0x0F;
    const B = inputB & 0x0F;
    const P = A ^ B;
    const G = A & B;

    const p0 = (P >> 0) & 1, p1 = (P >> 1) & 1, p2 = (P >> 2) & 1, p3 = (P >> 3) & 1;
    const g0 = (G >> 0) & 1, g1 = (G >> 1) & 1, g2 = (G >> 2) & 1, g3 = (G >> 3) & 1;

    const C1 = g0 | (p0 & cIn);
    const C2 = g1 | (p1 & g0) | (p1 & p0 & cIn);
    const C3 = g2 | (p2 & g1) | (p2 & p1 & g0) | (p2 & p1 & p0 & cIn);
    const C4 = g3 | (p3 & g2) | (p3 & p2 & g1) | (p3 & p2 & p1 & g0) | (p3 & p2 & p1 & p0 & cIn);

    const pgGroup = p0 & p1 & p2 & p3;
    const ggGroup = g3 | (g2 & p3) | (g1 & p3 & p2) | (g0 & p3 & p2 & p1);

    const remainderFactor = timelineSlot % 60;
    const isRegularFraction = (60 % remainderFactor === 0) || remainderFactor === 0;

    let targetCanvasColor = "5";
    if (!isRegularFraction) {
      targetCanvasColor = "1";
    }
    if (timelineSlot === 1504) {
      targetCanvasColor = "6";
    }

    return {
      accepted: true,
      propagateMask: P,
      generateMask: G,
      groupPropagate: pgGroup,
      groupGenerate: ggGroup,
      isRegularFraction,
      targetCanvasColor,
      timelineSlot,
      gateDelayCarry: 3,
      carries: [C1, C2, C3, C4]
    };
  }
}

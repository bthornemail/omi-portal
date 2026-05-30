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

import { verifyOrbitLexer, extractTruthRow } from './delta-orbital-lexer.js';

export class OmiTetrahedralLatticeResolver {
  inferMissingVertex(S, activeVertexMask) {
    if (verifyOrbitLexer(S) !== 0) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    if (!rowData) return { accepted: false, reason: "EXTRACTION_FAILURE" };

    const mask = activeVertexMask & 0x0F;

    let popCount = 0;
    let tempMask = mask;
    while (tempMask > 0) {
      popCount += (tempMask & 1);
      tempMask >>= 1;
    }

    const canInfer = (popCount === 3);
    let inferredVertexId = null;

    if (canInfer) {
      inferredVertexId = mask ^ 0x0F;
    }

    const isHighContrastWhite = (rowData.NN & 0x03FF) > 512;
    const monochromeHexCode = isHighContrastWhite ? "#FFFFFF" : "#000000";

    return {
      accepted: true,
      canInfer,
      inferredVertexId,
      popCount,
      monochromeHexCode,
      timelineSlot: rowData.NN % 5040
    };
  }
}

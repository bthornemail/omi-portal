import { isOrbitLexerValid, extractTruthRow } from '../omi/delta-orbital-lexer.js';
import { computeCla4Bit } from '../omi/cla-adder.js';

export const EXTRUSION_MAX_ORDER = 10;

export class OmiExtrusionKernel {
  evaluateCellExtrusion(S, polyominoOrderNum, explicitDimensionMode, hasVoidInterior) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const order = polyominoOrderNum & 0xFF;
    const mode = explicitDimensionMode & 0xFF;

    const isOrderValid = (order >= 1 && order <= EXTRUSION_MAX_ORDER);
    if (!isOrderValid) {
      return { accepted: false, reason: "OUT_OF_BOUNDS_POLYOMINO_ORDER_EVICTION" };
    }

    let canvasPresetColorId = "5";
    let extrusionLayerModel = "UNROLL_BASE_PSEUDO_POLYOMINO";

    if (mode === 0) {
      extrusionLayerModel = "CONS_PSEUDO_POLYOMINO_ACTIVE";
      canvasPresetColorId = "5";
    } else if (mode === 1) {
      extrusionLayerModel = "CAR_POLYOMINOID_MESH_ACTIVE";
      canvasPresetColorId = "4";
    } else if (mode === 2) {
      extrusionLayerModel = "CDR_POLYCUBE_VOLUME_ACTIVE";
      canvasPresetColorId = "6";
    }

    if (!!hasVoidInterior && mode === 2) {
      canvasPresetColorId = "1";
    }

    const simulatedAdderResult = computeCla4Bit(order & 0x0F, mode & 0x0F, 1);

    return {
      accepted: isOrderValid,
      extrusionLayerModel,
      polyominoOrder: order,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(rowData.NN) % 5040
    };
  }
}

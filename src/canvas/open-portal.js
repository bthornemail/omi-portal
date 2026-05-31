import { isOrbitLexerValid, extractTruthRow } from '../omi/delta-orbital-lexer.js';
import { computeCla4Bit } from '../omi/cla-adder.js';

export const PORTAL_MAX_DIMENSION = 4096;

export class OmiOpenWorldPortal {
  processDroppedAsset(S, fileTypeOctet, imageWidth, imageHeight, hasValidFinders) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const type = fileTypeOctet & 0xFF;
    const w = imageWidth & 0xFFFF;
    const h = imageHeight & 0xFFFF;

    const isDimensionSafe = (w <= PORTAL_MAX_DIMENSION && h <= PORTAL_MAX_DIMENSION && w > 0 && h > 0);
    if (!isDimensionSafe) {
      return { accepted: false, reason: "PORTAL_CANVAS_DIMENSION_OVERFLOW_EVICTION" };
    }

    const isSymbologyAligned = !!hasValidFinders;
    if (!isSymbologyAligned) {
      return { accepted: false, reason: "MALFORMED_OPTICAL_FINDER_ALIGNMENT_EVICTION" };
    }

    let canvasPresetColorId = "5";
    let openWorldModelType = "STANDARD_VIEWPORT_IDLE";

    if (type === 0x49) {
      openWorldModelType = "PORTAL_STATIC_IMAGE_ASSET_LOADED";
      canvasPresetColorId = "5";
    } else if (type === 0x56) {
      openWorldModelType = "PORTAL_DYNAMIC_VIDEO_STREAM_ACTIVE";
      canvasPresetColorId = "4";
    }

    const simulatedAdderResult = computeCla4Bit(w & 0x0F, h & 0x0F, 1);

    return {
      accepted: true,
      openWorldModelType,
      imageWidth: w,
      imageHeight: h,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(rowData.NN) % 5040
    };
  }
}

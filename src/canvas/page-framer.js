import { isOrbitLexerValid, extractTruthRow } from '../omi/delta-orbital-lexer.js';
import { computeCla4Bit } from '../omi/cla-adder.js';

export const NAT64_WELL_KNOWN_PREFIX = "64:ff9b::/96";

export class OmiPageFramerKernel {
  framePageLayer(S, iframeIdString, segment6HexValue, segment7HexValue) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const targetId = iframeIdString.trim().toLowerCase();

    const isIframeAligned = targetId.includes("64:ff9b::/96") || targetId.includes("omi-64:ff9b::/96");

    const ipv4Word1 = segment6HexValue & 0xFFFF;
    const ipv4Word2 = segment7HexValue & 0xFFFF;

    const byte1 = (ipv4Word1 >> 8) & 0xFF;
    const byte2 = ipv4Word1 & 0xFF;
    const byte3 = (ipv4Word2 >> 8) & 0xFF;
    const byte4 = ipv4Word2 & 0xFF;

    const derivedIpv4String = `${byte1}.${byte2}.${byte3}.${byte4}`;

    let canvasPresetColorId = "5";
    let opticalFramingModel = "STANDARD_UNFRAMED_DOM";

    if (isIframeAligned) {
      opticalFramingModel = "NAT64_CODE16K_JABCODE_FRAMED";
      canvasPresetColorId = "6";
    } else {
      canvasPresetColorId = "1";
    }

    const simulatedAdderResult = computeCla4Bit(byte1 & 0x0F, byte4 & 0x0F, 1);

    return {
      accepted: isIframeAligned,
      opticalFramingModel,
      prefixReferencePoint: NAT64_WELL_KNOWN_PREFIX,
      derivedIpv4String,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}

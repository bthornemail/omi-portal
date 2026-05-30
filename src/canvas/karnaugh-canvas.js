import { isOrbitLexerValid, extractTruthRow } from '../omi/delta-orbital-lexer.js';
import { computeCla4Bit } from '../omi/cla-adder.js';

export const KMAP_GRAY_ORDER = [
  { minterm: 0,  binary: "0000", output: 0 }, { minterm: 4,  binary: "0100", output: 0 },
  { minterm: 12, binary: "1100", output: 1 }, { minterm: 8,  binary: "1000", output: 1 },
  { minterm: 1,  binary: "0001", output: 0 }, { minterm: 5,  binary: "0101", output: 0 },
  { minterm: 13, binary: "1101", output: 1 }, { minterm: 9,  binary: "1001", output: 1 },
  { minterm: 3,  binary: "0011", output: 0 }, { minterm: 7,  binary: "0111", output: 0 },
  { minterm: 15, binary: "1111", output: 0 }, { minterm: 11, binary: "1011", output: 1 },
  { minterm: 2,  binary: "0010", output: 0 }, { minterm: 6,  binary: "0110", output: 1 },
  { minterm: 14, binary: "1110", output: 1 }, { minterm: 10, binary: "1010", output: 1 }
];

export class OmiKarnaughToroidOptimizer {
  minimizeToroidalCell(S, inputA, inputB, inputC, inputD) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);

    const A = inputA & 1; const B = inputB & 1;
    const C = inputC & 1; const D = inputD & 1;
    const packedInputString = `${A}${B}${C}${D}`;

    const cellMatch = KMAP_GRAY_ORDER.find(c => c.binary === packedInputString);
    if (!cellMatch) return { accepted: false };

    const termGreen = (A === 1 && D === 0);
    const termRed   = (A === 1 && B === 0);
    const termBlue  = (B === 1 && C === 1 && D === 0);

    const isOutputTrue = (cellMatch.output === 1);

    let canvasPresetColorId = "5";
    let optimizedTermKey = "MAXTERM_ZERO";

    if (isOutputTrue) {
      if (termGreen && termRed) {
        canvasPresetColorId = "1";
        optimizedTermKey = "OVERLAP_BROWN_ZONE";
      } else if (termGreen) {
        canvasPresetColorId = "4";
        optimizedTermKey = "TERM_GREEN_AD_PRIME";
      } else if (termBlue) {
        canvasPresetColorId = "6";
        optimizedTermKey = "TERM_BLUE_BCD_PRIME";
      }
    }

    const simulatedAdderResult = computeCla4Bit((A << 1) | B, (C << 1) | D, 1);

    return {
      accepted: true,
      mintermIndex: cellMatch.minterm,
      isOutputTrue,
      optimizedTermKey,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: rowData.NN % 5040
    };
  }
}

export const COMPASS_NAT64_PREFIX = 0x64FF9B;

export class OmiMetacircularTorusInterpreter {
  evaluateMetacircularTransition(S, inputA, inputB, inputC, inputD, proxyAddressOffset) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_ALGEBRAIC_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);

    const isProxyAligned = (proxyAddressOffset >= 0xC8);

    const A = inputA & 1; const B = inputB & 1;
    const C = inputC & 1; const D = inputD & 1;

    const termGreen = (A === 1 && D === 0);
    const termRed   = (A === 1 && B === 0);
    const termBlue  = (B === 1 && C === 1 && D === 0);
    const termYellowConsensus = (A === 1 && D === 0);

    const isRaceConditionActive = (C === 1 && D === 0 && A === 1 && B === 0);

    let canvasPresetColorId = "5";
    let optimizedLogicModel = "CANONICAL_MINTERM_SOP";

    if (isRaceConditionActive && termYellowConsensus) {
      canvasPresetColorId = "3";
      optimizedLogicModel = "HAZARD_SECURED_CONSENSUS";
    } else if (termBlue) {
      canvasPresetColorId = "6";
    } else if (!isProxyAligned) {
      canvasPresetColorId = "1";
    }

    const simulatedAdderResult = computeCla4Bit((A << 1) | B, (C << 1) | D, 1);

    return {
      accepted: isProxyAligned,
      optimizedLogicModel,
      isRaceConditionActive,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: rowData.NN % 5040
    };
  }
}

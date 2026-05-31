/**
 * ============================================================================
 * OMI PROTOCOL: WALLIS-NEUGEBAUER NOTATIONAL SECTORS KERNEL
 * File Target: src/omi/notation-kernel.js
 * Invariant Configuration: Pure Positional Sexagesimal Core [Zero-Alloc]
 * ============================================================================
 */

import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const HIGH_SEXAGESIMAL_CEILING = 59;
export const CODE_UNICODE_LOWER_OMICRON = 0x03BF;
export const CODE_UNICODE_UPPER_OMICRON = 0x039F;

export class OmiNotationKernel {
  /**
   * EVALUATE POSITIONAL NOTATION STEP:
   * Slices an unescaped 128-bit frame S, verifies its structural boundaries via Gate 1,
   * unrolls Neugebauer positional commas, and tracks Fibonacci address transitions.
   */
  evaluatePositionalAddress(S, wholeIntegerPart, primaryMinuta, secondarySecunda, orderN, priorOrderN1, prefixChar, suffixChar) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const integerPart = Number(wholeIntegerPart) & 0xFFFF;
    const minutes     = Number(primaryMinuta) & 0xFF;
    const seconds     = Number(secondarySecunda) & 0xFF;

    const n    = Number(orderN) & 0xFF;
    const n1   = Number(priorOrderN1) & 0xFF;
    const pre  = Number(prefixChar) & 0xFFFF;
    const suff = Number(suffixChar) & 0xFFFF;

    const isEnclosed = (pre === CODE_UNICODE_LOWER_OMICRON && suff === CODE_UNICODE_UPPER_OMICRON);
    const isFibonacciSequenceStep = (n > 0 && n1 === n - 1);

    if (!isEnclosed || !isFibonacciSequenceStep) {
      return { accepted: false, reason: "OMICRON_FIBONACCI_ENCAPSULATION_VIOLATION_EVICTION" };
    }

    const isMinuteValid = (minutes <= HIGH_SEXAGESIMAL_CEILING);
    const isSecondValid = (seconds <= HIGH_SEXAGESIMAL_CEILING);

    if (!isMinuteValid || !isSecondValid) {
      return { accepted: false, reason: "EXCEEDS_MAX_SEXAGESIMAL_POSITION_EVICTION" };
    }

    let canvasPresetColorId = "5";
    let notationRoutingModel = "STANDARD_SEXAGESIMAL_NOTATION";

    if (integerPart === 29 && minutes === 31 && seconds === 50) {
      notationRoutingModel = "SYNODIC_CHRONOMETER_CENTROID_ACTIVE";
      canvasPresetColorId = "6";
    } else {
      notationRoutingModel = "WALLIS_POWER_SERIES_TRACK";
      canvasPresetColorId = "4";
    }

    const simulatedAdderResult = computeCla4Bit(minutes & 0x0F, seconds & 0x0F, 1);

    return {
      accepted: (isMinuteValid && isSecondValid),
      notationRoutingModel,
      currentOrderN: n,
      priorOrderN1: n1,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(BigInt(rowData.NN) % 5040n)
    };
  }
}

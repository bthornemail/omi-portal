/**
 * ============================================================================
 * OMI PROTOCOL: QEMU TYPE_CLOCK EMULATION KERNEL
 * File Target: src/omi/qemu-clock.js
 * Invariant Configuration: Pure Fractional Chronometer Surface [Zero-Alloc]
 * ============================================================================
 */

import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const SUPERIOR_COMPOSITE_LCM = 60;

export class OmiQemuClockKernel {
  /**
   * EVALUATE EMULATED CLOCK PERIOD:
   * Slices an unescaped 128-bit frame S, verifies its structural boundaries via Gate 1,
   * handles sub-nanosecond integer shifts, and evaluates clock gating conditions.
   */
  evaluateClockPeriod(S, rawPeriod32BitValue, targetDeviceTypeOctet) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const rawPeriod = BigInt(rawPeriod32BitValue) & 0xFFFFFFFFFFFFFFFFn;
    const deviceType = targetDeviceTypeOctet & 0xFF;

    const isClockGated = (rawPeriod === 0n);

    const periodInNanoseconds = Number(rawPeriod) / 4294967296;

    let canvasPresetColorId = "5";
    let qemuClockModelType   = "STANDARD_CLOCK_TREE_NODE";

    if (isClockGated) {
      qemuClockModelType   = "GATED_INACTIVE_CLOCK_SOURCE";
      canvasPresetColorId = "1";
    } else if (deviceType === 0) {
      qemuClockModelType   = "MAIN_MACHINE_CLOCK_SOURCE";
      canvasPresetColorId = "6";
    } else {
      qemuClockModelType   = "DEVICE_INTERCONNECT_CONNECTED";
      canvasPresetColorId = "4";
    }

    const simulatedAdderResult = computeCla4Bit(Number(rawPeriod & 0x0Fn), deviceType & 0x0F, 1);

    return {
      accepted: (!isClockGated || deviceType !== 0),
      qemuClockModelType,
      periodInNanoseconds,
      isClockGated,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(BigInt(rowData.NN) % BigInt(SUPERIOR_COMPOSITE_LCM))
    };
  }
}

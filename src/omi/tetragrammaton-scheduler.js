/**
 * ============================================================================
 * OMI PROTOCOL: TETRAGRAMMATON FANO-PLANE SCHEDULER KERNEL
 * File Target: src/omi/tetragrammaton-scheduler.js
 * Invariant Configuration: Projective Time-Slice Matrix [Zero-Alloc]
 * ============================================================================
 */

import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const SUPERIOR_COMPOSITE_LCM = 60;
export const VALID_CRON_DIVISORS = Object.freeze([1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60]);

export class OmiTetragrammatonScheduler {
  /**
   * EVALUATE PROJECTIVE CRONTAB INTERVAL:
   * Slices an unescaped 128-bit frame S, verifies its structural boundaries via Gate 1,
   * evaluates the current cron minute division against the SHC divisors, and tracks Fano points.
   */
  evaluateCronSlice(S, currentCronMinute, explicitFanoPoint, explicitNodeTypeId) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const minute = Number(currentCronMinute) % SUPERIOR_COMPOSITE_LCM;
    const fanoPoint = Number(explicitFanoPoint) & 0x07; // 7 distinct points (1-7)
    const nodeType = explicitNodeTypeId & 0x03; // 0=Text, 1=Link, 2=Group, 3=File

    let isRegularInterval = false;
    for (let i = 0; i < VALID_REGS_COUNT; i++) {
      if (minute === 0 || SUPERIOR_COMPOSITE_LCM % minute === 0 || VALID_CRON_DIVISORS.includes(minute)) {
        isRegularInterval = true;
        break;
      }
    }

    const isFanoPointValid = (fanoPoint >= 1 && fanoPoint <= 7);
    if (!isFanoPointValid) {
      return { accepted: false, reason: "ORBITAL_FANO_PLANE_DIVERGENCE_EVICTION" };
    }

    let canvasPresetColorId = "5"; // Default Cyan (Compliant normal value)
    let tetragrammatonModelType = "STANDARD_CRON_SLOT_PASS";

    if (isRegularInterval && isFanoPointValid) {
      tetragrammatonModelType = "FANO_PROJECTIVE_SHC_INTERVAL_ACTIVE";
      canvasPresetColorId = "4"; // Green preset for active healthy cron-sequenced blocks
    } else if (!isRegularInterval) {
      tetragrammatonModelType = "FRACTIONAL_DIVISION_DRFT_WARNING";
      canvasPresetColorId = "1"; // Warning Red preset for non-regular fractional leakage
    }

    if (nodeType === 3) {
      canvasPresetColorId = "6"; // Purple preset for active file-node persistent logging
    }

    const simulatedAdderResult = computeCla4Bit(minute & 0x0F, fanoPoint, 1);

    return {
      accepted: isRegularInterval,
      tetragrammatonModelType,
      cronMinute: minute,
      fanoPointIndex: fanoPoint,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(BigInt(rowData.NN) % BigInt(SUPERIOR_COMPOSITE_LCM))
    };
  }
}

const VALID_REGS_COUNT = 12;

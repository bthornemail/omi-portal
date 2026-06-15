import { OmiQemuClockKernel } from "../omi/qemu-clock.js";
import { normalizeClock } from "./omi-emmc-layout.js";
import { resolveGedGauge } from "./omi-ged-gauge-map.js";

export class OmiQemuClockGovernor {
  constructor(options = {}) {
    this.kernel = options.kernel ?? new OmiQemuClockKernel();
  }

  evaluate(S, rawPeriod32BitValue, targetDeviceTypeOctet, options = {}) {
    const metrics = this.kernel.evaluateClockPeriod(S, rawPeriod32BitValue, targetDeviceTypeOctet);
    const clock = normalizeClock(options.clock ?? "cosmic");
    const gauge = resolveGedGauge({
      governor: options.governor ?? "RULES",
      band: options.band ?? "boot",
      clock: clock.id,
      offsetLane: options.offsetLane ?? "FS",
      clockSlot60: metrics.accepted ? metrics.timelineSlot : 0,
    });

    const gatedMainClock = metrics.isClockGated && Number(targetDeviceTypeOctet & 0xff) === 0;

    return Object.freeze({
      accepted: metrics.accepted && !gatedMainClock,
      reason: gatedMainClock ? "GATED_MAIN_CLOCK_CANNOT_ACCEPT_RECEIPT" : metrics.reason,
      qemuClockModelType: metrics.qemuClockModelType,
      periodInNanoseconds: metrics.periodInNanoseconds,
      isClockGated: metrics.isClockGated,
      canvasPresetColorId: metrics.canvasPresetColorId,
      simulatedAdderResult: metrics.simulatedAdderResult,
      clockSlot60: metrics.timelineSlot ?? 0,
      local240: gauge.local240,
      slot5040: gauge.slot5040,
      governor: gauge.governor,
      exponent: gauge.exponent,
      band: gauge.band,
      clock: gauge.clock,
      clockName: gauge.clockName,
      partition: gauge.partition,
      polynomial: gauge.polynomial,
      offsetLane: gauge.offsetLane,
      offsetMask: gauge.offsetMask,
    });
  }
}

export function evaluateQemuClockGovernor(S, rawPeriod32BitValue, targetDeviceTypeOctet, options = {}) {
  return new OmiQemuClockGovernor(options).evaluate(
    S,
    rawPeriod32BitValue,
    targetDeviceTypeOctet,
    options
  );
}

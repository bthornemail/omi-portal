import {
  EMMC_BANDS,
  EMMC_CLOCKS,
  EMMC_OFFSET_LANES,
  normalizeBand,
  normalizeClock,
  normalizeGovernor,
  normalizeOffsetLane,
  projectEmmcSlot,
} from "./omi-emmc-layout.js";
import { governorPlaneForRoot, EMMC_POLYHARMONIC_PLANES } from "./omi-emmc-polyharmonic-governor.js";
import { extractGaugeLane, decodeSelector } from "./omi-ged-event-selector.js";
import { sealedGauge, GAUGE } from "../omi/sealed-gauge-word.js";

export const GED_DIMENSION_LABELS = Object.freeze({
  FACTS: "inverse-ground",
  RULES: "genesis-equality",
  CLOSURES: "sequence-line",
  COMBINATORS: "quadratic-surface",
  CONS: "cubic-body",
});

export function buildGedGaugeMap() {
  const rows = [];
  for (const governor of EMMC_POLYHARMONIC_PLANES) {
    for (const band of EMMC_BANDS) {
      for (const clock of Object.values(EMMC_CLOCKS)) {
        for (const lane of EMMC_OFFSET_LANES) {
          const projection = projectEmmcSlot({
            clockSlot60: 0,
            offsetLane: lane.lane,
            governor: governor.governor,
            band: band.id,
          });
          rows.push(Object.freeze({
            governor: governor.governor,
            exponent: governor.exponent,
            dimension: GED_DIMENSION_LABELS[governor.governor],
            band: band.id,
            bandIndex: band.index,
            clock: clock.id,
            clockName: clock.name,
            polynomial: clock.polynomial,
            partition: clock.partition,
            offsetLane: lane.lane,
            offsetMask: lane.mask,
            local240Base: projection.local240,
            slot5040Base: projection.slot5040,
          }));
        }
      }
    }
  }
  return Object.freeze(rows);
}

export function resolveGedGauge({
  governor = "RULES",
  band = "boot",
  clock = "cosmic",
  offsetLane = "FS",
  clockSlot60 = 0,
} = {}) {
  const governorPlane = governorPlaneForRoot(normalizeGovernor(governor));
  const bandRecord = normalizeBand(band);
  const clockRecord = normalizeClock(clock);
  const laneRecord = normalizeOffsetLane(offsetLane);
  const projection = projectEmmcSlot({
    clockSlot60,
    offsetLane: laneRecord.lane,
    governor: governorPlane.governor,
    band: bandRecord.id,
  });
  return Object.freeze({
    ...projection,
    exponent: governorPlane.exponent,
    dimension: GED_DIMENSION_LABELS[governorPlane.governor],
    clock: clockRecord.id,
    clockName: clockRecord.name,
    polynomial: clockRecord.polynomial,
    partition: clockRecord.partition,
    bandRange: bandRecord.range,
  });
}

export function resolveGedSelectorGauge(selector) {
  const gaugeLane = extractGaugeLane(selector);
  if (!gaugeLane) return null;
  return Object.freeze({
    selectorBits: decodeSelector(selector),
    gaugeLane,
    gaugeToken: GAUGE[gaugeLane].token,
    sealedGaugeWord: sealedGauge(gaugeLane),
  });
}

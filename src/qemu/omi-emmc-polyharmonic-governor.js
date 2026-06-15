import {
  EMMC_GOVERNOR_ORDER,
  EMMC_OFFSET_LANES,
  normalizeGovernor,
  projectEmmcSlot,
  resolveEmmcPlane,
} from "./omi-emmc-layout.js";
import {
  POLYHARMONIC_GOVERNORS,
  governorForRoot,
  isInverseGovernorPair,
} from "../omi/tetragrammatron-polyharmonic-governor.js";

export const EMMC_POLYHARMONIC_PLANES = Object.freeze(
  EMMC_GOVERNOR_ORDER.map((governor, index) => {
    const record = POLYHARMONIC_GOVERNORS[governor];
    return Object.freeze({
      governor,
      root: record.root,
      compiled: record.root.replace(/\.omi$/i, ".imo"),
      oPlane: record.root.replace(/\.omi$/i, ".o"),
      index,
      exponent: record.exponent,
      name: record.governor,
      role: record.role,
      inverseOf: record.inverseOf ?? null,
    });
  })
);

export function governorPlaneForRoot(rootName) {
  const governor = governorForRoot(rootName);
  if (!governor) throw new RangeError(`Unknown polyharmonic governor root: ${rootName}`);
  return EMMC_POLYHARMONIC_PLANES.find((plane) => plane.root === governor.root);
}

export function governorPlaneForIndex(index) {
  const n = Number(index);
  if (!Number.isInteger(n) || n < 0 || n >= EMMC_POLYHARMONIC_PLANES.length) {
    throw new RangeError(`Polyharmonic governor index out of range: ${index}`);
  }
  return EMMC_POLYHARMONIC_PLANES[n];
}

export function governorPlaneAddress({
  governor = "RULES",
  clock = "cosmic",
  offsetLane = "FS",
  band = "boot",
  clockSlot60 = 0,
  layout,
} = {}) {
  const key = normalizeGovernor(governor);
  const plane = resolveEmmcPlane(key, layout);
  const projection = projectEmmcSlot({ clockSlot60, offsetLane, governor: key, band });
  return Object.freeze({
    ...projection,
    clock,
    planeOffset: plane.offset,
    planePayloadBytes: plane.payloadBytes,
    planeName: plane.oPlane,
  });
}

export function validatePolyharmonicEmmcGovernor() {
  const roots = EMMC_POLYHARMONIC_PLANES.map((plane) => plane.root);
  const exponents = EMMC_POLYHARMONIC_PLANES.map((plane) => plane.exponent);
  return Object.freeze({
    accepted: true,
    roots,
    exponents,
    offsetLanes: EMMC_OFFSET_LANES.map((lane) => lane.lane),
    factsConsInverse: isInverseGovernorPair("FACTS", "CONS"),
    note: "four offsets are lanes, not roots",
  });
}

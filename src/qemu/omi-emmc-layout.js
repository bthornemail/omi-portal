export const EMMC_BLOCK_BYTES = 512;
export const EMMC_HISTORY_SLOTS = 5040;
export const EMMC_PLANE_PAYLOAD_BYTES = EMMC_HISTORY_SLOTS * 8;
export const EMMC_O_WORD_BYTES = 32;
export const EMMC_PLANE_RESERVED_BYTES = EMMC_PLANE_PAYLOAD_BYTES - EMMC_O_WORD_BYTES;
export const EMMC_PLANE_DESCRIPTOR_BYTES = 128;
export const EMMC_PLANE_HEADER_BYTES = EMMC_PLANE_DESCRIPTOR_BYTES;
export const EMMC_PLANE_O_RECORD_OFFSET = EMMC_PLANE_DESCRIPTOR_BYTES;
export const EMMC_PLANE_RECORD_BYTES = EMMC_PLANE_DESCRIPTOR_BYTES + EMMC_PLANE_PAYLOAD_BYTES;
export const EMMC_PLANE_ALIGNED_BYTES = alignToBlock(EMMC_PLANE_RECORD_BYTES);
export const EMMC_PLANE_PADDING_BYTES = EMMC_PLANE_ALIGNED_BYTES - EMMC_PLANE_RECORD_BYTES;

export const EMMC_MAGIC = "OMIEMMC0";
export const EMMC_LAYOUT_VERSION = 1;

export const EMMC_GOVERNOR_ORDER = Object.freeze([
  "FACTS",
  "RULES",
  "CLOSURES",
  "COMBINATORS",
  "CONS",
]);

export const EMMC_BANDS = Object.freeze([
  { id: "boot", index: 0, range: "0x00..0x1F", role: "bootkernel tetragrammatron" },
  { id: "runtime", index: 1, range: "0x20..0x3F", role: "system runtime tetragrammatron" },
  { id: "userspace", index: 2, range: "0x40..0x5F", role: "userspace tetragrammatron" },
]);

export const EMMC_OFFSET_LANES = Object.freeze([
  { lane: "FS", mask: 0x0001, index: 0, role: "source/frame seed lane" },
  { lane: "GS", mask: 0x0010, index: 1, role: "group/generator lane" },
  { lane: "RS", mask: 0x0100, index: 2, role: "relation/receipt lane" },
  { lane: "US", mask: 0x1000, index: 3, role: "unit/userspace lane" },
]);

export const EMMC_CLOCKS = Object.freeze({
  atomic: Object.freeze({
    id: "atomic",
    name: "Atomic Logic Clock",
    polynomial: "4y²",
    partition: "boot1",
    plane: "low",
    role: "carry/cell clock",
  }),
  spectral: Object.freeze({
    id: "spectral",
    name: "Spectral Observer Clock",
    polynomial: "16xy",
    partition: "bridge",
    plane: "bridge",
    role: "observer high/low bridge",
  }),
  cosmic: Object.freeze({
    id: "cosmic",
    name: "Cosmic Orbit Clock",
    polynomial: "60x²",
    partition: "boot0",
    plane: "high",
    role: "block orbit clock",
  }),
});

function freezeDeep(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
}

export function alignToBlock(byteLength, blockBytes = EMMC_BLOCK_BYTES) {
  const bytes = Number(byteLength);
  const block = Number(blockBytes);
  if (!Number.isInteger(bytes) || bytes < 0) {
    throw new RangeError(`Invalid byte length: ${byteLength}`);
  }
  if (!Number.isInteger(block) || block <= 0) {
    throw new RangeError(`Invalid block size: ${blockBytes}`);
  }
  return Math.ceil(bytes / block) * block;
}

export function normalizeGovernor(value) {
  const key = String(value ?? "").replace(/\.o(?:mi)?$/i, "").trim().toUpperCase();
  if (!EMMC_GOVERNOR_ORDER.includes(key)) {
    throw new RangeError(`Unknown eMMC governor: ${value}`);
  }
  return key;
}

export function governorIndex(value) {
  return EMMC_GOVERNOR_ORDER.indexOf(normalizeGovernor(value));
}

export function normalizeBand(value = "boot") {
  const key = String(value ?? "").trim().toLowerCase();
  const band = EMMC_BANDS.find((entry) => entry.id === key);
  if (!band) throw new RangeError(`Unknown eMMC band: ${value}`);
  return band;
}

export function normalizeOffsetLane(value = "FS") {
  if (typeof value === "number") {
    const byMask = EMMC_OFFSET_LANES.find((entry) => entry.mask === value);
    if (byMask) return byMask;
  }
  const key = String(value ?? "").trim().toUpperCase();
  const lane = EMMC_OFFSET_LANES.find(
    (entry) => entry.lane === key || entry.mask.toString(16).padStart(4, "0") === key.replace(/^0X/i, "")
  );
  if (!lane) throw new RangeError(`Unknown eMMC offset lane: ${value}`);
  return lane;
}

export function normalizeClock(value = "cosmic") {
  const key = String(value ?? "").trim().toLowerCase();
  const aliases = {
    atomic_logic: "atomic",
    atomiclogic: "atomic",
    carry: "atomic",
    spectral_observer: "spectral",
    spectralobserver: "spectral",
    frame: "spectral",
    cosmic_orbit: "cosmic",
    cosmicorbit: "cosmic",
    phase: "cosmic",
  };
  const id = aliases[key] ?? key;
  if (!Object.hasOwn(EMMC_CLOCKS, id)) throw new RangeError(`Unknown eMMC clock: ${value}`);
  return EMMC_CLOCKS[id];
}

export function projectEmmcSlot({
  clockSlot60 = 0,
  offsetLane = "FS",
  governor = "RULES",
  band = "boot",
} = {}) {
  const slot60 = Number(clockSlot60);
  if (!Number.isInteger(slot60) || slot60 < 0 || slot60 >= 60) {
    throw new RangeError(`clockSlot60 must be an integer in 0..59: ${clockSlot60}`);
  }
  const lane = normalizeOffsetLane(offsetLane);
  const bandRecord = normalizeBand(band);
  const gIndex = governorIndex(governor);
  const local240 = (slot60 * EMMC_OFFSET_LANES.length + lane.index) % 240;
  const slot5040 = gIndex * 720 + bandRecord.index * 240 + local240;
  return {
    local240,
    slot5040,
    clockSlot60: slot60,
    offsetLane: lane.lane,
    offsetMask: lane.mask,
    offsetIndex: lane.index,
    governor: normalizeGovernor(governor),
    governorIndex: gIndex,
    band: bandRecord.id,
    bandIndex: bandRecord.index,
  };
}

export function createEmmcLayout() {
  const boot0Offset = 0;
  const boot1Offset = boot0Offset + EMMC_BLOCK_BYTES;
  const rpmbOffset = boot1Offset + EMMC_BLOCK_BYTES;
  const userdataOffset = rpmbOffset + EMMC_BLOCK_BYTES;

  const planes = EMMC_GOVERNOR_ORDER.map((governor, index) => {
    const offset = userdataOffset + index * EMMC_PLANE_ALIGNED_BYTES;
    return {
      governor,
      root: `${governor}.omi`,
      compiled: `${governor}.imo`,
      oPlane: `${governor}.o`,
      index,
      offset,
      byteLength: EMMC_PLANE_ALIGNED_BYTES,
      payloadBytes: EMMC_PLANE_PAYLOAD_BYTES,
      activePayloadBytes: EMMC_O_WORD_BYTES,
      reservedPayloadBytes: EMMC_PLANE_RESERVED_BYTES,
      descriptorBytes: EMMC_PLANE_DESCRIPTOR_BYTES,
      recordBytes: EMMC_PLANE_RECORD_BYTES,
      paddingBytes: EMMC_PLANE_PADDING_BYTES,
      headerBytes: EMMC_PLANE_HEADER_BYTES,
      oRecordOffset: offset + EMMC_PLANE_O_RECORD_OFFSET,
      payloadOffset: offset + EMMC_PLANE_DESCRIPTOR_BYTES,
      blockStart: offset / EMMC_BLOCK_BYTES,
      blockCount: EMMC_PLANE_ALIGNED_BYTES / EMMC_BLOCK_BYTES,
    };
  });

  const userdataBytes = planes.length * EMMC_PLANE_ALIGNED_BYTES;
  const layout = {
    magic: EMMC_MAGIC,
    version: EMMC_LAYOUT_VERSION,
    blockBytes: EMMC_BLOCK_BYTES,
    historySlots: EMMC_HISTORY_SLOTS,
    planePayloadBytes: EMMC_PLANE_PAYLOAD_BYTES,
    oWordBytes: EMMC_O_WORD_BYTES,
    planeReservedBytes: EMMC_PLANE_RESERVED_BYTES,
    planeDescriptorBytes: EMMC_PLANE_DESCRIPTOR_BYTES,
    planeRecordBytes: EMMC_PLANE_RECORD_BYTES,
    planeAlignedBytes: EMMC_PLANE_ALIGNED_BYTES,
    planePaddingBytes: EMMC_PLANE_PADDING_BYTES,
    imageSizeFormula: "3*512 + 5*(128 + 5040*8) = 203776",
    totalBytes: userdataOffset + userdataBytes,
    reservedSlots: EMMC_HISTORY_SLOTS - EMMC_GOVERNOR_ORDER.length * EMMC_BANDS.length * 240,
    partitions: {
      boot0: {
        name: "boot0",
        offset: boot0Offset,
        byteLength: EMMC_BLOCK_BYTES,
        plane: "high",
        clock: "cosmic",
        clockName: EMMC_CLOCKS.cosmic.name,
        polynomial: EMMC_CLOCKS.cosmic.polynomial,
      },
      boot1: {
        name: "boot1",
        offset: boot1Offset,
        byteLength: EMMC_BLOCK_BYTES,
        plane: "low",
        clock: "atomic",
        clockName: EMMC_CLOCKS.atomic.name,
        polynomial: EMMC_CLOCKS.atomic.polynomial,
      },
      rpmb: {
        name: "RPMB",
        offset: rpmbOffset,
        byteLength: EMMC_BLOCK_BYTES,
        plane: "receipt",
        role: "monotone receipt plane",
      },
      userdata: {
        name: "userdata",
        offset: userdataOffset,
        byteLength: userdataBytes,
        plane: "o-carrier",
        role: "compiled .o governor planes",
      },
    },
    planes,
    offsetLanes: EMMC_OFFSET_LANES,
    bands: EMMC_BANDS,
    clocks: EMMC_CLOCKS,
  };

  return freezeDeep(layout);
}

export function resolveEmmcPlane(governor, layout = createEmmcLayout()) {
  const key = normalizeGovernor(governor);
  const plane = layout.planes.find((entry) => entry.governor === key);
  if (!plane) throw new RangeError(`No eMMC plane for governor: ${governor}`);
  return plane;
}

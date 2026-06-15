import { Buffer } from "node:buffer";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { stableJson } from "../core/deterministic-utils.js";
import { oFileToBinary } from "../omi/o-file-container.js";
import { compileOmiFile } from "../omilog/omi-imo-compiler.js";
import {
  EMMC_BLOCK_BYTES,
  EMMC_CLOCKS,
  EMMC_MAGIC,
  EMMC_O_WORD_BYTES,
  EMMC_PLANE_PAYLOAD_BYTES,
  EMMC_PLANE_RESERVED_BYTES,
  createEmmcLayout,
} from "./omi-emmc-layout.js";
import {
  EMMC_POLYHARMONIC_PLANES,
} from "./omi-emmc-polyharmonic-governor.js";
import {
  createRpmbReceipt,
  sha256Hex,
  verifyRpmbReceipt,
} from "./omi-emmc-rpmb-receipt.js";

function writeJsonBlock(image, offset, value, blockBytes = EMMC_BLOCK_BYTES) {
  const text = stableJson(value);
  const bytes = Buffer.from(text, "utf8");
  if (bytes.byteLength > blockBytes) {
    throw new RangeError(`eMMC JSON block exceeds ${blockBytes} bytes: ${bytes.byteLength}`);
  }
  bytes.copy(image, offset);
}

function readJsonBlock(image, offset, blockBytes = EMMC_BLOCK_BYTES) {
  const block = Buffer.from(image).subarray(offset, offset + blockBytes);
  const zero = block.indexOf(0);
  const text = block.subarray(0, zero === -1 ? block.length : zero).toString("utf8").trim();
  return text ? JSON.parse(text) : null;
}

function compactPlaneRecord(record) {
  return {
    m: EMMC_MAGIC,
    t: "p",
    g: record.governor,
    e: record.exponent,
    i: record.index,
    h: record.planeHash,
  };
}

function expandPlaneRecord(record, layoutPlane) {
  return {
    magic: record.m,
    type: record.t,
    governor: record.g,
    exponent: record.e,
    root: `${record.g}.omi`,
    compiled: `${record.g}.imo`,
    oPlane: `${record.g}.o`,
    index: record.i,
    planeHash: record.h,
    oWordHex: `0x${record.h}`,
    payloadBytes: layoutPlane.payloadBytes,
    descriptorBytes: layoutPlane.descriptorBytes,
    activePayloadBytes: layoutPlane.activePayloadBytes,
    reservedPayloadBytes: layoutPlane.reservedPayloadBytes,
    recordBytes: layoutPlane.recordBytes,
  };
}

function compactReceipt(receipt) {
  return {
    m: EMMC_MAGIC,
    t: "rpmb",
    c: receipt.counter,
    ar: receipt.acceptedRootHash,
    cf: receipt.causalFrontierHash,
    s: receipt.slot5040,
    l: receipt.local240,
    g: receipt.governor,
    e: receipt.exponent,
    om: receipt.offsetMask,
    cl: receipt.clock,
    rh: receipt.receiptHash,
  };
}

function expandReceipt(receipt) {
  return {
    magic: receipt.m,
    type: receipt.t,
    counter: receipt.c,
    acceptedRootHash: receipt.ar,
    causalFrontierHash: receipt.cf,
    slot5040: receipt.s,
    local240: receipt.l,
    governor: receipt.g,
    exponent: receipt.e,
    offsetMask: receipt.om,
    clock: receipt.cl,
    receiptHash: receipt.rh,
  };
}

function rootText(rootSources, plane) {
  const value =
    rootSources?.[plane.governor] ??
    rootSources?.[plane.root] ??
    rootSources?.[plane.root.toLowerCase()];
  if (typeof value !== "string") {
    throw new TypeError(`Missing OMI root source for ${plane.root}`);
  }
  return value;
}

export function buildVectorBundle(vectorSources = []) {
  const entries = [...vectorSources]
    .map((entry) => ({
      path: entry.path,
      hash: sha256Hex(entry.text ?? ""),
    }))
    .sort((a, b) => String(a.path).localeCompare(String(b.path)));
  return Object.freeze({
    entries,
    hash: sha256Hex(stableJson(entries)),
  });
}

export function buildOPlaneRecord({
  plane,
  sourceText,
  compiledImoText,
  vectorBundleHash,
  layoutPlane,
}) {
  const base = {
    governor: plane.governor,
    exponent: plane.exponent,
    root: plane.root,
    compiled: plane.compiled,
    oPlane: plane.oPlane,
    index: plane.index,
    sourceHash: sha256Hex(sourceText),
    imoHash: sha256Hex(compiledImoText),
    vectorBundleHash,
    payloadBytes: layoutPlane.payloadBytes,
  };
  const planeHash = sha256Hex(stableJson(base));
  const oWordHex = `0x${planeHash}`;
  return Object.freeze({ ...base, planeHash, oWordHex });
}

export async function buildOPlaneRecords({
  rootSources,
  vectorSources = [],
  compiledImoTexts = {},
  layout = createEmmcLayout(),
} = {}) {
  const vectorBundle = buildVectorBundle(vectorSources);
  const records = [];

  for (const plane of EMMC_POLYHARMONIC_PLANES) {
    const sourceText = rootText(rootSources, plane);
    const compiledImoText =
      compiledImoTexts[plane.governor] ??
      compiledImoTexts[plane.compiled] ??
      (await compileOmiFile(sourceText, { source: plane.root })).imoText;
    const layoutPlane = layout.planes.find((entry) => entry.governor === plane.governor);
    records.push(buildOPlaneRecord({
      plane,
      sourceText,
      compiledImoText,
      vectorBundleHash: vectorBundle.hash,
      layoutPlane,
    }));
  }

  return Object.freeze({ records: Object.freeze(records), vectorBundle });
}

export function computeAcceptedRootHash(planeRecords) {
  const reduced = planeRecords.map((record) => ({
    exponent: record.exponent,
    governor: record.governor,
    oWordHex: record.oWordHex,
    planeHash: record.planeHash,
  }));
  return sha256Hex(stableJson(reduced));
}

export function computeCausalFrontierHash({ acceptedRootHash, layout, vectorBundleHash }) {
  return sha256Hex(stableJson({
    acceptedRootHash,
    magic: layout.magic,
    totalBytes: layout.totalBytes,
    vectorBundleHash,
    version: layout.version,
  }));
}

export async function buildEmmcStateImage({
  rootSources,
  vectorSources = [],
  compiledImoTexts = {},
  counter = 1,
  governor = "RULES",
  clock = "cosmic",
  offsetLane = "FS",
  band = "boot",
  clockSlot60 = 0,
  layout = createEmmcLayout(),
} = {}) {
  const { records, vectorBundle } = await buildOPlaneRecords({
    rootSources,
    vectorSources,
    compiledImoTexts,
    layout,
  });
  const acceptedRootHash = computeAcceptedRootHash(records);
  const causalFrontierHash = computeCausalFrontierHash({
    acceptedRootHash,
    layout,
    vectorBundleHash: vectorBundle.hash,
  });
  const receipt = createRpmbReceipt({
    counter,
    acceptedRootHash,
    causalFrontierHash,
    governor,
    clock,
    offsetLane,
    band,
    clockSlot60,
  });

  const image = Buffer.alloc(layout.totalBytes);
  writeJsonBlock(image, layout.partitions.boot0.offset, {
    m: EMMC_MAGIC,
    t: "boot",
    p: "boot0",
    pl: "high",
    cl: EMMC_CLOCKS.cosmic.id,
    poly: EMMC_CLOCKS.cosmic.polynomial,
    role: "boot/high header",
  });
  writeJsonBlock(image, layout.partitions.boot1.offset, {
    m: EMMC_MAGIC,
    t: "boot",
    p: "boot1",
    pl: "low",
    cl: EMMC_CLOCKS.atomic.id,
    poly: EMMC_CLOCKS.atomic.polynomial,
    role: "boot/low header",
  });
  writeJsonBlock(image, layout.partitions.rpmb.offset, compactReceipt(receipt));

  for (const record of records) {
    const plane = layout.planes.find((entry) => entry.governor === record.governor);
    writeJsonBlock(image, plane.offset, compactPlaneRecord(record), plane.descriptorBytes);
    Buffer.from(oFileToBinary([BigInt(record.oWordHex)])).copy(image, plane.oRecordOffset);
  }

  return Object.freeze({
    image,
    layout,
    receipt,
    planeRecords: records,
    vectorBundle,
    acceptedRootHash,
    causalFrontierHash,
  });
}

export function parseEmmcStateImage(image, layout = createEmmcLayout()) {
  const bytes = Buffer.from(image);
  if (bytes.byteLength < layout.totalBytes) {
    throw new RangeError(`eMMC image too small: ${bytes.byteLength} < ${layout.totalBytes}`);
  }
  const boot0 = readJsonBlock(bytes, layout.partitions.boot0.offset);
  const boot1 = readJsonBlock(bytes, layout.partitions.boot1.offset);
  const rpmb = expandReceipt(readJsonBlock(bytes, layout.partitions.rpmb.offset));
  const planes = layout.planes.map((plane) => {
    const header = expandPlaneRecord(readJsonBlock(bytes, plane.offset, plane.descriptorBytes), plane);
    const word = bytes.subarray(plane.oRecordOffset, plane.oRecordOffset + 32).toString("hex");
    return { ...header, oRecordHex: `0x${word}`, offset: plane.offset };
  });
  return Object.freeze({
    layout,
    headers: Object.freeze({ boot0, boot1 }),
    rpmb,
    planes: Object.freeze(planes),
  });
}

export function verifyEmmcStateImage(image, layout = createEmmcLayout()) {
  const errors = [];
  let parsed;
  try {
    parsed = parseEmmcStateImage(image, layout);
  } catch (error) {
    return { accepted: false, errors: [error.message] };
  }

  if (parsed.headers.boot0?.m !== EMMC_MAGIC || parsed.headers.boot0?.cl !== "cosmic") {
    errors.push("boot0 high/cosmic header missing");
  }
  if (parsed.headers.boot1?.m !== EMMC_MAGIC || parsed.headers.boot1?.cl !== "atomic") {
    errors.push("boot1 low/atomic header missing");
  }
  if (parsed.rpmb?.magic !== EMMC_MAGIC || parsed.rpmb?.type !== "rpmb") {
    errors.push("RPMB receipt header missing");
  }

  const expectedGovernors = EMMC_POLYHARMONIC_PLANES.map((plane) => plane.governor);
  const actualGovernors = parsed.planes.map((plane) => plane.governor);
  if (stableJson(expectedGovernors) !== stableJson(actualGovernors)) {
    errors.push("userdata governor planes are out of order");
  }

  for (const plane of parsed.planes) {
    if (plane.payloadBytes !== EMMC_PLANE_PAYLOAD_BYTES) {
      errors.push(`${plane.governor} payload byte count is not ${EMMC_PLANE_PAYLOAD_BYTES}`);
    }
    if (plane.activePayloadBytes !== EMMC_O_WORD_BYTES) {
      errors.push(`${plane.governor} active payload byte count is not ${EMMC_O_WORD_BYTES}`);
    }
    if (plane.reservedPayloadBytes !== EMMC_PLANE_RESERVED_BYTES) {
      errors.push(`${plane.governor} reserved payload byte count is not ${EMMC_PLANE_RESERVED_BYTES}`);
    }
    if (plane.descriptorBytes !== 128) {
      errors.push(`${plane.governor} descriptor byte count is not 128`);
    }
    if (plane.oWordHex !== plane.oRecordHex) {
      errors.push(`${plane.governor} .o record hash does not match payload word`);
    }

    const layoutPlane = layout.planes.find((entry) => entry.governor === plane.governor);
    const payloadStart = layoutPlane.payloadOffset;
    const reservedStart = payloadStart + EMMC_O_WORD_BYTES;
    const payloadEnd = payloadStart + layoutPlane.payloadBytes;
    const reserved = Buffer.from(image).subarray(reservedStart, payloadEnd);
    if (reserved.some((byte) => byte !== 0)) {
      errors.push(`${plane.governor} reserved payload padding is not zero`);
    }
  }

  const acceptedRootHash = computeAcceptedRootHash(parsed.planes);
  if (acceptedRootHash !== parsed.rpmb.acceptedRootHash) {
    errors.push("RPMB accepted root hash does not match userdata plane hashes");
  }

  const receiptCheck = verifyRpmbReceipt(parsed.rpmb);
  if (!receiptCheck.accepted) errors.push(receiptCheck.reason);

  return { accepted: errors.length === 0, errors, parsed };
}

export async function readEmmcStateInputs({ rootDir = process.cwd() } = {}) {
  const rootSources = {};
  for (const plane of EMMC_POLYHARMONIC_PLANES) {
    rootSources[plane.governor] = await readFile(join(rootDir, plane.root), "utf8");
  }

  const vectorsDir = join(rootDir, "vectors");
  let vectorNames = [];
  try {
    vectorNames = (await readdir(vectorsDir))
      .filter((name) => name.endsWith(".omi"))
      .sort();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const vectorSources = await Promise.all(
    vectorNames.map(async (name) => ({
      path: `vectors/${name}`,
      text: await readFile(join(vectorsDir, name), "utf8"),
    }))
  );

  return { rootSources, vectorSources };
}

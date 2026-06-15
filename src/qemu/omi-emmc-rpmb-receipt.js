import { createHash } from "node:crypto";
import { stableJson } from "../core/deterministic-utils.js";
import {
  EMMC_CLOCKS,
  normalizeClock,
  normalizeGovernor,
  normalizeOffsetLane,
  projectEmmcSlot,
} from "./omi-emmc-layout.js";
import { governorPlaneForRoot } from "./omi-emmc-polyharmonic-governor.js";

const HASH_RE = /^[0-9a-f]{64}$/i;

export function sha256Hex(value) {
  const hash = createHash("sha256");
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    hash.update(value);
  } else {
    hash.update(String(value));
  }
  return hash.digest("hex");
}

function assertHash(name, value) {
  const text = String(value ?? "");
  if (!HASH_RE.test(text)) throw new TypeError(`${name} must be a 64-character SHA-256 hex string`);
  return text.toLowerCase();
}

function receiptPayload(receipt) {
  const {
    counter,
    acceptedRootHash,
    causalFrontierHash,
    slot5040,
    local240,
    governor,
    exponent,
    offsetMask,
    clock,
  } = receipt;
  return {
    acceptedRootHash,
    causalFrontierHash,
    clock,
    counter,
    exponent,
    governor,
    local240,
    offsetMask,
    slot5040,
  };
}

export function receiptHashFor(receipt) {
  return sha256Hex(stableJson(receiptPayload(receipt)));
}

export function createRpmbReceipt({
  counter = 1,
  acceptedRootHash,
  causalFrontierHash,
  slot5040,
  local240,
  governor = "RULES",
  exponent,
  offsetMask = 0x0001,
  offsetLane,
  clock = "cosmic",
  clockSlot60 = 0,
  band = "boot",
} = {}) {
  const normalizedGovernor = normalizeGovernor(governor);
  const plane = governorPlaneForRoot(normalizedGovernor);
  const lane = normalizeOffsetLane(offsetLane ?? offsetMask);
  const clockRecord = normalizeClock(clock);
  const projection =
    slot5040 == null || local240 == null
      ? projectEmmcSlot({
          clockSlot60,
          offsetLane: lane.lane,
          governor: normalizedGovernor,
          band,
        })
      : null;

  const receipt = {
    counter: Number(counter),
    acceptedRootHash: assertHash("acceptedRootHash", acceptedRootHash),
    causalFrontierHash: assertHash("causalFrontierHash", causalFrontierHash),
    slot5040: Number(slot5040 ?? projection.slot5040),
    local240: Number(local240 ?? projection.local240),
    governor: normalizedGovernor,
    exponent: Number(exponent ?? plane.exponent),
    offsetMask: lane.mask,
    clock: clockRecord.id,
  };

  if (!Number.isSafeInteger(receipt.counter) || receipt.counter < 0) {
    throw new RangeError(`RPMB receipt counter must be a non-negative integer: ${counter}`);
  }
  if (!Number.isInteger(receipt.slot5040) || receipt.slot5040 < 0 || receipt.slot5040 >= 5040) {
    throw new RangeError(`RPMB slot5040 out of range: ${receipt.slot5040}`);
  }
  if (!Number.isInteger(receipt.local240) || receipt.local240 < 0 || receipt.local240 >= 240) {
    throw new RangeError(`RPMB local240 out of range: ${receipt.local240}`);
  }
  if (!Object.hasOwn(EMMC_CLOCKS, receipt.clock)) {
    throw new RangeError(`RPMB clock is not an eMMC clock: ${receipt.clock}`);
  }

  return Object.freeze({ ...receipt, receiptHash: receiptHashFor(receipt) });
}

export function verifyRpmbReceipt(receipt) {
  if (!receipt || typeof receipt !== "object") {
    return { accepted: false, reason: "RPMB_RECEIPT_MISSING" };
  }
  try {
    const normalized = createRpmbReceipt(receipt);
    if (normalized.receiptHash !== String(receipt.receiptHash ?? "").toLowerCase()) {
      return { accepted: false, reason: "RPMB_RECEIPT_HASH_MISMATCH", expected: normalized.receiptHash };
    }
    return { accepted: true, receipt: normalized };
  } catch (error) {
    return { accepted: false, reason: "RPMB_RECEIPT_INVALID", error: error.message };
  }
}

export function compareRpmbReceipts(previous, next) {
  const nextCheck = verifyRpmbReceipt(next);
  if (!nextCheck.accepted) return nextCheck;
  if (!previous) return { accepted: true, reason: "RPMB_RECEIPT_INITIAL", receipt: nextCheck.receipt };

  const previousCheck = verifyRpmbReceipt(previous);
  if (!previousCheck.accepted) return previousCheck;

  if (nextCheck.receipt.counter < previousCheck.receipt.counter) {
    return {
      accepted: false,
      reason: "RPMB_COUNTER_DECREASED",
      previousCounter: previousCheck.receipt.counter,
      nextCounter: nextCheck.receipt.counter,
    };
  }

  if (
    nextCheck.receipt.counter === previousCheck.receipt.counter &&
    nextCheck.receipt.receiptHash !== previousCheck.receipt.receiptHash
  ) {
    return { accepted: false, reason: "RPMB_COUNTER_REPLAY_HASH_MISMATCH" };
  }

  return { accepted: true, reason: "RPMB_RECEIPT_MONOTONE", receipt: nextCheck.receipt };
}

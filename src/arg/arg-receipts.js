import { QuquartMachine } from "../omi/ququart-machine.js";
import { compileGenomeNode } from "./world-genome.js";

export function createAcceptReceipt(entity, topology) {
  const node = topology.getNode(entity.id);
  if (!node) return null;

  if (node.carrier == null) compileGenomeNode(node);

  const source = BigInt(node.carrier);
  const notationMask = source;
  const activeReading = source >> 128n;

  const result = mixCarrierToResult(source);
  const receipt = QuquartMachine.makeReceipt(source, notationMask, activeReading, result);

  node.receipt = {
    ...receipt,
    sourceHex: source.toString(16),
    action: "accept",
    timestamp: Date.now(),
    entityId: entity.id
  };

  return node.receipt;
}

export function createRejectReceipt(entity, topology) {
  const node = topology.getNode(entity.id);
  if (!node) return null;

  if (node.carrier == null) compileGenomeNode(node);

  const source = BigInt(node.carrier);
  const notationMask = source;
  const activeReading = source >> 128n;
  const result = mixCarrierToResult(source) ^ 0xDEADn;

  const receipt = QuquartMachine.makeReceipt(source, notationMask, activeReading, result);

  node.receipt = {
    ...receipt,
    sourceHex: source.toString(16),
    action: "reject",
    timestamp: Date.now(),
    entityId: entity.id
  };

  return node.receipt;
}

export function importReceipt(receipt, worldState) {
  if (!worldState || !receipt) return false;

  const entry = {
    receiptHash: receipt.receiptHash?.toString(16) || "0",
    sourceHex: receipt.sourceHex || "0",
    action: receipt.action || "unknown",
    timestamp: receipt.timestamp || Date.now(),
    entityId: receipt.entityId || null
  };

  if (typeof worldState.addReceipt === "function") {
    worldState.addReceipt(entry);
  } else if (Array.isArray(worldState.receipts)) {
    worldState.receipts.push(entry);
  } else if (Array.isArray(worldState)) {
    worldState.push(entry);
  }

  return true;
}

export function formatReceipt(receipt) {
  if (!receipt) return "null";
  return {
    receiptHash: receipt.receiptHash?.toString(16).padStart(16, "0") || "—",
    sourceHash: receipt.sourceHash?.toString(16).padStart(16, "0") || "—",
    notationHash: receipt.notationHash?.toString(16).padStart(16, "0") || "—",
    readingHash: receipt.readingHash?.toString(16).padStart(16, "0") || "—",
    resultHash: receipt.resultHash?.toString(16).padStart(16, "0") || "—",
    action: receipt.action || "—",
    timestamp: receipt.timestamp || "—",
    entityId: receipt.entityId || "—"
  };
}

function mixCarrierToResult(source) {
  let x = source & 0xFFFF_FFFF_FFFF_FFFFn;
  x ^= x >> 33n;
  x *= 0xFF51_AFD7_ED55_8CCDn;
  x &= 0xFFFF_FFFF_FFFF_FFFFn;
  x ^= x >> 33n;
  x *= 0xC4CE_B9FE_1A85_EC53n;
  x &= 0xFFFF_FFFF_FFFF_FFFFn;
  x ^= x >> 33n;
  return x;
}

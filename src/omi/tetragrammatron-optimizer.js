import { fnv1a32, stableJson } from "../core/deterministic-utils.js";
import {
  formatOmiAddressFromSegments,
  ingestSources
} from "./codebase-ingestion.js";
import { parseOmiDocument } from "./omi-parser.js";
import {
  TETRA_DESCRIPTOR,
  createTetragrammatronMemory,
  writeDescriptor,
  writeTetragrammatronReceipt
} from "./tetragrammatron-meta-memory.js";
import { parseNodeTestOutput } from "./tetragrammatron-modem.js";
import { workerRuntimeTick } from "./tetragrammatron-worker-runtime.js";

export const OPTIMIZER_ROOT_SEGMENT = 0x0c0e;
export const OPTIMIZER_RECEIPT_STATE = "candidate";

export const OPTIMIZER_KIND_SEVERITY = Object.freeze({
  failed_test: 100,
  malformed_omi: 90,
  duplicate_declaration: 70,
  slide_residue: 50,
  unsupported_surface: 30
});

export const OPTIMIZER_KIND_CODES = Object.freeze({
  failed_test: 0x0001,
  malformed_omi: 0x0002,
  duplicate_declaration: 0x0003,
  slide_residue: 0x0004,
  unsupported_surface: 0x0005
});

const DEFAULT_TOP = Infinity;

export function optimizeCodebase({ sources = [], testOutput = "", options = {} } = {}) {
  const ingestion = ingestSources(sources, options.ingestion || {});
  const parseCandidates = collectMalformedOmiCandidates({
    ...ingestion.documents,
    ...(options.omiDocuments || {})
  });
  const rawCandidates = [
    ...collectFailedTestCandidates(testOutput),
    ...parseCandidates,
    ...collectDuplicateCandidates(ingestion.records),
    ...collectSlideResidueCandidates(ingestion.records),
    ...collectUnsupportedSurfaceCandidates(options.skippedSources || [])
  ];

  const ranked = rankCandidates(rawCandidates);
  const top = normalizeTop(options.top ?? DEFAULT_TOP);
  const selected = Number.isFinite(top) ? ranked.slice(0, top) : ranked;
  const memory = options.memory || createTetragrammatronMemory();
  const events = [];
  const candidates = selected.map((candidate, index) => {
    const routed = routeCandidate(candidate, index);
    const admitted = admitCandidateToTetragrammatron(memory, routed, index, {
      timestamp: options.timestamp ?? index
    });
    events.push(admitted.event);
    return Object.freeze({
      ...routed,
      receipt: admitted.receipt.receipt,
      snapshot: admitted.snapshot
    });
  });
  const receipts = candidates.map((candidate) => candidate.receipt);
  const omiText = formatOptimizationOmi(candidates);

  return Object.freeze({
    summary: Object.freeze({
      sourceCount: ingestion.summary.sourceCount,
      ingestionRecordCount: ingestion.summary.recordCount,
      discoveredCandidateCount: ranked.length,
      candidateCount: candidates.length,
      top: Number.isFinite(top) ? top : null,
      severity: summarizeSeverity(candidates),
      kinds: summarizeKinds(candidates),
      receiptState: OPTIMIZER_RECEIPT_STATE,
      proposeOnly: true
    }),
    candidates,
    receipts,
    events,
    omiText
  });
}

export function collectFailedTestCandidates(testOutput = "") {
  return parseNodeTestOutput(testOutput)
    .filter((event) => event.status === "failed")
    .map((event) => baseCandidate({
      kind: "failed_test",
      confidence: 1,
      sourcePath: event.source || "test-output",
      line: 0,
      reason: `failed test: ${event.name}`,
      evidence: {
        id: event.id,
        suite: event.suite,
        name: event.name,
        raw: event.raw,
        durationMs: event.durationMs ?? null
      },
      proposedAction: "inspect failing test output, reproduce locally, and fix the underlying regression before accepting optimization"
    }));
}

export function collectMalformedOmiCandidates(documents = {}) {
  const candidates = [];
  for (const [source, text] of Object.entries(documents || {})) {
    const parsed = parseOmiDocument(text, { source });
    for (const malformed of parsed.malformed || []) {
      candidates.push(baseCandidate({
        kind: "malformed_omi",
        confidence: 1,
        sourcePath: source,
        line: malformed.line || 0,
        reason: `malformed OMI projection: ${malformed.reason}`,
        evidence: malformed,
        proposedAction: "repair generated OMI projection before treating this surface as optimization authority"
      }));
    }
  }
  return candidates;
}

export function collectDuplicateCandidates(records = []) {
  const groups = new Map();
  for (const record of records || []) {
    const key = [
      record.category,
      record.kind,
      record.name,
      normalizeSignature(record.signature)
    ].join("\u001f");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  const candidates = [];
  for (const recordsInGroup of groups.values()) {
    const distinctLocations = new Set(recordsInGroup.map((record) => `${record.sourcePath}:${record.line}`));
    if (distinctLocations.size < 2) continue;
    const first = recordsInGroup[0];
    candidates.push(baseCandidate({
      kind: "duplicate_declaration",
      confidence: 0.85,
      sourcePath: first.sourcePath,
      line: first.line,
      reason: `duplicate ${first.kind} declaration: ${first.name}`,
      evidence: {
        category: first.category,
        kind: first.kind,
        name: first.name,
        signature: first.signature,
        locations: [...distinctLocations].sort()
      },
      proposedAction: "compare duplicate declarations and consolidate, rename, or document intentional mirroring"
    }));
  }
  return candidates;
}

export function collectSlideResidueCandidates(records = []) {
  return (records || [])
    .filter((record) => record.cell?.surrogate === 1 || record.cell?.suboptimal === 1)
    .map((record) => baseCandidate({
      kind: "slide_residue",
      confidence: record.cell?.surrogate === 1 ? 0.75 : 0.6,
      sourcePath: record.sourcePath,
      line: record.line,
      reason: `slide residue on ${record.kind}: ${record.name}`,
      evidence: {
        category: record.category,
        kind: record.kind,
        name: record.name,
        address: record.address,
        delta: record.cell?.delta,
        surrogate: record.cell?.surrogate,
        suboptimal: record.cell?.suboptimal,
        telemetry: record.telemetry
      },
      proposedAction: "review the structural element for unstable scope, over-broad binding, or missing closure"
    }));
}

export function collectUnsupportedSurfaceCandidates(skippedSources = []) {
  return (skippedSources || []).map((source) => {
    const path = typeof source === "string" ? source : source.path;
    const reason = typeof source === "string" ? "unsupported source surface" : source.reason || "unsupported source surface";
    return baseCandidate({
      kind: "unsupported_surface",
      confidence: 0.5,
      sourcePath: path || "unknown",
      line: 0,
      reason,
      evidence: source,
      proposedAction: "decide whether this surface needs an ingestion adapter or should remain outside optimizer scope"
    });
  });
}

export function rankCandidates(candidates = []) {
  return (candidates || [])
    .map(finalizeCandidate)
    .sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      if (a.sourcePath !== b.sourcePath) return a.sourcePath.localeCompare(b.sourcePath);
      if (a.line !== b.line) return a.line - b.line;
      return a.id.localeCompare(b.id);
    });
}

export function routeCandidate(candidate, index = 0) {
  const finalized = finalizeCandidate(candidate);
  const routeSeed = stableJson({
    id: finalized.id,
    kind: finalized.kind,
    severity: finalized.severity,
    sourcePath: finalized.sourcePath,
    line: finalized.line
  });
  const hA = fnv1a32(`route:A:${routeSeed}`);
  const hB = fnv1a32(`route:B:${routeSeed}`);
  const slot5040 = hA % 5040;
  const local240 = hB % 240;
  const address = composeOptimizationAddress(finalized, hA, hB);
  const telemetry = `optimizer kind=${finalized.kind} severity=${finalized.severity} slot5040=${slot5040} local240=${local240}`;

  return Object.freeze({
    ...finalized,
    address,
    telemetry,
    slot5040,
    local240,
    receiptState: OPTIMIZER_RECEIPT_STATE,
    route: Object.freeze({
      baseQ: hA & 0x03,
      fiberQ: (hA >>> 2) & 0x03,
      chart11: hB % 11,
      fano7: hA % 7,
      role3: hB % 3,
      polybiusRow: local240 % 5,
      polybiusCol: Math.floor(local240 / 5) % 5,
      workerId: (index % 31) + 1
    })
  });
}

export function admitCandidateToTetragrammatron(memory, candidate, index = 0, options = {}) {
  const routed = routeCandidate(candidate, index);
  const receipt64 = receipt64ForCandidate(routed);
  const route = routed.route;

  writeDescriptor(memory, TETRA_DESCRIPTOR.STATUS, 3);
  writeDescriptor(memory, TETRA_DESCRIPTOR.PAYLOAD_VIEW, 0);
  writeDescriptor(memory, TETRA_DESCRIPTOR.ERROR_CODE, 0);
  writeDescriptor(memory, TETRA_DESCRIPTOR.RECEIPT_STATE, 0);
  writeDescriptor(memory, TETRA_DESCRIPTOR.ACTIVE_PHASE, route.baseQ);
  writeDescriptor(memory, TETRA_DESCRIPTOR.POLYBIUS_ROW, route.polybiusRow);
  writeDescriptor(memory, TETRA_DESCRIPTOR.POLYBIUS_COL, route.polybiusCol);
  writeDescriptor(memory, TETRA_DESCRIPTOR.LOCAL240, routed.local240);
  writeDescriptor(memory, TETRA_DESCRIPTOR.SLOT5040, routed.slot5040);
  writeDescriptor(memory, TETRA_DESCRIPTOR.CHART11, route.chart11);
  writeDescriptor(memory, TETRA_DESCRIPTOR.BASE_Q, route.baseQ);
  writeDescriptor(memory, TETRA_DESCRIPTOR.FIBER_Q, route.fiberQ);
  writeDescriptor(memory, TETRA_DESCRIPTOR.FANO7, route.fano7);
  writeDescriptor(memory, TETRA_DESCRIPTOR.ROLE3, route.role3);
  writeDescriptor(memory, TETRA_DESCRIPTOR.CURSOR, routed.slot5040);
  writeTetragrammatronReceipt(memory, routed.slot5040, receipt64);

  return workerRuntimeTick(memory, {
    workerId: route.workerId,
    timestamp: Number(options.timestamp ?? index)
  });
}

export function formatOptimizationOmi(candidates = []) {
  const header = [
    "# ============================================================================",
    "# TETRAGRAMMATRON CODEBASE OPTIMIZER - PROPOSE-ONLY CANDIDATES",
    "# Generated review artifacts. Source code remains authoritative.",
    "# ============================================================================"
  ];
  const body = (candidates || []).map(formatOptimizationRecord);
  return `${header.concat(body).join("\n\n")}\n`;
}

export function formatOptimizationRecord(candidate) {
  const routed = routeCandidate(candidate);
  const receipt = candidate.receipt || routed.telemetry;
  return [
    `${routed.address}/128 SHOULD optimizer-${routed.kind}-${routed.id}`,
    `SOURCE: ${routed.sourcePath}:${routed.line}`,
    `STATE: ${routed.receiptState}`,
    `PROPERTY: ${sanitizeLine(routed.reason)}`,
    `KIND: ${routed.kind}`,
    `SEVERITY: ${routed.severity}`,
    `CONFIDENCE: ${routed.confidence}`,
    `ACTION: ${sanitizeLine(routed.proposedAction)}`,
    `EVIDENCE: ${sanitizeLine(stableJson(routed.evidence))}`,
    `RECEIPT: ${sanitizeLine(receipt)}`,
    `ROUTE: slot5040=${routed.slot5040} local240=${routed.local240}`
  ].join("\n");
}

export function receipt64ForCandidate(candidate) {
  const seed = stableJson({
    id: candidate.id,
    kind: candidate.kind,
    severity: candidate.severity,
    address: candidate.address,
    sourcePath: candidate.sourcePath,
    line: candidate.line,
    reason: candidate.reason
  });
  const hi = BigInt(fnv1a32(`receipt:hi:${seed}`));
  const lo = BigInt(fnv1a32(`receipt:lo:${seed}`));
  return BigInt.asIntN(64, (hi << 32n) | lo);
}

function baseCandidate(candidate) {
  return {
    ...candidate,
    severity: candidate.severity ?? OPTIMIZER_KIND_SEVERITY[candidate.kind] ?? 0,
    receiptState: OPTIMIZER_RECEIPT_STATE
  };
}

function finalizeCandidate(candidate) {
  const normalized = {
    kind: String(candidate.kind || "unsupported_surface"),
    severity: Number(candidate.severity ?? OPTIMIZER_KIND_SEVERITY[candidate.kind] ?? 0),
    confidence: clamp01(candidate.confidence ?? 0.5),
    sourcePath: normalizePath(candidate.sourcePath || "unknown"),
    line: Math.max(0, Number(candidate.line || 0) | 0),
    reason: String(candidate.reason || "optimization candidate"),
    evidence: candidate.evidence ?? {},
    proposedAction: String(candidate.proposedAction || "review candidate before making source changes"),
    receiptState: OPTIMIZER_RECEIPT_STATE
  };
  const id = candidate.id || candidateId(normalized);
  return Object.freeze({ ...normalized, id });
}

function candidateId(candidate) {
  return `opt-${fnv1a32(stableJson({
    kind: candidate.kind,
    severity: candidate.severity,
    sourcePath: candidate.sourcePath,
    line: candidate.line,
    reason: candidate.reason,
    evidence: candidate.evidence
  })).toString(36)}`;
}

function composeOptimizationAddress(candidate, hA, hB) {
  return formatOmiAddressFromSegments([
    OPTIMIZER_ROOT_SEGMENT,
    OPTIMIZER_KIND_CODES[candidate.kind] || 0x000f,
    candidate.severity & 0xffff,
    candidate.line & 0xffff,
    (hA >>> 16) & 0xffff,
    hA & 0xffff,
    (hB >>> 16) & 0xffff,
    hB & 0xffff
  ]);
}

function summarizeSeverity(candidates) {
  return Object.freeze({
    max: candidates.length ? Math.max(...candidates.map((candidate) => candidate.severity)) : 0,
    min: candidates.length ? Math.min(...candidates.map((candidate) => candidate.severity)) : 0
  });
}

function summarizeKinds(candidates) {
  const counts = {};
  for (const candidate of candidates) {
    counts[candidate.kind] = (counts[candidate.kind] || 0) + 1;
  }
  return Object.freeze(counts);
}

function normalizeSignature(signature) {
  return String(signature || "").replace(/\s+/g, " ").trim();
}

function normalizePath(path) {
  return String(path || "unknown").replace(/\\/g, "/").replace(/^\.\//, "");
}

function sanitizeLine(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function normalizeTop(top) {
  if (top === null || top === undefined || top === Infinity) return Infinity;
  const n = Number(top);
  if (!Number.isFinite(n) || n < 0) return Infinity;
  return Math.floor(n);
}

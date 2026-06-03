import { parseOmiDocument } from "../omi/omi-parser.js";
import { TRIAD_COUNT, resolveTriad } from "./triad-router155.js";
import {
  extractConsRRGGBBAALookups,
  validateMonotonicConsLookup
} from "./router-seeds.js";

export { TRIAD_COUNT };

export const TRIAD_MODE_PREFIX3 = "prefix3";
export const TRIAD_MODE_FULL8 = "full8";
export const TRIAD_MODES = Object.freeze([TRIAD_MODE_PREFIX3, TRIAD_MODE_FULL8]);

export const TRIAD_PLANE_REAL = "real";
export const TRIAD_PLANE_IMAGINARY = "imaginary";
export const TRIAD_BRANCH_REAL = "A";
export const TRIAD_BRANCH_IMAGINARY = "B";
export const TRIAD_REAL_TOWER = Object.freeze(["8!", "6!", "4!", "2!"]);
export const TRIAD_IMAGINARY_TOWER = Object.freeze(["7!", "5!", "3!", "1!"]);
export const TRIAD_REAL_GENERATOR = 0x7d;
export const TRIAD_IMAGINARY_GENERATOR = 0x7e;
export const DEFAULT_COREMAX_THRESHOLD = 0x8000;

const ADDRESS_RE = /^omi-((?:[0-9a-fA-F]{4}-){7}[0-9a-fA-F]{4})(?:\/\d{1,3}(?:\/[^\s]+)?)?$/;

function parseSegment(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value & 0xffff;
  if (typeof value === "string") {
    const text = value.trim().toLowerCase().replace(/^0x/, "");
    if (/^[0-9a-f]{1,4}$/.test(text)) return Number.parseInt(text, 16) & 0xffff;
  }
  return null;
}

export function lowByte(segment) {
  const value = parseSegment(segment);
  if (value === null) throw new TypeError(`Invalid OMI segment: ${segment}`);
  return value & 0xff;
}

export function normalizeTriadSegments(input) {
  if (!input) return null;

  if (Array.isArray(input) || ArrayBuffer.isView(input)) {
    const segments = Array.from(input).map(parseSegment);
    return segments.length === 8 && segments.every((segment) => segment !== null) ? segments : null;
  }

  if (typeof input === "string") {
    const match = input.trim().match(ADDRESS_RE);
    if (!match) return null;
    const segments = match[1].split("-").map(parseSegment);
    return segments.length === 8 && segments.every((segment) => segment !== null) ? segments : null;
  }

  if (Array.isArray(input.segments)) return normalizeTriadSegments(input.segments);
  if (Array.isArray(input.segmentHex)) return normalizeTriadSegments(input.segmentHex);
  if (typeof input.address === "string") return normalizeTriadSegments(input.address);
  if (input.head && typeof input.head.address === "string") return normalizeTriadSegments(input.head.address);

  return null;
}

export function triad155FromSegments(segmentsInput, mode = TRIAD_MODE_PREFIX3) {
  const segments = normalizeTriadSegments(segmentsInput);
  if (!segments) return null;
  const dispatchMode = TRIAD_MODES.includes(mode) ? mode : TRIAD_MODE_PREFIX3;
  const selected = dispatchMode === TRIAD_MODE_FULL8 ? segments : segments.slice(0, 3);
  return selected.reduce((sum, segment) => sum + lowByte(segment), 0) % TRIAD_COUNT;
}

export const computeTriadIndex = triad155FromSegments;

export function coreMaxFromSegments(segmentsInput) {
  const segments = normalizeTriadSegments(segmentsInput);
  if (!segments) return null;
  return Math.max(segments[3], segments[4], segments[5]);
}

export function determineTriadPlane(coreMax, threshold = DEFAULT_COREMAX_THRESHOLD) {
  const intensity = Number(coreMax);
  const ceiling = Number(threshold);
  if (!Number.isFinite(intensity) || !Number.isFinite(ceiling)) {
    throw new TypeError("coreMax and threshold must be numeric");
  }
  return intensity < ceiling ? TRIAD_PLANE_REAL : TRIAD_PLANE_IMAGINARY;
}

function planeDescriptor(plane) {
  const real = plane === TRIAD_PLANE_REAL;
  return {
    plane,
    branch: real ? TRIAD_BRANCH_REAL : TRIAD_BRANCH_IMAGINARY,
    tower: real ? Array.from(TRIAD_REAL_TOWER) : Array.from(TRIAD_IMAGINARY_TOWER),
    generator: real ? TRIAD_REAL_GENERATOR : TRIAD_IMAGINARY_GENERATOR,
    memorySlot: real ? "real:A" : "imaginary:B",
    isolation: {
      real: real ? "real:A" : null,
      imaginary: real ? null : "imaginary:B"
    }
  };
}

export function evaluateTriadDispatch(input, options = {}) {
  const mode = options.triadMode || options.mode || TRIAD_MODE_PREFIX3;
  const threshold = options.threshold ?? DEFAULT_COREMAX_THRESHOLD;
  const segments = normalizeTriadSegments(input);
  if (!segments) return null;

  const triadIndex = triad155FromSegments(segments, mode);
  const diagnosticFull8 = triad155FromSegments(segments, TRIAD_MODE_FULL8);
  const resolved = resolveTriad(triadIndex);
  const coreMax = coreMaxFromSegments(segments);
  const plane = determineTriadPlane(coreMax, threshold);
  const planeMeta = planeDescriptor(plane);

  return {
    mode: TRIAD_MODES.includes(mode) ? mode : TRIAD_MODE_PREFIX3,
    modulus: TRIAD_COUNT,
    triadIndex,
    diagnosticFull8,
    category: resolved?.category ?? null,
    localIndex: resolved?.localIndex ?? null,
    globalIndex: resolved?.globalIndex ?? triadIndex,
    coreMax,
    threshold,
    authority: "secondary-index",
    forbids: ["triad-reorders-primary-rrggbbaa-key", "triad-validates-lower-body"],
    ...planeMeta
  };
}

export function deriveTriadDispatch(parsed, options = {}) {
  const records = Array.isArray(parsed) ? parsed : (parsed?.records || []);
  return records.map((record) => ({
    record,
    address: record.address || record.head?.address || null,
    assignment: record.assignment || null,
    keyword: record.keyword || null,
    dispatch: evaluateTriadDispatch(record, options)
  }));
}

export function auditConsTriadDispatch(consSource, options = {}) {
  const parsed = typeof consSource === "string"
    ? parseOmiDocument(consSource, { source: options.source || "CONS.omi" })
    : consSource;
  const records = parsed?.records || [];
  const lookups = extractConsRRGGBBAALookups(records);
  const monotonic = validateMonotonicConsLookup(lookups);
  const entries = lookups.map((lookup) => {
    const dispatch = evaluateTriadDispatch(lookup.record, options);
    const hasTriadSourceBlock = /\(triad-dispatch\s+\./.test(lookup.raw);
    const valid = Boolean(dispatch) && dispatch.triadIndex >= 0 && dispatch.triadIndex < TRIAD_COUNT;
    return {
      assignment: lookup.assignment,
      address: lookup.address,
      rrggbbaaHex: lookup.rrggbbaaHex,
      dispatch,
      hasTriadSourceBlock,
      valid
    };
  });
  const violations = [
    ...monotonic.violations.map((violation) => ({
      type: "monotonicity",
      reason: violation.reason,
      current: violation.current?.assignment,
      previous: violation.previous?.assignment
    })),
    ...entries
      .filter((entry) => !entry.valid)
      .map((entry) => ({
        type: "triad-dispatch",
        reason: "CONS lookup record did not produce a valid triad dispatch",
        assignment: entry.assignment
      })),
    ...(options.requireSourceBlocks
      ? entries
        .filter((entry) => !entry.hasTriadSourceBlock)
        .map((entry) => ({
          type: "source-block",
          reason: "CONS lookup record is missing triad-dispatch source metadata",
          assignment: entry.assignment
        }))
      : [])
  ];
  return {
    valid: violations.length === 0,
    mode: options.triadMode || options.mode || TRIAD_MODE_PREFIX3,
    count: entries.length,
    monotonic: monotonic.valid,
    entries,
    violations
  };
}

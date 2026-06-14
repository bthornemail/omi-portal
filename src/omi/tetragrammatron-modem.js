import { fnv1a32 } from "../core/deterministic-utils.js";
import { parseOmiDocument } from "../omi/omi-parser.js";
import { tetragrammatronGeometryRoute } from "../omi/tetragrammatron-geometry-router.js";
import { packOWord, unpackOWord } from "../omi/o-bitboard.js";
import { packOFile, unpackOFile } from "../omi/o-file-container.js";

// ── Types (JSDoc) ──────────────────────────────────────────────

/**
 * @typedef {Object} OmiTestEvent
 * @property {string} id
 * @property {string|null} suite
 * @property {string} name
 * @property {"passed"|"failed"|"skipped"|"todo"|"running"} status
 * @property {number} [durationMs]
 * @property {string} raw
 * @property {"node-test"|"make"|"qemu"|"mcrsgsp"|"unknown"} source
 */

/**
 * @typedef {Object} OmiModemFrame
 * @property {OmiTestEvent} event
 * @property {string} omi
 * @property {string} imo
 * @property {"candidate"|"accepted"|"rejected"} receiptState
 */

// ── Helpers ────────────────────────────────────────────────────

function stableId(text) {
  return fnv1a32(text).toString(36);
}

function makeModemAddress(event, index) {
  const hash = fnv1a32(`${event.id}:${event.source}:${index}`);
  const seg = (n) => ((hash >> (n * 4)) & 0xFFFF).toString(16).padStart(4, "0");
  return `omi-${seg(0)}-${seg(1)}-${seg(2)}-${seg(3)}-${seg(4)}-${seg(5)}-${seg(6)}-${seg(7)}/128`;
}

function keywordForStatus(status) {
  switch (status) {
    case "passed":  return "FACT";
    case "failed":  return "MUST_NOT";
    case "running": return "COMBINE";
    default:        return "FACT";
  }
}

function statusFromKeyword(keyword) {
  switch (keyword) {
    case "FACT":     return "passed";
    case "MUST_NOT": return "failed";
    case "COMBINE":  return "running";
    default:         return "candidate";
  }
}

// ── Parse test output into events ──────────────────────────────

export function parseNodeTestOutput(text) {
  const events = [];
  let currentSuite = null;

  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const suiteMatch = line.match(/^▶\s+(.+)$/);
    if (suiteMatch) {
      currentSuite = suiteMatch[1].trim();
      events.push({
        id: stableId(`suite:${currentSuite}`),
        suite: currentSuite,
        name: currentSuite,
        status: "running",
        raw: line,
        source: "node-test",
      });
      continue;
    }

    const passMatch = line.match(/^✔\s+(.+?)(?:\s+\(([\d.]+)ms\))?$/);
    if (passMatch) {
      events.push({
        id: stableId(`pass:${currentSuite}:${passMatch[1]}`),
        suite: currentSuite,
        name: passMatch[1].trim(),
        status: "passed",
        durationMs: passMatch[2] ? Number(passMatch[2]) : undefined,
        raw: line,
        source: "node-test",
      });
      continue;
    }

    const failMatch = line.match(/^✖\s+(.+?)(?:\s+\(([\d.]+)ms\))?$/);
    if (failMatch) {
      events.push({
        id: stableId(`fail:${currentSuite}:${failMatch[1]}`),
        suite: currentSuite,
        name: failMatch[1].trim(),
        status: "failed",
        durationMs: failMatch[2] ? Number(failMatch[2]) : undefined,
        raw: line,
        source: "node-test",
      });
    }
  }

  return events;
}

// ── Modulate event into omi---imo notation ─────────────────────

export function modulateTestEventToOmi(event, address) {
  const keyword = keywordForStatus(event.status);

  return [
    `${address} ${keyword} test:${event.status}:${event.id}`,
    `INPUT: ${event.source}`,
    `PROPERTY: ${event.name}`,
    event.suite ? `DERIVED_FROM: ${event.suite}` : null,
    `STATE: ${event.status}`,
    event.durationMs != null ? `TIMING: ${event.durationMs}ms` : null,
    "AUTHORITY: projection-only-until-receipt",
    "omi-",
    event.raw,
    "-imo",
  ].filter(Boolean).join("\n");
}

// ── Demodulate parsed record back to readable event ────────────

export function demodulateOmiRecord(record) {
  return {
    id: record.assignment,
    status: statusFromKeyword(record.keyword),
    name: record.sections?.PROPERTY || record.assignment,
    source: record.sections?.INPUT || "unknown",
    raw: record.sourceBlock?.raw || "",
  };
}

// ── Full modem round-trip pipeline ─────────────────────────────

export function modemRoundTripTestOutput(testOutput, options = {}) {
  const events = parseNodeTestOutput(testOutput || "");

  const frames = events.map((event, index) => {
    const address = makeModemAddress(event, index);
    const omi = modulateTestEventToOmi(event, address);

    const parsed = parseOmiDocument(omi, {
      source: options.source || "tetragrammatron-modem",
    });

    const demodulated = parsed.records.map(demodulateOmiRecord);

    return {
      event,
      address,
      omi,
      parsed,
      demodulated,
      receiptState: "candidate",
    };
  });

  return {
    eventCount: events.length,
    frames,
  };
}

// ── Status → geometry channel mapping ──────────────────────────

const STATUS_TO_CHANNEL = Object.freeze({
  passed:  "US",
  failed:  "RS",
  running: "GS",
  skipped: "FS",
  todo:    "FS",
});

function statusToChannel(status) {
  return STATUS_TO_CHANNEL[status] ?? "FS";
}

function statusToStability(status) {
  switch (status) {
    case "passed":  return 1;
    case "failed":  return 0;
    case "running": return 0.5;
    default:        return 0.25;
  }
}

function nodeFromEvent(event, index) {
  return {
    channel: statusToChannel(event.status),
    id: event.id,
    label: event.name,
    controlCode: event.durationMs != null ? Math.round(event.durationMs) & 0xFF : index & 0xFF,
    wordnet: {
      relationCount: index,
      metric: { stability: statusToStability(event.status) },
      cells: { canonical: event.suite ?? "" },
    },
  };
}

// ── Integrate modem frames with geometry routing ───────────────

export function modemRoundTripToGeometryReceipts(testOutput, options = {}) {
  const { eventCount, frames } = modemRoundTripTestOutput(testOutput, options);

  const receiptFrames = frames.map((frame, index) => {
    const node = nodeFromEvent(frame.event, index);
    const geometry = tetragrammatronGeometryRoute(node, index);

    return {
      ...frame,
      node,
      geometry,
      qphase: `Q${geometry.baseQ}`,
      chart11: geometry.chart11,
      baseQ: geometry.baseQ,
      fiberQ: geometry.fiberQ,
      fano7: geometry.fano7,
      role3: geometry.role3,
      local240: geometry.local240,
      slot5040: geometry.slot5040,
      receiptState: frame.event.status === "passed" ? "accepted" : "candidate",
      qxy: geometry.qxy,
      thrustDirection: geometry.thrustDirection,
      polybius: geometry.polybius,
    };
  });

  return {
    eventCount,
    frames: receiptFrames,
    summary: {
      passed: receiptFrames.filter((f) => f.event.status === "passed").length,
      failed: receiptFrames.filter((f) => f.event.status === "failed").length,
      running: receiptFrames.filter((f) => f.event.status === "running").length,
      accepted: receiptFrames.filter((f) => f.receiptState === "accepted").length,
      candidate: receiptFrames.filter((f) => f.receiptState === "candidate").length,
    },
  };
}

// ── .o word bit-field constants ────────────────────────────────
// path (19 bits):
//   [baseQ:2][fiberQ:2][chart11:4][fano7:3][role3:2][reserved:6]
// surface (236 bits):
//   [status:2][receiptState:2][durationMs:16][local240:8][slot5040:13]
//   [idHash:32][nameHash:32][reserved:131]

const PATH_BASEQ_SHIFT = 0;
const PATH_BASEQ_BITS = 2;
const PATH_FIBERQ_SHIFT = 2;
const PATH_FIBERQ_BITS = 2;
const PATH_CHART11_SHIFT = 4;
const PATH_CHART11_BITS = 4;
const PATH_FANO7_SHIFT = 8;
const PATH_FANO7_BITS = 3;
const PATH_ROLE3_SHIFT = 11;
const PATH_ROLE3_BITS = 2;

const SURF_STATUS_SHIFT = 0;
const SURF_STATUS_BITS = 2;
const SURF_RCPT_SHIFT = 2;
const SURF_RCPT_BITS = 2;
const SURF_DURMS_SHIFT = 4;
const SURF_DURMS_BITS = 16;
const SURF_LOCAL240_SHIFT = 20;
const SURF_LOCAL240_BITS = 8;
const SURF_SLOT5040_SHIFT = 28;
const SURF_SLOT5040_BITS = 13;
const SURF_IDHASH_SHIFT = 41;
const SURF_IDHASH_BITS = 32;
const SURF_NAMEHASH_SHIFT = 73;
const SURF_NAMEHASH_BITS = 32;

function statusToCode(status) {
  switch (status) {
    case "passed":     return 0;
    case "failed":     return 1;
    case "running":    return 2;
    default:           return 3;
  }
}

function codeToStatus(code) {
  switch (code) {
    case 0:  return "passed";
    case 1:  return "failed";
    case 2:  return "running";
    default: return "candidate";
  }
}

function rcptToCode(state) {
  switch (state) {
    case "accepted":   return 1;
    case "rejected":   return 2;
    default:           return 0;
  }
}

function codeToRcpt(code) {
  switch (code) {
    case 1:  return "accepted";
    case 2:  return "rejected";
    default: return "candidate";
  }
}

function packModemPath(frame) {
  let path = 0;
  path |= (frame.baseQ & ((1 << PATH_BASEQ_BITS) - 1)) << PATH_BASEQ_SHIFT;
  path |= (frame.fiberQ & ((1 << PATH_FIBERQ_BITS) - 1)) << PATH_FIBERQ_SHIFT;
  path |= (frame.chart11 & ((1 << PATH_CHART11_BITS) - 1)) << PATH_CHART11_SHIFT;
  path |= (frame.fano7 & ((1 << PATH_FANO7_BITS) - 1)) << PATH_FANO7_SHIFT;
  path |= (frame.role3 & ((1 << PATH_ROLE3_BITS) - 1)) << PATH_ROLE3_SHIFT;
  return path;
}

function unpackModemPath(path) {
  const mask = (n) => (1 << n) - 1;
  return {
    baseQ:  (path >> PATH_BASEQ_SHIFT)   & mask(PATH_BASEQ_BITS),
    fiberQ: (path >> PATH_FIBERQ_SHIFT)  & mask(PATH_FIBERQ_BITS),
    chart11: (path >> PATH_CHART11_SHIFT) & mask(PATH_CHART11_BITS),
    fano7:  (path >> PATH_FANO7_SHIFT)   & mask(PATH_FANO7_BITS),
    role3:  (path >> PATH_ROLE3_SHIFT)   & mask(PATH_ROLE3_BITS),
  };
}

function packModemSurface(frame) {
  let surf = 0n;
  const toInt = (v) => Math.round(Number(v) || 0);
  const setField = (shift, bits, value) => {
    const mask = (1n << BigInt(bits)) - 1n;
    surf |= (BigInt(toInt(value)) & mask) << BigInt(shift);
  };
  setField(SURF_STATUS_SHIFT, SURF_STATUS_BITS, statusToCode(frame.event.status));
  setField(SURF_RCPT_SHIFT, SURF_RCPT_BITS, rcptToCode(frame.receiptState));
  setField(SURF_DURMS_SHIFT, SURF_DURMS_BITS, frame.event.durationMs ?? 0);
  setField(SURF_LOCAL240_SHIFT, SURF_LOCAL240_BITS, frame.local240);
  setField(SURF_SLOT5040_SHIFT, SURF_SLOT5040_BITS, frame.slot5040);
  setField(SURF_IDHASH_SHIFT, SURF_IDHASH_BITS, fnv1a32(frame.event.id));
  setField(SURF_NAMEHASH_SHIFT, SURF_NAMEHASH_BITS, fnv1a32(frame.event.name));
  return surf;
}

// ── modemFrameToOWord ───────────────────────────────────────────

export function modemFrameToOWord(frame) {
  const selector = 0;
  const path = packModemPath(frame);
  const surface = packModemSurface(frame);
  return packOWord({ selector, path, surface });
}

// ── oWordToModemFrame ───────────────────────────────────────────

export function oWordToModemFrame(word) {
  const { selector, path, surface } = unpackOWord(word);
  const pathFields = unpackModemPath(path);

  const getField = (shift, bits) => Number((surface >> BigInt(shift)) & ((1n << BigInt(bits)) - 1n));

  const status = codeToStatus(getField(SURF_STATUS_SHIFT, SURF_STATUS_BITS));
  const receiptState = codeToRcpt(getField(SURF_RCPT_SHIFT, SURF_RCPT_BITS));
  const durationMs = getField(SURF_DURMS_SHIFT, SURF_DURMS_BITS);
  const local240 = getField(SURF_LOCAL240_SHIFT, SURF_LOCAL240_BITS);
  const slot5040 = getField(SURF_SLOT5040_SHIFT, SURF_SLOT5040_BITS);
  const idHash = getField(SURF_IDHASH_SHIFT, SURF_IDHASH_BITS);
  const nameHash = getField(SURF_NAMEHASH_SHIFT, SURF_NAMEHASH_BITS);

  return {
    selector,
    ...pathFields,
    status,
    receiptState,
    durationMs: durationMs || undefined,
    local240,
    slot5040,
    idHash: idHash.toString(36),
    nameHash: nameHash.toString(36),
    wordHex: word.toString(16).padStart(64, "0"),
  };
}

// ── packModemFramesToOFile / unpackOFileToModemFrames ───────────

export function packModemFramesToOFile(frames) {
  const words = frames.map(modemFrameToOWord);
  return packOFile(words);
}

export function unpackOFileToModemFrames(text) {
  const words = unpackOFile(text);
  return words.map(oWordToModemFrame);
}

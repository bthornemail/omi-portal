import { fnv1a32 } from "../core/deterministic-utils.js";
import { parseOmiDocument } from "../omi/omi-parser.js";
import { tetragrammatronGeometryRoute, computeQxy } from "../omi/tetragrammatron-geometry-router.js";

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

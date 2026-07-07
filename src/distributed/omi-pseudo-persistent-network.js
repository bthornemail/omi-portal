import { fnv1a32, stableJson } from "../core/deterministic-utils.js";
import { formatOmiAddressFromSegments } from "../omi/codebase-ingestion.js";
import { encodeSelector } from "../qemu/omi-ged-event-selector.js";
import { resolveGedSelectorGauge } from "../qemu/omi-ged-gauge-map.js";
import { createEmmcLayout } from "../qemu/omi-emmc-layout.js";

export const OMI_NETWORK_PLAN_VERSION = 1;

export const OMI_CONTROL_CODES = Object.freeze({
  FS: 0x1c,
  GS: 0x1d,
  RS: 0x1e,
  US: 0x1f
});

export const OMI_CONTROL_OPEN = Object.freeze([
  OMI_CONTROL_CODES.FS,
  OMI_CONTROL_CODES.GS,
  OMI_CONTROL_CODES.RS,
  OMI_CONTROL_CODES.US
]);

export const OMI_CONTROL_CLOSE = Object.freeze([
  OMI_CONTROL_CODES.US,
  OMI_CONTROL_CODES.RS,
  OMI_CONTROL_CODES.GS,
  OMI_CONTROL_CODES.FS
]);

export const OMI_MQTT_CHANNELS = Object.freeze([
  "delta",
  "receipt",
  "control",
  "sync",
  "surrogate",
  "suboptimal"
]);

export const OMI_STATE_VECTOR_FILES = Object.freeze([
  "RULES.omi",
  "FACTS.omi",
  "CLOSURES.omi",
  "COMBINATORS.omi",
  "CONS.omi",
  ".omi/map.json",
  "receipts.ndjson",
  ".omi/control.raw"
]);

const MESH_ROUTE_TABLE = Object.freeze({
  stable: Object.freeze({
    channel: "delta",
    gaugeBit: 28,
    gaugeLane: "FS",
    target: "cell",
    route: "stable"
  }),
  surrogate: Object.freeze({
    channel: "surrogate",
    gaugeBit: 29,
    gaugeLane: "GS",
    target: "adjacent-cell",
    route: "adjacent"
  }),
  suboptimal: Object.freeze({
    channel: "suboptimal",
    gaugeBit: 30,
    gaugeLane: "RS",
    target: "parent-cell",
    route: "parent"
  }),
  reset: Object.freeze({
    channel: "control",
    gaugeBit: 31,
    gaugeLane: "US",
    target: "root-cell",
    route: "root"
  })
});

const DEFAULT_RECEIPT_DATE = "1970-01-01";
const DEFAULT_SOURCE_DIR = ".";
const DEFAULT_OUTPUT_DIR = "dist/omi-network";

export function encodeControlFrame(payload = new Uint8Array(0)) {
  const body = toUint8Array(payload);
  return concatBytes(
    Uint8Array.from(OMI_CONTROL_OPEN),
    body,
    Uint8Array.from(OMI_CONTROL_CLOSE)
  );
}

export function decodeControlFrame(frame) {
  const bytes = toUint8Array(frame);
  if (bytes.length < OMI_CONTROL_OPEN.length + OMI_CONTROL_CLOSE.length) {
    throw new RangeError(`OMI control frame too short: ${bytes.length}`);
  }
  assertControlBoundary(bytes, 0, OMI_CONTROL_OPEN, "opening");
  assertControlBoundary(
    bytes,
    bytes.length - OMI_CONTROL_CLOSE.length,
    OMI_CONTROL_CLOSE,
    "closing"
  );
  const payload = bytes.slice(OMI_CONTROL_OPEN.length, bytes.length - OMI_CONTROL_CLOSE.length);
  return Object.freeze({
    frameLength: bytes.length,
    payload,
    payloadLength: payload.length,
    receipt: receiptForBytes(bytes)
  });
}

export function isControlFrame(frame) {
  try {
    decodeControlFrame(frame);
    return true;
  } catch {
    return false;
  }
}

export function controlFrameToHex(frame) {
  return [...toUint8Array(frame)].map((byte) => byte.toString(16).padStart(2, "0")).join(" ");
}

export function receiptForBytes(bytes) {
  const value = fnv1a32Bytes(toUint8Array(bytes));
  return `omi-frame-${value.toString(16).padStart(8, "0")}`;
}

export function normalizeBranch(branch = "main") {
  const value = String(branch || "main").trim().replace(/\\/g, "/");
  if (!value || value.startsWith("/") || value.endsWith("/") || value.includes("//")) {
    throw new TypeError(`Invalid OMI state branch: ${branch}`);
  }
  if (value.includes("..") || value.endsWith(".lock") || /[\s~^:?*[\\]/.test(value)) {
    throw new TypeError(`Invalid OMI state branch: ${branch}`);
  }
  return value;
}

export function normalizeMqttChannel(channel = "delta") {
  const value = String(channel || "delta").trim().toLowerCase();
  if (!OMI_MQTT_CHANNELS.includes(value)) {
    throw new RangeError(`Unsupported OMI MQTT channel: ${channel}`);
  }
  return value;
}

export function formatOmiMqttTopic({ branch = "main", channel = "delta" } = {}) {
  return `omi/state/${normalizeBranch(branch)}/${normalizeMqttChannel(channel)}`;
}

export function parseOmiMqttTopic(topic) {
  const parts = String(topic || "").split("/");
  if (parts.length < 4 || parts[0] !== "omi" || parts[1] !== "state") {
    throw new TypeError(`Invalid OMI MQTT topic: ${topic}`);
  }
  const channel = normalizeMqttChannel(parts.at(-1));
  const branch = normalizeBranch(parts.slice(2, -1).join("/"));
  return Object.freeze({
    namespace: "omi/state",
    branch,
    channel,
    topic: formatOmiMqttTopic({ branch, channel })
  });
}

export function buildOmiMqttTopics(branch = "main") {
  const normalizedBranch = normalizeBranch(branch);
  return Object.freeze(Object.fromEntries(
    OMI_MQTT_CHANNELS.map((channel) => [
      channel,
      formatOmiMqttTopic({ branch: normalizedBranch, channel })
    ])
  ));
}

export function classifyMeshRoute({ surrogate = 0, suboptimal = 0 } = {}) {
  const hasSurrogate = boolBit(surrogate);
  const hasSuboptimal = boolBit(suboptimal);
  const key = hasSurrogate && hasSuboptimal
    ? "reset"
    : hasSurrogate
      ? "surrogate"
      : hasSuboptimal
        ? "suboptimal"
        : "stable";
  const row = MESH_ROUTE_TABLE[key];
  const selector = encodeSelector([row.gaugeBit]);
  const gauge = resolveGedSelectorGauge(selector);

  return Object.freeze({
    surrogate: hasSurrogate,
    suboptimal: hasSuboptimal,
    route: row.route,
    target: row.target,
    channel: row.channel,
    gaugeBit: row.gaugeBit,
    gaugeLane: row.gaugeLane,
    selector,
    gauge
  });
}

export function meshRouteFromCell(cell = {}) {
  return classifyMeshRoute({
    surrogate: cell.surrogate,
    suboptimal: cell.suboptimal
  });
}

export function createGedMeshEvent({
  branch = "main",
  cellId = "cell-0",
  delta = 0,
  surrogate = 0,
  suboptimal = 0,
  telemetry = null,
  payload = null
} = {}) {
  const normalizedBranch = normalizeBranch(branch);
  const route = classifyMeshRoute({ surrogate, suboptimal });
  const topic = formatOmiMqttTopic({ branch: normalizedBranch, channel: route.channel });
  const core = Object.freeze({
    type: "omi-ged-mesh-event",
    version: OMI_NETWORK_PLAN_VERSION,
    branch: normalizedBranch,
    cellId: String(cellId),
    delta: Number(delta) >>> 0,
    surrogate: route.surrogate,
    suboptimal: route.suboptimal,
    route: route.route,
    target: route.target,
    channel: route.channel,
    gaugeLane: route.gaugeLane,
    selector: route.selector,
    topic,
    telemetry: telemetry === undefined ? null : telemetry
  });
  const framePayload = payload === null || payload === undefined ? stableJson(core) : payload;
  const frame = encodeControlFrame(framePayload);

  return Object.freeze({
    ...core,
    controlFrameHex: controlFrameToHex(frame),
    controlFrameLength: frame.length,
    receipt: receiptForBytes(frame)
  });
}

export function createStateVectorDescriptor({
  branch = "main",
  commit = "HEAD",
  files = OMI_STATE_VECTOR_FILES,
  vectorClock = 0
} = {}) {
  const normalizedFiles = normalizeStateVectorFiles(files);
  const body = {
    type: "omi-state-vector",
    version: OMI_NETWORK_PLAN_VERSION,
    branch: normalizeBranch(branch),
    commit: String(commit || "HEAD"),
    vectorClock: normalizeNonNegativeInteger(vectorClock, "vectorClock"),
    files: normalizedFiles
  };
  const signature = `omi-sv-${fnv1a32(stableJson(body)).toString(16).padStart(8, "0")}`;
  return deepFreeze({ ...body, signature });
}

export function createStateVectorManifest({
  branches = null,
  commit = "HEAD",
  files = OMI_STATE_VECTOR_FILES,
  receiptDate = DEFAULT_RECEIPT_DATE
} = {}) {
  const branchList = branches || ["main", "feature/hopf", `receipts/${normalizeReceiptDate(receiptDate)}`];
  const descriptors = branchList.map((branch, index) => createStateVectorDescriptor({
    branch,
    commit,
    files,
    vectorClock: index
  }));
  const body = {
    type: "omi-state-vector-manifest",
    version: OMI_NETWORK_PLAN_VERSION,
    descriptors
  };
  const signature = `omi-svm-${fnv1a32(stableJson(body)).toString(16).padStart(8, "0")}`;
  return deepFreeze({ ...body, signature });
}

export function createOmiNetworkDeployPlan(options = {}) {
  const sourceDir = String(options.sourceDir || DEFAULT_SOURCE_DIR);
  const outDir = String(options.outDir || DEFAULT_OUTPUT_DIR);
  const branch = normalizeBranch(options.branch || "main");
  const receiptDate = normalizeReceiptDate(options.receiptDate || DEFAULT_RECEIPT_DATE);
  const broker = String(options.broker || "localhost:1883");
  const stateRepo = String(options.stateRepo || `${outDir}/omi-state`);
  const emmcImage = String(options.emmcImage || `${outDir}/omi-emmc-state.img`);
  const emmcLayoutPath = String(options.emmcLayout || `${outDir}/omi-emmc-layout.json`);
  const emmcReceiptPath = String(options.emmcReceipt || `${outDir}/omi-emmc-receipt.json`);
  const omiOutDir = String(options.omiOutDir || `${outDir}/omi`);
  const mqttContainer = String(options.mqttContainer || "omi-mqtt");
  const layout = createEmmcLayout();
  const topics = buildOmiMqttTopics(branch);
  const stateBranches = branch === "main"
    ? ["main", "feature/hopf", `receipts/${receiptDate}`]
    : [branch, "main", "feature/hopf", `receipts/${receiptDate}`];
  const stateVectors = createStateVectorManifest({ branches: stateBranches, receiptDate });
  const controlPayload = stableJson({
    type: "omi-network-control",
    version: OMI_NETWORK_PLAN_VERSION,
    branch,
    broker,
    stateRepo,
    emmcImage
  });
  const controlFrame = encodeControlFrame(controlPayload);
  const meshRoutes = [
    classifyMeshRoute({ surrogate: 0, suboptimal: 0 }),
    classifyMeshRoute({ surrogate: 1, suboptimal: 0 }),
    classifyMeshRoute({ surrogate: 0, suboptimal: 1 }),
    classifyMeshRoute({ surrogate: 1, suboptimal: 1 })
  ];

  const steps = [
    stepSpec({
      id: "ingest-codebase",
      phase: "ingest",
      label: "Ingest source tree into OMI review roots",
      implemented: true,
      command: "npm",
      args: ["run", "omi:ingest", "--", sourceDir, omiOutDir],
      writes: [`${omiOutDir}/RULES.omi`, `${omiOutDir}/FACTS.omi`, `${omiOutDir}/CLOSURES.omi`, `${omiOutDir}/COMBINATORS.omi`, `${omiOutDir}/CONS.omi`]
    }),
    stepSpec({
      id: "compile-omi-roots",
      phase: "compile",
      label: "Compile review OMI roots into .imo control tape fragments",
      implemented: true,
      commands: ["RULES", "FACTS", "CLOSURES", "COMBINATORS", "CONS"].map((root) => ({
        command: "node",
        args: ["scripts/compile-omi.js", `${omiOutDir}/${root}.omi`, `${omiOutDir}/${root}.imo`]
      })),
      writes: ["RULES", "FACTS", "CLOSURES", "COMBINATORS", "CONS"].map((root) => `${omiOutDir}/${root}.imo`)
    }),
    stepSpec({
      id: "build-emmc-state",
      phase: "emmc",
      label: "Build canonical eMMC-shaped state image with RPMB receipt",
      implemented: true,
      command: "node",
      args: ["scripts/omi-mkemmc-state.js", "--out", emmcImage, "--layout", emmcLayoutPath, "--receipt", emmcReceiptPath],
      writes: [emmcImage, emmcLayoutPath, emmcReceiptPath]
    }),
    stepSpec({
      id: "initialize-git-state-vectors",
      phase: "git",
      label: "Initialize Git branches as replayable state vectors",
      implemented: false,
      reason: "operator-controlled branch mutation is emitted as a plan, not run by default",
      commands: [
        { command: "git", args: ["init", stateRepo] },
        { command: "git", args: ["-C", stateRepo, "checkout", "-b", branch] },
        { command: "git", args: ["-C", stateRepo, "branch", "feature/hopf"] },
        { command: "git", args: ["-C", stateRepo, "branch", `receipts/${receiptDate}`] }
      ],
      writes: [stateRepo]
    }),
    stepSpec({
      id: "start-mqtt-broker",
      phase: "mqtt",
      label: "Start MQTT broker for distributed state propagation",
      implemented: false,
      reason: "Docker broker launch is operator-controlled and environment-dependent",
      command: "docker",
      args: ["run", "-d", "--name", mqttContainer, "-p", "1883:1883", "-p", "9001:9001", "eclipse-mosquitto"],
      topics: Object.values(topics)
    }),
    stepSpec({
      id: "boot-qemu-emmc-carrier",
      phase: "qemu",
      label: "Boot QEMU raw block carrier with the eMMC state image",
      implemented: false,
      reason: "QEMU launch requires local emulator artifacts and is intentionally explicit",
      command: "sh",
      args: ["scripts/run-omi-emmc-qemu.sh"],
      env: {
        OMI_EMMC_IMAGE: emmcImage,
        OMI_QEMU_SYSTEM: "qemu-system-aarch64"
      }
    }),
    stepSpec({
      id: "sync-git-mqtt",
      phase: "sync",
      label: "Bridge Git state vectors to MQTT deltas and receipts",
      implemented: false,
      reason: "sync adapter is planned; v1 records topics, state vectors, and control frames only",
      topics: [topics.delta, topics.receipt, topics.sync]
    }),
    stepSpec({
      id: "monitor-surrogate-suboptimal-mesh",
      phase: "mesh",
      label: "Record GED mesh routes for surrogate and suboptimal events",
      implemented: true,
      topics: [topics.surrogate, topics.suboptimal, topics.control]
    })
  ];

  const body = {
    type: "omi-distributed-pseudo-persistent-network-plan",
    version: OMI_NETWORK_PLAN_VERSION,
    mode: "propose-only",
    sourceDir,
    outDir,
    branch,
    broker,
    mqttContainer,
    stateRepo,
    emmcImage,
    emmcLayoutPath,
    emmcReceiptPath,
    omiOutDir,
    topics,
    stateVectors,
    controlFrame: {
      hex: controlFrameToHex(controlFrame),
      byteLength: controlFrame.length,
      receipt: receiptForBytes(controlFrame)
    },
    meshRoutes,
    emmc: {
      layoutVersion: layout.version,
      totalBytes: layout.totalBytes,
      blockBytes: layout.blockBytes,
      planes: layout.planes.map((plane) => ({
        governor: plane.governor,
        offset: plane.offset,
        blockStart: plane.blockStart,
        blockCount: plane.blockCount
      }))
    },
    steps
  };
  const signature = `omi-net-${fnv1a32(stableJson(body)).toString(16).padStart(8, "0")}`;
  return deepFreeze({ ...body, signature });
}

export function formatNetworkOmi(plan) {
  const normalized = plan || createOmiNetworkDeployPlan();
  const header = [
    "# ============================================================================",
    "# OMI DISTRIBUTED PSEUDO-PERSISTENT NETWORK PLAN",
    "# Propose-only runtime plan. Operator-controlled QEMU/Docker/Git steps stay explicit.",
    "# ============================================================================"
  ];
  const body = normalized.steps.map((step, index) => formatNetworkStepOmiRecord(step, index, normalized));
  return `${header.concat(body).join("\n\n")}\n`;
}

export function formatNetworkShellPlan(plan) {
  const normalized = plan || createOmiNetworkDeployPlan();
  const lines = [
    "#!/bin/sh",
    "set -eu",
    "",
    "# Generated OMI network plan. This shell prints commands; it does not execute runtime mutations.",
    `echo ${quoteShell(`OMI network plan ${normalized.signature}`)}`
  ];

  for (const step of normalized.steps) {
    lines.push("", `echo ${quoteShell(`[${step.phase}] ${step.label}`)}`);
    for (const command of stepCommands(step)) {
      lines.push(`echo ${quoteShell(shellLine(command.command, command.args || [], command.env || step.env || {}))}`);
    }
    if (!step.implemented && step.reason) {
      lines.push(`echo ${quoteShell(`[planned] ${step.reason}`)}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatNetworkStepOmiRecord(step, index, plan) {
  const seed = fnv1a32(stableJson({
    signature: plan.signature,
    id: step.id,
    phase: step.phase,
    index
  }));
  const address = formatOmiAddressFromSegments([
    0x0d15,
    OMI_NETWORK_PLAN_VERSION,
    index & 0xffff,
    seed & 0xffff,
    (seed >>> 16) & 0xffff,
    step.implemented ? 1 : 0,
    fnv1a32(step.phase) & 0xffff,
    fnv1a32(step.id) & 0xffff
  ]);
  const commands = stepCommands(step).map((command) => shellLine(command.command, command.args || [], command.env || step.env || {}));
  return [
    `${address}/128 SHOULD network-step-${step.id}`,
    `STATE: ${step.implemented ? "implemented" : "planned"}`,
    `PROPERTY: ${sanitizeLine(step.label)}`,
    `PHASE: ${sanitizeLine(step.phase)}`,
    `COMMAND: ${sanitizeLine(commands.join(" ; ") || "none")}`,
    `TOPIC: ${sanitizeLine((step.topics || []).join(","))}`,
    `WRITES: ${sanitizeLine((step.writes || []).join(","))}`,
    `RECEIPT: ${plan.signature}:${step.id}`,
    `REASON: ${sanitizeLine(step.reason || "local deterministic plan step")}`
  ].join("\n");
}

function stepSpec(step) {
  const commands = step.commands || (step.command ? [{ command: step.command, args: step.args || [], env: step.env || {} }] : []);
  return deepFreeze({
    implemented: false,
    writes: [],
    topics: [],
    env: {},
    ...step,
    commands
  });
}

function stepCommands(step) {
  return step.commands || (step.command ? [{ command: step.command, args: step.args || [], env: step.env || {} }] : []);
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return Uint8Array.from(value.map(validateByte));
  if (typeof value === "string") return new TextEncoder().encode(value);
  if (value === null || value === undefined) return new Uint8Array(0);
  throw new TypeError(`Cannot convert value to OMI control bytes: ${typeof value}`);
}

function concatBytes(...chunks) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function assertControlBoundary(bytes, offset, expected, label) {
  for (let i = 0; i < expected.length; i++) {
    if (bytes[offset + i] !== expected[i]) {
      throw new TypeError(`Invalid OMI control frame ${label} boundary`);
    }
  }
}

function fnv1a32Bytes(bytes) {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash >>> 0;
}

function boolBit(value) {
  return Number(value) ? 1 : 0;
}

function validateByte(value) {
  const byte = Number(value);
  if (!Number.isInteger(byte) || byte < 0 || byte > 0xff) {
    throw new RangeError(`Invalid OMI control byte: ${value}`);
  }
  return byte;
}

function normalizeStateVectorFiles(files) {
  const entries = (files || OMI_STATE_VECTOR_FILES).map((entry) => {
    if (typeof entry === "string") {
      return { path: entry, hash: null, bytes: null };
    }
    return {
      path: String(entry.path),
      hash: entry.hash === undefined ? null : String(entry.hash),
      bytes: entry.bytes === undefined && entry.size === undefined
        ? null
        : normalizeNonNegativeInteger(entry.bytes ?? entry.size, `bytes for ${entry.path}`)
    };
  });
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}

function normalizeNonNegativeInteger(value, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`${label} must be a non-negative integer`);
  return n;
}

function normalizeReceiptDate(value) {
  const text = String(value || DEFAULT_RECEIPT_DATE).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new TypeError(`Invalid receipt date: ${value}`);
  }
  return text;
}

function shellLine(command, args = [], env = {}) {
  const envPrefix = Object.entries(env || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${quoteShell(String(value))}`);
  return [...envPrefix, quoteShell(String(command)), ...args.map((part) => quoteShell(String(part)))].join(" ");
}

function quoteShell(value) {
  if (/^[A-Za-z0-9_./:=@%+,-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function sanitizeLine(value) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

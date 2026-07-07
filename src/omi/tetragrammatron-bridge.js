import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fnv1a32, stableJson } from "../core/deterministic-utils.js";
import {
  DEFAULT_IGNORED_DIRECTORIES,
  OMI_INGESTION_CATEGORIES,
  buildCellState,
  buildOmiDocuments,
  defaultShouldIncludePath,
  detectLanguage,
  ingestSources
} from "./codebase-ingestion.js";
import { parseOmiDocument } from "./omi-parser.js";
import { compileOmiFile } from "../omilog/omi-imo-compiler.js";
import { optimizeCodebase } from "./tetragrammatron-optimizer.js";
import { OmiRingIndexer } from "./ring-indexer.js";
import { QuquartMachine } from "./ququart-machine.js";
import { sha256Hex } from "../qemu/omi-emmc-rpmb-receipt.js";
import {
  createGedMeshEvent,
  createOmiNetworkDeployPlan,
  createStateVectorDescriptor,
  formatNetworkOmi
} from "../distributed/omi-pseudo-persistent-network.js";

export const TETRAGRAMMATRON_BRIDGE_VERSION = 1;
export const TETRAGRAMMATRON_BRIDGE_DEFAULT_OUT = "dist/tetragrammatron";
export const TETRAGRAMMATRON_BRIDGE_DEFAULT_ITERATIONS = 3;

export async function runTetragrammatronBridge(options = {}) {
  const config = normalizeBridgeOptions(options);
  const sourceScan = await readBridgeSources(config.sourceDir, config);
  const ring = new OmiRingIndexer();
  ring.bootstrapGenesis();

  await mkdir(config.outDir, { recursive: true });

  let previousCellState = options.previousCellState || null;
  let previousStateHash = null;
  let finalIteration = null;
  const iterations = [];
  const allReceipts = [];
  const allMeshEvents = [];
  let stoppedReason = "iteration-limit";

  for (let index = 0; index < config.iterations; index += 1) {
    const iterationNumber = index + 1;
    const iterationDir = join(config.outDir, "iterations", String(iterationNumber).padStart(3, "0"));
    const iteration = await runBridgeIteration({
      allReceipts,
      branch: config.branch,
      compileOmi: config.compileOmi,
      documentTransform: config.documentTransform,
      iterationDir,
      iterationNumber,
      nodeId: config.nodeId,
      previousCellState,
      previousStateHash,
      ququartOperator: config.ququartOperator,
      ring,
      safeGateRunner: config.safeGateRunner,
      sourceDir: config.sourceDir,
      sourceScan,
      testOutput: config.testOutput,
      top: config.top
    });

    iterations.push(iteration.summary);
    allReceipts.push(...iteration.receipts);
    allMeshEvents.push(...iteration.meshEvents);
    previousCellState = iteration.cellState;
    previousStateHash = iteration.stateHash;
    finalIteration = iteration;

    if (iteration.accepted) {
      stoppedReason = "accepted";
      break;
    }
    if (iteration.converged) {
      stoppedReason = "converged-safe-gate-not-accepted";
      break;
    }
  }

  const summary = buildBridgeSummary({
    allMeshEvents,
    allReceipts,
    config,
    finalIteration,
    iterations,
    sourceScan,
    stoppedReason
  });

  await writeTopLevelArtifacts({
    allMeshEvents,
    allReceipts,
    finalIteration,
    outDir: config.outDir,
    summary
  });

  return deepFreeze({
    summary,
    iterations,
    final: finalIteration?.summary || null,
    receipts: allReceipts,
    meshEvents: allMeshEvents,
    outDir: config.outDir
  });
}

export async function readBridgeSources(sourceDir, options = {}) {
  const root = resolve(sourceDir || ".");
  const included = [];
  const skipped = [];
  const ignored = new Set(options.ignoredDirectories || DEFAULT_IGNORED_DIRECTORIES);
  const maxBytes = Number(options.maxBytes ?? 1024 * 1024);

  async function visit(dir) {
    const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const rel = relative(root, fullPath).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) await visit(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const info = await stat(fullPath);
      if (info.size > maxBytes) {
        skipped.push({ path: rel, reason: "source skipped by --max-bytes budget" });
        continue;
      }
      if (defaultShouldIncludePath(rel, options)) {
        included.push(fullPath);
      } else {
        skipped.push({ path: rel, reason: "unsupported source surface" });
      }
    }
  }

  await visit(root);
  const limitedIncluded = options.maxFiles ? included.slice(0, Number(options.maxFiles)) : included;
  const sources = [];
  for (const filePath of limitedIncluded) {
    sources.push({
      path: relative(root, filePath).replace(/\\/g, "/"),
      language: detectLanguage(filePath),
      content: await readFile(filePath, "utf8")
    });
  }
  const budgetSkipped = included.slice(limitedIncluded.length).map((filePath) => ({
    path: relative(root, filePath).replace(/\\/g, "/"),
    reason: "source skipped by --max-files budget"
  }));

  return deepFreeze({
    root,
    sources,
    skippedSources: [...skipped, ...budgetSkipped]
  });
}

async function runBridgeIteration({
  allReceipts,
  branch,
  compileOmi,
  documentTransform,
  iterationDir,
  iterationNumber,
  nodeId,
  previousCellState,
  previousStateHash,
  ququartOperator,
  ring,
  safeGateRunner,
  sourceDir,
  sourceScan,
  testOutput,
  top
}) {
  await mkdir(iterationDir, { recursive: true });

  const ingestion = ingestSources(sourceScan.sources, { previousCellState });
  let documents = buildOmiDocuments(ingestion);
  if (typeof documentTransform === "function") {
    documents = Object.fromEntries(Object.entries(documents).map(([fileName, text]) => [
      fileName,
      documentTransform({ fileName, text, iteration: iterationNumber, ingestion })
    ]));
  }

  const parseChecks = parseGeneratedDocuments(documents);
  const compiled = await compileGeneratedDocuments(documents, compileOmi);
  const optimizer = optimizeCodebase({
    sources: sourceScan.sources,
    testOutput,
    options: {
      top,
      skippedSources: sourceScan.skippedSources,
      omiDocuments: documents,
      ingestion: { previousCellState }
    }
  });

  const meshEvents = [
    ...meshEventsFromRecords(ingestion.records, { branch, iterationNumber, nodeId }),
    ...meshEventsFromCandidates(optimizer.candidates, { branch, iterationNumber, nodeId })
  ];
  const iterationReceipts = collectIterationReceipts({ ingestion, meshEvents, optimizer });
  const ringWrites = writeReceiptsToRing(ring, iterationReceipts, iterationNumber);
  const ringSnapshot = serializeRingSnapshot(ring, Math.max(16, Math.min(64, iterationReceipts.length + 8)));
  const stateHash = bridgeStateHash({ ingestion, optimizer, sourceScan });
  const stateUnchanged = previousStateHash === stateHash;
  const zeroDeltas = ingestion.records.every((record) => record.cell?.delta === 0);
  const ringDeterministic = verifyRingDeterminism(iterationReceipts, iterationNumber);
  const resolved = resolveQuquartState({
    optimizer,
    ququartOperator,
    ringSnapshot,
    stateHash
  });
  const networkPlan = createOmiNetworkDeployPlan({
    sourceDir,
    outDir: join(iterationDir, "network"),
    branch,
    receiptDate: "1970-01-01"
  });
  const stateVector = createBridgeStateVector({
    branch,
    compiled,
    documents,
    iterationNumber,
    networkPlan,
    optimizer,
    resolved,
    ringSnapshot,
    stateHash
  });

  const localAccepted =
    parseChecks.malformed.length === 0 &&
    compiled.errors.length === 0 &&
    resolved.isStable &&
    ringDeterministic.accepted &&
    zeroDeltas &&
    stateUnchanged;
  const safeGate = await runSafeGate({ safeGateRunner, iterationDir, iterationNumber, localAccepted });
  const accepted = localAccepted && safeGate.accepted;
  const converged = localAccepted;

  const summary = deepFreeze({
    accepted,
    compiled: {
      ok: compiled.errors.length === 0,
      errors: compiled.errors
    },
    converged,
    guard: {
      localAccepted,
      parseOk: parseChecks.malformed.length === 0,
      compileOk: compiled.errors.length === 0,
      ququartStable: resolved.isStable,
      ringDeterministic: ringDeterministic.accepted,
      safeGateAccepted: safeGate.accepted,
      stateUnchanged,
      zeroDeltas
    },
    ingestion: ingestion.summary,
    iteration: iterationNumber,
    meshEventCount: meshEvents.length,
    optimizer: optimizer.summary,
    parse: {
      malformedCount: parseChecks.malformed.length,
      malformed: parseChecks.malformed
    },
    receiptCount: iterationReceipts.length,
    ring: {
      position: ringSnapshot.position,
      epoch: ringSnapshot.epoch,
      deterministic: ringDeterministic
    },
    safeGate,
    stateHash
  });

  await writeIterationArtifacts({
    cellState: buildCellState(ingestion.records),
    compiled,
    documents,
    ingestion,
    iterationDir,
    meshEvents,
    networkPlan,
    optimizer,
    parseChecks,
    receipts: iterationReceipts,
    resolved,
    ringSnapshot,
    stateVector,
    summary
  });

  return deepFreeze({
    accepted,
    cellState: buildCellState(ingestion.records),
    converged,
    meshEvents,
    receipts: iterationReceipts,
    resolved,
    ringSnapshot,
    stateHash,
    stateVector,
    summary
  });
}

function parseGeneratedDocuments(documents) {
  const parsed = {};
  const malformed = [];
  for (const [fileName, text] of Object.entries(documents)) {
    const document = parseOmiDocument(text, { source: fileName });
    parsed[fileName] = document;
    malformed.push(...document.malformed.map((entry) => ({ ...entry, source: fileName })));
  }
  return deepFreeze({ malformed, parsed });
}

async function compileGeneratedDocuments(documents, compileOmi = compileOmiFile) {
  const compiled = {};
  const errors = [];
  for (const category of OMI_INGESTION_CATEGORIES) {
    const fileName = `${category}.omi`;
    try {
      const result = await compileOmi(documents[fileName], { source: fileName });
      compiled[`${category}.imo`] = result.imoText;
    } catch (error) {
      errors.push({ source: fileName, error: error.message });
    }
  }
  return deepFreeze({ documents: compiled, errors });
}

function meshEventsFromRecords(records, { branch, iterationNumber, nodeId }) {
  return (records || [])
    .filter((record) => record.cell?.delta !== 0 || record.cell?.surrogate || record.cell?.suboptimal)
    .map((record) => createGedMeshEvent({
      branch,
      cellId: `${nodeId}:iter-${iterationNumber}:${record.id}`,
      delta: record.cell?.delta ?? 0,
      surrogate: record.cell?.surrogate ?? 0,
      suboptimal: record.cell?.suboptimal ?? 0,
      telemetry: record.telemetry,
      payload: stableJson({
        type: "slide-cell",
        address: record.address,
        category: record.category,
        id: record.id,
        iteration: iterationNumber,
        kind: record.kind,
        sourcePath: record.sourcePath
      })
    }));
}

function meshEventsFromCandidates(candidates, { branch, iterationNumber, nodeId }) {
  return (candidates || []).map((candidate) => createGedMeshEvent({
    branch,
    cellId: `${nodeId}:iter-${iterationNumber}:${candidate.id}`,
    delta: candidate.severity,
    surrogate: candidate.severity >= 90 ? 1 : 0,
    suboptimal: 1,
    telemetry: candidate.telemetry,
    payload: stableJson({
      type: "optimizer-candidate",
      address: candidate.address,
      id: candidate.id,
      iteration: iterationNumber,
      kind: candidate.kind,
      receiptState: candidate.receiptState,
      severity: candidate.severity,
      sourcePath: candidate.sourcePath
    })
  }));
}

function collectIterationReceipts({ ingestion, meshEvents, optimizer }) {
  return [
    ...ingestion.receipts.map((receipt, index) => ({
      kind: "slide",
      index,
      receipt
    })),
    ...optimizer.receipts.map((receipt, index) => ({
      kind: "optimizer",
      index,
      receipt
    })),
    ...meshEvents.map((event, index) => ({
      kind: "mesh",
      index,
      receipt: event.receipt
    }))
  ];
}

function writeReceiptsToRing(ring, receipts, iterationNumber) {
  return receipts.map((entry, index) => {
    const truthRow = truthRowFromReceipt(entry.receipt);
    const result = ring.atomicAdvance(1, truthRow, BigInt((iterationNumber << 8) + index));
    return {
      ...result,
      receipt: result.receipt.toString(),
      sourceReceipt: entry.receipt
    };
  });
}

function verifyRingDeterminism(receipts, iterationNumber) {
  const first = new OmiRingIndexer();
  const second = new OmiRingIndexer();
  first.bootstrapGenesis();
  second.bootstrapGenesis();
  const a = writeReceiptsToRing(first, receipts, iterationNumber).map((entry) => entry.receipt);
  const b = writeReceiptsToRing(second, receipts, iterationNumber).map((entry) => entry.receipt);
  return deepFreeze({
    accepted: stableJson(a) === stableJson(b),
    receiptCount: receipts.length
  });
}

function serializeRingSnapshot(ring, length = 16) {
  return deepFreeze({
    epoch: ring.epoch,
    position: ring.position,
    chain: ring.getReceiptChain(length).map((entry) => ({
      ...entry,
      slotValue: entry.slotValue.toString()
    }))
  });
}

function truthRowFromReceipt(receipt) {
  const text = String(receipt ?? "");
  const a = fnv1a32(`ring:a:${text}`);
  const b = fnv1a32(`ring:b:${text}`);
  const ll = BigInt((a % 7) + 1);
  const nn = BigInt(a & 0xffff);
  const mm = BigInt(b & 0xffff);
  return (ll << 32n) | (nn << 16n) | mm;
}

function bridgeStateHash({ ingestion, optimizer, sourceScan }) {
  return sha256Hex(stableJson({
    candidates: optimizer.candidates.map((candidate) => ({
      id: candidate.id,
      kind: candidate.kind,
      severity: candidate.severity,
      slot5040: candidate.slot5040,
      local240: candidate.local240
    })),
    records: ingestion.records.map((record) => ({
      address: record.address,
      category: record.category,
      id: record.id,
      kind: record.kind,
      line: record.line,
      name: record.name,
      newWord: record.cell?.newWord >>> 0,
      signature: record.signature,
      sourcePath: record.sourcePath,
      suboptimal: record.cell?.suboptimal >>> 0,
      surrogate: record.cell?.surrogate >>> 0
    })),
    sources: sourceScan.sources.map((source) => ({
      hash: sha256Hex(source.content),
      path: source.path
    }))
  }));
}

function resolveQuquartState({ optimizer, ququartOperator, ringSnapshot, stateHash }) {
  const source = BigInt(`0x${stateHash.slice(0, 16)}`);
  const notationMask = BigInt(`0x${sha256Hex(optimizer.omiText).slice(0, 16)}`);
  const activeReading = BigInt(`0x${sha256Hex(stableJson(ringSnapshot)).slice(0, 16)}`);
  const defaultSalt = BigInt(`0x${stateHash.slice(16, 32)}`);
  const operator = ququartOperator || ((value) => QuquartMachine.mix64(value ^ defaultSalt));
  const replay = QuquartMachine.evaluateReceiptReplayStability(source, notationMask, activeReading, operator);
  return deepFreeze({
    ...bigIntJson(replay),
    activeReading: activeReading.toString(),
    isStable: replay.isStable,
    notationMask: notationMask.toString(),
    source: source.toString()
  });
}

function createBridgeStateVector({
  branch,
  compiled,
  documents,
  iterationNumber,
  networkPlan,
  optimizer,
  resolved,
  ringSnapshot,
  stateHash
}) {
  const files = [
    ...Object.entries(documents).map(([path, text]) => ({ path, hash: sha256Hex(text), bytes: Buffer.byteLength(text) })),
    ...Object.entries(compiled.documents).map(([path, text]) => ({ path, hash: sha256Hex(text), bytes: Buffer.byteLength(text) })),
    { path: "OPTIMIZATION.omi", hash: sha256Hex(optimizer.omiText), bytes: Buffer.byteLength(optimizer.omiText) },
    { path: "NETWORK.omi", hash: sha256Hex(formatNetworkOmi(networkPlan)), bytes: Buffer.byteLength(formatNetworkOmi(networkPlan)) },
    { path: "ring.json", hash: sha256Hex(stableJson(ringSnapshot)), bytes: Buffer.byteLength(stableJson(ringSnapshot)) },
    { path: "resolved.json", hash: sha256Hex(stableJson(resolved)), bytes: Buffer.byteLength(stableJson(resolved)) }
  ];
  return createStateVectorDescriptor({
    branch,
    commit: stateHash,
    files,
    vectorClock: iterationNumber
  });
}

async function runSafeGate({ safeGateRunner, iterationDir, iterationNumber, localAccepted }) {
  if (!localAccepted) {
    return deepFreeze({ accepted: false, status: "skipped", reason: "local guards not accepted" });
  }
  if (typeof safeGateRunner !== "function") {
    return deepFreeze({ accepted: false, status: "not-run", reason: "safe gate runner not provided" });
  }
  try {
    const result = await safeGateRunner({ iterationDir, iterationNumber });
    if (result === true) return deepFreeze({ accepted: true, status: "passed" });
    if (result && typeof result === "object") {
      return deepFreeze({
        accepted: result.accepted !== false && result.status !== "failed",
        status: result.status || (result.accepted === false ? "failed" : "passed"),
        ...result
      });
    }
    return deepFreeze({ accepted: false, status: "failed", reason: "safe gate returned false" });
  } catch (error) {
    return deepFreeze({ accepted: false, status: "failed", reason: error.message });
  }
}

async function writeIterationArtifacts({
  cellState,
  compiled,
  documents,
  ingestion,
  iterationDir,
  meshEvents,
  networkPlan,
  optimizer,
  parseChecks,
  receipts,
  resolved,
  ringSnapshot,
  stateVector,
  summary
}) {
  for (const [fileName, text] of Object.entries(documents)) {
    await writeFile(join(iterationDir, fileName), text, "utf8");
  }
  for (const [fileName, text] of Object.entries(compiled.documents)) {
    await writeFile(join(iterationDir, fileName), text, "utf8");
  }
  await writeJson(join(iterationDir, "summary.json"), summary);
  await writeJson(join(iterationDir, "ingestion-summary.json"), ingestion.summary);
  await writeJson(join(iterationDir, "parse.json"), parseChecks);
  await writeJson(join(iterationDir, "candidates.json"), optimizer.candidates);
  await writeJson(join(iterationDir, "optimizer-summary.json"), optimizer.summary);
  await writeFile(join(iterationDir, "events.jsonl"), jsonl(optimizer.events), "utf8");
  await writeFile(join(iterationDir, "mesh-events.jsonl"), jsonl(meshEvents), "utf8");
  await writeFile(join(iterationDir, "receipts.ndjson"), jsonl(receipts), "utf8");
  await writeFile(join(iterationDir, "receipts.txt"), `${receipts.map((entry) => entry.receipt).join("\n")}\n`, "utf8");
  await writeFile(join(iterationDir, "OPTIMIZATION.omi"), optimizer.omiText, "utf8");
  await writeJson(join(iterationDir, "ring.json"), ringSnapshot);
  await writeJson(join(iterationDir, "resolved.json"), resolved);
  await writeJson(join(iterationDir, "cell-state.json"), cellState);
  await writeJson(join(iterationDir, "state-vector.json"), stateVector);
  await writeJson(join(iterationDir, "network-plan.json"), networkPlan);
  await writeFile(join(iterationDir, "NETWORK.omi"), formatNetworkOmi(networkPlan), "utf8");
}

async function writeTopLevelArtifacts({ allMeshEvents, allReceipts, finalIteration, outDir, summary }) {
  await writeJson(join(outDir, "summary.json"), summary);
  await writeFile(join(outDir, "receipts.ndjson"), jsonl(allReceipts), "utf8");
  await writeFile(join(outDir, "mesh-events.jsonl"), jsonl(allMeshEvents), "utf8");
  if (!finalIteration) return;
  await writeJson(join(outDir, "ring.json"), finalIteration.ringSnapshot);
  await writeJson(join(outDir, "resolved.json"), finalIteration.resolved);
  await writeJson(join(outDir, "state-vector.json"), finalIteration.stateVector);
  await writeFile(join(outDir, "OPTIMIZATION.omi"), await readFile(join(outDir, "iterations", String(finalIteration.summary.iteration).padStart(3, "0"), "OPTIMIZATION.omi"), "utf8"), "utf8");
  await writeFile(join(outDir, "NETWORK.omi"), await readFile(join(outDir, "iterations", String(finalIteration.summary.iteration).padStart(3, "0"), "NETWORK.omi"), "utf8"), "utf8");
}

function buildBridgeSummary({ allMeshEvents, allReceipts, config, finalIteration, iterations, sourceScan, stoppedReason }) {
  return deepFreeze({
    accepted: finalIteration?.accepted || false,
    branch: config.branch,
    finalIteration: finalIteration?.summary.iteration || 0,
    finalStateHash: finalIteration?.stateHash || null,
    iterationCount: iterations.length,
    iterations,
    meshEventCount: allMeshEvents.length,
    nodeId: config.nodeId,
    outDir: config.outDir,
    receiptCount: allReceipts.length,
    sourceCount: sourceScan.sources.length,
    skippedSourceCount: sourceScan.skippedSources.length,
    stoppedReason,
    version: TETRAGRAMMATRON_BRIDGE_VERSION
  });
}

function normalizeBridgeOptions(options) {
  const iterations = Number(options.iterations ?? TETRAGRAMMATRON_BRIDGE_DEFAULT_ITERATIONS);
  return {
    branch: String(options.branch || "main"),
    compileOmi: options.compileOmi || compileOmiFile,
    documentTransform: options.documentTransform,
    extensions: options.extensions || null,
    ignoredDirectories: options.ignoredDirectories || DEFAULT_IGNORED_DIRECTORIES,
    iterations: Number.isInteger(iterations) && iterations > 0 ? iterations : TETRAGRAMMATRON_BRIDGE_DEFAULT_ITERATIONS,
    maxBytes: options.maxBytes ?? 1024 * 1024,
    maxFiles: options.maxFiles ?? null,
    nodeId: String(options.nodeId || "local"),
    outDir: resolve(options.outDir || TETRAGRAMMATRON_BRIDGE_DEFAULT_OUT),
    ququartOperator: options.ququartOperator,
    safeGateRunner: options.safeGateRunner,
    sourceDir: resolve(options.sourceDir || "."),
    testOutput: String(options.testOutput || ""),
    top: options.top ?? 50
  };
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(bigIntJson(value), null, 2)}\n`, "utf8");
}

function jsonl(values) {
  if (!values || values.length === 0) return "";
  return `${values.map((value) => JSON.stringify(bigIntJson(value))).join("\n")}\n`;
}

function bigIntJson(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(bigIntJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, bigIntJson(child)]));
  }
  return value;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

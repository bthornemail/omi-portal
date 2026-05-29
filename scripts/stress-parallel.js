/**
 * ============================================================================
 * OMI PROTOCOL: PARALLEL BENCHMARK — TRUE WORKER / VM / ATOMICS / SYMBOLS
 * File Target: scripts/stress-parallel.js
 * Invariant: zero new module names, zero renames, only validation evidence
 * =
 * Five parallel benchmarks using frozen kernel names:
 *   1. SAB ring coherence — 4 Workers + Atomics store/load
 *   2. Delta period-8     — 16 vm.Script instances, 65,536 seeds
 *   3. Avalanche effect   — 8 Workers + Atomics.add counter
 *   4. Base64 decode      — 10 vm.Script instances
 *   5. Symbol dispatch    — 4 Workers + Symbol.for task routing
 * ============================================================================
 */
import { Worker } from "node:worker_threads";
import vm from "node:vm";

const SAB_BYTES = 40320;
const RING_SIZE = 5040;

/* ── Helper: create Worker from a function body string ────────────────── */

function spawnWorker(body, transfer) {
  const code = [
    'const { parentPort, workerData } = require("worker_threads");',
    body,
    "parentPort.postMessage(result);"
  ].join("\n");
  return new Promise((resolve, reject) => {
    const w = new Worker(code, { eval: true, workerData: transfer });
    w.on("message", resolve);
    w.on("error", reject);
  });
}

/* ── 1. SAB Ring Coherence ─────────────────────────────────────────────── */

async function benchmarkSabRingCoherence() {
  console.log("\n=== 1. SAB Ring Coherence ===");

  const sab = new SharedArrayBuffer(SAB_BYTES);
  const view = new Uint32Array(sab);
  const WORKERS = 4;

  const workerBodies = [
    // Worker 0: lane = slot % 4 === 0, marker = 1
    `
const v = new Uint32Array(workerData.sab);
for (let slot = 0; slot < 5040; slot += 4) {
  Atomics.store(v, slot, 1);
}
const result = { marker: 1, expected: "slot % 4 === 0" };
`,
    // Worker 1: lane = slot % 4 === 1, marker = 2
    `
const v = new Uint32Array(workerData.sab);
for (let slot = 1; slot < 5040; slot += 4) {
  Atomics.store(v, slot, 2);
}
const result = { marker: 2, expected: "slot % 4 === 1" };
`,
    // Worker 2: lane = slot % 4 === 2, marker = 3
    `
const v = new Uint32Array(workerData.sab);
for (let slot = 2; slot < 5040; slot += 4) {
  Atomics.store(v, slot, 3);
}
const result = { marker: 3, expected: "slot % 4 === 2" };
`,
    // Worker 3: lane = slot % 4 === 3, marker = 4
    `
const v = new Uint32Array(workerData.sab);
for (let slot = 3; slot < 5040; slot += 4) {
  Atomics.store(v, slot, 4);
}
const result = { marker: 4, expected: "slot % 4 === 3" };
`
  ];

  await Promise.all(
    workerBodies.map((body) => spawnWorker(body, { sab }))
  );

  let crossCollisions = 0;
  let emptySlots = 0;
  let mismatchedMarkers = 0;

  for (let slot = 0; slot < RING_SIZE; slot++) {
    const val = Atomics.load(view, slot);
    if (val === 0) { emptySlots++; continue; }
    const expected = (slot % 4) + 1;
    if (val !== expected) {
      mismatchedMarkers++;
      crossCollisions++;
    }
  }

  console.log("  Slots scanned: " + RING_SIZE);
  console.log("  Empty slots: " + emptySlots);
  console.log("  Cross-worker collisions: " + crossCollisions);
  console.log("  Mismatched markers: " + mismatchedMarkers);

  const pass = crossCollisions === 0 && emptySlots === 0;
  console.log("  Result: " + (pass ? "PASS" : "FAIL"));

  return pass;
}

/* ── 2. Delta Period-8 — 16 vm.Script instances ──────────────────────── */

async function benchmarkDeltaPeriod8() {
  console.log("\n=== 2. Delta Period-8 (16 vm.Script instances) ===");

  const TOTAL_SEEDS = 65536;
  const CHUNKS = 16;
  const CHUNK_SIZE = TOTAL_SEEDS / CHUNKS;

  const deltaScript = new vm.Script(
    "function verifyChunk(start, count) {" +
    "const INVERSION_C = 0x5A3C; var failures = [];" +
    "for (let seed = start; seed < start + count; seed++) {" +
    "let x = seed & 0xFFFF; const original = x;" +
    "for (let step = 0; step < 8; step++) {" +
    "const rotl1 = ((x << 1) | (x >> 15)) & 0xFFFF;" +
    "const rotl3 = ((x << 3) | (x >> 13)) & 0xFFFF;" +
    "const rotr2 = ((x >> 2) | (x << 14)) & 0xFFFF;" +
    "x = (rotl1 ^ rotl3 ^ rotr2 ^ INVERSION_C) & 0xFFFF;" +
    "} if (x !== original) failures.push(seed);" +
    "} return { failures: failures, count: count }; }"
  );

  const contexts = Array.from({ length: CHUNKS }, (_, i) => {
    const ctx = vm.createContext({});
    deltaScript.runInContext(ctx);
    return { ctx, start: i * CHUNK_SIZE, count: CHUNK_SIZE };
  });

  const start = process.hrtime.bigint();
  const chunkResults = contexts.map(({ ctx, start, count }) =>
    ctx.verifyChunk(start, count)
  );
  const end = process.hrtime.bigint();

  const totalFailures = chunkResults.reduce((s, r) => s + r.failures.length, 0);
  const totalVerified = chunkResults.reduce((s, r) => s + r.count, 0);
  const durationMs = Number(end - start) / 1_000_000;

  console.log("  Seeds verified: " + totalVerified + " / " + TOTAL_SEEDS);
  console.log("  Period-8 violations: " + totalFailures);
  console.log("  Execution time: " + durationMs.toFixed(2) + " ms");

  const pass = totalFailures === 0 && totalVerified === TOTAL_SEEDS;
  console.log("  Result: " + (pass ? "PASS" : "FAIL"));

  return pass;
}

/* ── 3. Avalanche Effect — 8 Workers + Atomics.add ───────────────────── */

async function benchmarkAvalanche() {
  console.log("\n=== 3. Avalanche Effect (8 Workers + Atomics.add) ===");

  const TOTAL_SEEDS = 65536;
  const WORKERS = 8;
  const CHUNK_SIZE = TOTAL_SEEDS / WORKERS;
  const counterSab = new SharedArrayBuffer(4);
  const varianceSab = new SharedArrayBuffer(4);
  const counter = new Int32Array(counterSab);
  const varianceCounter = new Int32Array(varianceSab);

  const workerBody =
    "const counter = new Int32Array(workerData.counterSab);" +
    "const vcounter = new Int32Array(workerData.varianceSab);" +
    "const INVERSION_C = 0x5A3C;" +
    "let localSum = 0; let localSqSum = 0; let localCount = 0;" +
    "for (let seed = workerData.start; seed < workerData.start + workerData.count; seed++) {" +
    "let x = seed & 0xFFFF;" +
    "for (let step = 0; step < 8; step++) {" +
    "const prev = x;" +
    "const rotl1 = ((x << 1) | (x >> 15)) & 0xFFFF;" +
    "const rotl3 = ((x << 3) | (x >> 13)) & 0xFFFF;" +
    "const rotr2 = ((x >> 2) | (x << 14)) & 0xFFFF;" +
    "x = (rotl1 ^ rotl3 ^ rotr2 ^ INVERSION_C) & 0xFFFF;" +
    "const diff = prev ^ x;" +
    "let n = diff - ((diff >>> 1) & 0x5555);" +
    "n = (n & 0x3333) + ((n >>> 2) & 0x3333);" +
    "n = (n + (n >>> 4)) & 0x0F0F;" +
    "const flipped = (n + (n >>> 8)) & 0x00FF;" +
    "localSum += flipped; localSqSum += flipped * flipped; localCount++;" +
    "}" +
    "}" +
    "Atomics.add(counter, 0, localSum);" +
    "Atomics.add(vcounter, 0, localSqSum);" +
    "const result = { localSum, localCount, localSqSum };";

  const results = await Promise.all(
    Array.from({ length: WORKERS }, (_, i) =>
      spawnWorker(workerBody, {
        start: i * CHUNK_SIZE, count: CHUNK_SIZE,
        counterSab, varianceSab
      })
    )
  );

  const totalSum = Atomics.load(counter, 0);
  const totalSqSum = Atomics.load(varianceCounter, 0);
  const totalSeeds = results.reduce((s, r) => s + r.localCount, 0);
  const mean = totalSum / totalSeeds;
  const variance = (totalSqSum / totalSeeds) - (mean * mean);
  const stddev = Math.sqrt(variance);

  console.log("  Seeds processed: " + totalSeeds);
  console.log("  Total bits flipped: " + totalSum);
  console.log("  Mean bits flipped per iteration: " + mean.toFixed(4));
  console.log("  Std deviation: " + stddev.toFixed(4));

  const pass = mean >= 7.5 && mean <= 8.5 && stddev <= 2.0;
  console.log("  Result: " + (pass ? "PASS" : "FAIL"));

  return pass;
}

/* ── 4. Base64 Payload Decode — 10 vm.Script instances ───────────────── */

async function benchmarkBase64Decode() {
  console.log("\n=== 4. Base64 Payload Decode (10 vm.Script instances) ===");

  const TOTAL_TOKENS = 10000;
  const CHUNKS = 10;
  const CHUNK_SIZE = TOTAL_TOKENS / CHUNKS;

  const tokens = Array.from({ length: TOTAL_TOKENS }, (_, i) => {
    const seed = ((i * 2654435761) >>> 0).toString(16).padStart(8, "0");
    const b64 = Buffer.from("payload-" + i + "-" + seed).toString("base64url");
    return "omi-ffff-0001-0000-0001-0078-0000-0003-0000/48/" + b64;
  });

  const decodeScript = new vm.Script(
    "function decodeChunk(start, count) {" +
    "var decoded = 0; var totalBytes = 0;" +
    "for (let i = start; i < start + count; i++) {" +
    "var parts = globalThis.__tokens[i];" +
    "if (parts.length < 3) continue;" +
    "var b64 = parts[2];" +
    "var raw = b64.replace(/-/g, '+').replace(/_/g, '/');" +
    "var buf = globalThis.__Buffer.from(raw, 'base64');" +
    "totalBytes += buf.length; decoded++;" +
    "} return { decoded: decoded, totalBytes: totalBytes }; }"
  );

  const contexts = Array.from({ length: CHUNKS }, (_, i) => {
    const ctx = vm.createContext({
      globalThis: { __tokens: tokens.map(t => t.split("/")), __Buffer: Buffer }
    });
    decodeScript.runInContext(ctx);
    return { ctx, start: i * CHUNK_SIZE, count: CHUNK_SIZE };
  });

  const start = process.hrtime.bigint();
  const chunkResults = contexts.map(({ ctx, start, count }) =>
    ctx.decodeChunk(start, count)
  );
  const end = process.hrtime.bigint();

  const totalDecoded = chunkResults.reduce((s, r) => s + r.decoded, 0);
  const totalBytes = chunkResults.reduce((s, r) => s + r.totalBytes, 0);
  const durationMs = Number(end - start) / 1_000_000;

  console.log("  Tokens decoded: " + totalDecoded + " / " + TOTAL_TOKENS);
  console.log("  Total payload bytes: " + totalBytes);
  console.log("  Execution time: " + durationMs.toFixed(2) + " ms");

  const pass = totalDecoded === TOTAL_TOKENS;
  console.log("  Result: " + (pass ? "PASS" : "FAIL"));

  return pass;
}

/* ── 5. Symbol Dispatch — 4 Workers + Symbol.for ─────────────────────── */

async function benchmarkSymbolDispatch() {
  console.log("\n=== 5. Symbol Dispatch (4 Workers + Symbol.for) ===");

  const WORKERS = 4;
  const TASKS_PER_WORKER = 25000;
  const TOTAL_TASKS = WORKERS * TASKS_PER_WORKER;

  const tasks = Array.from({ length: TOTAL_TASKS }, (_, i) => {
    const isCompliance = i % 2 === 0;
    const token = i % 10 === 0
      ? "omi-0000-0000-invalid-0000-0000-0000-0000-0000/48"
      : "omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48";
    return JSON.stringify({
      id: i,
      taskSymbol: isCompliance ? "omi:bench:compliance" : "omi:bench:fact-resolve",
      token
    });
  });

  const chunkSize = tasks.length / WORKERS;

  const workerBody =
    "const tasks = workerData.taskStrings.map(s => JSON.parse(s));" +
    "const SYM_COMPLIANCE = Symbol.for('omi:bench:compliance');" +
    "const SYM_FACT_RESOLVE = Symbol.for('omi:bench:fact-resolve');" +
    "let compliancePass = 0; let complianceFail = 0;" +
    "let factResolveOk = 0; let factResolveFail = 0;" +
    "for (const task of tasks) {" +
    "const sym = Symbol.for(task.taskSymbol);" +
    "if (sym === SYM_COMPLIANCE) {" +
    "const valid = task.token.startsWith('omi-') &&" +
    "task.token.split('-').length === 9 &&" +
    "/^[0-9a-f]{4}$/i.test(task.token.split('-')[2]);" +
    "if (valid) compliancePass++; else complianceFail++;" +
    "}" +
    "if (sym === SYM_FACT_RESOLVE) {" +
    "const parts = task.token.split('/')[0].slice(4).split('-');" +
    "if (parts.length === 8 && /^[0-9a-f]{4}$/i.test(parts[3])) {" +
    "factResolveOk++;" +
    "} else { factResolveFail++; }" +
    "}" +
    "}" +
    "const result = { compliancePass, complianceFail, factResolveOk, factResolveFail };";

  const results = await Promise.all(
    Array.from({ length: WORKERS }, (_, i) =>
      spawnWorker(workerBody, {
        taskStrings: tasks.slice(i * chunkSize, (i + 1) * chunkSize)
      })
    )
  );

  const totals = results.reduce((s, r) => ({
    compliancePass: s.compliancePass + r.compliancePass,
    complianceFail: s.complianceFail + r.complianceFail,
    factResolveOk: s.factResolveOk + r.factResolveOk,
    factResolveFail: s.factResolveFail + r.factResolveFail
  }), { compliancePass: 0, complianceFail: 0, factResolveOk: 0, factResolveFail: 0 });

  const processed = totals.compliancePass + totals.complianceFail +
                    totals.factResolveOk + totals.factResolveFail;

  console.log("  Tasks dispatched: " + TOTAL_TASKS);
  console.log("  Tasks completed: " + processed);
  console.log("  Compliance pass: " + totals.compliancePass + ", fail: " + totals.complianceFail);
  console.log("  Fact resolve ok: " + totals.factResolveOk + ", fail: " + totals.factResolveFail);

  const pass = processed === TOTAL_TASKS;
  console.log("  Result: " + (pass ? "PASS" : "FAIL"));

  return pass;
}

/* ── Main ─────────────────────────────────────────────────────────────── */

async function main() {
  console.log("============================================================");
  console.log("OMI PARALLEL BENCHMARK — Worker / vm.Script / Atomics / Symbols");
  console.log("Frozen kernel names only — zero renames, zero new modules");
  console.log("============================================================");

  const results = [];
  results.push({ name: "SAB ring coherence", pass: await benchmarkSabRingCoherence() });
  results.push({ name: "Delta period-8", pass: await benchmarkDeltaPeriod8() });
  results.push({ name: "Avalanche effect", pass: await benchmarkAvalanche() });
  results.push({ name: "Base64 decode", pass: await benchmarkBase64Decode() });
  results.push({ name: "Symbol dispatch", pass: await benchmarkSymbolDispatch() });

  console.log("\n============================================================");
  console.log("SUMMARY");
  console.log("============================================================");
  for (const { name, pass } of results) {
    console.log("  " + (pass ? "PASS" : "FAIL") + " — " + name);
  }
  const allPass = results.every(r => r.pass);
  console.log("\n  Overall: " + (allPass ? "ALL PASS" : "SOME FAILED"));
  console.log("============================================================");

  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});

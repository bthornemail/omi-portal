#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { stdin } from "node:process";
import {
  modemFrameToMemory,
  modemRoundTripToGeometryReceipts,
} from "../src/omi/tetragrammatron-modem.js";
import { createTetragrammatronMemory } from "../src/omi/tetragrammatron-meta-memory.js";
import { workerRuntimeTick } from "../src/omi/tetragrammatron-worker-runtime.js";
import { OmiLivePortalBinder } from "../src/wan/live-portal-binder.js";

const DEFAULT_SAMPLE = [
  "▶ Tetragrammatron live proof",
  "  ✔ readable proof becomes carrier (0.41ms)",
  "  ✔ carrier becomes memory (0.32ms)",
  "  ✖ failed proof remains candidate (0.19ms)",
].join("\n");

function printHelp() {
  console.log("Tetragrammatron Live Proof — proof stream to live portal projection");
  console.log("");
  console.log("Usage:");
  console.log("  npm run tetragrammatron:live-proof");
  console.log("  npm run tetragrammatron:live-proof -- path/to/test-output.txt");
  console.log("  npm run tetragrammatron:live-proof -- --stdin < test-output.txt");
  console.log("");
  console.log("Pipeline:");
  console.log("  test output -> modem frame -> memory -> worker tick -> backend event -> voxel snapshot");
}

async function readStdin() {
  if (stdin.isTTY) return "";
  let data = "";
  stdin.setEncoding("utf8");
  for await (const chunk of stdin) data += chunk;
  return data;
}

async function resolveInput(args) {
  if (args.includes("--sample")) return DEFAULT_SAMPLE;
  if (args.includes("--stdin")) return readStdin();
  const fileArg = args.find((arg) => !arg.startsWith("-"));
  if (fileArg) return readFileSync(fileArg, "utf8");
  const piped = await readStdin();
  return piped.trim() ? piped : DEFAULT_SAMPLE;
}

function summarizeVoxel(voxel) {
  if (!voxel) return null;
  return {
    key: voxel.key,
    x: voxel.x,
    y: voxel.y,
    q: voxel.q,
    depth: voxel.depth,
    local240: voxel.local240,
    operator: voxel.operator,
    address: voxel.address,
    receiptState: voxel.backendEvent?.receiptState ?? null,
    receipt: voxel.backendEvent?.receipt ?? null,
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const input = await resolveInput(args);
  const result = modemRoundTripToGeometryReceipts(input);
  if (result.eventCount === 0) {
    console.log("No test events found in input.");
    return;
  }

  const memory = createTetragrammatronMemory();
  const binder = new OmiLivePortalBinder();
  const ticks = [];

  for (let i = 0; i < result.frames.length; i++) {
    const frame = result.frames[i];
    modemFrameToMemory(memory, frame, { workerId: i + 1 });
    const tick = workerRuntimeTick(memory, {
      workerId: i + 1,
      timestamp: Date.now(),
      emit: (event) => binder.ingestBackendEvent(event),
    });
    ticks.push({
      index: i,
      event: frame.event.name,
      status: frame.event.status,
      receiptState: tick.state,
      slot5040: frame.slot5040,
      claimedSlot: tick.claimedSlot,
      receipt: tick.receipt.receipt,
      voxelKey: `${frame.baseQ}:${frame.fiberQ}`,
    });
  }

  const voxelSnapshot = binder.voxelStream.getState().map(summarizeVoxel);
  const accepted = ticks.filter((tick) => tick.receiptState === "accepted").length;
  const candidate = ticks.filter((tick) => tick.receiptState === "candidate").length;
  const rejected = ticks.filter((tick) => tick.receiptState === "rejected").length;

  console.log("Tetragrammatron live proof");
  console.log("==========================");
  console.log(`events: ${result.eventCount}`);
  console.log(`accepted: ${accepted}`);
  console.log(`candidate: ${candidate}`);
  console.log(`rejected: ${rejected}`);
  console.log(`voxels: ${voxelSnapshot.length}`);
  console.log("");
  console.log("ticks:");
  for (const tick of ticks) {
    console.log(
      `  #${tick.index + 1} ${tick.status.padEnd(7)} slot=${tick.claimedSlot}` +
      ` state=${tick.receiptState.padEnd(9)} voxel=${tick.voxelKey} ${tick.event}`
    );
  }
  console.log("");
  console.log("voxel snapshot:");
  console.log(JSON.stringify(voxelSnapshot, null, 2));
  console.log("");
  console.log("Readable proof becomes carrier.");
  console.log("Carrier becomes memory.");
  console.log("Memory becomes worker event.");
  console.log("Worker event becomes live projection.");
  console.log("Receipt accepts.");
}

main().catch((err) => {
  console.error("Tetragrammatron live proof error:", err.message);
  process.exit(1);
});

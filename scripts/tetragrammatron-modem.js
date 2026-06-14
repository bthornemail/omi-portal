#!/usr/bin/env node
import {
  modemRoundTripToGeometryReceipts,
  modemFrameToOWord,
  packModemFramesToOFile,
} from "../src/omi/tetragrammatron-modem.js";
import { formatOWord } from "../src/omi/o-bitboard.js";

function printFrame(frame, index) {
  const word = modemFrameToOWord(frame);
  const fmt = formatOWord(word);

  console.log(`\n─── Frame ${index + 1} ───────────────────────────────`);
  console.log(`  Event:     ${frame.event.status} — ${frame.event.name}`);
  console.log(`  Suite:     ${frame.event.suite || "(none)"}`);
  if (frame.event.durationMs != null) console.log(`  Duration:  ${frame.event.durationMs}ms`);
  console.log(`  Receipt:   ${frame.receiptState}`);
  console.log(`  Channel:   ${frame.node.channel} → Q${frame.baseQ}`);
  console.log(`  Chart 11:  ${frame.chart11}`);
  console.log(`  Q_xy:      ${frame.qxy} (baseQ=${frame.baseQ}, fiberQ=${frame.fiberQ})`);
  console.log(`  Local 240: ${frame.local240}`);
  console.log(`  Slot 5040: ${frame.slot5040}`);
  console.log(`  Thrust:    a=${frame.thrustDirection.a.toFixed(4)}  b=${frame.thrustDirection.b.toFixed(4)}  c=${frame.thrustDirection.c.toFixed(4)}`);
  console.log(`  Polybius:  row=${frame.polybius.row} col=${frame.polybius.col}`);

  console.log(`\n  .o word (hex):   ${fmt.hex}`);
  console.log(`  path:    ${fmt.path.toString(2).padStart(19, "0")}  (${fmt.path})`);
  console.log(`  surface: ${fmt.surface.toString(2).padStart(236, "0").slice(0, 64)}...`);
}

function printSummary(frames) {
  const passed = frames.filter(f => f.event.status === "passed").length;
  const failed = frames.filter(f => f.event.status === "failed").length;
  const running = frames.filter(f => f.event.status === "running").length;
  const accepted = frames.filter(f => f.receiptState === "accepted").length;
  const candidate = frames.filter(f => f.receiptState === "candidate").length;

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  Summary: ${frames.length} events`);
  console.log(`    passed:  ${passed}`);
  console.log(`    failed:  ${failed}`);
  console.log(`    running: ${running}`);
  console.log(`    accepted receipt:  ${accepted}`);
  console.log(`    candidate receipt: ${candidate}`);

  if (failed > 0) {
    console.log(`\n  Failed tests:`);
    for (const f of frames) {
      if (f.event.status === "failed") console.log(`    ✖ ${f.event.name}`);
    }
  }

  const oFile = packModemFramesToOFile(frames);
  const lineCount = oFile.trim().split("\n").length;
  console.log(`\n  .o file: ${lineCount} words, ${oFile.length} chars`);
}

async function main() {
  const args = process.argv.slice(2);
  let input;

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Tetragrammatron Modem — compile test streams to .o words");
    console.log("");
    console.log("Usage: node scripts/tetragrammatron-modem.js [file]");
    console.log("  Reads from file or stdin. Runs full modem pipeline:");
    console.log("  parse → modulate → parse → demodulate → geometry → .o word");
    return;
  }

  if (args.length > 0 && args[0] !== "--stdin") {
    const fs = await import("fs");
    input = fs.readFileSync(args[0], "utf-8");
  } else {
    const stdin = await new Promise((resolve) => {
      let data = "";
      process.stdin.setEncoding("utf-8");
      process.stdin.on("data", (chunk) => data += chunk);
      process.stdin.on("end", () => resolve(data));
    });
    input = stdin;
  }

  if (!input || !input.trim()) {
    console.log("No input. Pipe test output or provide a file path.");
    process.exit(1);
  }

  const result = modemRoundTripToGeometryReceipts(input);

  if (result.eventCount === 0) {
    console.log("No test events found in input.");
    process.exit(0);
  }

  for (let i = 0; i < result.frames.length; i++) {
    printFrame(result.frames[i], i);
  }

  printSummary(result.frames);
}

main().catch((err) => {
  console.error("Tetragrammatron modem error:", err.message);
  process.exit(1);
});

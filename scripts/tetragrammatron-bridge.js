#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { runTetragrammatronBridge } from "../src/omi/tetragrammatron-bridge.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log([
    "Usage: node scripts/tetragrammatron-bridge.js [options]",
    "",
    "Options:",
    "  --dir <path>              Source directory; default .",
    "  --out <dir>               Output directory; default dist/tetragrammatron",
    "  --iterations <n>          Max guarded replay iterations; default 3",
    "  --top <n>                 Optimizer candidate limit; default 50",
    "  --test-output <path>      Node test output to feed into optimizer",
    "  --node-id <id>            Local process mesh node id; default local",
    "  --branch <name>           State vector branch; default main",
    "  --max-files <n>           Max source files to scan",
    "  --max-bytes <n>           Max bytes per source file; default 1048576",
    "  --ext <list>              Comma-separated source extensions",
    "  --run-safe-gate           Run focused tests, build, and make verify-safe before accepting"
  ].join("\n"));
  process.exit(0);
}

try {
  const options = parseOptions(args);
  const result = await runTetragrammatronBridge({
    ...options,
    safeGateRunner: options.runSafeGate ? runSafeGateCommands : undefined
  });

  console.log("Tetragrammatron bridge");
  console.log(`  source files: ${result.summary.sourceCount}`);
  console.log(`  iterations: ${result.summary.iterationCount}`);
  console.log(`  accepted: ${result.summary.accepted}`);
  console.log(`  stopped: ${result.summary.stoppedReason}`);
  console.log(`  receipts: ${result.summary.receiptCount}`);
  console.log(`  output: ${result.summary.outDir}`);
} catch (error) {
  console.error(`Tetragrammatron bridge failed: ${error.message}`);
  process.exit(1);
}

function parseOptions(rawArgs) {
  const parsed = {
    branch: "main",
    iterations: 3,
    maxBytes: 1024 * 1024,
    maxFiles: null,
    nodeId: "local",
    outDir: "dist/tetragrammatron",
    runSafeGate: false,
    sourceDir: ".",
    testOutput: "",
    top: 50
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const next = rawArgs[index + 1];
    if ((arg === "--dir" || arg === "--source-dir") && next) {
      parsed.sourceDir = next;
      index += 1;
    } else if (arg.startsWith("--dir=")) {
      parsed.sourceDir = arg.slice("--dir=".length);
    } else if (arg.startsWith("--source-dir=")) {
      parsed.sourceDir = arg.slice("--source-dir=".length);
    } else if (arg === "--out" && next) {
      parsed.outDir = next;
      index += 1;
    } else if (arg.startsWith("--out=")) {
      parsed.outDir = arg.slice("--out=".length);
    } else if (arg === "--iterations" && next) {
      parsed.iterations = positiveInteger(next, parsed.iterations);
      index += 1;
    } else if (arg.startsWith("--iterations=")) {
      parsed.iterations = positiveInteger(arg.slice("--iterations=".length), parsed.iterations);
    } else if (arg === "--top" && next) {
      parsed.top = positiveInteger(next, parsed.top);
      index += 1;
    } else if (arg.startsWith("--top=")) {
      parsed.top = positiveInteger(arg.slice("--top=".length), parsed.top);
    } else if (arg === "--test-output" && next) {
      parsed.testOutput = readTextFile(next, "--test-output");
      index += 1;
    } else if (arg.startsWith("--test-output=")) {
      parsed.testOutput = readTextFile(arg.slice("--test-output=".length), "--test-output");
    } else if (arg === "--node-id" && next) {
      parsed.nodeId = next;
      index += 1;
    } else if (arg.startsWith("--node-id=")) {
      parsed.nodeId = arg.slice("--node-id=".length);
    } else if (arg === "--branch" && next) {
      parsed.branch = next;
      index += 1;
    } else if (arg.startsWith("--branch=")) {
      parsed.branch = arg.slice("--branch=".length);
    } else if (arg === "--max-files" && next) {
      parsed.maxFiles = positiveInteger(next, parsed.maxFiles);
      index += 1;
    } else if (arg.startsWith("--max-files=")) {
      parsed.maxFiles = positiveInteger(arg.slice("--max-files=".length), parsed.maxFiles);
    } else if (arg === "--max-bytes" && next) {
      parsed.maxBytes = positiveInteger(next, parsed.maxBytes);
      index += 1;
    } else if (arg.startsWith("--max-bytes=")) {
      parsed.maxBytes = positiveInteger(arg.slice("--max-bytes=".length), parsed.maxBytes);
    } else if (arg === "--ext" && next) {
      parsed.extensions = parseExtensions(next);
      index += 1;
    } else if (arg.startsWith("--ext=")) {
      parsed.extensions = parseExtensions(arg.slice("--ext=".length));
    } else if (arg === "--run-safe-gate") {
      parsed.runSafeGate = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!existsSync(parsed.sourceDir)) {
    throw new Error(`source directory not found: ${parsed.sourceDir}`);
  }

  return parsed;
}

function readTextFile(path, label) {
  if (!existsSync(path)) throw new Error(`${label} file not found: ${path}`);
  return readFileSync(path, "utf8");
}

function parseExtensions(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function positiveInteger(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

async function runSafeGateCommands() {
  const commands = [
    {
      command: process.execPath,
      args: [
        "--test",
        "test/autonomous-slide.test.js",
        "test/codebase-ingestion.test.js",
        "test/tetragrammatron-optimizer.test.js",
        "test/omi-pseudo-persistent-network.test.js",
        "test/tetragrammatron-bridge.test.js"
      ],
      label: "focused bridge tests"
    },
    { command: "npm", args: ["run", "build"], label: "production build" },
    { command: "make", args: ["verify-safe"], label: "safe verification gate" }
  ];
  const results = [];

  for (const spec of commands) {
    const result = spawnSync(spec.command, spec.args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe"
    });
    results.push({
      command: [spec.command, ...spec.args].join(" "),
      label: spec.label,
      ok: result.status === 0,
      status: result.status,
      stderr: result.stderr,
      stdout: result.stdout
    });
    if (result.status !== 0) {
      return { accepted: false, status: "failed", results };
    }
  }

  return { accepted: true, status: "passed", results };
}

#!/usr/bin/env node
import {
  mkdirSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";
import {
  createOmiNetworkDeployPlan,
  decodeControlFrame,
  formatNetworkOmi,
  formatNetworkShellPlan
} from "../src/distributed/omi-pseudo-persistent-network.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log([
    "Usage: node scripts/omi-network-plan.js [options]",
    "",
    "Options:",
    "  --source-dir <path>       Source tree to ingest; default .",
    "  --out <dir>               Output directory; default dist/omi-network",
    "  --branch <name>           State vector branch; default main",
    "  --receipt-date <date>     Receipt branch date YYYY-MM-DD; default 1970-01-01",
    "  --broker <host:port>      MQTT broker address; default localhost:1883",
    "  --state-repo <path>       Planned Git state repo path",
    "  --emmc-image <path>       Planned eMMC image path",
    "  --mqtt-container <name>   Planned MQTT container name; default omi-mqtt"
  ].join("\n"));
  process.exit(0);
}

const options = parseOptions(args);
const plan = createOmiNetworkDeployPlan(options);
const outDir = plan.outDir;
const controlFrame = bytesFromHex(plan.controlFrame.hex);
const decoded = decodeControlFrame(controlFrame);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "network-plan.json"), `${JSON.stringify(plan, null, 2)}\n`, "utf8");
writeFileSync(join(outDir, "mqtt-topics.json"), `${JSON.stringify(plan.topics, null, 2)}\n`, "utf8");
writeFileSync(join(outDir, "state-vectors.json"), `${JSON.stringify(plan.stateVectors, null, 2)}\n`, "utf8");
writeFileSync(join(outDir, "mesh-routes.json"), `${JSON.stringify(plan.meshRoutes, null, 2)}\n`, "utf8");
writeFileSync(join(outDir, "control-frame.bin"), Buffer.from(controlFrame));
writeFileSync(join(outDir, "control-frame.hex"), `${plan.controlFrame.hex}\n`, "utf8");
writeFileSync(join(outDir, "NETWORK.omi"), formatNetworkOmi(plan), "utf8");
writeFileSync(join(outDir, "run-omi-network.plan.sh"), formatNetworkShellPlan(plan), "utf8");

console.log("OMI network plan");
console.log(`  signature: ${plan.signature}`);
console.log(`  mode: ${plan.mode}`);
console.log(`  branch: ${plan.branch}`);
console.log(`  steps: ${plan.steps.length}`);
console.log(`  control-frame: ${decoded.receipt} (${decoded.frameLength} bytes)`);
console.log(`  output: ${outDir}`);

function parseOptions(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    const next = rawArgs[index + 1];
    if (arg === "--source-dir" && next) {
      parsed.sourceDir = next;
      index += 1;
    } else if (arg.startsWith("--source-dir=")) {
      parsed.sourceDir = arg.slice("--source-dir=".length);
    } else if (arg === "--out" && next) {
      parsed.outDir = next;
      index += 1;
    } else if (arg.startsWith("--out=")) {
      parsed.outDir = arg.slice("--out=".length);
    } else if (arg === "--branch" && next) {
      parsed.branch = next;
      index += 1;
    } else if (arg.startsWith("--branch=")) {
      parsed.branch = arg.slice("--branch=".length);
    } else if (arg === "--receipt-date" && next) {
      parsed.receiptDate = next;
      index += 1;
    } else if (arg.startsWith("--receipt-date=")) {
      parsed.receiptDate = arg.slice("--receipt-date=".length);
    } else if (arg === "--broker" && next) {
      parsed.broker = next;
      index += 1;
    } else if (arg.startsWith("--broker=")) {
      parsed.broker = arg.slice("--broker=".length);
    } else if (arg === "--state-repo" && next) {
      parsed.stateRepo = next;
      index += 1;
    } else if (arg.startsWith("--state-repo=")) {
      parsed.stateRepo = arg.slice("--state-repo=".length);
    } else if (arg === "--emmc-image" && next) {
      parsed.emmcImage = next;
      index += 1;
    } else if (arg.startsWith("--emmc-image=")) {
      parsed.emmcImage = arg.slice("--emmc-image=".length);
    } else if (arg === "--mqtt-container" && next) {
      parsed.mqttContainer = next;
      index += 1;
    } else if (arg.startsWith("--mqtt-container=")) {
      parsed.mqttContainer = arg.slice("--mqtt-container=".length);
    } else {
      throw new Error(`Unknown OMI network plan option: ${arg}`);
    }
  }

  return parsed;
}

function bytesFromHex(hex) {
  const bytes = String(hex || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => Number.parseInt(part, 16));
  if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 0xff)) {
    throw new TypeError("Invalid control-frame hex in generated plan");
  }
  return Uint8Array.from(bytes);
}

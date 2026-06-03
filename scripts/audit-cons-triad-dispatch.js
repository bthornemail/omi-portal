#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { auditConsTriadDispatch } from "../src/omilog/triad-dispatch.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = new Set(process.argv.slice(2));
const requireSourceBlocks = args.has("--require-source-blocks");
const triadMode = args.has("--full8") ? "full8" : "prefix3";
const consPath = join(ROOT, "CONS.omi");
const source = readFileSync(consPath, "utf8");
const audit = auditConsTriadDispatch(source, {
  source: "CONS.omi",
  triadMode,
  requireSourceBlocks
});

console.log(`CONS triad dispatch audit: ${audit.count} RRGGBBAA lookup record(s)`);
console.log(`  mode: ${audit.mode}`);
console.log(`  monotonic: ${audit.monotonic ? "yes" : "no"}`);

for (const entry of audit.entries) {
  const dispatch = entry.dispatch;
  const triad = dispatch
    ? `triad=${dispatch.triadIndex} category=${dispatch.category} plane=${dispatch.plane}/${dispatch.branch} coreMax=0x${dispatch.coreMax.toString(16).padStart(4, "0")}`
    : "triad=<invalid>";
  console.log(`  ${entry.rrggbbaaHex} ${entry.assignment}: ${triad}`);
}

if (!audit.valid) {
  console.error("\nCONS triad dispatch audit failed:");
  for (const violation of audit.violations) {
    console.error(`  - [${violation.type}] ${violation.assignment || violation.current || "unknown"}: ${violation.reason}`);
  }
  process.exit(1);
}

console.log("CONS triad dispatch audit passed.");

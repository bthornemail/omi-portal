#!/usr/bin/env node
import { existsSync } from "node:fs";
import { runTetragrammatronRemoteMesh } from "../src/remote/tetragrammatron-remote-mesh.js";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log([
    "Usage: node scripts/tetragrammatron-remote-mesh.js [options]",
    "",
    "Options:",
    "  --host <ssh-alias>          SSH host alias; default small",
    "  --remote-dir <path>         Remote repo path; default /root/omi-portal",
    "  --out <dir>                 Output base directory; default dist/tetragrammatron-remote",
    "  --branch <name>             State branch; default main",
    "  --bootstrap                 Install/configure missing remote runtime services",
    "  --public-mqtt-http          Configure public HTTP and authenticated MQTT",
    "  --public-http               Configure public HTTP only",
    "  --public-mqtt               Configure authenticated public MQTT only",
    "  --push-github               Push artifact-only receipt branch when validation passes",
    "  --git-remote <name-or-url>  Git remote for artifact branch; default origin",
    "  --mqtt-password <value>     MQTT password; otherwise OMI_SMALL_MQTT_PASSWORD or remote generated secret",
    "  --no-sync                   Do not rsync local repo before remote checks",
    "  --dry-run                   Generate local plan artifacts without SSH mutation"
  ].join("\n"));
  process.exit(0);
}

try {
  const options = parseOptions(process.argv.slice(2));
  const result = await runTetragrammatronRemoteMesh(options);
  console.log("Tetragrammatron remote mesh");
  console.log(`  host: ${result.summary.host}`);
  console.log(`  state: ${result.summary.state}`);
  console.log(`  accepted: ${result.summary.accepted}`);
  console.log(`  checks: ${result.summary.checkStatus}`);
  console.log(`  artifact branch: ${result.summary.artifactBranch}`);
  console.log(`  output: ${result.summary.outDir}`);
} catch (err) {
  console.error(`Tetragrammatron remote mesh failed: ${err.message}`);
  process.exit(1);
}

function parseOptions(args) {
  const parsed = {
    bootstrap: false,
    branch: "main",
    dryRun: false,
    gitRemote: "origin",
    host: "small",
    outDir: "dist/tetragrammatron-remote",
    publicHttp: false,
    publicMqtt: false,
    pushGithub: false,
    remoteDir: "/root/omi-portal",
    sync: true
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === "--host" && next) {
      parsed.host = next;
      index += 1;
    } else if (arg.startsWith("--host=")) {
      parsed.host = arg.slice("--host=".length);
    } else if (arg === "--remote-dir" && next) {
      parsed.remoteDir = next;
      index += 1;
    } else if (arg.startsWith("--remote-dir=")) {
      parsed.remoteDir = arg.slice("--remote-dir=".length);
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
    } else if (arg === "--git-remote" && next) {
      parsed.gitRemote = next;
      index += 1;
    } else if (arg.startsWith("--git-remote=")) {
      parsed.gitRemote = arg.slice("--git-remote=".length);
    } else if (arg === "--mqtt-password" && next) {
      parsed.mqttPassword = next;
      index += 1;
    } else if (arg.startsWith("--mqtt-password=")) {
      parsed.mqttPassword = arg.slice("--mqtt-password=".length);
    } else if (arg === "--bootstrap") {
      parsed.bootstrap = true;
    } else if (arg === "--public-mqtt-http") {
      parsed.publicHttp = true;
      parsed.publicMqtt = true;
    } else if (arg === "--public-http") {
      parsed.publicHttp = true;
    } else if (arg === "--public-mqtt") {
      parsed.publicMqtt = true;
    } else if (arg === "--push-github") {
      parsed.pushGithub = true;
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--no-sync") {
      parsed.sync = false;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!existsSync(".")) throw new Error("repo root not found");
  return parsed;
}

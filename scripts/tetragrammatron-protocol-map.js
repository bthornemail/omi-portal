#!/usr/bin/env node
import {
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { join, resolve } from "node:path";
import {
  createTetragrammatronProtocolMap,
  decodeBrowserProtocolFrame,
  formatProtocolMapOmi
} from "../src/web/tetragrammatron-protocol-map.js";

const DEFAULT_OUT_DIR = "dist/tetragrammatron-protocol-map";

function parseArgs(argv) {
  const args = {
    outDir: DEFAULT_OUT_DIR,
    branch: "main",
    routesPath: null,
    transports: null
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out" || arg === "--out-dir") args.outDir = argv[++i];
    else if (arg === "--branch") args.branch = argv[++i];
    else if (arg === "--routes") args.routesPath = argv[++i];
    else if (arg === "--transports") args.transports = argv[++i].split(",").map((part) => part.trim()).filter(Boolean);
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown tetragrammatron protocol-map option: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  npm run tetragrammatron:protocol-map -- --out dist/tetragrammatron-protocol-map --branch main

Options:
  --out <dir>          Output directory. Default: ${DEFAULT_OUT_DIR}
  --branch <name>      Git/MQTT state-vector branch. Default: main
  --routes <json>      Optional JSON route array.
  --transports <list>  Comma-separated transport subset: raw-binary,mqtt,github,docker,qemu
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = resolve(args.outDir);
  const routeOptions = args.routesPath
    ? { routes: JSON.parse(readFileSync(resolve(args.routesPath), "utf8")) }
    : {};
  const map = createTetragrammatronProtocolMap({
    branch: args.branch,
    transports: args.transports || undefined,
    ...routeOptions
  });
  const omiText = formatProtocolMapOmi(map);
  const frames = map.routes.map((route) => bytesFromHex(route.binary.frameHex));
  const rawFrames = Buffer.concat(frames);
  const decoded = frames.map((frame, index) => ({
    id: map.routes[index].id,
    receipt: map.routes[index].binary.receipt,
    decoded: decodeBrowserProtocolFrame(frame)
  }));

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "protocol-map.json"), `${JSON.stringify(map, null, 2)}\n`, "utf8");
  writeFileSync(join(outDir, "routes.ndjson"), `${map.routes.map((route) => JSON.stringify(route)).join("\n")}\n`, "utf8");
  writeFileSync(join(outDir, "transport-plan.json"), `${JSON.stringify({
    signature: map.signature,
    branch: map.branch,
    github: map.github,
    docker: map.docker,
    qemu: map.qemu,
    routes: map.routes.map((route) => ({ id: route.id, descriptors: route.descriptors }))
  }, null, 2)}\n`, "utf8");
  writeFileSync(join(outDir, "mqtt-topics.json"), `${JSON.stringify(map.topics, null, 2)}\n`, "utf8");
  writeFileSync(join(outDir, "PROTOCOLS.omi"), omiText, "utf8");
  writeFileSync(join(outDir, "raw-frames.bin"), rawFrames);
  writeFileSync(join(outDir, "raw-frames.hex"), `${map.routes.map((route) => route.binary.frameHex).join("\n")}\n`, "utf8");
  writeFileSync(join(outDir, "decoded-frames.json"), `${JSON.stringify(decoded, null, 2)}\n`, "utf8");

  console.log(`Tetragrammatron protocol map ${map.signature}`);
  console.log(`routes: ${map.routeCount}`);
  console.log(`raw bytes: ${rawFrames.length}`);
  console.log(`out: ${outDir}`);
}

function bytesFromHex(hex) {
  return Buffer.from(String(hex).trim().split(/\s+/).map((part) => Number.parseInt(part, 16)));
}

try {
  main();
} catch (err) {
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
}

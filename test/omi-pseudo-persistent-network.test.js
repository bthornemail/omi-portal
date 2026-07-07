import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OMI_CONTROL_CLOSE,
  OMI_CONTROL_OPEN,
  buildOmiMqttTopics,
  classifyMeshRoute,
  controlFrameToHex,
  createGedMeshEvent,
  createOmiNetworkDeployPlan,
  createStateVectorDescriptor,
  createStateVectorManifest,
  decodeControlFrame,
  encodeControlFrame,
  formatNetworkOmi,
  formatOmiMqttTopic,
  isControlFrame,
  parseOmiMqttTopic
} from "../src/distributed/omi-pseudo-persistent-network.js";
import { parseOmiDocument } from "../src/omi/omi-parser.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("OMI control frame encodes raw FS/GS/RS/US boundaries", () => {
  const payload = Uint8Array.from([0x00, 0x7f, 0xff]);
  const frame = encodeControlFrame(payload);
  const decoded = decodeControlFrame(frame);

  assert.deepEqual([...frame.slice(0, 4)], OMI_CONTROL_OPEN);
  assert.deepEqual([...frame.slice(-4)], OMI_CONTROL_CLOSE);
  assert.deepEqual([...decoded.payload], [...payload]);
  assert.equal(decoded.payloadLength, 3);
  assert.equal(isControlFrame(frame), true);
  assert.equal(controlFrameToHex(frame), "1c 1d 1e 1f 00 7f ff 1f 1e 1d 1c");
  assert.throws(() => decodeControlFrame(Uint8Array.from([0x1c, 0x1d])), RangeError);
});

test("MQTT topics preserve slash-bearing Git branch names", () => {
  const topic = formatOmiMqttTopic({ branch: "feature/hopf", channel: "receipt" });
  const parsed = parseOmiMqttTopic(topic);
  const topics = buildOmiMqttTopics("receipts/2026-06-16");

  assert.equal(topic, "omi/state/feature/hopf/receipt");
  assert.equal(parsed.branch, "feature/hopf");
  assert.equal(parsed.channel, "receipt");
  assert.equal(topics.surrogate, "omi/state/receipts/2026-06-16/surrogate");
  assert.equal(Object.keys(topics).length, 6);
});

test("surrogate and suboptimal flags route through GED gauge lanes", () => {
  const stable = classifyMeshRoute({ surrogate: 0, suboptimal: 0 });
  const surrogate = classifyMeshRoute({ surrogate: 1, suboptimal: 0 });
  const suboptimal = classifyMeshRoute({ surrogate: 0, suboptimal: 1 });
  const reset = classifyMeshRoute({ surrogate: 1, suboptimal: 1 });

  assert.equal(stable.route, "stable");
  assert.equal(stable.channel, "delta");
  assert.equal(stable.gaugeLane, "FS");
  assert.equal(surrogate.route, "adjacent");
  assert.equal(surrogate.channel, "surrogate");
  assert.equal(surrogate.gauge.gaugeLane, "GS");
  assert.equal(suboptimal.route, "parent");
  assert.equal(suboptimal.gauge.gaugeLane, "RS");
  assert.equal(reset.route, "root");
  assert.equal(reset.channel, "control");
  assert.equal(reset.gauge.gaugeLane, "US");
});

test("GED mesh event emits a framed MQTT payload receipt", () => {
  const event = createGedMeshEvent({
    branch: "feature/hopf",
    cellId: "cell-7",
    delta: 0xabc,
    surrogate: 1,
    suboptimal: 0,
    telemetry: "QED slot=7 surrogate=1 suboptimal=0"
  });
  const frame = bytesFromHex(event.controlFrameHex);
  const decoded = decodeControlFrame(frame);
  const payload = JSON.parse(new TextDecoder().decode(decoded.payload));

  assert.equal(event.topic, "omi/state/feature/hopf/surrogate");
  assert.equal(event.route, "adjacent");
  assert.equal(event.receipt, decoded.receipt);
  assert.equal(payload.cellId, "cell-7");
  assert.equal(payload.gaugeLane, "GS");
});

test("state vector descriptors are deterministic and sorted", () => {
  const files = [
    { path: "FACTS.omi", hash: "b", bytes: 2 },
    { path: "RULES.omi", hash: "a", bytes: 1 }
  ];
  const first = createStateVectorDescriptor({ branch: "main", commit: "abc123", files });
  const second = createStateVectorDescriptor({ branch: "main", commit: "abc123", files });
  const manifest = createStateVectorManifest({
    branches: ["main", "feature/hopf", "receipts/2026-06-16"],
    commit: "abc123",
    files
  });

  assert.deepEqual(first, second);
  assert.deepEqual(first.files.map((entry) => entry.path), ["FACTS.omi", "RULES.omi"]);
  assert.match(first.signature, /^omi-sv-[0-9a-f]{8}$/);
  assert.equal(manifest.descriptors.length, 3);
  assert.equal(manifest.descriptors[1].branch, "feature/hopf");
});

test("network deploy plan is deterministic and NETWORK.omi parses", () => {
  const first = createOmiNetworkDeployPlan({
    outDir: "dist/test-network",
    branch: "feature/hopf",
    receiptDate: "2026-06-16"
  });
  const second = createOmiNetworkDeployPlan({
    outDir: "dist/test-network",
    branch: "feature/hopf",
    receiptDate: "2026-06-16"
  });
  const omiText = formatNetworkOmi(first);
  const parsed = parseOmiDocument(omiText, { source: "NETWORK.omi" });

  assert.deepEqual(first, second);
  assert.equal(first.mode, "propose-only");
  assert.equal(first.emmc.totalBytes, 203776);
  assert.equal(first.topics.control, "omi/state/feature/hopf/control");
  assert.equal(first.stateVectors.descriptors[0].branch, "feature/hopf");
  assert.equal(parsed.malformed.length, 0);
  assert.equal(parsed.records.length, first.steps.length);
});

test("omi network plan CLI writes replay artifacts without mutating sources", () => {
  const root = mkdtempSync(join(tmpdir(), "omi-network-"));
  const sourceDir = join(root, "src");
  const outDir = join(root, "out");
  const sourcePath = join(sourceDir, "fixture.js");
  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(sourcePath, "export function fixture() { return 1; }\n", "utf8");
  const before = readFileSync(sourcePath, "utf8");

  const result = execFileSync(process.execPath, [
    "scripts/omi-network-plan.js",
    "--source-dir",
    sourceDir,
    "--out",
    outDir,
    "--branch",
    "feature/hopf",
    "--receipt-date",
    "2026-06-16"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });

  assert.match(result, /OMI network plan/);
  for (const fileName of [
    "network-plan.json",
    "mqtt-topics.json",
    "state-vectors.json",
    "mesh-routes.json",
    "control-frame.bin",
    "control-frame.hex",
    "NETWORK.omi",
    "run-omi-network.plan.sh"
  ]) {
    assert.equal(existsSync(join(outDir, fileName)), true, fileName);
  }
  assert.equal(readFileSync(sourcePath, "utf8"), before);

  const plan = JSON.parse(readFileSync(join(outDir, "network-plan.json"), "utf8"));
  const frame = readFileSync(join(outDir, "control-frame.bin"));
  const parsed = parseOmiDocument(readFileSync(join(outDir, "NETWORK.omi"), "utf8"), {
    source: "NETWORK.omi"
  });

  assert.equal(plan.branch, "feature/hopf");
  assert.equal(decodeControlFrame(frame).receipt, plan.controlFrame.receipt);
  assert.equal(readFileSync(join(outDir, "control-frame.hex"), "utf8").trim(), plan.controlFrame.hex);
  assert.equal(parsed.malformed.length, 0);
});

function bytesFromHex(hex) {
  return Uint8Array.from(String(hex).trim().split(/\s+/).map((part) => Number.parseInt(part, 16)));
}

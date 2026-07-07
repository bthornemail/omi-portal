import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REMOTE_MESH_PACKAGES,
  SMALL_VPS_IPV4,
  SMALL_VPS_IPV6,
  createRemoteMeshServicePlan,
  runTetragrammatronRemoteMesh
} from "../src/remote/tetragrammatron-remote-mesh.js";
import { parseOmiDocument } from "../src/omi/omi-parser.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("remote service plan is deterministic and redacts MQTT password", () => {
  const first = createRemoteMeshServicePlan({
    host: "small",
    remoteDir: "/root/omi-portal",
    publicMqttHttp: true,
    mqttPassword: "super-secret-test-password"
  });
  const second = createRemoteMeshServicePlan({
    host: "small",
    remoteDir: "/root/omi-portal",
    publicMqttHttp: true,
    mqttPassword: "super-secret-test-password"
  });
  const text = JSON.stringify(first);

  assert.deepEqual(first, second);
  assert.equal(first.host, "small");
  assert.equal(first.publicHttp, true);
  assert.equal(first.publicMqtt, true);
  assert.equal(first.mqtt.allowAnonymous, false);
  assert.match(first.mqtt.passwordReceipt, /^secret-sha256-[0-9a-f]{64}$/);
  assert.equal(text.includes("super-secret-test-password"), false);
  assert.equal(first.packages.includes("mosquitto"), true);
  assert.equal(first.packages.includes("docker.io"), true);
  assert.equal(first.packages.includes("qemu-system-x86"), true);
  assert.equal(REMOTE_MESH_PACKAGES.includes("jq"), true);
});

test("dry-run remote mesh writes all review artifacts and parseable REMOTE_MESH.omi", async () => {
  const outBase = mkdtempSync(join(tmpdir(), "omi-remote-mesh-"));
  const result = await runTetragrammatronRemoteMesh({
    host: "small",
    remoteDir: "/root/omi-portal",
    outDir: outBase,
    publicMqttHttp: true,
    pushGithub: true,
    dryRun: true,
    mqttPassword: "not-written"
  });
  const outDir = join(outBase, "small");

  assert.equal(result.summary.host, "small");
  assert.equal(result.summary.state, "planned");
  assert.equal(result.summary.accepted, false);
  assert.equal(result.github.status, "dry-run");
  for (const fileName of [
    "summary.json",
    "remote-preflight.json",
    "service-plan.json",
    "protocol-map.json",
    "raw-frames.bin",
    "mqtt-topics.json",
    "remote-checks.json",
    "receipts.ndjson",
    "REMOTE_MESH.omi"
  ]) {
    assert.equal(existsSync(join(outDir, fileName)), true, fileName);
  }

  const omiText = readFileSync(join(outDir, "REMOTE_MESH.omi"), "utf8");
  const parsed = parseOmiDocument(omiText, { source: "REMOTE_MESH.omi" });
  const servicePlan = readFileSync(join(outDir, "service-plan.json"), "utf8");

  assert.equal(parsed.malformed.length, 0);
  assert.equal(parsed.records.length, 5);
  assert.equal(servicePlan.includes("not-written"), false);
  assert.equal(readFileSync(join(outDir, "raw-frames.bin")).length > 0, true);
});

test("formatRemoteMeshOmi preserves small VPS boundary facts", async () => {
  const outBase = mkdtempSync(join(tmpdir(), "omi-remote-mesh-facts-"));
  const result = await runTetragrammatronRemoteMesh({
    host: "small",
    remoteDir: "/root/omi-portal",
    dryRun: true,
    outDir: outBase
  });
  const omiText = readFileSync(join(result.outDir, "REMOTE_MESH.omi"), "utf8");
  const parsed = parseOmiDocument(omiText, { source: "REMOTE_MESH.omi" });

  assert.equal(SMALL_VPS_IPV4, "69.48.202.32");
  assert.equal(SMALL_VPS_IPV6, "2607:f1c0:f062:e900::1");
  assert.equal(parsed.malformed.length, 0);
  assert.match(omiText, /persistent-small-vps-public-mqtt-http/);
});

test("mocked remote execution runs bootstrap, rsync, npm, generation, and validation in order", async () => {
  const calls = [];
  const executor = {
    async ssh(host, script) {
      calls.push({ type: "ssh", host, script });
      if (script.includes("printf '{'") && script.includes("\"capabilities\"")) {
        return {
          status: 0,
          stdout: JSON.stringify({
            status: "ok",
            node: "my-vps",
            kernel: "6.12.90+deb13-amd64",
            arch: "x86_64",
            user: "root",
            capabilities: {
              node: "present",
              npm: "present",
              git: "present",
              docker: "missing",
              qemu: "missing",
              mosquitto: "missing"
            }
          }),
          stderr: ""
        };
      }
      if (script.includes("apt-get install")) {
        return { status: 0, stdout: "{\"status\":\"bootstrapped\"}\n", stderr: "" };
      }
      if (script.includes("npm run tetragrammatron:protocol-map")) {
        return { status: 0, stdout: "{\"status\":\"generated\"}\n", stderr: "" };
      }
      if (script.includes("docker run --rm hello-world")) {
        return {
          status: 0,
          stdout: JSON.stringify({
            status: "passed",
            accepted: true,
            http: { status: 0, code: "200" },
            sse: { headers: "Cross-Origin-Opener-Policy: same-origin" },
            mqtt: { publish: 0, subscribe: 0 },
            docker: { helloWorld: 0 },
            qemu: { x86Version: 0, aarch64Version: 0, fullSoftMmuBoot: "out-of-scope-on-small" },
            rawBinary: { decode: 0 }
          }),
          stderr: ""
        };
      }
      return { status: 0, stdout: "", stderr: "" };
    },
    async rsync(config) {
      calls.push({ type: "rsync", host: config.host, remoteDir: config.remoteDir });
      return { status: 0, stdout: "", stderr: "" };
    },
    async local() {
      throw new Error("local git push should not run in this test");
    }
  };

  const result = await runTetragrammatronRemoteMesh({
    bootstrap: true,
    executor,
    host: "small",
    publicMqttHttp: true,
    remoteDir: "/root/omi-portal",
    outDir: mkdtempSync(join(tmpdir(), "omi-remote-mesh-mock-"))
  });

  assert.equal(result.summary.state, "validated");
  assert.equal(result.summary.accepted, true);
  assert.equal(result.remoteChecks.accepted, true);
  assert.equal(calls.some((call) => call.type === "rsync"), true);
  assert.equal(calls.some((call) => call.script?.includes("apt-get install")), true);
  assert.equal(calls.some((call) => call.script?.includes("npm ci --no-audit --fund=false")), true);
  assert.equal(calls.some((call) => call.script?.includes("npm run tetragrammatron:bridge")), true);
});

test("remote mesh CLI dry-run writes artifacts without mutating sources", () => {
  const outBase = mkdtempSync(join(tmpdir(), "omi-remote-mesh-cli-"));
  const marker = join(outBase, "source-marker.txt");
  writeFileSync(marker, "before\n", "utf8");

  const output = execFileSync(process.execPath, [
    "scripts/tetragrammatron-remote-mesh.js",
    "--host",
    "small",
    "--remote-dir",
    "/root/omi-portal",
    "--out",
    outBase,
    "--public-mqtt-http",
    "--push-github",
    "--dry-run"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });

  assert.match(output, /Tetragrammatron remote mesh/);
  assert.equal(readFileSync(marker, "utf8"), "before\n");
  assert.equal(existsSync(join(outBase, "small", "summary.json")), true);
  assert.equal(existsSync(join(outBase, "small", "REMOTE_MESH.omi")), true);
});

test("real remote integration is gated by explicit environment variables", { skip: !process.env.OMI_REMOTE_HOST || process.env.OMI_ALLOW_REMOTE_MUTATION !== "1" }, async () => {
  const result = await runTetragrammatronRemoteMesh({
    host: process.env.OMI_REMOTE_HOST,
    remoteDir: process.env.OMI_REMOTE_DIR || "/root/omi-portal",
    bootstrap: process.env.OMI_REMOTE_BOOTSTRAP === "1",
    publicMqttHttp: true,
    pushGithub: false,
    outDir: mkdtempSync(join(tmpdir(), "omi-remote-mesh-live-"))
  });

  assert.equal(["validated", "failed"].includes(result.summary.state), true);
});

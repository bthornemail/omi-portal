import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fnv1a32, stableJson } from "../core/deterministic-utils.js";
import { parseOmiDocument } from "../omi/omi-parser.js";
import {
  createTetragrammatronProtocolMap,
  decodeBrowserProtocolFrame,
  formatProtocolMapOmi
} from "../web/tetragrammatron-protocol-map.js";
import { formatOmiAddressFromSegments } from "../omi/codebase-ingestion.js";

export const TETRAGRAMMATRON_REMOTE_MESH_VERSION = 1;
export const DEFAULT_REMOTE_MESH_HOST = "small";
export const DEFAULT_REMOTE_MESH_DIR = "/root/omi-portal";
export const DEFAULT_REMOTE_MESH_OUT = "dist/tetragrammatron-remote";
export const DEFAULT_REMOTE_BRANCH = "main";
export const SMALL_VPS_IPV4 = "69.48.202.32";
export const SMALL_VPS_IPV6 = "2607:f1c0:f062:e900::1";

export const REMOTE_MESH_PACKAGES = Object.freeze([
  "mosquitto",
  "mosquitto-clients",
  "docker.io",
  "qemu-system-x86",
  "qemu-system-arm",
  "qemu-user-static",
  "nginx",
  "ufw",
  "rsync",
  "curl",
  "jq"
]);

const FIREWALL_PORTS = Object.freeze(["22/tcp", "80/tcp", "443/tcp", "1883/tcp", "9001/tcp"]);
const REMOTE_ARTIFACT_DIR = ".omi/remote-mesh";

export async function runTetragrammatronRemoteMesh(options = {}) {
  const config = normalizeRemoteMeshOptions(options);
  const executor = options.executor || defaultExecutor();
  const outDir = join(config.outDir, config.hostSlug);
  await mkdir(outDir, { recursive: true });

  const servicePlan = createRemoteMeshServicePlan(config);
  const protocolMap = createTetragrammatronProtocolMap({ branch: config.branch });
  const protocolOmi = formatProtocolMapOmi(protocolMap);
  const rawFrames = protocolMap.routes.map((route) => bytesFromHex(route.binary.frameHex));
  const rawFrameBytes = concatBytes(rawFrames);
  const decodedFrames = rawFrames.map((frame, index) => ({
    id: protocolMap.routes[index].id,
    receipt: protocolMap.routes[index].binary.receipt,
    decoded: decodeBrowserProtocolFrame(frame)
  }));
  const preflight = config.dryRun
    ? dryRunPreflight(config)
    : await collectRemotePreflight(config, executor);

  const steps = [];
  let remoteChecks = dryRunRemoteChecks();
  let github = { status: "not-requested", branch: null };
  let remoteState = "planned";

  if (!config.dryRun) {
    if (config.bootstrap) {
      steps.push(await executor.ssh(config.host, remoteBootstrapScript(config)));
    }
    if (config.sync) {
      steps.push(await executor.rsync(config));
    }
    steps.push(await executor.ssh(config.host, `cd ${quoteShell(config.remoteDir)} && npm ci --no-audit --fund=false`));
    steps.push(await executor.ssh(config.host, remoteGenerateArtifactsScript(config)));
    remoteChecks = await runRemoteChecks(config, executor);
    remoteState = remoteChecks.accepted ? "validated" : "failed";
  }

  const stateHash = remoteMeshStateHash({ config, preflight, protocolMap, remoteChecks, servicePlan });
  const receipts = buildRemoteMeshReceipts({ config, protocolMap, remoteChecks, servicePlan, stateHash });
  const summary = {
    type: "tetragrammatron-remote-mesh-summary",
    version: TETRAGRAMMATRON_REMOTE_MESH_VERSION,
    host: config.host,
    remoteDir: config.remoteDir,
    branch: config.branch,
    outDir,
    state: remoteState,
    stateHash,
    accepted: remoteChecks.accepted && (!config.pushGithub || github.status === "pushed"),
    bootstrapRequested: config.bootstrap,
    publicHttp: config.publicHttp,
    publicMqtt: config.publicMqtt,
    pushGithub: config.pushGithub,
    preflightStatus: preflight.status,
    checkStatus: remoteChecks.status,
    receiptCount: receipts.length,
    protocolSignature: protocolMap.signature,
    artifactBranch: `receipts/${config.hostSlug}/${stateHash.slice(0, 16)}`
  };

  const omiText = formatRemoteMeshOmi({ config, github, preflight, protocolMap, remoteChecks, servicePlan, summary });
  await writeRemoteMeshArtifacts({
    decodedFrames,
    github,
    omiText,
    outDir,
    preflight,
    protocolMap,
    rawFrameBytes,
    receipts,
    remoteChecks,
    servicePlan,
    summary
  });

  if (!config.dryRun && config.pushGithub && remoteChecks.accepted) {
    github = await pushArtifactBranch({
      branch: summary.artifactBranch,
      executor,
      outDir,
      remoteUrl: config.gitRemote
    });
    summary.accepted = github.status === "pushed";
    await writeFile(join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    await writeFile(join(outDir, "github.json"), `${JSON.stringify(github, null, 2)}\n`, "utf8");
    await writeFile(join(outDir, "REMOTE_MESH.omi"), formatRemoteMeshOmi({
      config,
      github,
      preflight,
      protocolMap,
      remoteChecks,
      servicePlan,
      summary
    }), "utf8");
  } else if (config.pushGithub && config.dryRun) {
    github = { status: "dry-run", branch: summary.artifactBranch };
    await writeFile(join(outDir, "github.json"), `${JSON.stringify(github, null, 2)}\n`, "utf8");
  }

  return deepFreeze({
    summary,
    preflight,
    servicePlan,
    protocolMap,
    remoteChecks,
    receipts,
    github,
    outDir,
    steps
  });
}

export function normalizeRemoteMeshOptions(options = {}) {
  const host = String(options.host || DEFAULT_REMOTE_MESH_HOST).trim();
  const outBase = resolve(options.outDir || join(DEFAULT_REMOTE_MESH_OUT));
  return {
    bootstrap: Boolean(options.bootstrap),
    branch: normalizeBranchName(options.branch || DEFAULT_REMOTE_BRANCH),
    dryRun: Boolean(options.dryRun),
    gitRemote: String(options.gitRemote || "origin"),
    host,
    hostSlug: safeSlug(host),
    mqttPassword: options.mqttPassword || process.env.OMI_SMALL_MQTT_PASSWORD || null,
    outDir: outBase,
    publicHttp: Boolean(options.publicHttp || options.publicMqttHttp),
    publicMqtt: Boolean(options.publicMqtt || options.publicMqttHttp),
    pushGithub: Boolean(options.pushGithub),
    remoteDir: String(options.remoteDir || DEFAULT_REMOTE_MESH_DIR),
    repoRoot: resolve(options.repoRoot || repoRoot()),
    sync: options.sync !== false
  };
}

export function createRemoteMeshServicePlan(options = {}) {
  const config = normalizeRemoteMeshOptions(options);
  const mqttPasswordReceipt = config.mqttPassword
    ? secretReceipt(config.mqttPassword)
    : "generated-remotely-root-only";
  const commands = {
    installPackages: ["apt-get", "update", "&&", "apt-get", "install", "-y", ...REMOTE_MESH_PACKAGES],
    enableServices: ["systemctl", "enable", "--now", "nginx", "mosquitto", "docker", "omi-wan.service"],
    firewall: FIREWALL_PORTS.map((port) => ["ufw", "allow", port]),
    wanService: ["systemctl", "restart", "omi-wan.service"]
  };
  const body = {
    type: "tetragrammatron-remote-mesh-service-plan",
    version: TETRAGRAMMATRON_REMOTE_MESH_VERSION,
    host: config.host,
    remoteDir: config.remoteDir,
    publicHttp: config.publicHttp,
    publicMqtt: config.publicMqtt,
    packages: REMOTE_MESH_PACKAGES,
    services: ["nginx", "mosquitto", "docker", "omi-wan.service"],
    firewallPorts: FIREWALL_PORTS,
    mqtt: {
      listeners: [
        { port: 1883, protocol: "mqtt" },
        { port: 9001, protocol: "websockets" }
      ],
      allowAnonymous: false,
      passwordReceipt: mqttPasswordReceipt
    },
    http: {
      publicPort: 80,
      upstream: "http://127.0.0.1:8080",
      headers: ["Cross-Origin-Opener-Policy", "Cross-Origin-Embedder-Policy"]
    },
    qemu: {
      smokes: ["qemu-system-x86_64 --version", "qemu-system-aarch64 --version"],
      fullSoftMmuBoot: "out-of-scope-on-small"
    },
    commands
  };
  return deepFreeze({
    ...body,
    signature: `omi-remote-plan-${fnv1a32(stableJson(body)).toString(16).padStart(8, "0")}`
  });
}

export function formatRemoteMeshOmi({ config, github, preflight, protocolMap, remoteChecks, servicePlan, summary }) {
  const records = [
    remoteRecord(0, "remote-mesh-service-plan", [
      `STATE: ${sanitizeLine(summary.state)}`,
      `PROPERTY: host=${sanitizeLine(config.host)} remoteDir=${sanitizeLine(config.remoteDir)}`,
      `RECEIPT: ${servicePlan.signature}`,
      `BOUNDARY: persistent-small-vps-public-mqtt-http`
    ]),
    remoteRecord(1, "remote-mesh-preflight", [
      `STATE: ${sanitizeLine(preflight.status)}`,
      `PROPERTY: node=${sanitizeLine(preflight.node || "unknown")} docker=${sanitizeLine(preflight.capabilities?.docker || "unknown")} qemu=${sanitizeLine(preflight.capabilities?.qemu || "unknown")}`,
      `RECEIPT: ${summary.stateHash}`,
      `BOUNDARY: remote-readiness-before-bootstrap`
    ]),
    remoteRecord(2, "remote-mesh-protocol-map", [
      `STATE: candidate`,
      `PROPERTY: routes=${protocolMap.routeCount} signature=${protocolMap.signature}`,
      `RECEIPT: ${protocolMap.rawBinary.receipts.join(",")}`,
      `BOUNDARY: raw-binary-fs-gs-rs-us-control-frame`
    ]),
    remoteRecord(3, "remote-mesh-validation", [
      `STATE: ${remoteChecks.accepted ? "accepted" : "candidate"}`,
      `PROPERTY: status=${sanitizeLine(remoteChecks.status)}`,
      `RECEIPT: ${summary.stateHash}`,
      `BOUNDARY: remote-validation-without-source-authority`
    ]),
    remoteRecord(4, "remote-mesh-github-artifact-branch", [
      `STATE: ${sanitizeLine(github?.status || "not-requested")}`,
      `PROPERTY: branch=${sanitizeLine(github?.branch || summary.artifactBranch)}`,
      `RECEIPT: ${summary.stateHash}`,
      `BOUNDARY: artifact-branch-only-no-secrets`
    ])
  ];
  return `${[
    "# ============================================================================",
    "# SMALL VPS PERSISTENT TETRAGRAMMATRON MESH",
    "# Review artifact for remote mesh service, MQTT/HTTP exposure, raw frames, and receipts.",
    "# ============================================================================"
  ].concat(records).join("\n\n")}\n`;
}

async function collectRemotePreflight(config, executor) {
  const script = [
    "set -eu",
    "printf '{'",
    "printf '\"status\":\"ok\",'",
    "printf '\"node\":\"'; hostname | tr -d '\\n'; printf '\",'",
    "printf '\"kernel\":\"'; uname -r | tr -d '\\n'; printf '\",'",
    "printf '\"arch\":\"'; uname -m | tr -d '\\n'; printf '\",'",
    "printf '\"user\":\"'; id -un | tr -d '\\n'; printf '\",'",
    "printf '\"capabilities\":{'",
    "printf '\"node\":\"'; command -v node >/dev/null && printf present || printf missing; printf '\",'",
    "printf '\"npm\":\"'; command -v npm >/dev/null && printf present || printf missing; printf '\",'",
    "printf '\"git\":\"'; command -v git >/dev/null && printf present || printf missing; printf '\",'",
    "printf '\"docker\":\"'; command -v docker >/dev/null && printf present || printf missing; printf '\",'",
    "printf '\"qemu\":\"'; command -v qemu-system-x86_64 >/dev/null && printf present || printf missing; printf '\",'",
    "printf '\"mosquitto\":\"'; command -v mosquitto >/dev/null && printf present || printf missing",
    "printf '}}'",
  ].join("\n");
  const result = await executor.ssh(config.host, script);
  try {
    return deepFreeze(JSON.parse(result.stdout));
  } catch {
    return deepFreeze({ status: "parse-failed", stdout: result.stdout, stderr: result.stderr });
  }
}

async function runRemoteChecks(config, executor) {
  const result = await executor.ssh(config.host, remoteChecksScript(config));
  let checks;
  try {
    checks = JSON.parse(result.stdout);
  } catch {
    checks = { status: "parse-failed", accepted: false, stdout: result.stdout, stderr: result.stderr };
  }
  return deepFreeze(checks);
}

function remoteBootstrapScript(config) {
  const passwordMode = config.mqttPassword ? "provided" : "generated";
  const passwordCommand = config.mqttPassword
    ? `install -m 600 /dev/null /etc/mosquitto/passwd && mosquitto_passwd -b /etc/mosquitto/passwd omi ${quoteShell(config.mqttPassword)}`
    : "[ -s /root/.omi-small-mqtt-password ] || openssl rand -base64 24 > /root/.omi-small-mqtt-password\ninstall -m 600 /dev/null /etc/mosquitto/passwd\nmosquitto_passwd -b /etc/mosquitto/passwd omi \"$(cat /root/.omi-small-mqtt-password)\"";
  return [
    "set -eu",
    "export DEBIAN_FRONTEND=noninteractive",
    "apt-get update",
    `apt-get install -y ${REMOTE_MESH_PACKAGES.map(quoteShell).join(" ")}`,
    "mkdir -p /etc/mosquitto/conf.d /root/omi-portal",
    passwordCommand,
    "cat > /etc/mosquitto/conf.d/omi-small.conf <<'MOSQ'",
    "per_listener_settings false",
    "allow_anonymous false",
    "password_file /etc/mosquitto/passwd",
    "listener 1883 0.0.0.0",
    "protocol mqtt",
    "listener 9001 0.0.0.0",
    "protocol websockets",
    "MOSQ",
    `cat > /etc/systemd/system/omi-wan.service <<'SERVICE'`,
    "[Unit]",
    "Description=OMI WAN Edge Daemon",
    "After=network.target",
    "",
    "[Service]",
    "Type=simple",
    `WorkingDirectory=${config.remoteDir}`,
    `ExecStart=/usr/bin/node ${config.remoteDir}/scripts/wan-sync.js`,
    "Restart=always",
    "RestartSec=3",
    "Environment=NODE_ENV=production",
    "Environment=OMI_NODE_ROLE=edge",
    "Environment=OMI_BIND_HOST=127.0.0.1",
    "Environment=OMI_WAN_PORT=8080",
    "",
    "[Install]",
    "WantedBy=multi-user.target",
    "SERVICE",
    "cat > /etc/nginx/sites-available/omi-proxy <<'NGINX'",
    "server {",
    "    listen 80 default_server;",
    "    listen [::]:80 default_server;",
    "    server_name _;",
    "    add_header Cross-Origin-Opener-Policy \"same-origin\" always;",
    "    add_header Cross-Origin-Embedder-Policy \"require-corp\" always;",
    "    add_header X-Content-Type-Options \"nosniff\" always;",
    "    location / { proxy_pass http://127.0.0.1:8080; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }",
    "    location /omi-stream { proxy_pass http://127.0.0.1:8080/omi-stream; proxy_http_version 1.1; proxy_set_header Connection ''; proxy_buffering off; proxy_cache off; chunked_transfer_encoding on; }",
    "}",
    "NGINX",
    "ln -sf /etc/nginx/sites-available/omi-proxy /etc/nginx/sites-enabled/omi-proxy",
    "rm -f /etc/nginx/sites-enabled/default",
    "ufw default deny incoming",
    "ufw default allow outgoing",
    ...FIREWALL_PORTS.map((port) => `ufw allow ${quoteShell(port)}`),
    "ufw --force enable",
    "systemctl daemon-reload",
    "systemctl enable --now docker mosquitto nginx",
    "systemctl restart mosquitto nginx",
    `printf '{"status":"bootstrapped","mqttPassword":"${passwordMode}"}\\n'`
  ].join("\n");
}

function remoteGenerateArtifactsScript(config) {
  return [
    "set -eu",
    `cd ${quoteShell(config.remoteDir)}`,
    `mkdir -p ${quoteShell(REMOTE_ARTIFACT_DIR)}`,
    `npm run tetragrammatron:protocol-map -- --out ${quoteShell(`${REMOTE_ARTIFACT_DIR}/protocol-map`)} --branch ${quoteShell(config.branch)}`,
    `npm run tetragrammatron:bridge -- --dir . --out ${quoteShell(`${REMOTE_ARTIFACT_DIR}/bridge`)} --iterations 3 --top 50 --branch ${quoteShell(config.branch)} --max-files 80`,
    "printf '{\"status\":\"generated\"}\\n'"
  ].join("\n");
}

function remoteChecksScript(config) {
  const mqttPass = config.mqttPassword
    ? quoteShell(config.mqttPassword)
    : "\"$(cat /root/.omi-small-mqtt-password 2>/dev/null || true)\"";
  return [
    "set +e",
    `cd ${quoteShell(config.remoteDir)}`,
    "http_code=$(curl -fsS -o /tmp/omi-health.txt -w '%{http_code}' http://127.0.0.1:8080/healthz 2>/tmp/omi-health.err)",
    "http_status=$?",
    "headers=$(curl -fsSI http://127.0.0.1:8080/omi-stream 2>/dev/null | tr '\\r' ' ' | sed ':a;N;$!ba;s/\\n/ | /g')",
    "mosquitto_sub -h 127.0.0.1 -p 1883 -u omi -P " + mqttPass + " -t 'omi/state/#' -C 1 -W 3 >/tmp/omi-mqtt-sub.out 2>/tmp/omi-mqtt-sub.err & subpid=$!",
    "sleep 1",
    "mosquitto_pub -h 127.0.0.1 -p 1883 -u omi -P " + mqttPass + " -t 'omi/state/main/control' -m 'remote-mesh-smoke' >/tmp/omi-mqtt-pub.out 2>/tmp/omi-mqtt-pub.err",
    "mqtt_pub=$?",
    "wait $subpid; mqtt_sub=$?",
    "docker run --rm hello-world >/tmp/omi-docker.out 2>/tmp/omi-docker.err; docker_status=$?",
    "qemu-system-x86_64 --version >/tmp/omi-qemu-x86.out 2>/tmp/omi-qemu-x86.err; qemu_x86=$?",
    "qemu-system-aarch64 --version >/tmp/omi-qemu-arm.out 2>/tmp/omi-qemu-arm.err; qemu_arm=$?",
    "node -e \"import('./src/web/tetragrammatron-protocol-map.js').then(async m=>{const fs=await import('node:fs'); const lines=fs.readFileSync('.omi/remote-mesh/protocol-map/raw-frames.hex','utf8').trim().split(/\\n+/); for (const line of lines) m.decodeBrowserProtocolFrame(Uint8Array.from(line.trim().split(/\\s+/).map(x=>parseInt(x,16)))); console.log('ok')})\" >/tmp/omi-raw-frame.out 2>/tmp/omi-raw-frame.err; raw_status=$?",
    "accepted=false",
    "[ \"$http_status\" = 0 ] && [ \"$mqtt_pub\" = 0 ] && [ \"$mqtt_sub\" = 0 ] && [ \"$docker_status\" = 0 ] && [ \"$qemu_x86\" = 0 ] && [ \"$qemu_arm\" = 0 ] && [ \"$raw_status\" = 0 ] && accepted=true",
    "printf '{'",
    "printf '\"status\":\"'; $accepted && printf passed || printf failed; printf '\",'",
    "printf '\"accepted\":'; $accepted && printf true || printf false; printf ','",
    "printf '\"http\":{\"status\":%s,\"code\":\"%s\"},' \"$http_status\" \"$http_code\"",
    "printf '\"sse\":{\"headers\":%s},' \"$(node -e 'console.log(JSON.stringify(process.argv[1]||\"\"))' \"$headers\")\"",
    "printf '\"mqtt\":{\"publish\":%s,\"subscribe\":%s},' \"$mqtt_pub\" \"$mqtt_sub\"",
    "printf '\"docker\":{\"helloWorld\":%s},' \"$docker_status\"",
    "printf '\"qemu\":{\"x86Version\":%s,\"aarch64Version\":%s,\"fullSoftMmuBoot\":\"out-of-scope-on-small\"},' \"$qemu_x86\" \"$qemu_arm\"",
    "printf '\"rawBinary\":{\"decode\":%s}' \"$raw_status\"",
    "printf '}\\n'"
  ].join("\n");
}

async function pushArtifactBranch({ branch, executor, outDir, remoteUrl }) {
  const artifactRepo = `${outDir}.artifact-git`;
  await rm(artifactRepo, { force: true, recursive: true });
  await mkdir(artifactRepo, { recursive: true });
  await executor.local("git", ["init"], { cwd: artifactRepo });
  await executor.local("git", ["checkout", "--orphan", branch], { cwd: artifactRepo });
  await executor.local("mkdir", ["-p", "remote-mesh"], { cwd: artifactRepo });
  await executor.local("cp", ["-R", `${outDir}/.`, "remote-mesh/"], { cwd: artifactRepo });
  await executor.local("git", ["add", "remote-mesh"], { cwd: artifactRepo });
  await executor.local("git", ["-c", "user.name=omi-remote-mesh", "-c", "user.email=omi-remote-mesh@example.invalid", "commit", "-m", `remote mesh receipts ${branch}`], { cwd: artifactRepo });
  await executor.local("git", ["remote", "add", "origin", remoteUrl], { cwd: artifactRepo });
  const pushed = await executor.local("git", ["push", "-f", "origin", `HEAD:${branch}`], { cwd: artifactRepo, allowFailure: true });
  return {
    status: pushed.status === 0 ? "pushed" : "push-failed-auth",
    branch,
    stderr: pushed.status === 0 ? "" : redact(pushed.stderr),
    stdout: pushed.status === 0 ? redact(pushed.stdout) : ""
  };
}

async function writeRemoteMeshArtifacts({
  decodedFrames,
  github,
  omiText,
  outDir,
  preflight,
  protocolMap,
  rawFrameBytes,
  receipts,
  remoteChecks,
  servicePlan,
  summary
}) {
  await writeFile(join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "remote-preflight.json"), `${JSON.stringify(preflight, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "service-plan.json"), `${JSON.stringify(servicePlan, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "protocol-map.json"), `${JSON.stringify(protocolMap, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "raw-frames.bin"), rawFrameBytes);
  await writeFile(join(outDir, "decoded-frames.json"), `${JSON.stringify(decodedFrames, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "mqtt-topics.json"), `${JSON.stringify(protocolMap.topics, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "remote-checks.json"), `${JSON.stringify(remoteChecks, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "receipts.ndjson"), `${receipts.map((receipt) => JSON.stringify(receipt)).join("\n")}\n`, "utf8");
  await writeFile(join(outDir, "github.json"), `${JSON.stringify(github, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "REMOTE_MESH.omi"), omiText, "utf8");
  const parsed = parseOmiDocument(omiText, { source: "REMOTE_MESH.omi" });
  await writeFile(join(outDir, "parse.json"), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
}

function buildRemoteMeshReceipts({ config, protocolMap, remoteChecks, servicePlan, stateHash }) {
  const rows = [
    { kind: "service-plan", receipt: servicePlan.signature },
    { kind: "state-hash", receipt: stateHash },
    { kind: "remote-checks", receipt: `omi-remote-checks-${fnv1a32(stableJson(remoteChecks)).toString(16).padStart(8, "0")}` },
    ...protocolMap.routes.map((route) => ({ kind: "protocol-route", id: route.id, receipt: route.binary.receipt }))
  ];
  return rows.map((row, index) => ({
    type: "tetragrammatron-remote-mesh-receipt",
    version: TETRAGRAMMATRON_REMOTE_MESH_VERSION,
    host: config.host,
    branch: config.branch,
    index,
    ...row
  }));
}

function remoteMeshStateHash({ config, preflight, protocolMap, remoteChecks, servicePlan }) {
  return createHash("sha256").update(stableJson({
    host: config.host,
    remoteDir: config.remoteDir,
    branch: config.branch,
    preflight,
    protocolSignature: protocolMap.signature,
    checks: remoteChecks,
    servicePlan: servicePlan.signature
  })).digest("hex");
}

function dryRunPreflight(config) {
  return {
    status: "dry-run",
    node: config.host,
    capabilities: {
      node: "planned",
      npm: "planned",
      git: "planned",
      docker: "planned",
      qemu: "planned",
      mosquitto: "planned"
    }
  };
}

function dryRunRemoteChecks() {
  return {
    status: "dry-run",
    accepted: false,
    http: { status: "planned" },
    sse: { status: "planned" },
    mqtt: { status: "planned" },
    docker: { status: "planned" },
    qemu: { status: "planned", fullSoftMmuBoot: "out-of-scope-on-small" },
    rawBinary: { status: "planned" }
  };
}

function defaultExecutor() {
  return {
    ssh(host, script) {
      return runProcess("ssh", ["-o", "BatchMode=yes", host, script]);
    },
    rsync(config) {
      return runProcess("rsync", [
        "-az",
        "--delete",
        "--exclude", "node_modules",
        "--exclude", "dist",
        "--exclude", ".git",
        `${config.repoRoot}/`,
        `${config.host}:${config.remoteDir}/`
      ]);
    },
    local(command, args, options = {}) {
      return runProcess(command, args, options);
    }
  };
}

function runProcess(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      shell: false
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (status) => {
      const result = { command, args, status, stdout, stderr };
      if (status !== 0 && !options.allowFailure) {
        const error = new Error(`${command} ${args.join(" ")} failed with status ${status}`);
        error.result = result;
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

function remoteRecord(index, name, sections) {
  const seed = fnv1a32(`${name}:${index}`);
  const address = formatOmiAddressFromSegments([
    0x0d06,
    TETRAGRAMMATRON_REMOTE_MESH_VERSION,
    index,
    seed & 0xffff,
    (seed >>> 16) & 0xffff,
    0x0060,
    0x1883,
    0x9001
  ]);
  return [`${address}/128 SHOULD ${name}`, ...sections].join("\n");
}

function bytesFromHex(hex) {
  return Uint8Array.from(String(hex).trim().split(/\s+/).map((part) => Number.parseInt(part, 16)));
}

function concatBytes(chunks) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function secretReceipt(value) {
  return `secret-sha256-${createHash("sha256").update(String(value)).digest("hex")}`;
}

function normalizeBranchName(value) {
  const branch = String(value || DEFAULT_REMOTE_BRANCH).trim();
  if (!branch || branch.startsWith("/") || branch.includes("..") || /[\s~^:?*[\\]/.test(branch)) {
    throw new TypeError(`Invalid remote mesh branch: ${value}`);
  }
  return branch;
}

function quoteShell(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function safeSlug(value) {
  return String(value || "small").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "small";
}

function sanitizeLine(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function redact(value) {
  return String(value || "").replace(/password=[^\s]+/gi, "password=<redacted>");
}

function repoRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

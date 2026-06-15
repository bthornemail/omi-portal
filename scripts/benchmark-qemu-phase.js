#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync } from "node:fs";
import {
  appendFile,
  copyFile,
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

const EXPECTED_ARTIFACTS = [
  "environment.txt",
  "baseline.log",
  "emmc-proof.log",
  "emmc-image.sha256",
  "emmc-receipt.json",
  "qemu-user-build.log",
  "softmmu-build.log",
  "stress.log",
  "load-compose.log",
  "summary.json",
  "report.md",
];

function usage() {
  return `Usage: node scripts/benchmark-qemu-phase.js [options]

Options:
  --only <phase>             Run one phase: emmc, baseline, docker, softmmu, stress, load, qemu-launch
  --include-docker           Include docker buildx qemu-test and stress-validation
  --include-softmmu          Include docker buildx softmmu-test
  --include-stress           Include native benchmark-stress-all
  --include-load             Include docker-compose load matrix
  --include-qemu-launch      Include explicit eMMC raw-carrier QEMU launch smoke test
  --emmc-runs <n>            Number of eMMC proof runs; default 1, or 3 with --only emmc
  --out-dir <path>           Output directory; default dist/benchmarks/<utc timestamp>
  --dry-run                  Write artifacts and planned commands without executing commands
  --continue-on-error        Keep running after failures
  --help                     Show this help
`;
}

function parseArgs(argv) {
  const options = {
    continueOnError: false,
    dryRun: false,
    includeDocker: false,
    includeLoad: false,
    includeQemuLaunch: false,
    includeSoftmmu: false,
    includeStress: false,
    only: null,
    outDir: null,
    emmcRuns: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") {
      console.log(usage());
      process.exit(0);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--continue-on-error") {
      options.continueOnError = true;
    } else if (arg === "--include-docker") {
      options.includeDocker = true;
    } else if (arg === "--include-softmmu") {
      options.includeSoftmmu = true;
    } else if (arg === "--include-stress") {
      options.includeStress = true;
    } else if (arg === "--include-load") {
      options.includeLoad = true;
    } else if (arg === "--include-qemu-launch") {
      options.includeQemuLaunch = true;
    } else if (arg === "--only") {
      options.only = argv[++index];
    } else if (arg.startsWith("--only=")) {
      options.only = arg.slice("--only=".length);
    } else if (arg === "--out-dir") {
      options.outDir = argv[++index];
    } else if (arg.startsWith("--out-dir=")) {
      options.outDir = arg.slice("--out-dir=".length);
    } else if (arg === "--emmc-runs") {
      options.emmcRuns = Number.parseInt(argv[++index], 10);
    } else if (arg.startsWith("--emmc-runs=")) {
      options.emmcRuns = Number.parseInt(arg.slice("--emmc-runs=".length), 10);
    } else {
      throw new Error(`Unknown benchmark option: ${arg}\n\n${usage()}`);
    }
  }

  if (options.only && !["emmc", "baseline", "docker", "softmmu", "stress", "load", "qemu-launch"].includes(options.only)) {
    throw new Error(`Unsupported --only phase: ${options.only}`);
  }
  if (options.emmcRuns !== null && (!Number.isInteger(options.emmcRuns) || options.emmcRuns < 1)) {
    throw new Error("--emmc-runs must be a positive integer");
  }

  return options;
}

function runId() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function outputDirFor(options, id) {
  if (!options.outDir) return join(repoRoot, "dist", "benchmarks", id);
  return isAbsolute(options.outDir) ? options.outDir : resolve(repoRoot, options.outDir);
}

function rel(path) {
  const value = relative(repoRoot, path);
  return value.startsWith("..") ? path : value;
}

function quote(value) {
  return /^[A-Za-z0-9_./:=@%+-]+$/.test(value) ? value : JSON.stringify(value);
}

function shellLine(command, args) {
  return [command, ...args].map(quote).join(" ");
}

function commandSpec({
  args = [],
  command,
  env = {},
  id,
  label,
  logFile,
  phase,
  alwaysRun = false,
}) {
  return { id, label, phase, command, args, env, logFile, alwaysRun };
}

function addEmmcCommands(commands, runs) {
  for (let index = 1; index <= runs; index += 1) {
    commands.push(commandSpec({
      id: `emmc-proof-${index}`,
      label: `eMMC proof run ${index}/${runs}`,
      phase: "emmc",
      command: "make",
      args: ["emmc-proof"],
      logFile: "emmc-proof.log",
    }));
  }
}

function addBaselineCommands(commands) {
  commands.push(
    commandSpec({
      id: "verify-safe",
      label: "daily non-eBPF verification gate",
      phase: "baseline",
      command: "make",
      args: ["verify-safe"],
      logFile: "baseline.log",
    }),
    commandSpec({
      id: "npm-test",
      label: "full Node test suite",
      phase: "baseline",
      command: "npm",
      args: ["test"],
      logFile: "baseline.log",
    }),
    commandSpec({
      id: "npm-build",
      label: "Vite production build",
      phase: "baseline",
      command: "npm",
      args: ["run", "build"],
      logFile: "baseline.log",
    }),
  );
}

function addDockerCommands(commands) {
  commands.push(commandSpec({
    id: "qemu-user-build",
    label: "QEMU user-mode container matrix",
    phase: "docker",
    command: "docker",
    args: ["buildx", "bake", "qemu-test"],
    logFile: "qemu-user-build.log",
  }));
}

function addSoftmmuCommands(commands) {
  commands.push(commandSpec({
    id: "softmmu-build",
    label: "SoftMMU full-system container matrix",
    phase: "softmmu",
    command: "docker",
    args: ["buildx", "bake", "softmmu-test"],
    logFile: "softmmu-build.log",
  }));
}

function addDockerStressCommand(commands) {
  commands.push(commandSpec({
    id: "docker-stress",
    label: "Docker stress-validation bake target",
    phase: "stress",
    command: "docker",
    args: ["buildx", "bake", "stress-validation"],
    logFile: "stress.log",
  }));
}

function addNativeStressCommand(commands) {
  commands.push(commandSpec({
    id: "native-stress",
    label: "Native benchmark stress suite",
    phase: "stress",
    command: "make",
    args: ["benchmark-stress-all"],
    logFile: "stress.log",
  }));
}

function addLoadCommands(commands) {
  commands.push(
    commandSpec({
      id: "load-compose-up",
      label: "polytope load matrix compose up",
      phase: "load",
      command: "docker",
      args: ["compose", "-f", "docker-compose.load.yml", "up", "--build", "--abort-on-container-exit"],
      logFile: "load-compose.log",
    }),
    commandSpec({
      id: "load-compose-down",
      label: "polytope load matrix compose cleanup",
      phase: "load",
      command: "docker",
      args: ["compose", "-f", "docker-compose.load.yml", "down", "--remove-orphans"],
      logFile: "load-compose.log",
      alwaysRun: true,
    }),
  );
}

function addQemuLaunchCommand(commands) {
  commands.push(commandSpec({
    id: "qemu-emmc-launch",
    label: "operator-gated eMMC raw-carrier QEMU smoke",
    phase: "qemu-launch",
    command: "timeout",
    args: ["20s", "sh", "scripts/run-omi-emmc-qemu.sh"],
    env: {
      OMI_EMMC_IMAGE: process.env.OMI_EMMC_IMAGE || "dist/omi-emmc-state.img",
      OMI_QEMU_BOOT_ARTIFACT: process.env.OMI_QEMU_BOOT_ARTIFACT || "dist/omi-boot-kernel.bin",
    },
    logFile: "qemu-launch.log",
  }));
}

function selectedCommands(options) {
  const commands = [];
  const emmcRuns = options.emmcRuns ?? (options.only === "emmc" ? 3 : 1);

  if (options.only === "emmc") {
    addEmmcCommands(commands, emmcRuns);
    return commands;
  }
  if (options.only === "baseline") {
    addEmmcCommands(commands, emmcRuns);
    addBaselineCommands(commands);
    return commands;
  }
  if (options.only === "docker") {
    addDockerCommands(commands);
    addDockerStressCommand(commands);
    return commands;
  }
  if (options.only === "softmmu") {
    addSoftmmuCommands(commands);
    return commands;
  }
  if (options.only === "stress") {
    addNativeStressCommand(commands);
    addDockerStressCommand(commands);
    return commands;
  }
  if (options.only === "load") {
    addLoadCommands(commands);
    return commands;
  }
  if (options.only === "qemu-launch") {
    addQemuLaunchCommand(commands);
    return commands;
  }

  addEmmcCommands(commands, emmcRuns);
  addBaselineCommands(commands);
  if (options.includeDocker) addDockerCommands(commands);
  if (options.includeSoftmmu) addSoftmmuCommands(commands);
  if (options.includeStress) addNativeStressCommand(commands);
  if (options.includeDocker) addDockerStressCommand(commands);
  if (options.includeLoad) addLoadCommands(commands);
  if (options.includeQemuLaunch) addQemuLaunchCommand(commands);

  return commands;
}

async function writeIfMissing(path, content) {
  if (existsSync(path)) return;
  await writeFile(path, content);
}

async function initializeArtifactTree(outDir) {
  await mkdir(outDir, { recursive: true });
  for (const artifact of EXPECTED_ARTIFACTS) {
    const path = join(outDir, artifact);
    if (artifact.endsWith(".log")) {
      await writeIfMissing(path, "");
    }
  }
  await writeIfMissing(join(outDir, "emmc-image.sha256"), "not generated\n");
  await writeIfMissing(join(outDir, "emmc-receipt.json"), `${JSON.stringify({
    generated: false,
    note: "not generated",
  }, null, 2)}\n`);
}

function capture(command, args = []) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  if (result.error) {
    return {
      command: shellLine(command, args),
      ok: false,
      output: result.error.message,
      status: null,
    };
  }
  return {
    command: shellLine(command, args),
    ok: result.status === 0,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
    status: result.status,
  };
}

async function writeEnvironment(outDir, id, commands) {
  const probes = [
    capture("node", ["--version"]),
    capture("npm", ["--version"]),
    capture("docker", ["--version"]),
    capture("docker", ["buildx", "version"]),
    capture("docker", ["compose", "version"]),
    capture("qemu-system-x86_64", ["--version"]),
    capture("qemu-system-aarch64", ["--version"]),
    capture("qemu-system-riscv64", ["--version"]),
  ];

  const lines = [
    "OMI QEMU benchmark environment",
    `run_id: ${id}`,
    `cwd: ${repoRoot}`,
    `timestamp_utc: ${new Date().toISOString()}`,
    `platform: ${process.platform}`,
    `arch: ${process.arch}`,
    `node: ${process.version}`,
    `cpus: ${os.cpus().length}`,
    `total_memory_bytes: ${os.totalmem()}`,
    `free_memory_bytes: ${os.freemem()}`,
    `kvm: ${existsSync("/dev/kvm") ? "available" : "unavailable; TCG only"}`,
    "",
    "Selected commands:",
    ...commands.map((command) => `- [${command.phase}] ${shellLine(command.command, command.args)}`),
    "",
    "Tool probes:",
  ];

  for (const probe of probes) {
    lines.push(`$ ${probe.command}`);
    lines.push(`exit: ${probe.status === null ? "error" : probe.status}`);
    lines.push(probe.output || "(no output)");
    lines.push("");
  }

  await writeFile(join(outDir, "environment.txt"), `${lines.join("\n")}\n`);
}

function baseSummary(id, outDir, options, commands) {
  return {
    runId: id,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: "running",
    repoRoot,
    outputDir: rel(outDir),
    options: {
      continueOnError: options.continueOnError,
      dryRun: options.dryRun,
      includeDocker: options.includeDocker,
      includeLoad: options.includeLoad,
      includeQemuLaunch: options.includeQemuLaunch,
      includeSoftmmu: options.includeSoftmmu,
      includeStress: options.includeStress,
      only: options.only,
      emmcRuns: options.emmcRuns,
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      kvmAvailable: existsSync("/dev/kvm"),
    },
    artifacts: {
      environment: rel(join(outDir, "environment.txt")),
      report: rel(join(outDir, "report.md")),
      summary: rel(join(outDir, "summary.json")),
    },
    plannedCommands: commands.map((command) => ({
      id: command.id,
      phase: command.phase,
      command: command.command,
      args: command.args,
      logFile: command.logFile,
    })),
    commands: [],
  };
}

async function writeSummary(outDir, summary) {
  await writeFile(join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

async function appendLogHeader(logPath, spec) {
  await appendFile(logPath, [
    "",
    `## ${spec.id}`,
    `label: ${spec.label}`,
    `phase: ${spec.phase}`,
    `$ ${shellLine(spec.command, spec.args)}`,
    `started_at: ${new Date().toISOString()}`,
    "",
  ].join("\n"));
}

async function endLogStream(stream, footer) {
  await new Promise((resolveStream, rejectStream) => {
    stream.once("error", rejectStream);
    stream.end(footer, resolveStream);
  });
}

async function runCommand(spec, outDir, options) {
  const startedAt = new Date().toISOString();
  const start = process.hrtime.bigint();
  const logPath = join(outDir, spec.logFile);
  await appendLogHeader(logPath, spec);

  console.log(`[benchmark] ${spec.id}: ${shellLine(spec.command, spec.args)}`);

  if (options.dryRun) {
    await appendFile(logPath, "[dry-run] command not executed\n");
    return {
      id: spec.id,
      label: spec.label,
      phase: spec.phase,
      command: spec.command,
      args: spec.args,
      logFile: spec.logFile,
      startedAt,
      finishedAt: new Date().toISOString(),
      elapsedMs: 0,
      exitCode: null,
      signal: null,
      skipped: true,
      ok: true,
    };
  }

  return await new Promise((resolveCommand) => {
    const child = spawn(spec.command, spec.args, {
      cwd: repoRoot,
      env: { ...process.env, ...spec.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stream = createWriteStream(logPath, { flags: "a" });
    let resolved = false;

    child.stdout.pipe(stream, { end: false });
    child.stderr.pipe(stream, { end: false });

    child.on("error", async (error) => {
      if (resolved) return;
      resolved = true;
      const finishedAt = new Date().toISOString();
      const elapsedMs = Number((process.hrtime.bigint() - start) / 1000000n);
      await endLogStream(stream, `\n[error] ${error.message}\nfinished_at: ${finishedAt}\n`);
      resolveCommand({
        id: spec.id,
        label: spec.label,
        phase: spec.phase,
        command: spec.command,
        args: spec.args,
        logFile: spec.logFile,
        startedAt,
        finishedAt,
        elapsedMs,
        exitCode: null,
        signal: null,
        skipped: false,
        ok: false,
        error: error.message,
      });
    });

    child.on("close", async (exitCode, signal) => {
      if (resolved) return;
      resolved = true;
      const finishedAt = new Date().toISOString();
      const elapsedMs = Number((process.hrtime.bigint() - start) / 1000000n);
      await endLogStream(stream, `\nfinished_at: ${finishedAt}\nexit_code: ${exitCode}\nsignal: ${signal || ""}\nelapsed_ms: ${elapsedMs}\n`);
      resolveCommand({
        id: spec.id,
        label: spec.label,
        phase: spec.phase,
        command: spec.command,
        args: spec.args,
        logFile: spec.logFile,
        startedAt,
        finishedAt,
        elapsedMs,
        exitCode,
        signal,
        skipped: false,
        ok: exitCode === 0,
      });
    });
  });
}

async function sha256File(path) {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}

async function collectEmmcArtifacts(outDir, summary, { dryRun }) {
  const snapshot = {};
  if (dryRun) {
    summary.artifacts.emmcImageSha256 = null;
    summary.artifacts.emmcReceipt = rel(join(outDir, "emmc-receipt.json"));
    snapshot.emmcImageSha256 = null;
    snapshot.emmcReceipt = summary.artifacts.emmcReceipt;
    return snapshot;
  }

  const imagePath = join(repoRoot, "dist", "omi-emmc-state.img");
  const receiptPath = join(repoRoot, "dist", "omi-emmc-receipt.json");
  if (existsSync(imagePath)) {
    const imageStat = await stat(imagePath);
    const hash = await sha256File(imagePath);
    await writeFile(join(outDir, "emmc-image.sha256"), `${hash}  ${rel(imagePath)}\n`);
    summary.artifacts.emmcImage = rel(imagePath);
    summary.artifacts.emmcImageBytes = imageStat.size;
    summary.artifacts.emmcImageSha256 = hash;
    summary.artifacts.emmcImageSha256File = rel(join(outDir, "emmc-image.sha256"));
    snapshot.emmcImage = rel(imagePath);
    snapshot.emmcImageBytes = imageStat.size;
    snapshot.emmcImageSha256 = hash;
  }
  if (existsSync(receiptPath)) {
    await copyFile(receiptPath, join(outDir, "emmc-receipt.json"));
    summary.artifacts.emmcReceipt = rel(join(outDir, "emmc-receipt.json"));
    snapshot.emmcReceipt = summary.artifacts.emmcReceipt;
  }
  return snapshot;
}

function reportRows(commands) {
  if (commands.length === 0) return "| none | | | | |\n";
  return commands.map((command) => {
    const state = command.skipped ? "skipped" : command.ok ? "pass" : "fail";
    const elapsed = command.skipped ? "0.000" : (command.elapsedMs / 1000).toFixed(3);
    const exit = command.exitCode === null ? "" : String(command.exitCode);
    return `| ${command.id} | ${command.phase} | ${state} | ${exit} | ${elapsed} |`;
  }).join("\n");
}

function emmcHashRows(commands) {
  const rows = commands
    .filter((command) => command.phase === "emmc" && command.artifacts?.emmcImageSha256)
    .map((command) => `| ${command.id} | ${command.artifacts.emmcImageBytes} | ${command.artifacts.emmcImageSha256} |`);
  if (rows.length === 0) return [];
  return [
    "## eMMC Proof Runs",
    "",
    "| command | bytes | image sha256 |",
    "| --- | ---: | --- |",
    ...rows,
    "",
  ];
}

async function writeReport(outDir, summary) {
  const lines = [
    "# QEMU Benchmark Phase Report",
    "",
    `Run: ${summary.runId}`,
    `Status: ${summary.status}`,
    `Started: ${summary.startedAt}`,
    `Finished: ${summary.finishedAt || ""}`,
    "",
    "## Environment",
    "",
    `- Node: ${summary.environment.node}`,
    `- Platform: ${summary.environment.platform}/${summary.environment.arch}`,
    `- CPUs: ${summary.environment.cpus}`,
    `- KVM: ${summary.environment.kvmAvailable ? "available" : "unavailable; TCG only"}`,
    "",
    "## eMMC Artifact",
    "",
    `- Image bytes: ${summary.artifacts.emmcImageBytes ?? "not generated"}`,
    `- Image SHA-256: ${summary.artifacts.emmcImageSha256 ?? "not generated"}`,
    `- Receipt: ${summary.artifacts.emmcReceipt ?? "not generated"}`,
    "",
    "## Commands",
    "",
    "| command | phase | status | exit | seconds |",
    "| --- | --- | --- | --- | ---: |",
    reportRows(summary.commands),
    "",
    ...emmcHashRows(summary.commands),
    "QEMU launch is not part of the default benchmark. It runs only when `--include-qemu-launch` is passed.",
    "",
  ];
  await writeFile(join(outDir, "report.md"), `${lines.join("\n")}\n`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const id = runId();
  const outDir = outputDirFor(options, id);
  const commands = selectedCommands(options);

  await initializeArtifactTree(outDir);
  await writeEnvironment(outDir, id, commands);

  const summary = baseSummary(id, outDir, options, commands);
  await writeSummary(outDir, summary);

  let anyFailure = false;
  let stopAfterFailure = false;
  for (let index = 0; index < commands.length; index += 1) {
    const spec = commands[index];
    if (stopAfterFailure && !spec.alwaysRun) continue;

    const result = await runCommand(spec, outDir, options);
    const artifactSnapshot = await collectEmmcArtifacts(outDir, summary, options);
    if (spec.phase === "emmc" && result.ok && artifactSnapshot.emmcImageSha256) {
      result.artifacts = artifactSnapshot;
    }
    summary.commands.push(result);
    await writeSummary(outDir, summary);

    if (!result.ok) {
      anyFailure = true;
      if (!options.continueOnError) stopAfterFailure = true;
    }
  }

  summary.finishedAt = new Date().toISOString();
  summary.status = options.dryRun ? "dry-run" : anyFailure ? "failed" : "passed";
  await collectEmmcArtifacts(outDir, summary, options);
  await writeSummary(outDir, summary);
  await writeReport(outDir, summary);

  console.log(`[benchmark] summary: ${rel(join(outDir, "summary.json"))}`);
  console.log(`[benchmark] report: ${rel(join(outDir, "report.md"))}`);

  if (anyFailure) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

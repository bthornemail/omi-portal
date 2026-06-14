import http from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import 'dotenv/config';

const PORT = process.env.PORT || 8080;
const CANONICAL_ROOT = process.env.CANONICAL_ROOT || "omi-ffff-127-0-0-1";
const REPO_ROOT = resolve(import.meta.dirname, '..');

const ALLOWED_TARGETS = {
  "verify-safe": ["make", "verify-safe"],
  "qemu-test": ["make", "qemu-test"],
  "softmmu-test": ["make", "softmmu-test"],
  "docker-build": ["make", "docker-build"],
  "docker-stress": ["make", "docker-stress"],
  "run-all-virt-gates": ["make", "run-all-virt-gates"],
  "test-omi-pipe": ["make", "test-omi-pipe"],
  "test-omi-pipe-mcrsgsp": ["make", "test-omi-pipe-mcrsgsp"],
  "test-omi-pipe-omi-acceptance": ["make", "test-omi-pipe-omi-acceptance"],
  "test-omi-pipe-causal-proof": ["make", "test-omi-pipe-causal-proof"],
  "test-omi-pipe-rs-proof": ["make", "test-omi-pipe-rs-proof"],
  "test-omi-pipe-gf256-rs-proof": ["make", "test-omi-pipe-gf256-rs-proof"]
};

/** @type {Map<string, import('./types.js').InfraRunRecord & { sseClients: Set<import('http').ServerResponse>, abort: () => void }>} */
const runs = new Map();

function writeJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function handleInfraRun(req, res) {
  if (req.method !== "POST") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;

  let target;
  try {
    target = JSON.parse(body).target;
  } catch { target = null; }

  if (!target || !ALLOWED_TARGETS[target]) {
    writeJson(res, 400, { error: `Unknown or disallowed target: "${target}"` });
    return;
  }

  const id = randomUUID();
  const commandArr = ALLOWED_TARGETS[target];
  const run = {
    id,
    target,
    command: commandArr.join(' '),
    status: "running",
    startedAt: Date.now(),
    finishedAt: null,
    stdout: [],
    stderr: [],
    exitCode: null,
    dataOmi: `infra-run/${target}`,
    dataImo: `imo:run@${id.slice(0, 8)}`,
    sseClients: new Set()
  };

  const child = spawn(commandArr[0], commandArr.slice(1), { cwd: REPO_ROOT });

  child.stdout.on("data", (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.length > 0) {
        run.stdout.push(line);
        for (const client of run.sseClients) {
          sendSSE(client, "stdout", { line, target });
        }
      }
    }
  });

  child.stderr.on("data", (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.length > 0) {
        run.stderr.push(line);
        for (const client of run.sseClients) {
          sendSSE(client, "stderr", { line, target });
        }
      }
    }
  });

  child.on("close", (code) => {
    run.status = code === 0 ? "passed" : "failed";
    run.exitCode = code;
    run.finishedAt = Date.now();
    for (const client of run.sseClients) {
      sendSSE(client, "complete", { status: run.status, exitCode: code, target });
      client.end();
    }
    run.sseClients.clear();
  });

  child.on("error", (err) => {
    run.status = "failed";
    run.exitCode = -1;
    run.stderr.push(err.message);
    run.finishedAt = Date.now();
    for (const client of run.sseClients) {
      sendSSE(client, "error", { message: err.message, target });
      client.end();
    }
    run.sseClients.clear();
  });

  run.abort = () => {
    child.kill();
    run.status = "failed";
    run.exitCode = -1;
    run.finishedAt = Date.now();
    for (const client of run.sseClients) {
      sendSSE(client, "complete", { status: "failed", exitCode: -1, target });
      client.end();
    }
    run.sseClients.clear();
  };

  runs.set(id, run);

  writeJson(res, 201, {
    id,
    target: run.target,
    command: run.command,
    status: run.status,
    dataOmi: run.dataOmi,
    dataImo: run.dataImo
  });
}

function handleInfraEvents(req, res) {
  if (req.method !== "GET") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const match = req.url.match(/^\/api\/infra\/events\/(.+)$/);
  if (!match) {
    writeJson(res, 400, { error: "Missing runId" });
    return;
  }

  const runId = match[1];
  const run = runs.get(runId);
  if (!run) {
    writeJson(res, 404, { error: "Run not found" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  sendSSE(res, "state", { status: run.status, stdout: run.stdout, stderr: run.stderr });

  if (run.status === "passed" || run.status === "failed") {
    sendSSE(res, "complete", { status: run.status, exitCode: run.exitCode, target: run.target });
    res.end();
    return;
  }

  run.sseClients.add(res);

  res.on("close", () => {
    run.sseClients.delete(res);
  });
}

function handleInfraRuns(req, res) {
  if (req.method !== "GET") {
    writeJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const summary = [];
  for (const run of runs.values()) {
    summary.push({
      id: run.id,
      target: run.target,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      exitCode: run.exitCode
    });
  }
  writeJson(res, 200, { runs: summary });
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "healthy",
      host: "omi-node-core-proxy",
      root: CANONICAL_ROOT
    }));
    return;
  }

  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Omi Multi-Service Core Proxy Server Adapter Gateway");
    return;
  }

  if (req.url === "/api/infra/run") {
    handleInfraRun(req, res);
    return;
  }

  if (req.url.startsWith("/api/infra/events/")) {
    handleInfraEvents(req, res);
    return;
  }

  if (req.url === "/api/infra/runs") {
    handleInfraRuns(req, res);
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[Omi Node Server] listening on http://localhost:${PORT}/health`);
});


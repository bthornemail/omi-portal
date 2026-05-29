#!/usr/bin/env node
import http from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { extname, resolve } from "node:path";

const EDGE_IP = "69.48.202.32";
const EDGE_PORT = 8080;
const TUNNEL_IP = "74.208.190.29";
const PROBE_PORT = parseInt(process.env.PROBE_PORT || "8082", 10);
const PROBE_INTERVAL = parseInt(process.env.PROBE_INTERVAL || "5000", 10);
const PING_COUNT = 3;

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

let sseClients = [];
let probeHistory = [];

let edgeTopology = null;
let lastTopologyFetch = 0;

function now() {
  return Date.now();
}

function elapsed(t0) {
  return (now() - t0) / 1000;
}

async function httpProbe(path, method = "GET", body = null, timeoutMs = 5000) {
  const t0 = now();
  return new Promise((resolve) => {
    const opts = {
      hostname: EDGE_IP,
      port: EDGE_PORT,
      path,
      method,
      timeout: timeoutMs,
      headers: body ? { "Content-Type": "text/plain" } : {},
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 500,
          statusCode: res.statusCode,
          rttMs: now() - t0,
          body: data.slice(0, 128),
        });
      });
    });
    req.on("error", () => {
      resolve({ ok: false, statusCode: 0, rttMs: now() - t0, body: "error" });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, statusCode: 0, rttMs: now() - t0, body: "timeout" });
    });
    if (body) req.write(body);
    req.end();
  });
}

function runPing(callback) {
  const proc = spawn("ping", [
    "-c", String(PING_COUNT),
    "-W", "2",
    EDGE_IP,
  ]);
  let stdout = "";
  proc.stdout.on("data", (d) => { stdout += d.toString(); });
  proc.on("close", (code) => {
    const result = { lossPct: 100, rttMin: 0, rttAvg: 0, rttMax: 0, rttMdev: 0 };
    if (code === 0) {
      const stats = stdout.match(/rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)/);
      if (stats) {
        result.rttMin = parseFloat(stats[1]);
        result.rttAvg = parseFloat(stats[2]);
        result.rttMax = parseFloat(stats[3]);
        result.rttMdev = parseFloat(stats[4]);
      }
      const loss = stdout.match(/(\d+)% packet loss/);
      if (loss) result.lossPct = parseInt(loss[1], 10);
    }
    callback(result);
  });
}

async function fetchTopology() {
  if (now() - lastTopologyFetch < 60000) return edgeTopology;
  const res = await httpProbe("/topology");
  if (res.ok) {
    try {
      edgeTopology = JSON.parse(res.body);
      lastTopologyFetch = now();
    } catch { /* skip bad parse */ }
  }
  return edgeTopology;
}

async function runProbeCycle() {
  const cycleStart = now();
  const pingResult = await new Promise((resolve) => runPing(resolve));
  const healthResult = await httpProbe("/healthz");
  const verifyResult = await httpProbe("/verify-packet", "POST", GENESIS_TOKEN);
  const topo = await fetchTopology();

  const probe = {
    ts: cycleStart,
    ping: pingResult,
    health: {
      ok: healthResult.ok,
      statusCode: healthResult.statusCode,
      rttMs: healthResult.rttMs,
    },
    verify: {
      ok: verifyResult.ok,
      statusCode: verifyResult.statusCode,
      rttMs: verifyResult.rttMs,
      response: verifyResult.body,
    },
    topology: topo,
    cycleMs: now() - cycleStart,
  };

  probeHistory.push(probe);
  if (probeHistory.length > 360) probeHistory.shift();

  const eventData = {
    ts: cycleStart,
    rttMs: healthResult.rttMs,
    verifyMs: verifyResult.rttMs,
    pingAvg: pingResult.rttAvg,
    pingLoss: pingResult.lossPct,
    edgeOk: healthResult.ok,
    verifyOk: verifyResult.ok,
    cycleMs: probe.cycleMs,
    uptime: probeHistory.filter((p) => p.health.ok).length / Math.max(probeHistory.length, 1),
    sseClients: sseClients.length,
    probeCount: probeHistory.length,
  };

  broadcast("wan-latency", eventData);
  return probe;
}

function broadcast(eventType, data) {
  const raw = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => res.write(raw));
}

function startProbeLoop() {
  let running = false;
  async function tick() {
    if (running) return;
    running = true;
    try {
      await runProbeCycle();
    } catch { /* keep loop alive */ }
    running = false;
    setTimeout(tick, PROBE_INTERVAL);
  }
  tick();
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  if (parsedUrl.pathname === "/wan-metrics") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    });
    res.write(`event: handshake\ndata: {"context":"wan-probe","edge":"${EDGE_IP}","tunnel":"${TUNNEL_IP}"}\n\n`);
    sseClients.push(res);
    req.on("close", () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
    return;
  }

  if (parsedUrl.pathname === "/wan-status") {
    const last = probeHistory[probeHistory.length - 1] || null;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      edge: EDGE_IP,
      tunnel: TUNNEL_IP,
      lastProbe: last,
      historyCount: probeHistory.length,
      uptime: probeHistory.length > 0
        ? probeHistory.filter((p) => p.health.ok).length / probeHistory.length
        : 0,
      sseClients: sseClients.length,
    }));
    return;
  }

  if (parsedUrl.pathname === "/wan-topology") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      role: "TUNNEL_CORE",
      ipv4: TUNNEL_IP,
      edgeIpv4: EDGE_IP,
      edgePort: EDGE_PORT,
      edgeTopology,
    }));
    return;
  }

  if (parsedUrl.pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WAN_PROBE:OK");
    return;
  }

  const MIME = {
    ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".svg": "image/svg+xml",
  };
  const filePath = parsedUrl.pathname === "/" ? "/index.html" : parsedUrl.pathname;
  const localPath = resolve(import.meta.dirname, "..", "dist", filePath.slice(1));
  if (existsSync(localPath) && !localPath.includes("..")) {
    const ext = extname(localPath);
    const data = readFileSync(localPath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    endpoints: {
      stream: "/wan-metrics",
      status: "/wan-status",
      topology: "/wan-topology",
      health: "/healthz",
    },
  }));
});

server.listen(PROBE_PORT, "0.0.0.0", () => {
  console.log(`[WAN Latency Probe] listening on 0.0.0.0:${PROBE_PORT}`);
  console.log(`  - SSE stream: http://${TUNNEL_IP}:${PROBE_PORT}/wan-metrics`);
  console.log(`  - Status:     http://${TUNNEL_IP}:${PROBE_PORT}/wan-status`);
  console.log(`  - Probing:    ${EDGE_IP}:${EDGE_PORT} every ${PROBE_INTERVAL}ms`);
  startProbeLoop();
});

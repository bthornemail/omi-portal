#!/usr/bin/env node
/**
 * ============================================================================
 * OMI PROTOCOL: ZERO-DEPENDENCY HARDENED PROXY STREAM SERVER
 * Target: Debian 13 | IP 69.48.202.32 | IPv6 2607:f1c0:f062:e900::1
 * ============================================================================
 */
import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, resolve } from "node:path";
import { OmiAxiomaticKernel } from "../src/omi/axiomatic-kernel.js";
import { OmiSexagesimalSlideRuleKernel } from "../src/omi/sliderule-kernel.js";

const PORT = 8080;
const CANONICAL_ROOT = "omi-ffff-127-0-0-1";
const POLYTOPE_SLOTS = 5040;

let activeSSEClients = [];

const mem = new SharedArrayBuffer(POLYTOPE_SLOTS * 8);
const view = new DataView(mem);
const kernel = new OmiAxiomaticKernel();
const slideRuleEngine = new OmiSexagesimalSlideRuleKernel(mem);

await kernel.loadAxiomaticFile("RULES.omi", kernel.rulesRegistry);
await kernel.loadAxiomaticFile("FACTS.omi", kernel.factsRegistry);

function broadcastSSEMessage(eventType, dataObject) {
  const raw = `event: ${eventType}\ndata: ${JSON.stringify(dataObject)}\n\n`;
  activeSSEClients.forEach((res) => res.write(raw));
}

function handleIncomingNetworkToken(rawToken) {
  const token = rawToken.trim();

  const isAxiomaticallyValid = kernel.verifyPacketCompliance(token);
  if (!isAxiomaticallyValid) {
    return { accepted: false, reason: "AXIOMATIC_EVICTION" };
  }

  const transformationCell = slideRuleEngine.evaluateCircularSlideRule(token);
  const slideruleMetadata = slideRuleEngine.car(transformationCell);

  if (!slideruleMetadata.accepted) {
    return { accepted: false, reason: "TWO_OF_FIVE_EVICTION" };
  }

  const broadcastPayload = JSON.stringify({
    token,
    angle: slideruleMetadata.computedSlideAngle,
    slot: slideruleMetadata.targetMemorySlot,
    isTerminalDepth: slideruleMetadata.isTerminalFractalDepth
  });
  broadcastSSEMessage("vector-update", {
    token,
    angle: slideruleMetadata.computedSlideAngle,
    slot: slideruleMetadata.targetMemorySlot,
    isTerminalDepth: slideruleMetadata.isTerminalFractalDepth
  });

  return { accepted: true, metadata: slideruleMetadata, broadcastPayload };
}

const BOOT_SIGNATURE = 0xaa55;
const MBR_BYTE_LENGTH = 512;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  if (parsedUrl.pathname === "/healthz" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OMI_SSE_PROXY:OK");
    return;
  }

  if (parsedUrl.pathname === "/topology" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      role: "EDGE_NODE",
      omiAddress: "omi-2607-f1c0-f062-e900-0000-0000-0000-0001/80",
      peerAddress: "omi-2607-f1c0-f0b7-df00-0000-0000-0000-0001/80",
      ipv4: "69.48.202.32",
      ipv6: "2607:f1c0:f062:e900::1"
    }));
    return;
  }

  if (parsedUrl.pathname === "/verify-packet" && req.method === "POST") {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 4096) req.destroy();
    });
    req.on("end", () => {
      const isCompliant = kernel.verifyPacketCompliance(body.trim());
      res.writeHead(isCompliant ? 200 : 400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(isCompliant ? "COMPLIANT_SUBSTRATE_TOKEN_ACCEPTED" : "EVICTION_FAULT_DISMISSED");
    });
    return;
  }

  if (parsedUrl.pathname === "/process-token" && req.method === "POST") {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 4096) req.destroy();
    });
    req.on("end", () => {
      const result = handleIncomingNetworkToken(body.trim());
      if (result.accepted) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "ACCEPTED",
          angle: result.metadata.computedSlideAngle,
          slot: result.metadata.targetMemorySlot,
          isTerminalDepth: result.metadata.isTerminalFractalDepth
        }));
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "REJECTED", reason: result.reason }));
      }
    });
    return;
  }

  const MIME = {
    ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png"
  };
  const filePath = parsedUrl.pathname === "/" ? "/index.html" : parsedUrl.pathname;
  const localPath = resolve("/root/omi-portal/dist", filePath.slice(1));
  if (existsSync(localPath) && !localPath.includes("..")) {
    const ext = extname(localPath);
    const data = readFileSync(localPath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
    return;
  }

  if (parsedUrl.pathname === "/omi-stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    });
    res.write(`event: handshake\ndata: {"context":"${CANONICAL_ROOT}"}\n\n`);
    activeSSEClients.push(res);
    req.on("close", () => {
      activeSSEClients = activeSSEClients.filter((c) => c !== res);
    });
    return;
  }

  if (req.url === "/omi-sab-read" && req.method === "GET") {
    const slot = parseInt(new URL(req.url, "http://localhost").searchParams.get("slot") || "0", 10);
    if (slot >= 0 && slot < POLYTOPE_SLOTS) {
      const value = view.getFloat64(slot * 8, true);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ slot, value }));
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "slot out of range" }));
    }
    return;
  }

  if (req.url === "/omi-sab-write" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const { slot, value } = JSON.parse(body);
        if (slot >= 0 && slot < POLYTOPE_SLOTS) {
          view.setFloat64(slot * 8, value, true);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ slot, value, written: true }));
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "slot out of range" }));
        }
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "invalid json" }));
      }
    });
    return;
  }

  if (req.url === "/omi-boot" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const raw = Buffer.from(body, "base64");
        if (raw.byteLength !== MBR_BYTE_LENGTH) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: `MBR must be ${MBR_BYTE_LENGTH} bytes` }));
          return;
        }
        const magic = raw.readUInt16LE(MBR_BYTE_LENGTH - 2);
        if (magic !== BOOT_SIGNATURE) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Invalid 0xAA55 signature" }));
          return;
        }
        const u8 = new Uint8Array(mem);
        u8.set(new Uint8Array(raw), 64);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "boot_sector_loaded", size: MBR_BYTE_LENGTH }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "invalid mbr payload" }));
      }
    });
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    status: "healthy",
    architecture: "x86_64-debian13",
    context: CANONICAL_ROOT,
    ipv4: "69.48.202.32",
    ipv6: "2607:f1c0:f062:e900::1",
    services: {
      stream: "/omi-stream",
      verifyPacket: "/verify-packet",
      processToken: "/process-token",
      topology: "/topology",
      sabRead: "/omi-sab-read?slot=N",
      sabWrite: "/omi-sab-write",
      boot: "/omi-boot"
    }
  }));
});

server.listen(PORT, () => {
  console.log(`[Omi OS Core] SSE pipeline initialized.`);
  console.log(` -> http://69.48.202.32:${PORT}/omi-stream`);
  console.log(` -> IPv6 [2607:f1c0:f062:e900::1]:${PORT}`);
});

// Bitwise clock: 60Hz tick loop
let tick = 0n;
setInterval(() => {
  tick++;
  const slot = Number(tick % 5040n);
  view.setBigUint64(0, tick, true);

  if (slot !== 0 && slot % 720 === 0) {
    broadcastSSEMessage("promote-gc", { slot, tick: tick.toString() });
  }

  if (tick % 5040n === 0n) {
    for (let i = 8; i < 5040 * 8; i += 8) {
      view.setFloat64(i, 0.0, true);
    }
    broadcastSSEMessage("hard-reset", { root: CANONICAL_ROOT, tick: tick.toString() });
  }
}, 16);

#!/usr/bin/env node
/**
 * ============================================================================
 * OMI PROTOCOL: DUAL-STACK HIGH-CAPACITY CENTRAL TUNNEL PROXY
 * Target: VPS 8-16-480 | 8 vCores | 16 GB RAM | 480 GB NVMe SSD
 * Binds: IPv4 74.208.190.29 & IPv6 [2607:f1c0:f0b7:df00::1]
 * ============================================================================
 */
import http from "node:http";
import { URL } from "node:url";
import { readFileSync, existsSync } from "node:fs";
import { extname, resolve } from "node:path";

const PORT = 8080;
const CANONICAL_ROOT = "omi-ffff-127-0-0-1";
const POLYTOPE_SLOTS = 5040;

let clientStreams = [];
const sabBuffer = new SharedArrayBuffer(POLYTOPE_SLOTS * 8);
const bufferView = new DataView(sabBuffer);

setInterval(() => {
  let tick = bufferView.getBigUint64(0, true);
  tick++;
  bufferView.setBigUint64(0, tick, true);
  const modulo = Number(tick % 5040n);

  if (modulo > 0 && modulo % 720 === 0) {
    emitProxyEvent("promote-gc", { slot: modulo, bus: "::5" });
  }

  if (tick > 0n && tick % 5040n === 0n) {
    for (let i = 8; i < 5040 * 8; i += 8) {
      bufferView.setFloat64(i, 0.0, true);
    }
    bufferView.setBigUint64(0, 0n, true);
    emitProxyEvent("hard-reset", { root: CANONICAL_ROOT });
  }
}, 16);

function emitProxyEvent(event, payload) {
  const packet = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  clientStreams.forEach((res) => res.write(packet));
}

const proxyServer = http.createServer((req, res) => {
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

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  if (parsedUrl.pathname === "/omi-stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    });
    res.write(`event: handshake\ndata: {"context":"${CANONICAL_ROOT}","subnet":"::/80"}\n\n`);
    clientStreams.push(res);
    req.on("close", () => {
      clientStreams = clientStreams.filter((c) => c !== res);
    });
    return;
  }

  if (parsedUrl.pathname === "/omi-sab-read") {
    const slotIdx = parseInt(parsedUrl.searchParams.get("slot") || "0", 10);
    if (slotIdx < 0 || slotIdx >= POLYTOPE_SLOTS) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Out of Bounds Factorial Ring Range" }));
      return;
    }
    const value = bufferView.getFloat64(slotIdx * 8, true);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ slot: slotIdx, value }));
    return;
  }

  if (parsedUrl.pathname === "/omi-sab-write" && req.method === "POST") {
    let rawBody = "";
    req.on("data", (chunk) => { rawBody += chunk.toString(); });
    req.on("end", () => {
      try {
        const data = JSON.parse(rawBody);
        const slotIdx = parseInt(data.slot, 10);
        const floatVal = parseFloat(data.value);
        if (slotIdx >= 0 && slotIdx < POLYTOPE_SLOTS) {
          bufferView.setFloat64(slotIdx * 8, floatVal, true);
          emitProxyEvent("vector-update", { slot: slotIdx, value: floatVal });
  const MIME = {
    ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png"
  };

  // Static file serving from dist/
  const filePath = parsedUrl.pathname === "/" ? "/index.html" : parsedUrl.pathname;
  const localPath = resolve("/root/omi-portal/dist", filePath.slice(1));
  if (existsSync(localPath) && !localPath.includes("..")) {
    const ext = extname(localPath);
    const data = readFileSync(localPath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "success", slot: slotIdx, value: floatVal }));
        } else {
          throw new Error();
        }
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid Packet Serialization Schema" }));
      }
    });
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    status: "healthy",
    infrastructure: "VPS-8-16-480-Production-Core",
    ipv4: "74.208.190.29",
    ipv6: "2607:f1c0:f0b7:df00::1",
    activeConnections: clientStreams.length
  }));
});

proxyServer.listen(PORT, "::", () => {
  console.log(`[Omi OS Core] Central Proxy Node active across IPv4 and IPv6.`);
  console.log(` -> http://74.208.190.29:${PORT}/omi-stream`);
  console.log(` -> http://[2607:f1c0:f0b7:df00::1]:${PORT}/omi-stream`);
});

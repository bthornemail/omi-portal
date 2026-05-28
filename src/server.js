import http from "node:http";

const PORT = process.env.PORT || 8080;
const CANONICAL_ROOT = "omi-ffff-127-0-0-1";

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

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

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[Omi Node Server] listening on http://localhost:${PORT}/health`);
});

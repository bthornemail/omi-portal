async function hmacSha1(key, data) {
  const enc = new TextEncoder();
  const cryptoObj = typeof window !== "undefined" ? window.crypto : (await import("node:crypto")).webcrypto;
  const importedKey = await cryptoObj.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const sig = await cryptoObj.subtle.sign("HMAC", importedKey, enc.encode(data));
  const bytes = new Uint8Array(sig);
  return btoa(String.fromCharCode(...bytes));
}

async function randomHex(len) {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : (await import("node:crypto")).webcrypto;
  const buf = new Uint8Array(len);
  cryptoObj.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class CoTURNProxy {
  constructor(options = {}) {
    this.realm = options.realm || "omi";
    this.secret = options.secret || (typeof process !== "undefined" && process.env.COTURN_SECRET) || "dev-secret";
    this.ttl = options.ttl || 3600;
  }

  async generateCredentials(username) {
    const user = username || `omi-${Date.now()}-${await randomHex(4)}`;
    const timestamp = Math.floor(Date.now() / 1000) + this.ttl;
    const name = `${timestamp}:${user}`;
    const password = await hmacSha1(this.secret, name);
    return { username: name, password, ttl: this.ttl, realm: this.realm };
  }

  async validateCredentials(username, password) {
    const parts = username.split(":");
    if (parts.length !== 2) return false;
    const timestamp = parseInt(parts[0], 10);
    if (isNaN(timestamp) || timestamp < Math.floor(Date.now() / 1000)) return false;
    const expected = await hmacSha1(this.secret, username);
    return expected === password;
  }

  generateTurnUri(credentials, options = {}) {
    const transport = options.transport || "udp";
    return {
      urls: [
        `turn:${options.host || "localhost"}:${options.port || 3478}?transport=${transport}`,
        `turns:${options.host || "localhost"}:${options.port || 5349}?transport=${transport}`
      ],
      username: credentials.username,
      credential: credentials.password
    };
  }

  urls() {
    return {
      stun: [{ urls: "stun:stun.l.google.com:19302" }],
      turn: { host: "localhost", port: 3478, tlsPort: 5349, realm: this.realm }
    };
  }
}

export function createCoTURNProxy(options = {}) {
  return new CoTURNProxy(options);
}

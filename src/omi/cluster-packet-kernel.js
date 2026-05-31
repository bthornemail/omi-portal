import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SAB_SIZE = 5040 * 8;
const BPF_MAP_BYTES = 64 * 8;
const TELEMETRY_PURPLE = 5;

export class OmiClusterSignatureGateway {
  constructor(discoveryKernel, nat64Kernel, telemetryLoop) {
    this.discoveryKernel = discoveryKernel;
    this.nat64Kernel = nat64Kernel;
    this.telemetryLoop = telemetryLoop;
    this.sab = new SharedArrayBuffer(SAB_SIZE);
    this.view = new BigUint64Array(this.sab);
    this.signatures = new Map();
  }

  deltaC(x, c = 0x1337C0DE) {
    const rotl1 = ((x << 1n) | (x >> 63n)) & 0xFFFFFFFFFFFFFFFFn;
    const rotl3 = ((x << 3n) | (x >> 61n)) & 0xFFFFFFFFFFFFFFFFn;
    const rotr2 = ((x >> 2n) | (x << 62n)) & 0xFFFFFFFFFFFFFFFFn;
    return (rotl1 ^ rotl3 ^ rotr2 ^ BigInt(c)) & 0xFFFFFFFFFFFFFFFFn;
  }

  signPeer(address) {
    const hex = address.replace(/[^0-9a-fA-F]/g, '');
    const raw = BigInt('0x' + (hex || '0'));
    const sig = this.deltaC(raw & 0xFFFFFFFFFFFFn);
    this.signatures.set(address, sig);
    return sig;
  }

  verifyPacket(saddrHex, payloadSig) {
    const sig = this.signatures.get(saddrHex);
    if (!sig) return false;
    return (sig & 0xFFFFFFFFn) === BigInt(payloadSig);
  }

  loadTelemetryFromObjectFile(path) {
    if (!existsSync(path)) return 0;
    const buf = readFileSync(path);
    const elfSlice = buf.slice(0, Math.min(BPF_MAP_BYTES, buf.length));
    for (let i = 0; i < 64 && i < this.view.length; i++) {
      const off = i * 8;
      if (off + 8 <= elfSlice.length) {
        this.view[i] = elfSlice.readBigUInt64LE ? elfSlice.readBigUInt64LE(off) : 0n;
      }
    }
    return 1;
  }

  telemetrySnapshot() {
    const snapshot = {};
    for (const [addr, sig] of this.signatures) {
      snapshot[addr] = sig.toString(16);
    }
    snapshot.sabSlots = Array.from({ length: 64 }, (_, i) => this.view[i]);
    return snapshot;
  }

  attachEpbfGate() {
    if (this.telemetryLoop && typeof this.telemetryLoop.broadcast === 'function') {
      const snap = this.telemetrySnapshot();
      this.telemetryLoop.broadcast('cluster-signature', snap);
    }
  }
}

export function initializeClusterSignatureGateway(discoveryKernel, nat64Kernel, telemetryLoop) {
  return new OmiClusterSignatureGateway(discoveryKernel, nat64Kernel, telemetryLoop);
}

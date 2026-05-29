/**
 * OMI PROTOCOL: PURE ARITHMETIC IPV6-CIDR COHERENT CONNECTOR
 * File Target: public/bidi.js
 * Invariant Configuration: Single Notation — omi-<8-hex>/<prefix> [Zero-Mixed-Notation]
 */
import "./bidi.css";

class OmiFrontendPipelineBridge {
  constructor() {
    this.sab = new SharedArrayBuffer(5040 * 8);
    this.floatArray = new Float64Array(this.sab);

    this.endpoints = [
      "http://69.48.202.32:8080/omi-stream",
      "http://74.208.190.29:8080/omi-stream"
    ];

    this.activeSource = null;
    this.initStreamingMultiplexer();
  }

  initStreamingMultiplexer() {
    const targetUrl = this.endpoints[Math.floor(Math.random() * this.endpoints.length)];
    this.activeSource = new EventSource(targetUrl);
    const dotElement = document.getElementById("t-stream-dot");

    this.activeSource.onopen = () => {
      if (dotElement) dotElement.className = "omi-active";
    };

    this.activeSource.onerror = () => {
      if (dotElement) dotElement.className = "omi-inactive";
      setTimeout(() => this.initStreamingMultiplexer(), 2000);
    };

    this.activeSource.addEventListener("vector-update", (e) => {
      try {
        this.processIPv6Packet(JSON.parse(e.data));
      } catch {
        // transient frame parsing anomalies
      }
    });

    this.activeSource.addEventListener("hard-reset", () => this.executeHardResetFence());
  }

  /**
   * ARITHMETIC PARAMETER EXTRACTION:
   * Strips the omi- human-readable prefix, splits 8 hex segments + CIDR prefix,
   * and derives every operational parameter directly from the bit positions.
   *
   *   [0] chiral/cardinal phase  — ffff = ο (U+03BF), 039f = Ο (U+039F)
   *   [1] service bus ID         — 0001..0008 (::1..::8)
   *   [2] inversion gate         — 0000 or 5a3c
   *   [3] step rank              — 0000..003b (0..59)
   *   [4] stride offset          — 0078=120, 02d0=720, 13b0=5040
   *   [5] sexagesimal slot       — 0000..0036 (0..54)
   *   [6] factorial lattice      — 0000..0007 (0!..7!)
   *   [7] nil terminator         — 0000 or 0001
   */
  processIPv6Packet(packetData) {
    if (!packetData || !packetData.token) return;

    const raw = packetData.token.trim();
    if (!raw.startsWith("omi-")) return;

    const body = raw.slice(4);
    const addr = body.split("/")[0];
    const segments = addr.split("-");

    if (segments.length < 8) return;

    const chiralHex   = segments[0];
    const busHex      = segments[1];
    const invertHex   = segments[2];
    const stepHex     = segments[3];
    const strideHex   = segments[4];
    const slotHex     = segments[5];
    const layerHex    = segments[6];
    const nilHex      = segments[7];

    const isChiral     = chiralHex === "ffff";
    const busId        = parseInt(busHex, 16);
    const isInverted   = invertHex === "5a3c";
    const stepRank     = parseInt(stepHex, 16);
    const stride       = parseInt(strideHex, 16);
    const slot         = parseInt(slotHex, 16);
    const layer        = parseInt(layerHex, 16);
    const isNilTerm    = nilHex === "0001";

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val != null ? String(val) : "--";
    };

    set("t-bus-conn", `ACTIVE_BUS_::${busId}`);
    set("t-operator", isChiral ? "ο_CHIRAL" : "Ο_CARDINAL");
    set("t-codepoint", `0x${chiralHex}`);
    set("t-token", raw.length > 28 ? raw.substring(0, 28) + "..." : raw);
    set("t-poly", "Order_4");
    set("t-stride", stride ? String(stride) : "--");
    set("t-step", stepRank ? `step${stepRank}` : "--");
    set("t-ratio", slot ? `${slot}/54` : "--");
    set("t-inversion", isInverted ? "0x5A3C" : "none");
    set("t-lisp-nil", isNilTerm ? "()!" : "()");
    set("t-lattice", `${layer}!`);

    const el = document.querySelector(`[data-omi-address="${raw}"]`);
    if (el) {
      const idx = slot % 5040;
      Atomics.store(this.floatArray, idx, stride || 1.0);
      if (isInverted) {
        el.classList.add("chiral-inverted");
      } else {
        el.classList.remove("chiral-inverted");
      }
      const zDepth = stepRank * 2.5;
      el.style.transform = `translate3d(0, 0, ${zDepth}px) rotateX(15deg)`;
    }

    const log = document.getElementById("stream-log");
    if (log) {
      const time = new Date().toLocaleTimeString();
      log.innerHTML += `<span class="vector">[${time}] <strong>vector</strong> ${raw.substring(0, 32)}...</span>\n`;
      log.scrollTop = log.scrollHeight;
    }
  }

  executeHardResetFence() {
    this.floatArray.fill(0.0);

    document.querySelectorAll("[id^='omi-']").forEach((el) => {
      el.classList.remove("chiral-inverted");
      el.style.transform = "translate3d(0px, 0px, 0px)";
    });

    ["t-poly", "t-stride", "t-step", "t-ratio",
     "t-inversion", "t-lisp-nil", "t-lattice"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "--";
    });

    const log = document.getElementById("stream-log");
    if (log) {
      const time = new Date().toLocaleTimeString();
      log.innerHTML += `<span class="reset">[${time}] <strong>hard-reset</strong></span>\n`;
      log.scrollTop = log.scrollHeight;
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.OmiSystemNode = new OmiFrontendPipelineBridge();
});

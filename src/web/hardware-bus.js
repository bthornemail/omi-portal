import { createPolytopeBuffer, storeTickValue, readTickValue, POLYTOPE_SLOTS } from "../runtime/polytope-sab.js";

const BUS_IDS = { serial: 10, usb: 11, hid: 12 };
const BUS_NAMES = { 10: "webserial", 11: "webusb", 12: "webhid" };

export class OmiHardwareBus {
  constructor({ bus, polytopeBuffer } = {}) {
    if (bus && !(bus in BUS_IDS) && !(bus in BUS_NAMES)) {
      throw new TypeError(`Invalid hardware bus: ${bus}. Must be 10 (serial), 11 (usb), or 12 (hid).`);
    }
    this.busId = bus || 10;
    this.name = BUS_NAMES[this.busId] || "webserial";
    this.clock = polytopeBuffer || createPolytopeBuffer({ shared: true });
    this._port = null;
    this._reader = null;
    this._writers = new Set();
    this._onData = null;
  }

  cons(car, cdr) {
    return Object.freeze({ car, cdr });
  }

  car(cell) {
    return cell.car;
  }

  cdr(cell) {
    return cell.cdr;
  }

  async requestDevice(filters = {}) {
    if (typeof navigator === "undefined") {
      throw new Error(`${this.name} bus requires a browser environment with navigator`);
    }
    const apis = {
      webserial: navigator.serial,
      webusb: navigator.usb,
      webhid: navigator.hid
    };
    const api = apis[this.name];
    if (!api) throw new Error(`${this.name} API not available`);

    if (this.name === "webserial") {
      this._port = await api.requestPort({ filters: filters.serialFilters || [] });
    } else if (this.name === "webusb") {
      this._port = await api.requestDevice({ filters: filters.usbFilters || [] });
    } else if (this.name === "webhid") {
      this._port = await api.requestDevice({ filters: filters.hidFilters || [] });
    }
    return this._port;
  }

  async open(options = {}) {
    if (!this._port) throw new Error(`No ${this.name} device selected. Call requestDevice first.`);
    if (this.name === "webserial") {
      await this._port.open({ baudRate: options.baudRate || 115200 });
      this._reader = this._port.readable.getReader();
      this._startSerialReadLoop();
    } else if (this.name === "webusb") {
      await this._port.open();
      if (options.configuration) await this._port.selectConfiguration(options.configuration);
      await this._port.claimInterface(options.interface || 0);
    } else if (this.name === "webhid") {
      await this._port.open();
    }
  }

  async close() {
    if (this._reader) {
      try { await this._reader.cancel(); } catch {}
      this._reader = null;
    }
    if (this._port) {
      try {
        if (this.name === "webserial") await this._port.close();
        else if (this.name === "webusb") await this._port.close();
        else if (this.name === "webhid") await this._port.close();
      } catch {}
    }
    this._port = null;
    this._writers.clear();
  }

  async write(data) {
    if (!this._port) throw new Error(`${this.name} bus not open`);
    if (this.name === "webserial") {
      const writer = this._port.writable.getWriter();
      this._writers.add(writer);
      try {
        await writer.write(data);
      } finally {
        this._writers.delete(writer);
        writer.releaseLock();
      }
    } else if (this.name === "webusb") {
      const endpoint = data.endpoint || 1;
      await this._port.transferOut(endpoint, data.buffer || data);
    } else if (this.name === "webhid") {
      await this._port.sendReport(data.reportId || 0, data.buffer || data);
    }
  }

  set onData(callback) {
    this._onData = callback;
  }

  _startSerialReadLoop() {
    if (!this._reader) return;
    const pump = async () => {
      try {
        while (true) {
          const { value, done } = await this._reader.read();
          if (done) break;
          if (value) {
            this._storeReadBuffer(value);
            if (this._onData) this._onData(value);
          }
        }
      } catch {}
    };
    pump();
  }

  _storeReadBuffer(data) {
    const slotBase = (this.busId * 100) % POLYTOPE_SLOTS;
    const max = Math.min(data.length, 64);
    for (let i = 0; i < max; i++) {
      storeTickValue(this.clock, (slotBase + i) % POLYTOPE_SLOTS, data[i]);
    }
  }

  readSlot(offset) {
    const slotBase = (this.busId * 100) % POLYTOPE_SLOTS;
    return readTickValue(this.clock, (slotBase + offset) % POLYTOPE_SLOTS);
  }
}

export function mockSerialPort(options = {}) {
  const { baudRate = 115200, readable = true, writable = true } = options;
  let _onReadCallback = null;
  const readers = [];
  const writers = new Set();

  const port = {
    baudRate,
    readable: readable ? {
      getReader() {
        const reader = {
          async read() { return { value: null, done: false }; },
          cancel() { return Promise.resolve(); },
          releaseLock() {}
        };
        readers.push(reader);
        return reader;
      }
    } : null,
    writable: writable ? {
      getWriter() {
        const writer = {
          async write(data) { return data; },
          releaseLock() {}
        };
        writers.add(writer);
        return writer;
      }
    } : null,
    async open(opts) { this.baudRate = opts?.baudRate || this.baudRate; },
    async close() { readers.length = 0; writers.clear(); },
    _pushReadData(data) {
      if (typeof _onReadCallback === "function") _onReadCallback(data);
    }
  };
  return port;
}

export function mockUSBDevice(options = {}) {
  const configuration = options.configuration || 1;
  let _opened = false;
  return {
    configuration,
    _opened,
    async open() { _opened = true; },
    async selectConfiguration(config) { this.configuration = config; },
    async claimInterface() {},
    async transferOut(endpoint, data) { return { endpoint, bytesWritten: data?.byteLength || 0 }; },
    async close() { _opened = false; }
  };
}

export function mockHIDDevice(options = {}) {
  let _opened = false;
  return {
    productId: options.productId || 0,
    vendorId: options.vendorId || 0,
    _opened,
    async open() { _opened = true; },
    async sendReport(reportId, data) { return { reportId, bytesWritten: data?.byteLength || 0 }; },
    async close() { _opened = false; }
  };
}

const CANONICAL_ROOT = "omi-ffff-127-0-0-1";

export const ASCII_OPCODES = Object.freeze({
  "0x00": "NUL", "0x01": "SOH", "0x02": "STX", "0x03": "ETX",
  "0x04": "EOT", "0x05": "ENQ", "0x06": "ACK", "0x07": "BEL",
  "0x08": "BS",  "0x09": "HT",  "0x0a": "LF",  "0x0b": "VT",
  "0x0c": "FF",  "0x0d": "CR",  "0x0e": "SO",  "0x0f": "SI",
  "0x10": "DLE", "0x11": "DC1", "0x12": "DC2", "0x13": "DC3",
  "0x14": "DC4", "0x15": "NAK", "0x16": "SYN", "0x17": "ETB",
  "0x18": "CAN", "0x19": "EM",  "0x1a": "SUB", "0x1b": "ESC",
  "0x1c": "FS",  "0x1d": "GS",  "0x1e": "RS",  "0x1f": "US"
});

export const ASCII_HARDWARE_BUS = Object.freeze({
  "0x01": "serial-cdc", "0x02": "serial-spp",
  "0x04": "usb-vendor", "0x05": "hid-descriptor"
});

export class OmiHardwarePeripheralEngine {
  constructor(polytopeBuffer) {
    if (polytopeBuffer && polytopeBuffer.buffer) {
      this.clock = polytopeBuffer;
    } else if (polytopeBuffer) {
      this.clock = new Float64Array(polytopeBuffer);
    } else {
      this.clock = createPolytopeBuffer({ shared: true });
    }
    this.view = new DataView(this.clock.buffer);
    this.ASCII_OPCODES = ASCII_OPCODES;
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

  parsePeripheralAddress(idString) {
    const cleanStr = String(idString || "");
    if (!cleanStr.startsWith("omi-")) return null;
    if (!cleanStr.startsWith(CANONICAL_ROOT)) {
      return { isSecureContext: false, error: "External or unauthorized network domain path" };
    }

    const subPath = cleanStr.substring(CANONICAL_ROOT.length + 1);
    const tokens = subPath.split("-");
    const asciiOp = tokens[0];
    const slotIdx = tokens.findIndex((t) => /^slot\d+$/.test(t));
    const device = slotIdx > 1 ? tokens.slice(1, slotIdx).join("-") : tokens[1] || "";
    const b64Data = tokens[tokens.length - 1];

    return {
      isSecureContext: true,
      contextRoot: CANONICAL_ROOT,
      asciiControl: { hexCode: asciiOp, mnemonic: ASCII_OPCODES[asciiOp] || null },
      portAllocation: device,
      coefficients: b64Data && b64Data.length > 10
        ? this.decodePayloadBits(b64Data) : null
    };
  }

  decodePayloadBits(b64) {
    let normalized = String(b64).replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    const binary = typeof atob === "function"
      ? atob(normalized)
      : Buffer.from(normalized, "base64").toString("binary");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  }

  ingestSerialBytePacket(targetSlotIndex, uint8ArrayPayload) {
    if (targetSlotIndex < 0 || targetSlotIndex >= POLYTOPE_SLOTS) return;
    const baseByteOffset = targetSlotIndex * 8;
    const max = Math.min(uint8ArrayPayload.length, 8);
    for (let i = 0; i < max; i++) {
      this.view.setUint8(baseByteOffset + i, uint8ArrayPayload[i]);
    }
  }

  readSlotBytes(slotIndex) {
    if (slotIndex < 0 || slotIndex >= POLYTOPE_SLOTS) return null;
    const base = slotIndex * 8;
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) bytes[i] = this.view.getUint8(base + i);
    return bytes;
  }
}

export function asciiOpcodeForBus(busName) {
  const map = { webserial: "0x01", webusb: "0x04", webhid: "0x05" };
  return map[busName] || "0x00";
}

export function formatHardwareAddress({ bus, port, slot, payload } = {}) {
  const op = asciiOpcodeForBus(bus || "webserial");
  const portName = port || "device0";
  const slotStr = `slot${slot || 0}`;
  const b64 = payload || "AAAAAAAAAAAAAAAAAAAAAA";
  return `${CANONICAL_ROOT}-${op}-${portName}-${slotStr}-${b64}`;
}
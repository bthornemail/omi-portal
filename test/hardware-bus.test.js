import test from "node:test";
import assert from "node:assert/strict";
import { OmiHardwareBus, mockSerialPort, mockUSBDevice, mockHIDDevice } from "../src/web/hardware-bus.js";

test("OmiHardwareBus constructor defaults to serial on ::10", () => {
  const bus = new OmiHardwareBus({ bus: 10 });
  assert.equal(bus.busId, 10);
  assert.equal(bus.name, "webserial");
});

test("OmiHardwareBus rejects invalid bus id", () => {
  assert.throws(() => new OmiHardwareBus({ bus: 99 }), TypeError);
});

test("OmiHardwareBus stores read data into polytope slots", () => {
  const bus = new OmiHardwareBus({ bus: 11 });
  const data = new Uint8Array([65, 66, 67]);
  bus._storeReadBuffer(data);
  assert.equal(bus.readSlot(0), 65);
  assert.equal(bus.readSlot(1), 66);
  assert.equal(bus.readSlot(2), 67);
});

test("OmiHardwareBus readSlot wraps around POLYTOPE_SLOTS", () => {
  const bus = new OmiHardwareBus({ bus: 10 });
  const slotBase = (10 * 100) % 5040;
  bus._storeReadBuffer(new Uint8Array([42]));
  assert.equal(bus.readSlot(0), 42);
});

test("requestDevice throws in non-browser environment", async () => {
  const bus = new OmiHardwareBus({ bus: 10 });
  await assert.rejects(() => bus.requestDevice(), /API not available/);
});

test("write throws when no device selected", async () => {
  const bus = new OmiHardwareBus({ bus: 10 });
  await assert.rejects(() => bus.write(new Uint8Array([1])), /not open/);
});

test("mockSerialPort creates port with correct baudRate", () => {
  const port = mockSerialPort({ baudRate: 9600 });
  assert.equal(port.baudRate, 9600);
  assert.ok(port.readable);
  assert.ok(port.writable);
});

test("mockSerialPort open sets baudRate", async () => {
  const port = mockSerialPort();
  await port.open({ baudRate: 19200 });
  assert.equal(port.baudRate, 19200);
});

test("mockUSBDevice transferOut returns bytes", async () => {
  const dev = mockUSBDevice();
  await dev.open();
  const result = await dev.transferOut(1, new Uint8Array([1, 2, 3]).buffer);
  assert.equal(result.bytesWritten, 3);
});

test("mockHIDDevice sendReport returns reportId", async () => {
  const dev = mockHIDDevice({ vendorId: 0x1234 });
  assert.equal(dev.vendorId, 0x1234);
  await dev.open();
  const result = await dev.sendReport(0, new Uint8Array([1]).buffer);
  assert.equal(result.reportId, 0);
});

test("cons/car/cdr primitives work on hardware bus", () => {
  const bus = new OmiHardwareBus({ bus: 12 });
  const cell = bus.cons("hid", "report");
  assert.equal(bus.car(cell), "hid");
  assert.equal(bus.cdr(cell), "report");
});

import {
  OmiHardwarePeripheralEngine, ASCII_OPCODES, ASCII_HARDWARE_BUS,
  asciiOpcodeForBus, formatHardwareAddress
} from "../src/web/hardware-bus.js";

test("ASCII_OPCODES covers 0x00-0x1F", () => {
  assert.equal(ASCII_OPCODES["0x00"], "NUL");
  assert.equal(ASCII_OPCODES["0x01"], "SOH");
  assert.equal(ASCII_OPCODES["0x15"], "NAK");
  assert.equal(ASCII_OPCODES["0x1b"], "ESC");
  assert.equal(ASCII_OPCODES["0x1f"], "US");
  assert.equal(Object.keys(ASCII_OPCODES).length, 32);
});

test("ASCII_HARDWARE_BUS maps opcodes to ports", () => {
  assert.equal(ASCII_HARDWARE_BUS["0x01"], "serial-cdc");
  assert.equal(ASCII_HARDWARE_BUS["0x04"], "usb-vendor");
  assert.equal(ASCII_HARDWARE_BUS["0x05"], "hid-descriptor");
});

test("parsePeripheralAddress validates secure local context", () => {
  const engine = new OmiHardwarePeripheralEngine(new ArrayBuffer(5040 * 8));
  const b64 = Buffer.from(new Float32Array([1.5, 2, -0.5, 10]).buffer).toString("base64url");
  const result = engine.parsePeripheralAddress(
    `omi-8-ffff-127-0-0-1-0x01-serial-cdc0-slot720-${b64}`
  );
  assert.equal(result.isSecureContext, true);
  assert.equal(result.asciiControl.hexCode, "0x01");
  assert.equal(result.asciiControl.mnemonic, "SOH");
  assert.equal(result.portAllocation, "serial-cdc0");
});

test("parsePeripheralAddress rejects non-omi strings", () => {
  const engine = new OmiHardwarePeripheralEngine(new ArrayBuffer(5040 * 8));
  assert.equal(engine.parsePeripheralAddress("garbage"), null);
});

test("parsePeripheralAddress handles local- prefix", () => {
  const engine = new OmiHardwarePeripheralEngine(new ArrayBuffer(5040 * 8));
  const b64 = Buffer.from(new Float32Array([1, 0, 0, 0]).buffer).toString("base64url");
  const result = engine.parsePeripheralAddress(
    `local-omi-8-ffff-127-0-0-1-0x04-usb-vendor-pid412-slot1440-${b64}`
  );
  assert.equal(result.isSecureContext, true);
  assert.equal(result.asciiControl.hexCode, "0x04");
  assert.equal(result.portAllocation, "usb-vendor-pid412");
});

test("ingestSerialBytePacket writes bytes into SAB slot", () => {
  const engine = new OmiHardwarePeripheralEngine(new ArrayBuffer(5040 * 8));
  engine.ingestSerialBytePacket(720, new Uint8Array([127, 0, 0, 1, 64, 128, 255, 0]));
  const bytes = engine.readSlotBytes(720);
  assert.equal(bytes[0], 127);
  assert.equal(bytes[4], 64);
  assert.equal(bytes[7], 0);
});

test("ingestSerialBytePacket clamps to slot bounds", () => {
  const engine = new OmiHardwarePeripheralEngine(new ArrayBuffer(5040 * 8));
  engine.ingestSerialBytePacket(-1, new Uint8Array([1]));
  engine.ingestSerialBytePacket(5040, new Uint8Array([1]));
});

test("readSlotBytes returns null out of range", () => {
  const engine = new OmiHardwarePeripheralEngine(new ArrayBuffer(5040 * 8));
  assert.equal(engine.readSlotBytes(-1), null);
  assert.equal(engine.readSlotBytes(5040), null);
});

test("asciiOpcodeForBus maps bus names to ASCII codes", () => {
  assert.equal(asciiOpcodeForBus("webserial"), "0x01");
  assert.equal(asciiOpcodeForBus("webusb"), "0x04");
  assert.equal(asciiOpcodeForBus("webhid"), "0x05");
});

test("formatHardwareAddress builds valid OMI address", () => {
  const addr = formatHardwareAddress({ bus: "webusb", port: "vendor-0x1234", slot: 1440 });
  assert.ok(addr.startsWith("omi-8-ffff-127-0-0-1-0x04-vendor-0x1234-slot1440-"));
});

test("OmiHardwarePeripheralEngine cons/car/cdr", () => {
  const engine = new OmiHardwarePeripheralEngine(new ArrayBuffer(5040 * 8));
  const cell = engine.cons(0x01, "serial-cdc");
  assert.equal(engine.car(cell), 0x01);
  assert.equal(engine.cdr(cell), "serial-cdc");
});

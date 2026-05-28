import test from "node:test";
import assert from "node:assert/strict";
import {
  POLYTOPE_SLOTS, BYTES_PER_SLOT, FACTORIAL_STRIDES, POLYTOPE_MAP,
  createPolytopeBuffer, pack4D, unpack4D,
  factorialStride, tickFactorials,
  polytopeWindow, registerTick, readTick,
  storeTickValue, readTickValue
} from "../src/runtime/polytope-sab.js";

test("polytope buffer is 5040 Float64 slots = 40320 bytes", () => {
  const buf = createPolytopeBuffer({ shared: false });
  assert.equal(buf.length, POLYTOPE_SLOTS);
  assert.equal(buf.BYTES_PER_ELEMENT, BYTES_PER_SLOT);
  assert.equal(buf.byteLength, POLYTOPE_SLOTS * BYTES_PER_SLOT);
});

test("pack4D / unpack4D round-trips coordinates", () => {
  const packed = pack4D(42, -17, 3000, -800);
  const u = unpack4D(packed);
  assert.equal(u.x, 42);
  assert.equal(u.y, -17);
  assert.equal(u.z, 3000);
  assert.equal(u.w, -800);
});

test("pack4D clamps to Int16 range", () => {
  const packed = pack4D(99999, -99999, 0, 0);
  const u = unpack4D(packed);
  assert.equal(u.x, 32767);
  assert.equal(u.y, -32768);
});

test("factorialStride returns correct values", () => {
  assert.equal(factorialStride(0), 1);
  assert.equal(factorialStride(1), 1);
  assert.equal(factorialStride(2), 2);
  assert.equal(factorialStride(3), 6);
  assert.equal(factorialStride(4), 24);
  assert.equal(factorialStride(5), 120);
  assert.equal(factorialStride(6), 720);
  assert.equal(factorialStride(7), 5040);
  assert.throws(() => factorialStride(8), RangeError);
});

test("tickFactorials decomposes tick into factorial frames", () => {
  const f = tickFactorials(1000);
  assert.equal(f.tick, 1000);
  assert.equal(f.page6, 1);
  assert.equal(f.remainder720, 280);
  assert.equal(f.block5, 2);
  assert.equal(f.remainder120, 40);
  assert.equal(f.cell4, 1);
  assert.equal(f.remainder24, 16);
  assert.equal(f.frame3, 2);
  assert.equal(f.remainder6, 4);
  assert.equal(f.edge2, 2);
  assert.equal(f.remainder2, 0);
});

test("tickFactorials wraps at 5040", () => {
  const f = tickFactorials(5040 + 42);
  assert.equal(f.tick, 42);
});

test("registerTick stores tick modulo 5040 at slot 0", () => {
  const clock = createPolytopeBuffer({ shared: false });
  registerTick(clock, 5120);
  assert.equal(readTick(clock), 80);
});

test("storeTickValue and readTickValue round-trip at correct slot", () => {
  const buf = createPolytopeBuffer({ shared: false });
  storeTickValue(buf, 777, 3.14);
  assert.equal(readTickValue(buf, 777), 3.14);
  assert.equal(readTickValue(buf, 777 + POLYTOPE_SLOTS), 3.14);
});

test("polytopeWindow provides strided access", () => {
  const buf = createPolytopeBuffer({ shared: false });
  const w720 = polytopeWindow(buf, 720);
  assert.equal(w720.count, 7);
  w720.write(0, 100, Math.PI);
  assert.equal(w720.read(0, 100), Math.PI);
});

test("polytopeWindow slice returns subarray", () => {
  const buf = createPolytopeBuffer({ shared: false });
  const w720 = polytopeWindow(buf, 720);
  storeTickValue(buf, 500, 2.71);
  const slice = w720.slice(0);
  assert.equal(slice.length, 720);
  assert.equal(slice[500], 2.71);
});

test("polytopeWindow fill writes multiple values", () => {
  const buf = createPolytopeBuffer({ shared: false });
  const w120 = polytopeWindow(buf, 120);
  w120.fill(0, [1, 2, 3, 4, 5]);
  assert.equal(w120.read(0, 0), 1);
  assert.equal(w120.read(0, 4), 5);
});

test("POLYTOPE_MAP defines correct polytope geometries", () => {
  assert.equal(POLYTOPE_MAP["600-cell"].vertices, 120);
  assert.equal(POLYTOPE_MAP["600-cell"].edges, 720);
  assert.equal(POLYTOPE_MAP["120-cell"].faces, 720);
  assert.equal(POLYTOPE_MAP["24-cell"].vertices, 24);
  assert.equal(POLYTOPE_MAP["600-cell"].stride, 720);
  assert.equal(POLYTOPE_MAP["24-cell"].stride, 24);
});

test("FACTORIAL_STRIDES describes each stride level", () => {
  assert.equal(FACTORIAL_STRIDES[720].fact, "6!");
  assert.equal(FACTORIAL_STRIDES[24].vertices, 24);
  assert.equal(FACTORIAL_STRIDES[6].name, "octahedron");
});

import { OmiPolytopeFactorialBuffer } from "../src/runtime/polytope-sab.js";

test("OmiPolytopeFactorialBuffer allocates 5040 slots", () => {
  const buf = new OmiPolytopeFactorialBuffer(new ArrayBuffer(5040 * 8));
  assert.equal(buf.view.length, 5040);
  assert.equal(buf.FACTORIAL_STRIDES[720].fact, "6!");
});

test("OmiPolytopeFactorialBuffer.resolveFactorialAddress maps tick 744", () => {
  const buf = new OmiPolytopeFactorialBuffer(new ArrayBuffer(5040 * 8));
  const addr = buf.resolveFactorialAddress(744n);
  assert.equal(addr.absoluteIndex, 744);
  assert.equal(addr.hierarchy.page720, 1);
  assert.equal(addr.hierarchy.block120, 0);
  assert.equal(addr.hierarchy.cell24, 1);
  assert.equal(addr.hierarchy.frame6, 0);
  assert.equal(addr.hierarchy.element2, 0);
  assert.ok(addr.tokenMnemonic.startsWith("page1-block0-cell1-frame0-edge0-slot744"));
});

test("OmiPolytopeFactorialBuffer zero-copy write/read round-trip", () => {
  const buf = new OmiPolytopeFactorialBuffer(new ArrayBuffer(5040 * 8));
  buf.writeCoordinateToSlot(744, 44.6875);
  assert.equal(buf.readCoordinateFromSlot(744), 44.6875);
  assert.equal(buf.readCoordinateFromSlot(-1), 0.0);
  assert.equal(buf.readCoordinateFromSlot(5040), 0.0);
});

test("OmiPolytopeFactorialBuffer cons/car/cdr cell primitives", () => {
  const buf = new OmiPolytopeFactorialBuffer(new ArrayBuffer(5040 * 8));
  const cell = buf.cons(42, buf.cons("hello", null));
  assert.equal(buf.car(cell), 42);
  assert.equal(buf.car(buf.cdr(cell)), "hello");
  assert.equal(buf.cdr(buf.cdr(cell)), null);
});

test("OmiPolytopeFactorialBuffer evaluateGCLifecycle fires 720 sweep", () => {
  const buf = new OmiPolytopeFactorialBuffer(new ArrayBuffer(5040 * 8));
  let captured = null;
  buf.evaluateGCLifecycle(720, (type, slot) => { captured = { type, slot }; });
  assert.equal(captured.type, "720_SWEEP");
  assert.equal(captured.slot, 720);
});

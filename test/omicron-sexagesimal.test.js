import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { OmiSexagesimalKernel } from '../src/omi/sexagesimal-kernel.js';

test('16-bit Delta Law executes an exact period 8 rotation orbit', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  let state = 0x1234;
  const history = [state];

  for (let i = 0; i < 8; i++) {
    state = kernel.executeDeltaLawStep(state);
    history.push(state);
  }

  assert.equal(history[0], history[8], "Delta law must return to origin after 8 steps");
  assert.notEqual(history[1], history[0], "Delta law must produce a different intermediate state");
});

test('period 8 holds for different seeds', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  for (const seed of [0x0000, 0xFFFF, 0xABCD, 0x1234, 0x5A3C]) {
    let state = seed;
    for (let i = 0; i < 8; i++) state = kernel.executeDeltaLawStep(state);
    assert.equal(state, seed, `Delta law seed 0x${seed.toString(16)} failed period 8`);
  }
});

test('parseSexagesimalAddress accepts valid step15 at slot720', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  const token = "Ο-ffff-127-0-0-1-0x02-slot720-step15/128-YmFzZTY0";
  const cell = kernel.parseSexagesimalAddress(token);

  assert.equal(kernel.car(cell).valid, true);
  assert.equal(kernel.car(cell).astronomy.sexagesimalStepDigit, 15);
  assert.equal(kernel.car(cell).astronomy.fractionalRatio, 15 / 60);
  assert.equal(kernel.car(cell).astronomy.currentStrideValue, 720);
});

test('parseSexagesimalAddress accepts valid step59 at slot120', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  const token = "Ο-ffff-127-0-0-1-0x04-slot120-step59/128-MzkAQA";
  const cell = kernel.parseSexagesimalAddress(token);

  assert.equal(kernel.car(cell).valid, true);
  assert.equal(kernel.car(cell).astronomy.sexagesimalStepDigit, 59);
  assert.equal(kernel.car(cell).astronomy.currentStrideValue, 120);
});

test('parseSexagesimalAddress rejects step65 (exceeds Hellenistic 59 limit)', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  const token = "Ο-ffff-127-0-0-1-0x02-slot720-step65/128-YmFzZTY0";
  const cell = kernel.parseSexagesimalAddress(token);

  assert.equal(kernel.car(cell).valid, false);
});

test('parseSexagesimalAddress rejects slot999 (not a valid factorial stride)', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  const token = "Ο-ffff-127-0-0-1-0x02-slot999-step15/128-YmFzZTY0";
  const cell = kernel.parseSexagesimalAddress(token);

  assert.equal(kernel.car(cell).valid, false);
});

test('parseSexagesimalAddress accepts stride 5040 as valid', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  const token = "Ο-ffff-127-0-0-1-0x02-slot5040-step0/128-YmFzZTY0";
  const cell = kernel.parseSexagesimalAddress(token);

  assert.equal(kernel.car(cell).valid, true);
  assert.equal(kernel.car(cell).astronomy.currentStrideValue, 5040);
  assert.equal(kernel.car(cell).astronomy.sexagesimalStepDigit, 0);
});

test('parseSexagesimalAddress decodes base64 payload into Float32Array', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  const token = "Ο-ffff-127-0-0-1-0x02-slot720-step15/128-AADAPwAAAEAAAAC_AAAgQQ";
  const cell = kernel.parseSexagesimalAddress(token);
  const payload = kernel.cdr(cell);

  assert.ok(payload instanceof Float32Array);
  assert.equal(payload[1], 2.0);
  assert.equal(payload[2], -0.5);
  assert.equal(payload[3], 10.0);
});

test('parseSexagesimalAddress returns null cdr for short payload', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  const token = "Ο-ffff-127-0-0-1-0x02-slot720-step15/128";
  const cell = kernel.parseSexagesimalAddress(token);

  assert.equal(kernel.car(cell).valid, true);
  assert.equal(kernel.cdr(cell), null);
});

test('parseSexagesimalAddress returns error for empty token', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  const cell = kernel.parseSexagesimalAddress("");
  assert.equal(kernel.car(cell).valid, false);
  assert.equal(kernel.car(cell).error, "Empty Token");
});

test('cons/car/cdr cell primitives work', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const kernel = new OmiSexagesimalKernel(sab);

  const cell = kernel.cons("abc", 42);
  assert.equal(kernel.car(cell), "abc");
  assert.equal(kernel.cdr(cell), 42);
});

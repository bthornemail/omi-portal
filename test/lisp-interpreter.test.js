import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseOmiAddressToSegments } from '../src/omi/delta-orbital-lexer.js';
import { OmiOneWordRegisterMachine } from '../src/omi/lisp-interpreter.js';

test('Register Machine: extracts CAR and CDR slices from genesis single-word register', () => {
  const machine = new OmiOneWordRegisterMachine();
  const genesisToken = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";
  const S = parseOmiAddressToSegments(genesisToken);

  const metrics = machine.evaluateRegisterWordCons(S);

  assert.ok(metrics.accepted);
  assert.equal(metrics.operatorLL, 0x01);
  assert.equal(metrics.registerCAR, 0x7C00);
  assert.equal(metrics.registerCDR, 0x1434);
  assert.equal(metrics.isCdrNilTerminated, false);
});

test('Register Machine: nil-terminated cons cell triggers cyan preset', () => {
  const machine = new OmiOneWordRegisterMachine();
  const nilToken = "omi-0100-03bf-aaaa-2b01-2f01-01ff-039f-01ff/48";
  const S = parseOmiAddressToSegments(nilToken);

  const metrics = machine.evaluateRegisterWordCons(S);

  assert.ok(metrics.accepted);
  assert.equal(metrics.registerCDR, 0x01FF);
  assert.equal(metrics.isCdrNilTerminated, true);
  assert.equal(metrics.canvasPresetColorId, "5");
});

test('Register Machine: structurally invalid address rejected at Gate 1', () => {
  const machine = new OmiOneWordRegisterMachine();
  const badToken = "omi-0000-0000-0000-0000-0000-0000-0000-0000/48";
  const S = parseOmiAddressToSegments(badToken);

  const metrics = machine.evaluateRegisterWordCons(S);

  assert.equal(metrics.accepted, false);
  assert.match(metrics.reason, /GATE_1/);
});

test('Register Machine: timelineSlot computed as CAR modulo 5040', () => {
  const machine = new OmiOneWordRegisterMachine();
  const token = "omi-0200-03bf-5040-2b02-2f02-aaaa-039f-02ff/48";
  const S = parseOmiAddressToSegments(token);

  const metrics = machine.evaluateRegisterWordCons(S);

  assert.ok(metrics.accepted);
  assert.equal(metrics.timelineSlot, 0x5040 % 5040);
});

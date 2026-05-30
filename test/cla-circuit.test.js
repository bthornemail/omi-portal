import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeCla4Bit, computeCla16Bit } from '../src/omi/cla-adder.js';

test('CLA 4-bit: 5 + 6 + 1 = 12 (0xC) with Cout=0', () => {
  const out = computeCla4Bit(5, 6, 1);
  assert.equal(out.sum, 12);
  assert.equal(out.Cout, 0);
  assert.equal(out.P, 3);
  assert.equal(out.G, 4);
});

test('CLA 4-bit: 0xF + 0x1 + 0 = 0 with Cout=1', () => {
  const out = computeCla4Bit(0xF, 0x1, 0);
  assert.equal(out.sum, 0);
  assert.equal(out.Cout, 1);
});

test('CLA 4-bit: 0 + 0 + 0 = 0 with Cout=0', () => {
  const out = computeCla4Bit(0, 0, 0);
  assert.equal(out.sum, 0);
  assert.equal(out.Cout, 0);
  assert.equal(out.P, 0);
  assert.equal(out.G, 0);
});

test('CLA 4-bit: 0xA + 0x5 + 1 = 0 with Cout=1', () => {
  const out = computeCla4Bit(0xA, 0x5, 1);
  assert.equal(out.sum, 0);
  assert.equal(out.Cout, 1);
});

test('CLA 4-bit: gate delays respect 4dt maximum (Rule 0x86)', () => {
  const out = computeCla4Bit(7, 7, 0);
  assert.ok(out.gateDelays.step0 <= 1);
  assert.ok(out.gateDelays.carry <= 3);
  assert.ok(out.gateDelays.sum <= 4);
});

test('CLA 4-bit: PG and GG group signals computed correctly', () => {
  const out = computeCla4Bit(0xF, 0xF, 0);
  assert.equal(out.PG, 0);
  assert.equal(out.GG, 1);
  assert.equal(out.Cout, 1);

  const out2 = computeCla4Bit(0x5, 0xA, 0);
  assert.equal(out2.PG, 1);
  assert.equal(out2.GG, 0);

  const out3 = computeCla4Bit(0x6, 0x9, 0);
  assert.equal(out3.PG, 1);
  assert.equal(out3.GG, 0);
});

test('CLA 4-bit: carry chain unrolled (C1 through C4) matches standard CLA equations', () => {
  const out = computeCla4Bit(0xD, 0x7, 0);
  const { P, G, carries } = out;
  const p0 = (P >> 0) & 1, p1 = (P >> 1) & 1, p2 = (P >> 2) & 1, p3 = (P >> 3) & 1;
  const g0 = (G >> 0) & 1, g1 = (G >> 1) & 1, g2 = (G >> 2) & 1, g3 = (G >> 3) & 1;

  const expectedC1 = g0;
  const expectedC2 = g1 | (p1 & g0);
  const expectedC3 = g2 | (p2 & g1) | (p2 & p1 & g0);
  const expectedC4 = g3 | (p3 & g2) | (p3 & p2 & g1) | (p3 & p2 & p1 & g0);

  assert.equal(carries[0], expectedC1);
  assert.equal(carries[1], expectedC2);
  assert.equal(carries[2], expectedC3);
  assert.equal(carries[3], expectedC4);
});

test('CLA 16-bit: 0xFFFF + 0x0001 = 0x0000 with Cout=1', () => {
  const out = computeCla16Bit(0xFFFF, 0x0001, 0);
  assert.equal(out.sum, 0x0000);
  assert.equal(out.Cout, 1);
});

test('CLA 16-bit: 0x1234 + 0x5678 + 1 = 0x68AD with Cout=0', () => {
  const out = computeCla16Bit(0x1234, 0x5678, 1);
  assert.equal(out.sum, 0x68AD);
  assert.equal(out.Cout, 0);
});

test('CLA JSON Canvas: tetragrammatron.canvas schema registers standard single-digit presets', () => {
  const filePath = join(process.cwd(), 'dev-docs/tetragrammatron.canvas');
  const raw = readFileSync(filePath, 'utf8');
  const canvas = JSON.parse(raw);

  assert.ok(canvas.nodes);
  assert.equal(canvas.nodes.length, 3);
  assert.ok(canvas.edges);
  assert.equal(canvas.edges.length, 2);

  const lcuNode = canvas.nodes.find(n => n.id === 'node-cla-step1-lcu');
  assert.ok(lcuNode);
  assert.equal(lcuNode.color, '2');
});

test('CLA JSON Canvas: edge topology connects step0 → step1 → outputs', () => {
  const filePath = join(process.cwd(), 'dev-docs/tetragrammatron.canvas');
  const raw = readFileSync(filePath, 'utf8');
  const canvas = JSON.parse(raw);

  const e1 = canvas.edges.find(e => e.id === 'edge-cla-step0-to-step1');
  assert.ok(e1);
  assert.equal(e1.fromNode, 'node-cla-step0-inputs');
  assert.equal(e1.toNode, 'node-cla-step1-lcu');

  const e2 = canvas.edges.find(e => e.id === 'edge-cla-step1-to-outputs');
  assert.ok(e2);
  assert.equal(e2.fromNode, 'node-cla-step1-lcu');
  assert.equal(e2.toNode, 'node-cla-sum-outputs');
});

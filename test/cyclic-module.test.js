import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cyclicReplayComponent,
  decomposeReplayModule,
  directSumComponents
} from '../src/omilog/cyclic-module.js';

const ADDR_A = 'omi-0400-03bf-0003-2b04-2f04-0002-039f-04ff/128';
const ADDR_B = 'omi-0400-03bf-0007-2b04-2f04-0009-039f-04ff/128';
const ADDR_C = 'omi-0500-03bf-0001-2b05-2f05-0003-039f-05ff/96';

describe('cyclic-module', () => {
  it('cyclicReplayComponent returns component with replay slot', () => {
    const comp = cyclicReplayComponent(ADDR_A, [ADDR_A, ADDR_B]);
    assert.notEqual(comp, null);
    assert.equal(comp.recordCount, 2);
    assert(typeof comp.replaySlot === 'number');
    assert(comp.replaySlot >= 0 && comp.replaySlot < 5040);
  });

  it('cyclicReplayComponent returns null for empty records', () => {
    assert.equal(cyclicReplayComponent(ADDR_A, []), null);
  });

  it('cyclicReplayComponent returns null for no generator', () => {
    assert.equal(cyclicReplayComponent(null, [ADDR_A]), null);
  });

  it('decomposeReplayModule splits records by generator', () => {
    const comps = decomposeReplayModule([ADDR_A, ADDR_B, ADDR_C]);
    assert.equal(comps.length, 2);
  });

  it('decomposeReplayModule returns empty for empty input', () => {
    assert.equal(decomposeReplayModule([]).length, 0);
  });

  it('decomposeReplayModule returns empty for no valid records', () => {
    assert.equal(decomposeReplayModule(['bad', null, 42]).length, 0);
  });

  it('directSumComponents aggregates components', () => {
    const comps = decomposeReplayModule([ADDR_A, ADDR_B, ADDR_C]);
    const sum = directSumComponents(comps);
    assert.notEqual(sum, null);
    assert.equal(sum.componentCount, 2);
    assert.equal(sum.totalRecords, 3);
    assert.equal(sum.generators.length, 2);
    assert.equal(sum.replaySlots.length, 2);
  });

  it('directSumComponents returns null for non-array input', () => {
    assert.equal(directSumComponents(42), null);
  });

  it('components sorted by replaySlot', () => {
    const comps = decomposeReplayModule([ADDR_A, ADDR_B, ADDR_C]);
    for (let i = 1; i < comps.length; i++) {
      assert(comps[i - 1].replaySlot <= comps[i].replaySlot);
    }
  });
});

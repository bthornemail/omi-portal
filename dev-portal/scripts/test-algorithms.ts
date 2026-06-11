import { strict as assert } from 'node:assert';
import { cellFromRowXY, rowXYFromCell, scalarFromPageCell, cellFromScalar, TOTAL_CELLS, makeMasterBitboard, setBit, getBit } from '../src/core/gauge';
import { toSurrogatePair, fromSurrogatePair } from '../src/core/surrogate';
import { delta, BLOCK_B_WIDTH } from '../src/core/delta';
import { computeCons } from '../src/core/cons';

assert.equal(TOTAL_CELLS, 1_048_576);
assert.equal(BLOCK_B_WIDTH, 36);

const cell = cellFromRowXY(0xA, 0x29, 0x15);
assert.equal(cell, 0xaa55);
assert.deepEqual(rowXYFromCell(cell), { row: 0xA, x: 0x29, y: 0x15 });

const scalar = scalarFromPageCell(0, cell);
assert.equal(scalar, 0x01aa55);
assert.deepEqual(cellFromScalar(scalar), { page: 0, row: 0xA, x: 0x29, y: 0x15, cell, scalar });

const pair = toSurrogatePair(scalar);
assert.equal(fromSurrogatePair(pair.high, pair.low), scalar);

assert.equal(delta(0, 0x03bf, 16), 0x03bf);

const cons = computeCons(0xaa55, 0x7c00);
assert.equal(cons.car, 0xfe55);
assert.equal(cons.cdr, 0xd655);
assert.equal(cons.cid >>> 0, 0xffff29aa);

const bits = makeMasterBitboard();
setBit(bits, 42, true);
assert.equal(getBit(bits, 42), true);
setBit(bits, 42, false);
assert.equal(getBit(bits, 42), false);

console.log('OMI algorithm tests passed');

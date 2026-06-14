import assert from "node:assert/strict";
import {
  qxy, qxyRoot120, qxyLocal240, mixedEncode, mixedDecode,
  unicodeDecompose, unicodeCompose, utf16SurrogatePair, codepointFromSurrogates,
  slot5040, decodeSlot5040, carCdrCid, verifyCarCdrCid, root16FromFragmentsXor,
  gf256InterpolateAtZero, dataViewHeader32, decodeDataViewHeader32,
  parseOmiAddress
} from "./omi-pure-functions.mjs";

assert.equal(qxy(3,3), 720);
assert.equal(qxyRoot120(3,3), 120);
assert.equal(qxyLocal240(3,3), 0);

const radices = [36, 7, 3, 240];
const v = 123456;
assert.equal(mixedDecode(mixedEncode(v, radices), radices), v);

assert.deepEqual(unicodeDecompose(0x10ffff), { plane: 16, offset: 0xffff });
assert.equal(unicodeCompose(16, 0xffff), 0x10ffff);

const sp = utf16SurrogatePair(0x10ffff);
assert.equal(codepointFromSurrogates(sp.high, sp.low), 0x10ffff);

const s = slot5040(6,2,239);
assert.deepEqual(decodeSlot5040(s), { fano7: 6, role3: 2, local240: 239 });

assert.equal(carCdrCid(0xaa55, 0x55aa), 0xffff);
assert.equal(verifyCarCdrCid(0xaa55, 0x55aa, 0xffff), true);
assert.equal(root16FromFragmentsXor([{idx:1, car:0x2001},{idx:0, car:0x2000},{idx:2, car:0x2002}]), 0x2003);

const h = dataViewHeader32(0x1234, 0x56, 0x12, 1);
assert.deepEqual(decodeDataViewHeader32(h), { subpath: 0x1234, packetClass: 0x56, axis: 0x12, sign: 1 });

const a = parseOmiAddress("omi-0000-0000-0000-000b-0000-0000-0000-0000/48");
assert.equal(a.segments[3], 0x000b);
assert.equal(a.prefix, 48);

assert.equal(gf256InterpolateAtZero([{x:1,y:0x20},{x:2,y:0x21}], 0x11d), 0xd4);

console.log("omi-pure-functions tests pass");

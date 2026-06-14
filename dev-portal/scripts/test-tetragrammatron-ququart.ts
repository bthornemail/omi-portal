import {
  interpolateRootedQuQuart,
  deriveRootedQuQuartFromCla,
  classifyByteAddress,
  binaryQuadraticDifferential,
  differenceOfSquares,
  gnomonMetrics,
  precisionShellMetrics,
  elevenCellOrientation,
  walkElevenCellShell,
  archimedeanCatalanCoordination,
  twosComplementGeometry,
  computeCla4Bit,
  evaluatePsi,
} from '../src/omi/tetragrammatronQuquartInterpolator';

const assert = (cond: boolean, msg: string) => {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
};

async function run() {
  console.log(`\n=== Tetragrammatron Rooted QuQuart ===`);

  // 1. Rooted QuQuart: local240 range
  console.log(`\n📐 1. interpolateRootedQuQuart`);
  for (let ph = 0; ph < 4; ph++) {
    for (let ori = 0; ori < 60; ori++) {
      const out = interpolateRootedQuQuart({
        orientation60: ori, phase4: ph as 0|1|2|3, role3: 0, fano7: 0,
      });
      assert(out.local240 === ph * 60 + ori, `local240 = ${ph}*60+${ori} = ${out.local240}`);
      assert(out.local240 >= 0 && out.local240 < 240, `local240 ${out.local240} in 0..239`);
      assert(out.activeByte === out.local240, `activeByte = local240`);
      assert(out.receiptState === 'candidate', `receiptState candidate`);
    }
  }
  console.log(`  ✓ 240 local240 values correct`);

  // 2. slot5040 computation
  {
    const out = interpolateRootedQuQuart({ orientation60: 30, phase4: 2, role3: 1, fano7: 3 });
    const expected = 3 * 720 + 1 * 240 + (2 * 60 + 30);
    assert(out.slot5040 === expected, `slot5040 = ${out.slot5040} (expected ${expected})`);
    assert(out.slot5040 >= 0 && out.slot5040 < 5040, `slot5040 in range`);
  }
  console.log(`  ✓ slot5040 = fano7×720 + role3×240 + local240`);

  // 3. CLA derivation
  console.log(`\n📐 2. deriveRootedQuQuartFromCla`);
  {
    const d = deriveRootedQuQuartFromCla({ A: 5, B: 6, Cin: 1 });
    assert(d.orientation60 >= 0 && d.orientation60 < 60, `orientation60 derived`);
    assert(d.phase4 >= 0 && d.phase4 < 4, `phase4 derived`);
    assert(d.role3 >= 0 && d.role3 < 3, `role3 derived`);
    assert(d.fano7 >= 0 && d.fano7 < 7, `fano7 derived`);
    assert(d.cla.sum === 0x0C, `CLA sum correct`);
  }
  console.log(`  ✓ CLA derivation produces valid rooted coords`);

  // 4. CLA 4-bit (preserved, 512 cases)
  console.log(`\n📐 3. computeCla4Bit`);
  for (let a = 0; a < 16; a++) {
    for (let b = 0; b < 16; b++) {
      for (let cin = 0; cin < 2; cin++) {
        const cla = computeCla4Bit(a, b, cin);
        assert(cla.sum === ((a + b + cin) & 0x0F), `CLA sum ${a}+${b}+${cin}`);
        assert(cla.Cout === ((a + b + cin) >> 4), `CLA Cout ${a}+${b}+${cin}`);
      }
    }
  }
  console.log(`  ✓ CLA 4-bit: all 512 cases correct`);

  // 5. classifyByteAddress
  console.log(`\n📐 4. classifyByteAddress`);
  for (let b = 0; b < 256; b++) {
    const c = classifyByteAddress(b);
    assert(c.byte === b, `byte ${b}`);
    assert(c.activeBridge === (b < 240), `activeBridge ${b}`);
    assert(c.reservedBand === (b >= 240), `reservedBand ${b}`);
  }
  console.log(`  ✓ 0..239 active bridge, 240..255 reserved band`);

  // 6. Binary Quadratic Differential
  console.log(`\n📐 5. binaryQuadraticDifferential`);
  assert(binaryQuadraticDifferential(0, 0) === 0, `BQD(0,0)=0`);
  assert(binaryQuadraticDifferential(1, 0) === 60, `BQD(1,0)=60`);
  assert(binaryQuadraticDifferential(0, 1) === 4, `BQD(0,1)=4`);
  assert(binaryQuadraticDifferential(1, 1) === 80, `BQD(1,1)=60+16+4=80`);
  assert(binaryQuadraticDifferential(3, 3) === 720, `BQD(3,3)=60*9+16*9+4*9=540+144+36=720 (6!)`);
  console.log(`  ✓ BQD matches 60x² + 16xy + 4y²`);

  // 7. Difference of squares / gnomon
  console.log(`\n📐 6. differenceOfSquares / gnomon`);
  assert(differenceOfSquares(10, 6) === 64, `10²-6²=64`);
  {
    const g1 = gnomonMetrics(10, 6);
    assert(g1.differenceOfSquares === 64, `gnomon(10,6) diffSq=64`);
    assert(g1.width === 4, `gnomon(10,6) width=4`);
    assert(g1.sum === 16, `gnomon(10,6) sum=16`);
    assert(g1.difference === 4, `gnomon(10,6) diff=4`);
    assert(g1.bridgeRectangle === 64, `gnomon(10,6) rect=64`);
    const g2 = gnomonMetrics(3, 8);
    assert(g2.width === 5, `gnomon(3,8) width=5 (order independent)`);
  }
  console.log(`  ✓ Difference of squares and gnomon correct`);

  // 8. Precision shell
  console.log(`\n📐 7. precisionShellMetrics`);
  {
    const p1 = precisionShellMetrics(5, 10);
    assert(p1.shell === 2048, `shell=2048`);
    assert(p1.surface === 1024, `surface=1024`);
    assert(p1.anchor === 'o---o', `anchor o---o when source & reading = 0`);
    const p2 = precisionShellMetrics(0xFF, 0x0F);
    assert(p2.anchor === 'omi---imo', `anchor omi---imo when source & reading != 0`);
  }
  console.log(`  ✓ 2¹¹/2¹⁰ shell + anchor`);

  // 9. 11-cell orientation
  console.log(`\n📐 8. elevenCellOrientation`);
  for (let v = 0; v < 11; v++) {
    for (let c = 0; c < 11; c++) {
      const o = elevenCellOrientation(v, c);
      assert(o >= 0 && o < 60, `orientation in 0..59`);
    }
  }
  assert(elevenCellOrientation(0, 0) === 0, `(0,0) → 0`);
  assert(elevenCellOrientation(1, 0) !== 0, `(1,0) must not collapse to 0`);
  assert(elevenCellOrientation(0, 1) !== 0, `(0,1) must not collapse to 0`);
  assert(elevenCellOrientation(3, 7) !== 0, `(3,7) must not collapse to 0`);
  console.log(`  ✓ 121 orientation pairs produce 0..59 range, no collapse`);

  // 10. 11-cell walk
  console.log(`\n📐 9. walkElevenCellShell`);
  {
    const w = walkElevenCellShell(3, 11);
    assert(w.path.length === 12, `path length 12`);
    assert(w.path[0] === 3, `start vertex 3`);
    assert(w.distances.length === 11, `11 distances`);
    assert(w.orientationStates.length === 11, `11 orientations`);
    for (const o of w.orientationStates) {
      assert(o >= 0 && o < 60, `orientation in 0..59`);
    }
  }
  console.log(`  ✓ Walk produces valid path, distances, orientations`);

  // 11. Archimedean/Catalan
  console.log(`\n📐 10. archimedeanCatalanCoordination`);
  {
    const ac = archimedeanCatalanCoordination(30, 45, 7);
    assert(ac.traversal >= 0 && ac.traversal < 60, `traversal in 0..59`);
    assert(ac.chiral >= 0 && ac.chiral < 60, `chiral in 0..59`);
    assert(ac.tangent.startsWith('o---o:'), `tangent starts with o---o:`);
    assert(ac.solidus.startsWith(ac.tangent), `solidus starts with tangent`);
  }
  console.log(`  ✓ Archimedean/Catalan coordination correct`);

  // 12. Two's-complement geometry
  console.log(`\n📐 11. twosComplementGeometry`);
  {
    const t1 = twosComplementGeometry(5, 10);
    assert(t1.orientation === 'outward', `5→10 outward`);
    const t2 = twosComplementGeometry(10, 5);
    assert(t2.orientation === 'inward', `10→5 inward`);
    const t3 = twosComplementGeometry(7, 7);
    assert(t3.orientation === 'identity', `7→7 identity`);
    assert(!t3.overflow, `no overflow on identity`);
  }
  console.log(`  ✓ Two's-complement: outward/inward/identity`);

  // 13. ψ function
  console.log(`\n📐 12. evaluatePsi`);
  {
    const psi = evaluatePsi({
      F1: 30, W1: 2, F2: 1, W2: 3,
      P: 2, E: 14, G: 1, I: 1,
      B: 30, H: 120, S: 1,
    });
    assert(typeof psi.accepted === 'boolean', `accepted boolean`);
    assert(psi.receiptId.startsWith('receipt:'), `receiptId prefix`);
    assert(psi.degree >= 0 && psi.degree < 60, `degree in 0..59`);
  }
  console.log(`  ✓ ψ function produces valid receipt`);

  // 14. Determinism
  console.log(`\n📐 13. Determinism`);
  const r1 = interpolateRootedQuQuart({ orientation60: 15, phase4: 1, role3: 2, fano7: 4 });
  const r2 = interpolateRootedQuQuart({ orientation60: 15, phase4: 1, role3: 2, fano7: 4 });
  assert(JSON.stringify(r1) === JSON.stringify(r2), `deterministic`);
  console.log(`  ✓ Deterministic for same inputs`);

  // 15. Edge: all zeros and all max
  console.log(`\n📐 14. Edge cases`);
  {
    const zero = interpolateRootedQuQuart({ orientation60: 0, phase4: 0, role3: 0, fano7: 0 });
    assert(zero.local240 === 0, `zero local240`);
    assert(zero.slot5040 === 0, `zero slot5040`);

    const max = interpolateRootedQuQuart({ orientation60: 59, phase4: 3, role3: 2, fano7: 6 });
    assert(max.local240 === 239, `max local240`);
    assert(max.slot5040 === 6*720 + 2*240 + 239, `max slot5040`);
  }
  console.log(`  ✓ Zero and max inputs produce correct ranges`);

  // ── Canonical lines ─────────────────────────────────
  console.log(`\n  ✓ Rooted QuQuart: orientation60 + phase4 + role3 + fano7`);
  console.log(`  ✓ 240-state active byte-plane (4 × 60)`);
  console.log(`  ✓ 720 semantic sweep (3 × 240)`);
  console.log(`  ✓ 5040 replay ring (7 × 720)`);
  console.log(`  ✓ CLA may derive, but is not the authority`);
  console.log(`  ✓ 11-cell roots orientation. QuQuart selects phase. CONS reduces.`);

  console.log(`\n────────────────────────────────────────`);
  console.log('PASS: tetragrammatron-ququart');
  process.exit(0);
}

run().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

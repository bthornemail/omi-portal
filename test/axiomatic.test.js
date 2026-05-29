import { test } from "node:test";
import { strict as assert } from "node:assert";
import { OmiAxiomaticKernel } from "../src/omi/axiomatic-kernel.js";
import { parsePrologFacts } from "../src/wordnet/prolog-broker.js";
import { join } from "node:path";

test("Axiomatic Kernel parses RULES.omi and enforces strict RFC2119 compliance parameters", async () => {
  const kernel = new OmiAxiomaticKernel();

  const rulesPath = join(process.cwd(), "RULES.omi");
  const factsPath = join(process.cwd(), "FACTS.omi");

  await kernel.loadAxiomaticFile(rulesPath, kernel.rulesRegistry);
  await kernel.loadAxiomaticFile(factsPath, kernel.factsRegistry);

  const mirrorKey = "omi-0000-0000-5a3c-0000-0000-0000-0000-0000/48";
  const resolvedRule = kernel.rulesRegistry.get(mirrorKey);
  assert.ok(resolvedRule);
  assert.equal(resolvedRule.keyword, "MUST");
  assert.equal(resolvedRule.assignment, "central-inversion-mirror");

  const chiralKey = "omi-ffff-0000-0000-0000-0000-0000-0000-0000/48";
  const chiralRule = kernel.rulesRegistry.get(chiralKey);
  assert.ok(chiralRule);
  assert.equal(chiralRule.assignment, "chiral-origin");

  const nounKey = "omi-0000-0000-0000-0001-0000-0000-0000-0000/48";
  const resolvedFact = kernel.factsRegistry.get(nounKey);
  assert.ok(resolvedFact);
  assert.equal(resolvedFact.keyword, "FACT");
  assert.equal(resolvedFact.assignment, "universal-pos-NOUN");

  const layer6Key = "omi-0000-0000-0000-0000-0000-0000-0006-0000/48";
  const layerFact = kernel.factsRegistry.get(layer6Key);
  assert.ok(layerFact);
  assert.equal(layerFact.assignment, "lattice-layer-6-720-sweep");

  const nilKey = "omi-0000-0000-0000-0000-0000-0000-0000-0001/48";
  const nilRule = kernel.rulesRegistry.get(nilKey);
  assert.ok(nilRule);
  assert.equal(nilRule.assignment, "fixed-point-zero-frame");
});

test("Axiomatic Kernel accurately maps real-time packet checks", async () => {
  const kernel = new OmiAxiomaticKernel();
  await kernel.loadAxiomaticFile(
    join(process.cwd(), "RULES.omi"),
    kernel.rulesRegistry
  );

  const validInverted = "omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48";
  assert.equal(kernel.verifyPacketCompliance(validInverted), true);

  const validPlain = "omi-ffff-0001-0000-0001-0078-0000-0003-0000/48";
  assert.equal(kernel.verifyPacketCompliance(validPlain), true);

  assert.equal(kernel.verifyPacketCompliance(""), false);
  assert.equal(kernel.verifyPacketCompliance("bad-prefix-ffff/48"), false);
  assert.equal(kernel.verifyPacketCompliance(null), false);
});

test("Axiomatic Kernel token-to-segments decoding matches 8-hex CIDR layout", async () => {
  const kernel = new OmiAxiomaticKernel();

  const segments = kernel.tokenToSegments(
    "omi-ffff-0005-5a3c-0002-02d0-0014-0004-0000/48"
  );
  assert.ok(segments);
  assert.equal(segments.length, 8);
  assert.equal(segments[0], 0xFFFF);
  assert.equal(segments[1], 0x0005);
  assert.equal(segments[2], 0x5A3C);
  assert.equal(segments[3], 0x0002);
  assert.equal(segments[4], 0x02D0);
  assert.equal(segments[5], 0x0014);
  assert.equal(segments[6], 0x0004);
  assert.equal(segments[7], 0x0000);

  assert.equal(kernel.tokenToSegments(""), null);
  assert.equal(kernel.tokenToSegments("omi-invalid"), null);
});

test("resolveFactForToken decodes POS, stride, layer from segment positions", async () => {
  const kernel = new OmiAxiomaticKernel();

  const cell = kernel.resolveFactForToken(
    "omi-039f-0003-0000-0001-0078-0005-0003-0000/48"
  );
  const meta = kernel.car(cell);
  const rest = kernel.cdr(cell);

  assert.ok(meta);
  assert.equal(meta.chiralPhase, "right");
  assert.equal(meta.busId, 0x0003);
  assert.equal(meta.inversionGate, false);
  assert.equal(meta.posTag, "NOUN");
  assert.equal(meta.stride, 0x0078);
  assert.equal(meta.slot, 0x0005);
  assert.equal(meta.factorialLayer, 0x0003);
  assert.equal(meta.nilTerminator, false);
  assert.equal(rest.length, 8);
});

test("Axiomatic Kernel integrates with Prolog WordNet fact parser", async () => {
  const kernel = new OmiAxiomaticKernel();

  const sampleProlog = `s(100002684,2,'physical object',n,1,0).
hyp(100002684,100001930).
g(100002684,'a tangible entity').`;

  const tempPath = join(process.cwd(), "test", "fixtures", "sample.pl");
  const { mkdir, writeFile, rm } = await import("node:fs/promises");
  await mkdir(join(process.cwd(), "test", "fixtures"), { recursive: true });
  await writeFile(tempPath, sampleProlog, "utf8");

  const loaded = await kernel.loadAxiomaticFile(tempPath, kernel.factsRegistry);
  assert.equal(loaded.length, 3);
  assert.equal(loaded[0].name, "s");
  assert.equal(loaded[0].args[0], "100002684");
  assert.equal(loaded[1].name, "hyp");
  assert.equal(loaded[2].name, "g");

  const key = "s(100002684,2,physical object,n,1,0)";
  const fact = kernel.factsRegistry.get(key);
  assert.ok(fact);
  assert.equal(fact.assignment, "prolog-s");

  await rm(tempPath);
  await rm(join(process.cwd(), "test", "fixtures"), { recursive: true });
});

test("matchMask checks subset wildcard against full rule table", async () => {
  const kernel = new OmiAxiomaticKernel();
  await kernel.loadAxiomaticFile(
    join(process.cwd(), "RULES.omi"),
    kernel.rulesRegistry
  );
  await kernel.loadAxiomaticFile(
    join(process.cwd(), "FACTS.omi"),
    kernel.factsRegistry
  );

  const nounToken = "omi-039f-0003-0000-0001-02d0-0036-0003-0000/48";
  const nounRule = "omi-0000-0000-0000-0001-0000-0000-0000-0000/48";
  assert.equal(kernel.matchMask(nounToken, nounRule), true);

  const verbToken = "omi-ffff-0001-0000-0002-0078-0005-0004-0000/48";
  const verbRule = "omi-0000-0000-0000-0002-0000-0000-0000-0000/48";
  assert.equal(kernel.matchMask(verbToken, verbRule), true);

  const nonMatching = "omi-ffff-0001-0000-0002-0078-0005-0004-0000/48";
  const wrongRule = "omi-0000-0000-0000-0003-0000-0000-0000-0000/48";
  assert.equal(kernel.matchMask(nonMatching, wrongRule), false);
});

test("queryRulesBySegment and queryFactsBySegment return correct matches", async () => {
  const kernel = new OmiAxiomaticKernel();
  await kernel.loadAxiomaticFile(
    join(process.cwd(), "RULES.omi"),
    kernel.rulesRegistry
  );
  await kernel.loadAxiomaticFile(
    join(process.cwd(), "FACTS.omi"),
    kernel.factsRegistry
  );

  const rules = kernel.queryRulesBySegment(0, 0xFFFF);
  assert.ok(rules.length > 0);
  assert.ok(rules.some(r => r.assignment === "chiral-origin"));

  const posFacts = kernel.queryFactsBySegment(3, 0x0001);
  assert.ok(posFacts.length > 0);
  assert.ok(posFacts.some(f => f.assignment === "universal-pos-NOUN"));

  const layerFacts = kernel.queryFactsBySegment(6, 0x0006);
  assert.ok(layerFacts.length > 0);
  assert.ok(layerFacts.some(f => f.assignment === "lattice-layer-6-720-sweep"));
});

test("segment boundaries mutate only their assigned decoded axis", async () => {
  const kernel = new OmiAxiomaticKernel();
  const base = "omi-ffff-0001-0000-0001-0078-0001-0001-0000/48";

  const decode = (token) => kernel.car(kernel.resolveFactForToken(token));
  const comparable = (meta) => ({
    chiralPhase: meta.chiralPhase,
    busId: meta.busId,
    inversionGate: meta.inversionGate,
    posHex: meta.posHex,
    posTag: meta.posTag,
    stride: meta.stride,
    slot: meta.slot,
    factorialLayer: meta.factorialLayer,
    nilTerminator: meta.nilTerminator
  });
  const assertOnlyChanged = (variant, changedKeys) => {
    const before = comparable(decode(base));
    const after = comparable(decode(variant));
    for (const key of Object.keys(before)) {
      if (changedKeys.includes(key)) {
        assert.notDeepEqual(after[key], before[key], `${key} should change`);
      } else {
        assert.deepEqual(after[key], before[key], `${key} should not change`);
      }
    }
  };

  assertOnlyChanged(
    "omi-039f-0001-0000-0001-0078-0001-0001-0000/48",
    ["chiralPhase"]
  );
  assertOnlyChanged(
    "omi-ffff-0002-0000-0001-0078-0001-0001-0000/48",
    ["busId"]
  );
  assertOnlyChanged(
    "omi-ffff-0001-5a3c-0001-0078-0001-0001-0000/48",
    ["inversionGate"]
  );
  assertOnlyChanged(
    "omi-ffff-0001-0000-0002-0078-0001-0001-0000/48",
    ["posHex", "posTag"]
  );
  assertOnlyChanged(
    "omi-ffff-0001-0000-0001-02d0-0001-0001-0000/48",
    ["stride"]
  );
  assertOnlyChanged(
    "omi-ffff-0001-0000-0001-0078-0002-0001-0000/48",
    ["slot"]
  );
  assertOnlyChanged(
    "omi-ffff-0001-0000-0001-0078-0001-0002-0000/48",
    ["factorialLayer"]
  );
  assertOnlyChanged(
    "omi-ffff-0001-0000-0001-0078-0001-0001-0001/48",
    ["nilTerminator"]
  );
});

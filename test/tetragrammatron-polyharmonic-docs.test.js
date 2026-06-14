import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DOC_DIR = "dev-docs/tetragrammatron-polyharmonic-governor";
const axisDoc = readFileSync(join(DOC_DIR, "polyharmonic-governor-axis.md"), "utf8");
const metaDoc = readFileSync(join(DOC_DIR, "tetragrammatron-meta-memory-automaton.md"), "utf8");

test("polyharmonic docs do not create new root authority", () => {
  assert.match(axisDoc, /not a new canonical root/i);
  assert.match(axisDoc, /not a runtime API/i);
  assert.match(axisDoc, /not as new roots\s+or new runtime keywords/i);
  assert.doesNotMatch(axisDoc, /BOOTVECTORS\.omi/);
});

test("meta-memory doc keeps five canonical factors", () => {
  for (const root of ["RULES.omi", "FACTS.omi", "CLOSURES.omi", "COMBINATORS.omi", "CONS.omi"]) {
    assert.match(metaDoc, new RegExp(root.replace(".", "\\.")));
  }
  assert.match(metaDoc, /does not add a sixth root or runtime API/i);
});

test("polyharmonic axis documents FACTS and CONS inverse projection", () => {
  assert.match(axisDoc, /FACTS\s*<->\s*CONS/);
  assert.match(metaDoc, /FACTS\s*<->\s*CONS/);
});

test("polyharmonic docs preserve implementation boundary language", () => {
  assert.match(axisDoc, /Q_frame before Q_xy projection/);
  assert.match(axisDoc, /POS graph channel behavior/);
  assert.match(axisDoc, /WordNet synset centroid identity/);
  assert.match(metaDoc, /does not change the implementation/);
  assert.match(metaDoc, /they do not replace the\s+five roots/i);
});

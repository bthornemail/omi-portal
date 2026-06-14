import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CANONICAL_NARRATIVE_ORDER,
  createNarrativePipeline,
  designForNarrative,
  snapshotNarrativeProjection
} from '../src/narrative/adapter';
import { buildSurfaceCommentDeclarations, narrativeDeclarationToProjection } from '../src/narrative/narrativeProjectionAdapter';

const root = resolve(import.meta.dirname, '../..');
const rawTexts = CANONICAL_NARRATIVE_ORDER.map((docId) =>
  readFileSync(resolve(root, 'vendor/narrative-series', docId), 'utf8')
);

const pipeline = createNarrativePipeline(rawTexts);
const projection = snapshotNarrativeProjection(pipeline, false);

if (rawTexts.length !== CANONICAL_NARRATIVE_ORDER.length) {
  throw new Error('Narrative raw text count does not match canonical order.');
}

if (pipeline.documents.length !== CANONICAL_NARRATIVE_ORDER.length) {
  throw new Error(`Expected ${CANONICAL_NARRATIVE_ORDER.length} documents, got ${pipeline.documents.length}.`);
}

if (pipeline.timeline.sceneCount <= 0 || pipeline.timeline.beatCount <= 0) {
  throw new Error('Narrative timeline did not produce scenes and beats.');
}

if (!projection.beat || projection.topologyNodeCount <= 0) {
  throw new Error('First narrative projection did not compile to motif topology.');
}

if (!['fano', 'sbibd', 'latin', 'hadamard', 'diffset', 'tuscan'].includes(designForNarrative(projection.beat))) {
  throw new Error('Narrative design mapping returned an unknown design.');
}

const declarations = buildSurfaceCommentDeclarations({
  beat: projection.beat,
  beatIndex: projection.beatIndex,
  tick: projection.tick
});

if (declarations.length <= 0) {
  throw new Error('Narrative projection adapter did not emit declarations.');
}

for (const declaration of declarations) {
  const projectionRef = narrativeDeclarationToProjection(declaration);
  if (!projectionRef.dataOmi || !projectionRef.dataImo || !projectionRef.gauge || !projectionRef.sealedGauge) {
    throw new Error(`Declaration ${declaration.id} is missing projection metadata.`);
  }
  if (projectionRef.receiptState !== 'candidate') {
    throw new Error(`Declaration ${declaration.id} is not a receipt candidate.`);
  }
  if (!projectionRef.dataOmi.includes(';b=beta1;s={4,3}@3C@')) {
    throw new Error(`Declaration ${declaration.id} does not keep metadata before the Base36 socket.`);
  }
  if (projectionRef.dataOmi.includes('@3C@;b=')) {
    throw new Error(`Declaration ${declaration.id} places metadata after the Base36 socket.`);
  }
}

console.log(`narrative pipeline ok: ${pipeline.documents.length} docs, ${pipeline.timeline.beatCount} beats, ${projection.topologyNodeCount} topology nodes, ${declarations.length} declarations`);

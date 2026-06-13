import { readFileSync } from 'node:fs';
import { CANONICAL_ORDER, parseNarrativeDocument } from './narrative-base.js';
import { PersistentWorldState } from '../world/persistent-world-state.js';
import { insertNarrativeIntoWorld } from './narrative-document-pipeline.js';

export { CANONICAL_ORDER, classifyDocument, parseNarrativeDocument, loadNarrativeFromMap } from './narrative-base.js';

export function loadAndInsertNarrative(narrativeDir, world) {
  const documents = loadNarrativeFromDisk(narrativeDir);
  if (documents.length === 0) return { world, motifCount: 0, documentCount: 0 };
  return insertNarrativeIntoWorld(documents, world || new PersistentWorldState());
}

export function loadNarrativeFromDisk(narrativeDir) {
  const path = narrativeDir.endsWith('/') ? narrativeDir : narrativeDir + '/';
  const documents = [];
  for (const [index, docId] of CANONICAL_ORDER.entries()) {
    const fullPath = path + docId;
    try {
      const text = readFileSync(fullPath, 'utf-8');
      documents.push(parseNarrativeDocument(text, docId, index));
    } catch {
      continue;
    }
  }
  return documents;
}

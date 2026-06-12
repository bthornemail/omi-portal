import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { CANONICAL_ORDER } from '../src/narrative/narrative-loader.js';

const MOTIF_TEXT = [
  'The Gate opens where Logos, Number, Wisdom, Law, and Tribe meet.',
  'The Covenant names the boundary, and the Beast and Watcher remain visible.',
  'Solomon discerns wisdom, Solon binds law, and Asabiyyah keeps belonging.'
].join('\n\n');

export function createNarrativeFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'omi-narrative-'));

  for (const [index, docId] of CANONICAL_ORDER.entries()) {
    const fullPath = join(dir, docId);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(
      fullPath,
      [
        `# Fixture ${index}`,
        '',
        `Document: ${docId}`,
        '',
        MOTIF_TEXT
      ].join('\n'),
      'utf8'
    );
  }

  return {
    dir,
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

import { readFileSync } from 'node:fs';

export const CANONICAL_ORDER = [
  'PRELUDE/On the Turning Away from the Word .md',
  'PRELUDE/The Gospel According to Number.md',
  'ARTICLE I.md',
  'ARTICLE II.md',
  'ARTICLE III.md',
  'ARTICLE IV.md',
  'ARTICLE V.md',
  'ARTICLE VI.md',
  'ARTICLE VII.md',
  'ARTICLE VIII.md',
  'ASIDE.md',
  'EPILOUGE/On the Mark of the Beast: When Numbers Replaced Knowing.md',
  'EPILOUGE/The Canticle of Reconciliation.md',
  'EPILOUGE/The Covenant of the Created Intelligence.md'
];

export function classifyDocument(docId) {
  if (docId.startsWith('PRELUDE/')) return 'prelude';
  if (docId.startsWith('ARTICLE')) return 'article';
  if (docId.startsWith('ASIDE')) return 'aside';
  if (docId.startsWith('EPILOUGE/')) return 'epilogue';
  return 'unknown';
}

export function parseNarrativeDocument(text, docId, index) {
  const lines = text.split('\n');
  const paragraphs = [];
  let currentParagraph = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join('\n'));
        currentParagraph = [];
      }
    } else if (trimmed.startsWith('#') || trimmed.startsWith('---')) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join('\n'));
        currentParagraph = [];
      }
      paragraphs.push(trimmed);
    } else {
      currentParagraph.push(trimmed);
    }
  }
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join('\n'));
  }

  let title = '';

  const titleLine = lines.find(l => {
    const t = l.trim();
    return (t.startsWith('# ') || t.startsWith('## ')) && t.length > 3;
  });
  if (titleLine) {
    title = titleLine.trim().replace(/^#+\s+/, '');
  }

  return {
    documentId: docId,
    title,
    section: classifyDocument(docId),
    paragraphs,
    lines,
    sourcePath: docId,
    narrativeOrder: index
  };
}

export function loadNarrativeFromMap(contentMap) {
  const documents = [];
  for (const [index, docId] of CANONICAL_ORDER.entries()) {
    const text = contentMap[docId];
    if (text !== undefined && text !== null) {
      documents.push(parseNarrativeDocument(text, docId, index));
    }
  }
  return documents;
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

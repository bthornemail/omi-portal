import { composeOmiCarrier, receiptCandidateImo } from './omiCarrier';
import type { VisualLiterateCell } from '../narrative/narrativeTypes';

export type NetworkingDoc = {
  path: string;
  title: string;
  sections: { heading: string; level: number; content: string; lineNumber: number }[];
};

function parseMarkdownSections(text: string): { heading: string; level: number; content: string; lineNumber: number }[] {
  const lines = text.split(/\r?\n/);
  const sections: { heading: string; level: number; content: string; lineNumber: number }[] = [];
  let currentSection: { heading: string; level: number; content: string[]; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push({
          heading: currentSection.heading,
          level: currentSection.level,
          content: currentSection.content.join('\n').trim(),
          lineNumber: currentSection.startLine
        });
      }
      currentSection = {
        heading: headingMatch[2],
        level: headingMatch[1].length,
        content: [],
        startLine: i + 1
      };
      continue;
    }
    if (currentSection) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) {
    sections.push({
      heading: currentSection.heading,
      level: currentSection.level,
      content: currentSection.content.join('\n').trim(),
      lineNumber: currentSection.startLine
    });
  }

  return sections;
}

function extractCodeRefs(content: string): { path: string; kind: VisualLiterateCell['sourceRefs'][0]['kind'] }[] {
  const refs: { path: string; kind: VisualLiterateCell['sourceRefs'][0]['kind'] }[] = [];
  const jsMatch = content.match(/`src\/[a-z./-]+\.js`/g);
  if (jsMatch) {
    for (const m of jsMatch) {
      refs.push({ path: m.replace(/`/g, ''), kind: 'js' });
    }
  }
  const testMatch = content.match(/`test\/[a-z./-]+\.test\.js`/g);
  if (testMatch) {
    for (const m of testMatch) {
      refs.push({ path: m.replace(/`/g, ''), kind: 'test' });
    }
  }
  return refs;
}

function extractCommand(content: string): string | undefined {
  const makeMatch = content.match(/`make\s+([a-z][a-z0-9._-]+)`/);
  if (makeMatch) return makeMatch[1];
  const nodeMatch = content.match(/`node\s+([^`]+)`/);
  if (nodeMatch) return nodeMatch[1];
  return undefined;
}

function docIdFromPath(path: string): string {
  return path.replace(/^docs\//, '').replace(/\.md$/, '').replace(/\//g, '-');
}

export function parseNetworkingDoc(text: string, path: string): VisualLiterateCell[] {
  const sections = parseMarkdownSections(text);
  const title = sections.length > 0 ? sections[0].heading : path;
  const docId = docIdFromPath(path);

  const cells: VisualLiterateCell[] = [];

  for (const section of sections) {
    if (section.level === 1) continue;

    const refs = extractCodeRefs(section.content);
    const command = extractCommand(section.content);
    const grade = determineGrade(section.heading, section.content);

    const cellId = `${docId}:${section.lineNumber}`;
    const carrierValue = `${docId}/${section.heading.slice(0, 24)}`;

    cells.push({
      id: `net:${cellId}`,
      title: section.heading,
      grade,
      explanation: section.content.slice(0, 200) + (section.content.length > 200 ? '…' : ''),
      sourceRefs: refs.length > 0
        ? refs
        : [{ path, kind: 'md' }],
      command,
      projection: {
        dataOmi: composeOmiCarrier(`net:${carrierValue}`, carrierValue.length + 4, docId),
        dataImo: receiptCandidateImo(),
        receiptState: 'candidate'
      }
    });
  }

  return cells;
}

function determineGrade(heading: string, _content: string): VisualLiterateCell['grade'] {
  const h = heading.toLowerCase();
  if (h.includes('specification') || h.includes('normative')) return 'production';
  if (h.includes('prospectus') || h.includes('aspirational')) return 'verify';
  if (h.includes('pipeline') || h.includes('sequencer')) return 'pipeline';
  if (h.includes('recommended') || h.includes('layout')) return 'consumer';
  return 'dev';
}

export const NETWORKING_DOCS: { path: string; description: string }[] = [
  { path: 'docs/03-network/omi-core-spec.md', description: 'OMI-CORE-v0: operators, address grammar, delta law, cons cells, sexagesimal notation, factorial lattice' },
  { path: 'docs/03-network/canonical-addressing.md', description: '8-segment address map, DOM/CSSOM id conventions, local context root' },
  { path: 'docs/03-network/omi-distributed-protocol.md', description: 'MCRSGSP, erasure coding, fragment gossip, causal closure, anti-entropy repair' },
  { path: 'docs/04-transport/omi-protocol-sequencing.md', description: '4-phase pipeline: ingestion, memory mapping, WebRTC routing, GPU acceleration' },
  { path: 'docs/05-session/memory-layout.md', description: 'ArrayBuffer/SharedArrayBuffer tiers, pre-header, 5040-cycle history' },
  { path: 'docs/07-application/prolog-wordnet-aframe.md', description: 'WordNet broker, service bus ::3, Fano tokens, A-Frame binding' }
];

export function summarizeNetworkingCells(cells: VisualLiterateCell[]) {
  const byGrade: Record<string, number> = {};
  for (const c of cells) {
    byGrade[c.grade] = (byGrade[c.grade] || 0) + 1;
  }
  return { total: cells.length, byGrade };
}

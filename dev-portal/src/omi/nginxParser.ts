import type { InfrastructureProjection } from '../narrative/narrativeTypes';
import { composeOmiCarrier, receiptCandidateImo } from './omiCarrier';

export type NginxBlock = {
  file: string;
  kind: 'main' | 'events' | 'http' | 'server' | 'location';
  name?: string;
  directives: { key: string; value: string }[];
  children: NginxBlock[];
};

export function parseNginx(text: string, fileName: string): NginxBlock[] {
  const lines = text.split(/\r?\n/);
  const root: NginxBlock = { file: fileName, kind: 'main', directives: [], children: [] };
  const stack: NginxBlock[] = [root];
  let currentBlock = root;
  let inBlock = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('#')) continue;

    const blockOpenMatch = trimmed.match(/^(\w[\w]*)\s+(.*?)\s*\{$/);
    const anonymousBlockMatch = trimmed.match(/^(\w[\w]*)\s*\{$/);

    if (blockOpenMatch) {
      const kind = blockOpenMatch[1] as NginxBlock['kind'];
      const name = blockOpenMatch[2].trim();
      const block: NginxBlock = { file: fileName, kind, name: name || undefined, directives: [], children: [] };
      currentBlock.children.push(block);
      stack.push(block);
      currentBlock = block;
      inBlock = true;
      continue;
    }

    if (anonymousBlockMatch) {
      const kind = anonymousBlockMatch[1] as NginxBlock['kind'];
      const block: NginxBlock = { file: fileName, kind, directives: [], children: [] };
      currentBlock.children.push(block);
      stack.push(block);
      currentBlock = block;
      inBlock = true;
      continue;
    }

    if (trimmed === '}') {
      if (stack.length > 1) {
        stack.pop();
        currentBlock = stack[stack.length - 1];
      }
      continue;
    }

    const directiveMatch = trimmed.match(/^([\w-]+)\s+(.+?);$/);
    if (directiveMatch) {
      currentBlock.directives.push({ key: directiveMatch[1], value: directiveMatch[2] });
      continue;
    }

    const simpleDirective = trimmed.match(/^([\w-]+)\s*;\s*$/);
    if (simpleDirective) {
      currentBlock.directives.push({ key: simpleDirective[1], value: '' });
    }
  }

  return root.children;
}

function flattenBlocks(blocks: NginxBlock[], file: string): NginxBlock[] {
  const result: NginxBlock[] = [];
  for (const b of blocks) {
    result.push(b);
    result.push(...flattenBlocks(b.children, file));
  }
  return result;
}

export function nginxBlocksToProjections(blocks: NginxBlock[]): InfrastructureProjection[] {
  const all = flattenBlocks(blocks, blocks[0]?.file || 'nginx.conf');
  return all.map((b, i) => {
    const portDirective = b.directives.find((d) => d.key === 'listen');
    const serverName = b.directives.find((d) => d.key === 'server_name');
    const label = serverName?.value || portDirective?.value || b.name || `${b.kind}-${i}`;
    return {
      id: `nginx:${i}:${b.kind}:${label}`,
      kind: 'nginx-block' as const,
      sourceFile: b.file,
      name: `${b.kind} ${label}`,
      description: b.directives.length > 0 ? `${b.directives.length} directives` : undefined,
      command: undefined,
      dependencies: [],
      dataOmi: composeOmiCarrier(`nginx:${b.kind}`, b.kind.length + 2, label.replace(/[^a-zA-Z0-9]/g, '-')),
      dataImo: receiptCandidateImo(),
      receiptState: 'candidate' as const
    };
  });
}

export function summarizeNginxBlocks(blocks: NginxBlock[]) {
  const all = flattenBlocks(blocks, 'nginx.conf');
  const byKind: Record<string, number> = {};
  for (const b of all) {
    byKind[b.kind] = (byKind[b.kind] || 0) + 1;
  }
  return { total: all.length, byKind };
}

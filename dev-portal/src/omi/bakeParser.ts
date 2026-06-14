import type { InfrastructureProjection } from '../narrative/narrativeTypes';
import { composeOmiCarrier, receiptCandidateImo } from './omiCarrier';

export type BakeTarget = {
  name: string;
  file: string;
  dockerfile: string;
  target?: string;
  platforms: string[];
  tags: string[];
  inherits: string[];
  group?: string;
};

export function parseBake(text: string, fileName: string): BakeTarget[] {
  const lines = text.split(/\r?\n/);
  const targets: BakeTarget[] = [];
  const groups: Record<string, string[]> = {};

  let currentGroup: string | null = null;
  let currentTarget: Partial<BakeTarget> | null = null;
  let inTarget = false;
  let inGroup = false;
  let inVariable = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('variable ') || trimmed.startsWith('variable"')) {
      inVariable = true;
      continue;
    }
    if (inVariable) {
      if (trimmed === '}' || trimmed.startsWith('}')) inVariable = false;
      continue;
    }

    const groupMatch = trimmed.match(/^group\s+"?(\w[\w-]*)"?\s*\{/);
    if (groupMatch) {
      currentGroup = groupMatch[1];
      groups[currentGroup] = [];
      inGroup = true;
      continue;
    }

    if (inGroup) {
      const targetsMatch = trimmed.match(/targets\s*=\s*\[([^\]]+)\]/);
      if (targetsMatch) {
        groups[currentGroup!] = targetsMatch[1].split(',').map((t) => t.trim().replace(/"/g, ''));
      }
      if (trimmed === '}') {
        inGroup = false;
        currentGroup = null;
      }
      continue;
    }

    const targetMatch = trimmed.match(/^target\s+"?(\w[\w-]*)"?\s*\{/);
    if (targetMatch) {
      if (currentTarget) targets.push(currentTarget as BakeTarget);
      currentTarget = {
        name: targetMatch[1],
        file: fileName,
        dockerfile: '',
        platforms: [],
        tags: [],
        inherits: []
      };
      inTarget = true;
      continue;
    }

    if (!currentTarget || !inTarget) continue;

    const dockerfileMatch = trimmed.match(/dockerfile\s*=\s*"([^"]+)"/);
    if (dockerfileMatch) {
      currentTarget.dockerfile = dockerfileMatch[1];
      continue;
    }

    const targetFieldMatch = trimmed.match(/target\s*=\s*"([^"]+)"/);
    if (targetFieldMatch) {
      currentTarget.target = targetFieldMatch[1];
      continue;
    }

    const platformsMatch = trimmed.match(/platforms\s*=\s*\[([^\]]+)\]/);
    if (platformsMatch) {
      currentTarget.platforms = platformsMatch[1].split(',').map((p) => p.trim().replace(/"/g, ''));
      continue;
    }

    const tagsMatch = trimmed.match(/tags\s*=\s*\[([^\]]+)\]/);
    if (tagsMatch) {
      currentTarget.tags = tagsMatch[1].split(',').map((t) => t.trim().replace(/"/g, ''));
      continue;
    }

    const inheritsMatch = trimmed.match(/inherits\s*=\s*\[([^\]]+)\]/);
    if (inheritsMatch) {
      currentTarget.inherits = inheritsMatch[1].split(',').map((t) => t.trim().replace(/"/g, ''));
      continue;
    }

    if (trimmed === '}') {
      targets.push(currentTarget as BakeTarget);
      currentTarget = null;
      inTarget = false;
    }
  }

  if (currentTarget) targets.push(currentTarget as BakeTarget);

  for (const t of targets) {
    for (const [groupName, memberNames] of Object.entries(groups)) {
      if (memberNames.includes(t.name)) {
        t.group = groupName;
        break;
      }
    }
  }

  return targets;
}

export function bakeTargetsToProjections(targets: BakeTarget[]): InfrastructureProjection[] {
  return targets.map((t) => ({
    id: `bake:${t.name}`,
    kind: 'bake-target' as const,
    sourceFile: t.file,
    name: t.name,
    description: t.group ? `group: ${t.group}` : t.dockerfile,
    command: `docker buildx bake ${t.name}`,
    dependencies: [t.dockerfile, ...t.inherits],
    dataOmi: composeOmiCarrier(`bake:${t.name}`, t.name.length + 5, t.target || 'runtime'),
    dataImo: receiptCandidateImo(),
    receiptState: 'candidate' as const
  }));
}

export function summarizeBakeTargets(targets: BakeTarget[]) {
  const byGroup: Record<string, number> = {};
  for (const t of targets) {
    const g = t.group || 'ungrouped';
    byGroup[g] = (byGroup[g] || 0) + 1;
  }
  return { total: targets.length, byGroup };
}

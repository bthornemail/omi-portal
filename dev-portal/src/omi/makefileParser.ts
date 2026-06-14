import type { InfrastructureProjection } from '../narrative/narrativeTypes';
import { composeOmiCarrier, receiptCandidateImo } from './omiCarrier';

export type MakeTarget = {
  name: string;
  description?: string;
  dependencies: string[];
  body: string[];
  group:
    | "grade"
    | "verification"
    | "pipeline"
    | "development"
    | "production"
    | "infrastructure"
    | "release"
    | "other";
};

const GRADE_ENTRYPOINTS = new Set(['dev', 'consumer', 'production', 'verify', 'verify-safe', 'pipeline', 'release']);
const VERIFICATION_TARGETS = new Set([
  'verify-docs', 'verify-omilog', 'verify-oppid', 'verify-browser', 'verify-ebpf',
  'verify-oppid-script', 'verify-reader', 'verify-wan', 'verify-portal-binder',
  'verify-narrative', 'verify-centroid', 'verify-lens-parser', 'verify-slice3',
  'verify-atomic-kernel', 'verify-reciprocal-router', 'verify-miquel-router',
  'verify-canvas-color', 'verify-json-canvas-schema', 'verify-rrggbbaa-orbit',
  'verify-miquel-rgb-incidence'
]);
const PIPELINE_STEPS = ['source', 'validate', 'generate', 'mirror', 'enter', 'read', 'compose', 'route', 'scope', 'timing', 'naming', 'project', 'replay'];
const PIPELINE_SET = new Set(PIPELINE_STEPS);
const INFRA_TARGETS = new Set([
  'docker-build', 'docker-bake', 'docker-push', 'docker-stress',
  'qemu-test', 'softmmu-test', 'run-all-virt-gates',
  'guix-env-init', 'docker-setup'
]);
const RELEASE_TARGETS = new Set(['release', 'release-dry-run', 'release-manifest']);

function detectGroup(name: string): MakeTarget['group'] {
  if (GRADE_ENTRYPOINTS.has(name)) return 'grade';
  if (VERIFICATION_TARGETS.has(name)) return 'verification';
  if (PIPELINE_SET.has(name)) return 'pipeline';
  if (INFRA_TARGETS.has(name)) return 'infrastructure';
  if (RELEASE_TARGETS.has(name)) return 'release';
  if (name.startsWith('verify-') || name.startsWith('test-')) return 'verification';
  if (name.startsWith('build-') || name.startsWith('compile-')) return 'production';
  if (name === 'test' || name === 'dev' || name === 'test-focused' || name === 'docs-dev' || name === 'build-dev') return 'development';
  return 'other';
}

export function parseMakefile(text: string): MakeTarget[] {
  const lines = text.split(/\r?\n/);
  const targets: MakeTarget[] = [];
  let current: MakeTarget | null = null;
  let lastComment: string | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    const commentMatch = trimmed.match(/^##\s*(.+)$/);
    if (commentMatch) {
      lastComment = commentMatch[1];
      continue;
    }

    const targetMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9._-]+)\s*:\s*(.*)$/);
    if (targetMatch) {
      if (current) targets.push(current);
      const name = targetMatch[1];
      const depStr = targetMatch[2].trim();
      const deps = depStr ? depStr.split(/\s+/).map((d) => d.replace(/^\$\(MAKE\)\s*/, '').trim()).filter(Boolean) : [];

      const desc = lastComment ?? undefined;
      lastComment = null;

      current = {
        name,
        description: desc,
        dependencies: deps,
        body: [],
        group: detectGroup(name)
      };
      continue;
    }

    if (current && trimmed && !trimmed.startsWith('#')) {
      if (trimmed.startsWith('\t') || trimmed.startsWith('  ')) {
        current.body.push(trimmed);
      }
    }
  }

  if (current) targets.push(current);
  return targets;
}

export function makeTargetsToProjections(targets: MakeTarget[]): InfrastructureProjection[] {
  return targets.map((t) => ({
    id: `make:${t.name}`,
    kind: 'make-target' as const,
    sourceFile: 'Makefile',
    name: t.name,
    description: t.description,
    command: t.body.length > 0 ? t.body[0].replace(/^\t+/, '').trim() : undefined,
    dependencies: t.dependencies,
    dataOmi: composeOmiCarrier(`make:${t.name}`, t.name.length + 5, t.group),
    dataImo: receiptCandidateImo(),
    receiptState: 'candidate' as const
  }));
}

export const PIPELINE_LABELS: { step: string; number: number; description: string }[] = [
  { step: 'source', number: 1, description: 'Reading .omi source files' },
  { step: 'validate', number: 2, description: 'Q_frame and parser validation' },
  { step: 'generate', number: 3, description: 'Resolving principal OMI pointers' },
  { step: 'mirror', number: 4, description: 'Lowering .omi to .imo' },
  { step: 'enter', number: 5, description: 'Verifying ο / Ο delimiters' },
  { step: 'read', number: 6, description: 'Reading O-expressions from .imo' },
  { step: 'compose', number: 7, description: 'Verifying operator-table32' },
  { step: 'route', number: 8, description: 'Verifying triad-router155' },
  { step: 'scope', number: 9, description: 'Verifying CIDR / wire profile' },
  { step: 'timing', number: 10, description: 'Verifying Delta / clock' },
  { step: 'naming', number: 11, description: 'Verifying Base36 projection' },
  { step: 'project', number: 12, description: 'Verifying Q_xy / canvas projection' },
  { step: 'replay', number: 13, description: 'Verifying replay receipts' }
];

export function summarizeTargets(targets: MakeTarget[]) {
  const byGroup: Record<string, number> = {};
  for (const t of targets) {
    byGroup[t.group] = (byGroup[t.group] || 0) + 1;
  }
  return { total: targets.length, byGroup };
}

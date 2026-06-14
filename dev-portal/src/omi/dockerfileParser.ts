import type { InfrastructureProjection } from '../narrative/narrativeTypes';
import { composeOmiCarrier, receiptCandidateImo } from './omiCarrier';

export type DockerfileStage = {
  file: string;
  name: string;
  from: string;
  base: string;
  lines: number;
  commands: string[];
  description?: string;
};

function parseSingleDockerfile(text: string, fileName: string): DockerfileStage[] {
  const lines = text.split(/\r?\n/);
  const stages: DockerfileStage[] = [];
  let currentStage: DockerfileStage | null = null;
  let stageLines: string[] = [];

  const flushStage = () => {
    if (currentStage) {
      currentStage.lines = stageLines.length;
      currentStage.commands = stageLines;
      stages.push(currentStage);
      stageLines = [];
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    stageLines.push(rawLine);

    const fromMatch = trimmed.match(/^FROM\s+(.+?)(?:\s+AS\s+(\w+))?$/i);
    if (fromMatch) {
      flushStage();
      currentStage = {
        file: fileName,
        name: fromMatch[2] || `unnamed-${stages.length + 1}`,
        from: fromMatch[1],
        base: fromMatch[1].split(':')[0],
        lines: 0,
        commands: [],
        description: undefined
      };
      continue;
    }

    if (!currentStage) continue;

    const labelMatch = trimmed.match(/^LABEL\s+org\.opencontainers\.image\.description\s*=\s*"([^"]+)"/);
    if (labelMatch) {
      currentStage.description = labelMatch[1];
    }
  }

  flushStage();
  return stages;
}

export function parseDockerfiles(inputs: { fileName: string; text: string }[]): DockerfileStage[] {
  return inputs.flatMap((input) => parseSingleDockerfile(input.text, input.fileName));
}

export function dockerfileStagesToProjections(stages: DockerfileStage[]): InfrastructureProjection[] {
  return stages.map((s) => ({
    id: `docker:${s.file}:${s.name}`,
    kind: 'docker-stage' as const,
    sourceFile: s.file,
    name: s.name,
    description: s.description || `FROM ${s.from}`,
    command: undefined,
    dependencies: s.from ? s.from.split(/\s+/).filter((p) => !p.startsWith('--')) : [],
    dataOmi: composeOmiCarrier(`docker:${s.file}:${s.name}`, s.name.length + s.file.length + 2, s.base),
    dataImo: receiptCandidateImo(),
    receiptState: 'candidate' as const
  }));
}

export function summarizeDockerfileStages(stages: DockerfileStage[]) {
  const byFile: Record<string, number> = {};
  for (const s of stages) {
    byFile[s.file] = (byFile[s.file] || 0) + 1;
  }
  return { total: stages.length, byFile };
}

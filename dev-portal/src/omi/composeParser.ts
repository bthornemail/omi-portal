import type { InfrastructureProjection } from '../narrative/narrativeTypes';
import { composeOmiCarrier, receiptCandidateImo } from './omiCarrier';

export type ComposeService = {
  file: string;
  name: string;
  dockerfile: string;
  target?: string;
  ports: string[];
  containerName?: string;
  profiles: string[];
  description?: string;
};

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

export function parseCompose(text: string, fileName: string): ComposeService[] {
  const lines = text.split(/\r?\n/);
  const services: ComposeService[] = [];
  let currentService: Partial<ComposeService> | null = null;
  let inServices = false;
  let servicesIndent = 0;
  let lastBlockHeader: string | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      const headerMatch = trimmed.match(/^#\s*(.{9,}?)\s*$/);
      if (headerMatch) lastBlockHeader = headerMatch[1];
      continue;
    }

    if (trimmed === 'services:') {
      inServices = true;
      servicesIndent = 0;
      lastBlockHeader = null;
      continue;
    }

    if (!inServices) continue;

    if (trimmed === 'volumes:' || trimmed === 'networks:' || trimmed === 'secrets:' || trimmed === 'configs:') {
      if (currentService) {
        services.push(currentService as ComposeService);
        currentService = null;
      }
      inServices = false;
      continue;
    }

    const ind = indentOf(rawLine);

    if (servicesIndent === 0 && ind > 0) {
      servicesIndent = ind;
    }

    const serviceNameMatch = trimmed.match(/^([a-zA-Z][\w-]*):$/);
    if (serviceNameMatch && ind === servicesIndent) {
      if (currentService) services.push(currentService as ComposeService);
      currentService = {
        file: fileName,
        name: serviceNameMatch[1],
        dockerfile: '',
        ports: [],
        profiles: [],
        description: lastBlockHeader ?? undefined
      };
      lastBlockHeader = null;
      continue;
    }

    if (!currentService) continue;

    if (ind <= servicesIndent && trimmed.includes(':')) {
      services.push(currentService as ComposeService);
      currentService = null;
      continue;
    }

    const dockerfileMatch = trimmed.match(/dockerfile:\s*(.+)$/);
    if (dockerfileMatch) {
      currentService.dockerfile = dockerfileMatch[1].trim();
      continue;
    }

    const targetMatch = trimmed.match(/target:\s*(.+)$/);
    if (targetMatch) {
      currentService.target = targetMatch[1].trim();
      continue;
    }

    const containerNameMatch = trimmed.match(/container_name:\s*(.+)$/);
    if (containerNameMatch) {
      currentService.containerName = containerNameMatch[1].trim();
      continue;
    }

    if (trimmed === 'ports:' || trimmed === 'profiles:') continue;

    const portMatch = trimmed.match(/^\s*-\s*"(.+?)"/);
    if (portMatch) {
      currentService.ports!.push(portMatch[1]);
      continue;
    }

    const profileItemMatch = trimmed.match(/^\s*-\s*(qemu|default)$/);
    if (profileItemMatch) {
      currentService.profiles!.push(profileItemMatch[1]);
    }
  }

  if (currentService) services.push(currentService as ComposeService);
  return services;
}

export function composeServicesToProjections(services: ComposeService[]): InfrastructureProjection[] {
  return services.map((s) => ({
    id: `compose:${s.file}:${s.name}`,
    kind: 'compose-service' as const,
    sourceFile: s.file,
    name: s.name,
    description: s.description || `dockerfile: ${s.dockerfile}`,
    command: s.target ? `docker compose --profile ${s.profiles.join(',') || 'default'} up ${s.name}` : undefined,
    dependencies: s.dockerfile ? [s.dockerfile] : [],
    dataOmi: composeOmiCarrier(`compose:${s.name}`, s.name.length + 8, s.dockerfile.replace('.yml', '')),
    dataImo: receiptCandidateImo(),
    receiptState: 'candidate' as const
  }));
}

export function summarizeComposeServices(services: ComposeService[]) {
  const byFile: Record<string, number> = {};
  for (const s of services) {
    byFile[s.file] = (byFile[s.file] || 0) + 1;
  }
  return { total: services.length, byFile };
}

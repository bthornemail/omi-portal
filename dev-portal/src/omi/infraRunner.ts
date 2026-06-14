import { composeOmiCarrier, receiptCandidateImo } from './omiCarrier';
import type { InfraRunRecord, InfraRunStatus } from '../narrative/narrativeTypes';

export const ALLOWED_TARGETS: readonly string[] = Object.freeze([
  'verify-safe',
  'qemu-test',
  'softmmu-test',
  'docker-build',
  'docker-stress',
  'run-all-virt-gates',
  'test-omi-pipe',
  'test-omi-pipe-mcrsgsp',
  'test-omi-pipe-omi-acceptance',
  'test-omi-pipe-causal-proof',
  'test-omi-pipe-rs-proof',
  'test-omi-pipe-gf256-rs-proof'
]);

export function isTargetRunnable(targetName: string): boolean {
  return ALLOWED_TARGETS.includes(targetName);
}

export function makeOmiRunRecord(target: string, initialStatus: InfraRunStatus = 'idle'): InfraRunRecord {
  return {
    id: `run:${target}:${Date.now()}`,
    target,
    command: `make ${target}`,
    status: initialStatus,
    stdout: [],
    stderr: [],
    dataOmi: composeOmiCarrier(`infra-run/${target}`, target.length + 5, 'exec'),
    dataImo: receiptCandidateImo()
  };
}

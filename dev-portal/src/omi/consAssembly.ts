import type { CidrMcrsgspRecord } from './cidrMcrsgspParser';
import { composeOmiCarrier, receiptCandidateImo, sealedGaugeFor } from './omiCarrier';
import type { GaugeName, ReceiptState } from '../narrative/narrativeTypes';

const GAUGE_TOKEN: Record<string, string> = {
  FS: 'o---o',
  GS: '/---/',
  RS: '?---?',
  US: '@---@'
};

export type OmiConsAssembly = {
  id: string;
  factCar: CidrMcrsgspRecord;
  ruleCdr: CidrMcrsgspRecord;
  cons?: CidrMcrsgspRecord;
  combinator?: CidrMcrsgspRecord;
  closure?: CidrMcrsgspRecord;
  carGauge: string;
  cdrGauge: string;
  pairGauge: GaugeName;
  dataOmi: string;
  dataImo: string;
  receiptState: ReceiptState;
};

export type ConsAssemblySummary = {
  total: number;
  withCons: number;
  withCombinator: number;
  withClosure: number;
};

export function assembleFactRuleCons(
  records: CidrMcrsgspRecord[]
): OmiConsAssembly[] {
  const facts = records.filter((record) => record.gate === 'FACT');
  const rules = records.filter((record) => record.gate === 'RULE');
  const consRecords = records.filter((record) => record.gate === 'CONS');
  const combinators = records.filter((record) => record.gate === 'COMBINATOR');
  const closures = records.filter((record) => record.gate === 'CLOSURE');

  if (facts.length === 0 || rules.length === 0) return [];

  const pairCount = Math.min(facts.length, rules.length);
  const result: OmiConsAssembly[] = [];

  for (let i = 0; i < pairCount; i++) {
    const fact = facts[i];
    const rule = rules[i];
    const carToken = GAUGE_TOKEN[fact.gauge] || 'o---o';
    const cdrToken = GAUGE_TOKEN[rule.gauge] || '/---/';
    const pairGauge: GaugeName = i % 2 === 0 ? 'FS' : 'GS';

    const dataOmi = `o---o/---/` +
      `?car=${fact.consCandidate.car.ref};cdr=${rule.consCandidate.car.ref};` +
      `fact=${encodeValue(fact.value)};rule=${encodeValue(rule.value)};` +
      `b=beta1;s={4,3}@${fact.consCandidate.car.ref}@`;

    const dataImo =
      `o---o/---/?receipt=candidate;pair=${i};` +
      `carGate=${fact.gate};cdrGate=${rule.gate}@${fact.consCandidate.car.ref}@`;

    result.push({
      id: `cons:${fact.consCandidate.car.ref}:${rule.consCandidate.car.ref}`,
      factCar: fact,
      ruleCdr: rule,
      cons: consRecords[i % consRecords.length] || consRecords[0],
      combinator: combinators[i % combinators.length] || combinators[0],
      closure: closures[i % closures.length] || closures[0],
      carGauge: carToken,
      cdrGauge: cdrToken,
      pairGauge,
      dataOmi,
      dataImo,
      receiptState: 'candidate'
    });
  }

  return result;
}

export function summarizeConsAssembly(assemblies: OmiConsAssembly[]): ConsAssemblySummary {
  return {
    total: assemblies.length,
    withCons: assemblies.filter((a) => a.cons).length,
    withCombinator: assemblies.filter((a) => a.combinator).length,
    withClosure: assemblies.filter((a) => a.closure).length
  };
}

function encodeValue(value: string) {
  return value.trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 24) || 'val';
}

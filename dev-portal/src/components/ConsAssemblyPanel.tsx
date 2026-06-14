import { useMemo, useState } from 'react';
import type { OmiConsAssembly, ConsAssemblySummary } from '../omi/consAssembly';
import { composeOmiCarrier, receiptCandidateImo } from '../omi/omiCarrier';

type ConsAssemblyPanelProps = {
  assemblies: OmiConsAssembly[];
  summary: ConsAssemblySummary | null;
};

export function ConsAssemblyPanel({ assemblies, summary }: ConsAssemblyPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const sample = useMemo(() => showAll ? assemblies : assemblies.slice(0, 8), [assemblies, showAll]);

  return (
    <section
      className="panel cons-assembly-panel"
      data-omi={composeOmiCarrier('cons-assembly', assemblies.length, 'projection')}
      data-imo={receiptCandidateImo()}
    >
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Cons Assembly</p>
          <h2>FACT → CAR · RULE → CDR</h2>
        </div>
        <span className="design-status">
          {summary ? `${summary.total} pairs` : 'assembling'}
        </span>
      </div>
      <p className="boundary-copy">
        FACTS are candidate CARs. RULES are candidate CDRs.
        CONS reduces CAR/CDR into an o---o pair.
        COMBINATORS compose lawful reductions.
        CLOSURES seal bounded candidate state.
        MCRSGSP carries the record until receipt acceptance.
      </p>

      {summary && (
        <div className="cons-summary">
          <span>total {summary.total}</span>
          <span>with CONS {summary.withCons}</span>
          <span>with COMBINATOR {summary.withCombinator}</span>
          <span>with CLOSURE {summary.withClosure}</span>
        </div>
      )}

      <div className="cons-assembly-grid">
        {sample.map((pair) => (
          <article
            key={pair.id}
            className="cons-pair"
            id={pair.id}
            data-omi={pair.dataOmi}
            data-imo={pair.dataImo}
            data-car-gauge={pair.carGauge}
            data-cdr-gauge={pair.cdrGauge}
            data-pair-gauge={pair.pairGauge}
            data-receipt-state={pair.receiptState}
          >
            <header>
              <span className="cons-arrow">CAR</span>
              <span className="cons-arrow">→</span>
              <span className="cons-arrow">CDR</span>
              <span className="cons-badge">{pair.pairGauge}</span>
            </header>

            <div className="cons-car">
              <span className="cons-gate-label">{pair.factCar.gate}</span>
              <strong>{pair.factCar.value}</strong>
              <code>{pair.factCar.consCandidate.car.ref}</code>
            </div>

            <div className="cons-cdr">
              <span className="cons-gate-label">{pair.ruleCdr.gate}</span>
              <strong>{pair.ruleCdr.value}</strong>
              <code>{pair.ruleCdr.consCandidate.car.ref}</code>
            </div>

            <div className="cons-reducers">
              {pair.cons && (
                <span className="cons-reducer-tag" title={`CONS: ${pair.cons.value}`}>CONS</span>
              )}
              {pair.combinator && (
                <span className="cons-reducer-tag combinator" title={`COMBINATOR: ${pair.combinator.value}`}>COMB</span>
              )}
              {pair.closure && (
                <span className="cons-reducer-tag closure" title={`CLOSURE: ${pair.closure.value}`}>CLOSE</span>
              )}
            </div>

            <div className="cons-omi-meta">
              <code className="cons-carrier">{pair.dataOmi.slice(0, 72)}</code>
            </div>
          </article>
        ))}
      </div>

      {assemblies.length > 8 && !showAll && (
        <button className="cons-show-all" onClick={() => setShowAll(true)}>
          Show all {assemblies.length} pairs
        </button>
      )}
    </section>
  );
}

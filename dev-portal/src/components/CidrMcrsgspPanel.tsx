import type { CidrMcrsgspRecord, CidrMcrsgspSummary } from '../omi/cidrMcrsgspParser';
import { composeOmiCarrier, receiptCandidateImo } from '../omi/omiCarrier';

type CidrMcrsgspPanelProps = {
  records: CidrMcrsgspRecord[];
  summary: CidrMcrsgspSummary | null;
};

export function CidrMcrsgspPanel({ records, summary }: CidrMcrsgspPanelProps) {
  const sample = records.slice(0, 6);

  return (
    <section
      className="panel cidr-mcrsgsp-panel"
      data-omi={composeOmiCarrier('cidr-mcrsgsp', records.length, 'adapter')}
      data-imo={receiptCandidateImo()}
    >
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">CIDR Adapter Track</p>
          <h2>MCRSGSP Cons Candidates</h2>
        </div>
        <span className="design-status">{summary ? `${summary.records} records` : 'loading'}</span>
      </div>
      <p className="boundary-copy">CIDR prefix is adapter claim boundary, not native OMI identity. FACTS and RULES are carried as CAR/CDR cons candidates until receipts accept.</p>

      {summary && (
        <div className="mcrsgsp-summary">
          {Object.entries(summary.byGate).map(([gate, count]) => (
            <span key={gate}>{gate} {count}</span>
          ))}
        </div>
      )}

      <div className="mcrsgsp-record-grid">
        {sample.map((record) => (
          <article
            key={record.id}
            className="mcrsgsp-record"
            id={record.id}
            data-omi={record.dataOmi}
            data-imo={record.dataImo}
            data-gauge={record.gauge}
            data-sealed-gauge={record.sealedGauge}
            data-gate={record.gate}
            data-receipt-state={record.mcrsgsp.receiptState}
          >
            <header>
              <span>{record.gate}</span>
              <span>{record.gauge}</span>
              <span>{record.consCandidate.car.ref}</span>
            </header>
            <strong>{record.value}</strong>
            <code>{record.consCandidate.car.address}/{record.claimPrefix}</code>
          </article>
        ))}
      </div>
    </section>
  );
}

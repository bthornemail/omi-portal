import { SurfaceCommentDeclarationCard } from './SurfaceCommentDeclarationCard';
import { composeOmiCarrier, receiptCandidateImo } from '../omi/omiCarrier';
import type { OmiProjectionRef, SurfaceCommentDeclaration } from '../narrative/narrativeTypes';

type NarrativeProjectionPanelProps = {
  declarations: SurfaceCommentDeclaration[];
  inspectedDeclarationId?: string | null;
  latestCandidateId?: string | null;
  onInspectDeclaration?: (declaration: SurfaceCommentDeclaration) => void;
  onReceiptCandidate?: (projection: OmiProjectionRef) => void;
};

export function NarrativeProjectionPanel({
  declarations,
  inspectedDeclarationId,
  latestCandidateId,
  onInspectDeclaration,
  onReceiptCandidate
}: NarrativeProjectionPanelProps) {
  return (
    <section
      className="panel narrative-projection-panel"
      data-omi={composeOmiCarrier('surface-comment-declarations', declarations.length, 'panel')}
      data-imo={receiptCandidateImo()}
    >
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Narrative Projection Records</p>
          <h2>Surface Comment Declarations</h2>
        </div>
        <span className="design-status">{declarations.length} candidates</span>
      </div>
      <p className="boundary-copy">React components may display projection. DOM/WebGL exposes projection. Receipt accepts state.</p>

      <div className="declaration-grid">
        {declarations.map((declaration) => (
          <SurfaceCommentDeclarationCard
            key={declaration.id}
            declaration={declaration}
            inspected={declaration.id === inspectedDeclarationId}
            latestCandidate={declaration.id === latestCandidateId}
            onInspect={onInspectDeclaration}
            onReceiptCandidate={onReceiptCandidate}
          />
        ))}
      </div>
    </section>
  );
}

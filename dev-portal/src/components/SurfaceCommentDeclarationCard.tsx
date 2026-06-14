import type { OmiProjectionRef, SurfaceCommentDeclaration } from '../narrative/narrativeTypes';

type SurfaceCommentDeclarationCardProps = {
  declaration: SurfaceCommentDeclaration;
  inspected?: boolean;
  latestCandidate?: boolean;
  onInspect?: (declaration: SurfaceCommentDeclaration) => void;
  onReceiptCandidate?: (projection: OmiProjectionRef) => void;
};

export function SurfaceCommentDeclarationCard({
  declaration,
  inspected = false,
  latestCandidate = false,
  onInspect,
  onReceiptCandidate
}: SurfaceCommentDeclarationCardProps) {
  const { projection } = declaration;

  return (
    <article
      id={projection.id}
      data-omi={projection.dataOmi}
      data-imo={projection.dataImo}
      data-gauge={projection.gauge}
      data-sealed-gauge={projection.sealedGauge}
      data-receipt-state={projection.receiptState}
      className={`surface-comment-declaration${inspected ? ' inspected' : ''}${latestCandidate ? ' latest-candidate' : ''}`}
    >
      <header>
        <span>{projection.gauge}</span>
        <span>{projection.sealedGauge}</span>
        <span>{projection.carBase36}</span>
      </header>

      <p className="declaration-triple">
        <strong>{declaration.subject}</strong>{' '}
        <em>{declaration.predicate}</em>{' '}
        <strong>{declaration.object}</strong>
      </p>

      <p>{declaration.comment}</p>

      <footer>
        <button type="button" onClick={() => onInspect?.(declaration)}>Inspect</button>
        <button type="button" onClick={() => onReceiptCandidate?.(projection)}>
          Emit receipt candidate
        </button>
      </footer>
    </article>
  );
}

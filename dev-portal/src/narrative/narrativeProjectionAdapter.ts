import { compileBeatToTopology } from './adapter';
import { buildProjectionRef } from '../omi/omiCarrier';
import type { NarrativeBeat, ReceiptState, SurfaceCommentDeclaration } from './narrativeTypes';

type TopologyNode = {
  id?: string;
  motif?: string;
  label?: string;
  emoji?: string;
};

export function narrativeDeclarationToProjection(declaration: SurfaceCommentDeclaration) {
  return {
    ...declaration.projection,
    receiptState: 'candidate' as const
  };
}

export function buildSurfaceCommentDeclarations(options: {
  beat: NarrativeBeat | null;
  beatIndex: number;
  tick: number;
  receiptStates?: Map<string, ReceiptState>;
}): SurfaceCommentDeclaration[] {
  const { beat, beatIndex, tick, receiptStates = new Map() } = options;
  if (!beat) return [];

  const topology = compileBeatToTopology(beat).topology;
  const topologyNodes = topology?.nodes ? [...topology.nodes.values()] as TopologyNode[] : [];
  const motifSubjects = (beat.motifs?.length ? beat.motifs : topologyNodes.map((node) => node.motif ?? node.label ?? node.id).filter(Boolean)) as string[];
  const subjects = motifSubjects.length ? motifSubjects : ['Narrative'];

  return subjects.map((subject, index) => {
    const node = topologyNodes.find((candidate) => candidate.motif === subject || candidate.label === subject);
    const id = stableDeclarationId(beat, subject, index);
    const articleId = beat.documentId;
    const receiptState = receiptStates.get(id) ?? 'candidate';
    const projection = buildProjectionRef({
      id,
      value: String(subject),
      length: String(subject).length,
      handle: 'surface-comment',
      index: tick + beatIndex + index,
      receiptState
    });

    return {
      id,
      articleId,
      passageId: `${beat.beatId}::p${beat.paragraphIndex}`,
      subject: node?.emoji ? `${node.emoji} ${subject}` : String(subject),
      predicate: 'projects',
      object: `${beat.phase}:${beat.documentId}`,
      motif: String(subject),
      comment: beat.caption.slice(0, 220),
      projection
    };
  });
}

function stableDeclarationId(beat: NarrativeBeat, subject: string, index: number) {
  return `surface-${slug(beat.beatId)}-${slug(subject)}-${index}`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'projection';
}
